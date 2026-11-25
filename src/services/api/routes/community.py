"""Live anonymized peer benchmarks and cohort percentiles endpoint."""

from __future__ import annotations

from collections import defaultdict
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select
from src.lib.auth.clerk import OptionalClerkIdentityDep
from src.lib.db import get_session
from src.models.practice import Exercise, PracticeSession, TransitionMastery
from src.models.user import User

router = APIRouter(prefix="/community", tags=["Community Benchmarks"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

_MIN_COHORT_SESSIONS = 10
_MIN_TEMPO_FAST_RATIO = 1.03
_MAX_TEMPO_SLOW_RATIO = 0.85
_PERCENT_UNIT_THRESHOLD = 1.0
_PERCENT_SCALE = 100.0
_MAX_PERCENT = 100.0
_MIN_PERCENT = 0.0
_P10 = 10.0
_P25 = 25.0
_P50 = 50.0
_P75 = 75.0
_P90 = 90.0
_MIN_PARTS_FOR_INITIAL = 2
_WEIGHT_ACCURACY = 0.45
_WEIGHT_VOICING = 0.35
_WEIGHT_TIMING = 0.20


class DistributionMetricDto(BaseModel):
    """Empirical distribution summary for one benchmark dimension."""

    median: float | None = None
    top_10_pct: float | None = None
    p25: float | None = None
    p75: float | None = None
    user_percentile: int | None = None


class CommunityDistributionsDto(BaseModel):
    """All three benchmark metric distributions."""

    timing_ms: DistributionMetricDto
    voicing_pct: DistributionMetricDto
    accuracy_pct: DistributionMetricDto


class CommunityLeaderboardEntryDto(BaseModel):
    """Single anonymized performer row on the piece leaderboard."""

    rank: int
    performer_name: str
    handle: str
    is_current_user: bool
    instrument: Literal["piano", "guitar"]
    exercise_id: str
    exercise_title: str
    tempo_tier: Literal["70%", "100%", "105%"]
    tempo_bpm: int
    accuracy_pct: float
    abs_timing_error_ms: float
    voicing_pct: float
    bkt_mastered_count: int
    verified_takes_count: int
    challenge_score: float


class CommunityBenchmarksResponse(BaseModel):
    """Public anonymized benchmarks response with honest fallback flagging."""

    is_baseline_fallback: bool
    baseline_label: str | None = None
    cohort_size: int
    total_completed_sessions: int
    min_cohort_sessions: int = _MIN_COHORT_SESSIONS
    distributions: CommunityDistributionsDto
    leaderboard: list[CommunityLeaderboardEntryDto]


def _anonymize_name(full_name: str, username: str) -> str:
    parts = [p for p in full_name.strip().split() if p]
    if len(parts) >= _MIN_PARTS_FOR_INITIAL:
        return f"{parts[0]} {parts[-1][0].upper()}."
    if len(parts) == 1:
        return parts[0]
    cleaned_user = username.strip()
    return cleaned_user or "Musician"


def _format_handle(username: str) -> str:
    cleaned = username.strip().lstrip("@")
    return f"@{cleaned}" if cleaned else "@musician"


def _normalize_pct(raw: float | None) -> float:
    if raw is None:
        return 0.0
    val = float(raw)
    scaled = val * _PERCENT_SCALE if val <= _PERCENT_UNIT_THRESHOLD else val
    return round(min(_MAX_PERCENT, max(_MIN_PERCENT, scaled)), 1)


def _compute_challenge_score(
    accuracy_pct: float,
    voicing_pct: float,
    abs_timing_ms: float,
) -> float:
    timing_score = max(0.0, _MAX_PERCENT - abs_timing_ms)
    return round(
        _WEIGHT_ACCURACY * accuracy_pct
        + _WEIGHT_VOICING * voicing_pct
        + _WEIGHT_TIMING * timing_score,
        1,
    )


def _compute_tempo_tier(
    session_tempo: int,
    exercise_tempo: int,
) -> Literal["70%", "100%", "105%"]:
    baseline = max(1, exercise_tempo)
    ratio = session_tempo / baseline
    if ratio >= _MIN_TEMPO_FAST_RATIO:
        return "105%"
    if ratio <= _MAX_TEMPO_SLOW_RATIO:
        return "70%"
    return "100%"


def _empirical_quantile(sorted_vals: list[float], pct: float) -> float | None:
    if not sorted_vals:
        return None
    if len(sorted_vals) == 1:
        return round(sorted_vals[0], 1)
    pos = (pct / _PERCENT_SCALE) * (len(sorted_vals) - 1)
    low = int(pos)
    high = min(low + 1, len(sorted_vals) - 1)
    frac = pos - low
    val = sorted_vals[low] + (sorted_vals[high] - sorted_vals[low]) * frac
    return round(val, 1)


def _empirical_user_percentile(
    sorted_vals: list[float],
    user_val: float | None,
    *,
    lower_is_better: bool = False,
) -> int | None:
    if not sorted_vals or user_val is None:
        return None
    total = len(sorted_vals)
    if lower_is_better:
        beaten = sum(1 for v in sorted_vals if v >= user_val)
    else:
        beaten = sum(1 for v in sorted_vals if v <= user_val)
    pct = round((beaten / total) * _PERCENT_SCALE)
    return max(1, min(99, pct))


def _build_distribution(
    values: list[float],
    user_val: float | None,
    *,
    lower_is_better: bool = False,
) -> DistributionMetricDto:
    if not values:
        return DistributionMetricDto()
    ordered = sorted(values)
    top_10_q = _P10 if lower_is_better else _P90
    return DistributionMetricDto(
        median=_empirical_quantile(ordered, _P50),
        top_10_pct=_empirical_quantile(ordered, top_10_q),
        p25=_empirical_quantile(ordered, _P25),
        p75=_empirical_quantile(ordered, _P75),
        user_percentile=_empirical_user_percentile(
            ordered,
            user_val,
            lower_is_better=lower_is_better,
        ),
    )


@router.get("/benchmarks", response_model=CommunityBenchmarksResponse)
async def get_community_benchmarks(
    session: SessionDep,
    identity: OptionalClerkIdentityDep,
    instrument: Annotated[Literal["all", "piano", "guitar"] | None, Query()] = None,
    piece_id: Annotated[str | None, Query(max_length=120)] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 25,
) -> CommunityBenchmarksResponse:
    """Return anonymized peer percentile distributions and piece leaderboard."""
    normalized_inst = None if instrument in (None, "all") else instrument
    normalized_piece = None if piece_id in (None, "", "all") else piece_id

    stmt = (
        select(PracticeSession, Exercise, User)
        .join(Exercise, col(PracticeSession.exercise_id) == col(Exercise.id))
        .join(User, col(PracticeSession.user_id) == col(User.id))
        .where(col(PracticeSession.state) == "completed")
    )
    if normalized_inst is not None:
        stmt = stmt.where(col(Exercise.instrument) == normalized_inst)
    if normalized_piece is not None:
        stmt = stmt.where(col(PracticeSession.exercise_id) == normalized_piece)

    rows = (await session.execute(stmt)).all()
    total_completed_sessions = len(rows)

    timing_values: list[float] = []
    voicing_values: list[float] = []
    accuracy_values: list[float] = []

    user_take_counts: dict[str, int] = defaultdict(int)
    user_best: dict[str, tuple[float, float, float, dict[str, object]]] = {}
    current_user_metrics: list[tuple[float, float, float]] = []

    for ps, ex, usr in rows:
        acc_pct = _normalize_pct(ps.overall_accuracy)
        voicing_pct = _normalize_pct(ps.voicing_score)
        abs_timing = round(abs(float(ps.avg_timing_error_ms or 0.0)), 1)
        score = _compute_challenge_score(acc_pct, voicing_pct, abs_timing)

        timing_values.append(abs_timing)
        voicing_values.append(voicing_pct)
        accuracy_values.append(acc_pct)

        user_take_counts[ps.user_id] += 1
        if identity is not None and ps.user_id == identity.user_id:
            current_user_metrics.append((abs_timing, voicing_pct, acc_pct))

        sort_key = (score, -abs_timing, acc_pct)
        ex_inst: Literal["piano", "guitar"] = (
            "piano" if ex.instrument == "piano" else "guitar"
        )
        candidate_payload: dict[str, object] = {
            "user_id": ps.user_id,
            "performer_name": _anonymize_name(usr.name, usr.username),
            "handle": _format_handle(usr.username),
            "instrument": ex_inst,
            "exercise_id": ex.id,
            "exercise_title": ex.title,
            "tempo_tier": _compute_tempo_tier(ps.tempo_bpm, ex.tempo_bpm),
            "tempo_bpm": ps.tempo_bpm,
            "accuracy_pct": acc_pct,
            "abs_timing_error_ms": abs_timing,
            "voicing_pct": voicing_pct,
            "challenge_score": score,
        }

        existing = user_best.get(ps.user_id)
        if existing is None or sort_key > (existing[0], existing[1], existing[2]):
            user_best[ps.user_id] = (score, -abs_timing, acc_pct, candidate_payload)

    mastery_stmt = (
        select(
            TransitionMastery.user_id,
            func.count(col(TransitionMastery.id)),
        )
        .where(col(TransitionMastery.is_mastered).is_(True))
        .group_by(TransitionMastery.user_id)
    )
    if normalized_inst is not None:
        mastery_stmt = mastery_stmt.where(
            col(TransitionMastery.instrument) == normalized_inst,
        )
    mastered_by_user: dict[str, int] = {
        uid: int(cnt) for uid, cnt in (await session.execute(mastery_stmt)).all()
    }

    sorted_users = sorted(
        user_best.items(),
        key=lambda item: (item[1][0], item[1][1], item[1][2]),
        reverse=True,
    )

    leaderboard: list[CommunityLeaderboardEntryDto] = []
    for idx, (uid, (_, _, _, data)) in enumerate(sorted_users[:limit], start=1):
        leaderboard.append(
            CommunityLeaderboardEntryDto(
                rank=idx,
                performer_name=str(data["performer_name"]),
                handle=str(data["handle"]),
                is_current_user=bool(identity is not None and uid == identity.user_id),
                instrument=data["instrument"],  # type: ignore[arg-type]
                exercise_id=str(data["exercise_id"]),
                exercise_title=str(data["exercise_title"]),
                tempo_tier=data["tempo_tier"],  # type: ignore[arg-type]
                tempo_bpm=int(data["tempo_bpm"]),  # type: ignore[call-overload]
                accuracy_pct=float(data["accuracy_pct"]),  # type: ignore[arg-type]
                abs_timing_error_ms=float(data["abs_timing_error_ms"]),  # type: ignore[arg-type]
                voicing_pct=float(data["voicing_pct"]),  # type: ignore[arg-type]
                bkt_mastered_count=mastered_by_user.get(uid, 0),
                verified_takes_count=user_take_counts[uid],
                challenge_score=float(data["challenge_score"]),  # type: ignore[arg-type]
            ),
        )

    user_timing: float | None = None
    user_voicing: float | None = None
    user_accuracy: float | None = None
    if current_user_metrics:
        n_user = len(current_user_metrics)
        user_timing = sum(m[0] for m in current_user_metrics) / n_user
        user_voicing = sum(m[1] for m in current_user_metrics) / n_user
        user_accuracy = sum(m[2] for m in current_user_metrics) / n_user

    is_fallback = total_completed_sessions < _MIN_COHORT_SESSIONS

    return CommunityBenchmarksResponse(
        is_baseline_fallback=is_fallback,
        baseline_label="Simulated Reference Baseline" if is_fallback else None,
        cohort_size=len(user_take_counts),
        total_completed_sessions=total_completed_sessions,
        min_cohort_sessions=_MIN_COHORT_SESSIONS,
        distributions=CommunityDistributionsDto(
            timing_ms=_build_distribution(
                timing_values,
                user_timing,
                lower_is_better=True,
            ),
            voicing_pct=_build_distribution(voicing_values, user_voicing),
            accuracy_pct=_build_distribution(accuracy_values, user_accuracy),
        ),
        leaderboard=leaderboard,
    )
