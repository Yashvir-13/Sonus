"""Practice session lifecycle, take submission, coaching, and drill endpoints."""

from __future__ import annotations

import contextlib
import json
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select
from src.lib.adaptive.llm_coach import generate_coaching_report_async
from src.lib.adaptive.mastery import StudentMasteryEngine
from src.lib.audio.validation import DEFAULT_MAX_AUDIO_SIZE_BYTES
from src.lib.auth.clerk import ClerkIdentityDep
from src.lib.db import get_session
from src.lib.exception import NotFound, Unprocessable
from src.lib.music.chords import parse_chord_notes
from src.lib.practice.evaluator import TakeEvaluator
from src.lib.rate_limit import COACHING_RATE_LIMIT, TAKE_RATE_LIMIT, read_bounded_upload
from src.models.practice import (
    AdaptiveIntervention,
    AdaptiveInterventionRead,
    Exercise,
    HabitPattern,
    PracticeSession,
    PracticeSessionCreate,
    PracticeSessionRead,
    SessionChordMetric,
    SessionChordMetricRead,
    TransitionMastery,
)
from src.services.api.routes.me import ensure_user_exists
from starlette.datastructures import UploadFile as StarletteUploadFile

router = APIRouter(prefix="/sessions", tags=["Practice Sessions"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

_MIN_TEMPO_BPM = 30
_MAX_TEMPO_BPM = 260
_DEFAULT_DRILL_TEMPO = 60
_PAIR_LEN = 2


def _extract_chord_from_id(exercise_id: str) -> str:
    cleaned = exercise_id
    if cleaned.startswith("drill_chord_"):
        cleaned = cleaned[len("drill_chord_") :]
    elif cleaned.startswith("chord_"):
        cleaned = cleaned[len("chord_") :]

    cleaned = (
        cleaned.replace("_sharp", "#")
        .replace("sharp", "#")
        .replace("_flat", "b")
        .replace("flat", "b")
        .replace("_", "")
    )
    if not cleaned:
        return ""
    return cleaned[0].upper() + cleaned[1:]


def build_synthetic_chord_drill(
    exercise_id: str,
    tempo_bpm: int | None = None,
) -> Exercise | None:
    """Build a deterministic 4-bar chord drill iff ``exercise_id`` is a valid drill."""
    if not exercise_id.startswith(("drill_chord_", "chord_")):
        return None

    chord_name = _extract_chord_from_id(exercise_id)
    if not chord_name:
        return None
    try:
        pitch_classes = parse_chord_notes(chord_name)
    except ValueError:
        return None

    bpm = tempo_bpm or _DEFAULT_DRILL_TEMPO
    expected_pitches = [48 + pc for pc in pitch_classes]
    progression = {
        "key": chord_name,
        "time_signature": "4/4",
        "default_tempo_bpm": bpm,
        "chords": [
            {
                "name": chord_name,
                "chord": chord_name,
                "beat": 1.0 + (bar * 4.0),
                "duration_beats": 4.0,
                "expected_pitches": expected_pitches,
                "section": f"Measure {bar + 1}",
            }
            for bar in range(4)
        ],
    }

    return Exercise(
        id=exercise_id,
        user_id=None,
        title=f"Chord Drill: {chord_name}",
        description="Focused single-chord harmonic drill",
        instrument="guitar",
        tempo_bpm=bpm,
        difficulty=1,
        progression_json=json.dumps(progression),
    )


class TakeSubmission(BaseModel):
    """Schema representing JSON played chord events."""

    played_chords: list[dict[str, Any]] | None = None


class SessionAnalysisResponse(BaseModel):
    """Response payload for session analysis metrics."""

    session: PracticeSessionRead
    chord_metrics: list[SessionChordMetricRead]


async def _parse_take_request(
    request: Request,
) -> tuple[bytes | None, list[dict[str, Any]] | None, int | None, float]:
    content_type = request.headers.get("content-type", "").lower()
    if "multipart/form-data" in content_type:
        return await _parse_multipart_take(request)
    if "application/json" in content_type:
        return await _parse_json_take(request)
    msg = "Content-Type must be application/json or multipart/form-data"
    raise Unprocessable(msg)


async def _parse_multipart_take(
    request: Request,
) -> tuple[bytes, None, int | None, float]:
    form = await request.form()
    uploaded_file = form.get("audio_file") or form.get("file")
    if not isinstance(uploaded_file, StarletteUploadFile):
        msg = "Missing audio_file or file in multipart form"
        raise Unprocessable(msg)

    audio_bytes = await read_bounded_upload(uploaded_file, DEFAULT_MAX_AUDIO_SIZE_BYTES)
    if not audio_bytes:
        msg = "Uploaded audio file is empty"
        raise Unprocessable(msg)

    submitted_tempo: int | None = None
    raw_tempo = form.get("tempo_bpm")
    if raw_tempo is not None:
        with contextlib.suppress(ValueError):
            submitted_tempo = int(str(raw_tempo))

    submitted_lead_in = 0.0
    raw_lead_in = form.get("lead_in_seconds") or form.get("count_in_seconds")
    if raw_lead_in is not None:
        with contextlib.suppress(ValueError):
            submitted_lead_in = float(str(raw_lead_in))

    return audio_bytes, None, submitted_tempo, submitted_lead_in


async def _parse_json_take(
    request: Request,
) -> tuple[None, list[dict[str, Any]], int | None, float]:
    raw_body = await request.json()
    chords_list = raw_body.get("played_chords") if isinstance(raw_body, dict) else None
    if chords_list is None and isinstance(raw_body, dict):
        chords_list = raw_body.get("chords")

    if not isinstance(chords_list, list):
        msg = "JSON body must contain 'played_chords' or 'chords' list"
        raise Unprocessable(msg)

    submitted_tempo: int | None = None
    raw_tempo = raw_body.get("tempo_bpm") if isinstance(raw_body, dict) else None
    if raw_tempo is not None:
        with contextlib.suppress(ValueError, TypeError):
            submitted_tempo = int(raw_tempo)

    submitted_lead_in = 0.0
    raw_lead_in = (
        raw_body.get("lead_in_seconds") or raw_body.get("count_in_seconds")
        if isinstance(raw_body, dict)
        else None
    )
    if raw_lead_in is not None:
        with contextlib.suppress(ValueError, TypeError):
            submitted_lead_in = float(raw_lead_in)

    return None, chords_list, submitted_tempo, submitted_lead_in


def _default_context_for_exercise(exercise: Exercise | None) -> str:
    if exercise is None:
        return "General progression"
    try:
        parsed = json.loads(exercise.progression_json)
        chords = parsed.get("chords", []) if isinstance(parsed, dict) else parsed
        if isinstance(chords, list) and len(chords) >= _PAIR_LEN:
            c0 = str(chords[0].get("name") or chords[0].get("chord") or "").strip()
            c1 = str(chords[1].get("name") or chords[1].get("chord") or "").strip()
            if c0 and c1:
                return f"{c0} -> {c1}"
    except (ValueError, TypeError, AttributeError):
        pass
    return "General progression"


def _aggregate_bandit_priors(
    mastery_rows: list[TransitionMastery],
) -> dict[str, tuple[float, float]] | None:
    if not mastery_rows:
        return None
    return {
        "isolated_transition": (
            sum(max(0.0, r.bandit_alpha_isolated - 1.0) for r in mastery_rows),
            sum(max(0.0, r.bandit_beta_isolated - 1.0) for r in mastery_rows),
        ),
        "subdivision_click": (
            sum(max(0.0, r.bandit_alpha_subdivision - 1.0) for r in mastery_rows),
            sum(max(0.0, r.bandit_beta_subdivision - 1.0) for r in mastery_rows),
        ),
        "voicing_arpeggio": (
            sum(max(0.0, r.bandit_alpha_voicing - 1.0) for r in mastery_rows),
            sum(max(0.0, r.bandit_beta_voicing - 1.0) for r in mastery_rows),
        ),
        "gradual_tempo_ramp": (
            sum(max(0.0, r.bandit_alpha_ramp - 1.0) for r in mastery_rows),
            sum(max(0.0, r.bandit_beta_ramp - 1.0) for r in mastery_rows),
        ),
    }


@router.post(
    "",
    response_model=PracticeSessionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_practice_session(
    body: PracticeSessionCreate,
    identity: ClerkIdentityDep,
    session: SessionDep,
) -> PracticeSession:
    """Create a new practice session for the authenticated user."""
    await ensure_user_exists(session, identity)

    if body.intervention_id is not None:
        intervention = await session.get(AdaptiveIntervention, body.intervention_id)
        if intervention is None or intervention.user_id != identity.user_id:
            msg = "Adaptive intervention not found"
            raise NotFound(msg)

    exercise = await session.get(Exercise, body.exercise_id)
    if exercise is not None:
        if exercise.user_id is not None and exercise.user_id != identity.user_id:
            msg = "Exercise not found"
            raise NotFound(msg)
    else:
        exercise = build_synthetic_chord_drill(body.exercise_id, body.tempo_bpm)
        if exercise is None:
            msg = "Exercise not found"
            raise NotFound(msg)
        try:
            session.add(exercise)
            await session.commit()
            await session.refresh(exercise)
        except IntegrityError as exc:
            await session.rollback()
            exercise = await session.get(Exercise, body.exercise_id)
            if exercise is None:
                msg = "Exercise not found"
                raise NotFound(msg) from exc

    new_session = PracticeSession(
        id=f"sess_{uuid4().hex[:16]}",
        user_id=identity.user_id,
        exercise_id=body.exercise_id,
        tempo_bpm=body.tempo_bpm,
        intervention_id=body.intervention_id,
        state="recording",
    )
    session.add(new_session)
    await session.commit()
    await session.refresh(new_session)
    return new_session


@router.get("/{session_id}", response_model=PracticeSessionRead)
async def get_practice_session(
    session_id: str,
    identity: ClerkIdentityDep,
    session: SessionDep,
) -> PracticeSession:
    """Retrieve practice session details."""
    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        msg = "Practice session not found"
        raise NotFound(msg)
    return practice_session


@router.post("/{session_id}/take")
@router.post("/{session_id}/takes")
async def submit_take(
    session_id: str,
    identity: ClerkIdentityDep,
    request: Request,
    session: SessionDep,
) -> dict[str, Any]:
    """Submit recorded WAV audio or played chord events for evaluation."""
    TAKE_RATE_LIMIT.check(identity.user_id)

    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        msg = "Practice session not found"
        raise NotFound(msg)

    exercise = await session.get(Exercise, practice_session.exercise_id)
    if exercise is None:
        msg = "Exercise not found"
        raise NotFound(msg)

    audio_bytes, played_chords, submitted_tempo, submitted_lead_in = (
        await _parse_take_request(request)
    )

    if submitted_tempo is not None:
        if submitted_tempo < _MIN_TEMPO_BPM or submitted_tempo > _MAX_TEMPO_BPM:
            msg = "tempo_bpm must be between 30 and 260"
            raise Unprocessable(msg)
        practice_session.tempo_bpm = submitted_tempo
        session.add(practice_session)

    return await TakeEvaluator.evaluate_take(
        session=session,
        practice_session=practice_session,
        exercise=exercise,
        audio_bytes=audio_bytes,
        played_chords=played_chords,
        lead_in_seconds=submitted_lead_in,
    )


@router.get("/{session_id}/analysis", response_model=SessionAnalysisResponse)
async def get_session_analysis(
    session_id: str,
    identity: ClerkIdentityDep,
    session: SessionDep,
    take_number: Annotated[int | None, Query(ge=1)] = None,
) -> dict[str, Any]:
    """Retrieve session results and per-chord metrics (defaults to latest take)."""
    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        msg = "Practice session not found"
        raise NotFound(msg)

    target_take = take_number
    if target_take is None:
        max_take_query = await session.execute(
            select(func.max(SessionChordMetric.take_number)).where(
                col(SessionChordMetric.session_id) == session_id,
            ),
        )
        target_take = max_take_query.scalar() or 1

    result = await session.execute(
        select(SessionChordMetric)
        .where(
            col(SessionChordMetric.session_id) == session_id,
            col(SessionChordMetric.take_number) == target_take,
        )
        .order_by(col(SessionChordMetric.chord_index)),
    )
    chord_metrics = list(result.scalars().all())

    return {
        "session": practice_session,
        "chord_metrics": chord_metrics,
    }


@router.get("/{session_id}/coaching")
async def get_session_coaching(
    session_id: str,
    identity: ClerkIdentityDep,
    session: SessionDep,
) -> dict[str, Any]:
    """Retrieve grounded AI coaching report for the latest take in a session."""
    COACHING_RATE_LIMIT.check(identity.user_id)

    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        msg = "Practice session not found"
        raise NotFound(msg)

    exercise = await session.get(Exercise, practice_session.exercise_id)
    instrument = exercise.instrument if exercise else "piano"

    max_take_query = await session.execute(
        select(func.max(SessionChordMetric.take_number)).where(
            col(SessionChordMetric.session_id) == session_id,
        ),
    )
    latest_take = max_take_query.scalar() or 1

    metrics_res = await session.execute(
        select(SessionChordMetric)
        .where(
            col(SessionChordMetric.session_id) == session_id,
            col(SessionChordMetric.take_number) == latest_take,
        )
        .order_by(col(SessionChordMetric.chord_index)),
    )
    metrics = [
        {
            "chord_index": m.chord_index,
            "expected_chord": m.expected_chord,
            "detected_chord": m.detected_chord,
            "is_matched": m.is_matched,
            "onset_error_ms": m.onset_error_ms,
            "voicing_completeness": m.voicing_completeness,
        }
        for m in metrics_res.scalars().all()
    ]

    habits_res = await session.execute(
        select(HabitPattern).where(col(HabitPattern.user_id) == identity.user_id),
    )
    habits = [
        {
            "id": h.id,
            "pattern_type": h.pattern_type,
            "context": h.trigger_context,
            "evidence_count": h.evidence_count,
        }
        for h in habits_res.scalars().all()
    ]

    return await generate_coaching_report_async(
        session_id=session_id,
        chord_metrics=metrics,
        habits=habits,
        instrument=instrument,
    )


@router.post(
    "/{session_id}/drill",
    response_model=AdaptiveInterventionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_session_drill(
    session_id: str,
    identity: ClerkIdentityDep,
    session: SessionDep,
) -> AdaptiveIntervention:
    """Generate and persist an adaptive practice drill to remediate bottlenecks."""
    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        msg = "Practice session not found"
        raise NotFound(msg)

    habit_query = await session.execute(
        select(HabitPattern)
        .where(col(HabitPattern.user_id) == identity.user_id)
        .order_by(col(HabitPattern.evidence_count).desc()),
    )
    pattern = habit_query.scalars().first()

    if pattern is None:
        exercise = await session.get(Exercise, practice_session.exercise_id)
        default_ctx = _default_context_for_exercise(exercise)
        pattern = HabitPattern(
            id=f"pat_{uuid4().hex[:16]}",
            user_id=identity.user_id,
            pattern_type="transition_lag",
            trigger_context=default_ctx,
            evidence_count=1,
            status="emerging",
        )
        session.add(pattern)
        await session.flush()

    mastery_query = await session.execute(
        select(TransitionMastery).where(
            col(TransitionMastery.user_id) == identity.user_id,
        ),
    )
    strategy_history = _aggregate_bandit_priors(list(mastery_query.scalars().all()))

    pattern_dict = {
        "id": pattern.id,
        "pattern_type": pattern.pattern_type,
        "context": pattern.trigger_context,
        "evidence_count": pattern.evidence_count,
    }

    drill_data = StudentMasteryEngine.generate_adaptive_drill_plan(
        habit_pattern=pattern_dict,
        user_id=identity.user_id,
        reference_tempo=practice_session.tempo_bpm,
        strategy_history=strategy_history,
    )

    new_intervention = AdaptiveIntervention(
        id=drill_data["id"],
        pattern_id=pattern.id,
        user_id=identity.user_id,
        drill_type=drill_data["drill_type"],
        target_tempo=drill_data["target_tempo"],
        target_repetitions=drill_data["target_repetitions"],
        completed=False,
    )
    session.add(new_intervention)
    await session.commit()
    await session.refresh(new_intervention)
    return new_intervention
