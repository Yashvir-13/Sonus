"""Authenticated user and longitudinal practice analytics routes."""

from __future__ import annotations

import re
from datetime import UTC, date, datetime, timedelta
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, col, select
from src.lib.adaptive.mastery import StudentMasteryEngine
from src.lib.auth.clerk import ClerkIdentity, ClerkIdentityDep, resolve_clerk_email
from src.lib.db import get_session
from src.lib.exception import NotFound, Unprocessable
from src.lib.schemas.mastery import MeMasteryResponse
from src.models.practice import (
    AdaptiveIntervention,
    AdaptiveInterventionRead,
    Exercise,
    HabitPattern,
    HabitPatternRead,
    PracticeSession,
    TransitionMastery,
    TransitionMasteryRead,
)
from src.models.user import User

router = APIRouter(tags=["Me"])

_USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,30}$")
_MIN_USERNAME_LEN = 3
_MAX_USERNAME_ATTEMPTS = 5
_PERCENT_SCALE = 100.0


class MeCreateRequest(SQLModel):
    """Fields required to create a product user after Clerk sign-in."""

    name: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=3, max_length=30)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        """Strip leading/trailing whitespace and reject blank names."""
        stripped = value.strip()
        if not stripped:
            msg = "Name must not be blank"
            raise ValueError(msg)
        return stripped

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        """Normalize username to lowercase alphanumeric/underscore."""
        normalized = value.strip().lower()
        if not _USERNAME_PATTERN.fullmatch(normalized):
            msg = "Username must be 3-30 characters: letters, numbers, underscore"
            raise ValueError(msg)
        return normalized


class MeUpdateRequest(SQLModel):
    """Fields that can be updated by the user."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    username: str | None = Field(default=None, min_length=3, max_length=30)
    onboarding_done: bool | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        """Strip whitespace and reject blank names when provided."""
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            msg = "Name must not be blank"
            raise ValueError(msg)
        return stripped

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str | None) -> str | None:
        """Normalize username to lowercase alphanumeric/underscore when provided."""
        if value is None:
            return None
        normalized = value.strip().lower()
        if not _USERNAME_PATTERN.fullmatch(normalized):
            msg = "Username must be 3-30 characters: letters, numbers, underscore"
            raise ValueError(msg)
        return normalized


class MeSessionHistoryItem(BaseModel):
    """User practice session summary item."""

    id: str
    exercise_id: str
    exercise_title: str
    instrument: str
    tempo_bpm: int
    state: str
    overall_accuracy: float | None = None
    avg_timing_error_ms: float | None = None
    voicing_score: float | None = None
    created_at: datetime | None = None


class MeStatsResponse(BaseModel):
    """Aggregated longitudinal practice statistics."""

    user_id: str
    total_sessions_completed: int
    overall_accuracy_pct: float
    avg_timing_error_ms: float
    avg_voicing_score: float
    active_habits_count: int
    interventions_completed: int
    streak_days: int


def _resolve_email_for_identity(identity: ClerkIdentity) -> str:
    if identity.email:
        return identity.email
    try:
        return resolve_clerk_email(identity.user_id)
    except (Unprocessable, RuntimeError):
        return f"{identity.user_id}@sonus.studio"


async def _pick_unique_username(session: AsyncSession, base_raw: str) -> str:
    sanitized = re.sub(r"[^a-z0-9_]", "_", base_raw.lower()).strip("_")
    if len(sanitized) < _MIN_USERNAME_LEN:
        sanitized = f"user_{sanitized}"
    base_username = sanitized[:22]

    username_candidate = base_username
    for _ in range(_MAX_USERNAME_ATTEMPTS):
        taken = await session.execute(
            select(User.id).where(User.username == username_candidate),
        )
        if taken.scalar_one_or_none() is None:
            return username_candidate
        username_candidate = f"{base_username}_{uuid4().hex[:4]}"[:30]
    return f"musician_{uuid4().hex[:8]}"[:30]


def _compute_consecutive_utc_streak(timestamps: list[datetime | None]) -> int:
    practice_dates: set[date] = set()
    for raw_dt in timestamps:
        if raw_dt is None:
            continue
        dt_utc = (
            raw_dt.replace(tzinfo=UTC)
            if raw_dt.tzinfo is None
            else raw_dt.astimezone(UTC)
        )
        practice_dates.add(dt_utc.date())

    if not practice_dates:
        return 0

    today_utc = datetime.now(UTC).date()
    cursor = today_utc if today_utc in practice_dates else today_utc - timedelta(days=1)
    streak = 0
    while cursor in practice_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


async def ensure_user_exists(
    session: AsyncSession,
    identity: ClerkIdentity,
    candidate_name: str | None = None,
    candidate_username: str | None = None,
) -> User:
    """Return the product user for ``identity.user_id``, provisioning if missing."""
    user = await session.get(User, identity.user_id)
    if user is not None:
        return user

    email_str = _resolve_email_for_identity(identity)

    # Never alias a different Clerk subject onto an existing account
    existing_by_email = await session.execute(
        select(User).where(User.email == email_str),
    )
    matched_user = existing_by_email.scalar_one_or_none()
    if matched_user is not None:
        msg = "An account with this email already exists under a different identity"
        raise Unprocessable(msg)

    raw_username = candidate_username or email_str.split("@", maxsplit=1)[0]
    username_candidate = await _pick_unique_username(session, raw_username)

    name = (
        candidate_name
        or raw_username.replace("_", " ").title()[:100]
        or "Studio Musician"
    )
    now = datetime.now(UTC)

    new_user = User(
        id=identity.user_id,
        name=name,
        username=username_candidate,
        email=email_str,
        verified=True,
        verified_at=now,
        onboarding_done=True,
    )
    session.add(new_user)
    try:
        await session.commit()
        await session.refresh(new_user)
    except IntegrityError as exc:
        await session.rollback()
        existing = await session.get(User, identity.user_id)
        if existing is not None:
            return existing
        msg = "Could not provision user profile due to conflicting email or username"
        raise Unprocessable(msg) from exc
    return new_user


@router.get("/me", response_model=User)
async def get_me(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """Return the signed-in user's DB row, auto-provisioning if first visit."""
    return await ensure_user_exists(session, identity)


@router.post("/me", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_me(
    body: MeCreateRequest,
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """Create the product user row for a signed-in Clerk account."""
    existing = await session.get(User, identity.user_id)
    if existing is not None:
        return existing
    return await ensure_user_exists(
        session,
        identity,
        candidate_name=body.name,
        candidate_username=body.username,
    )


@router.patch("/me", response_model=User)
async def update_me(
    body: MeUpdateRequest,
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """Update profile attributes for the signed-in user."""
    user = await session.get(User, identity.user_id)
    if user is None:
        msg = "User not found"
        raise NotFound(msg)

    if body.username is not None and body.username != user.username:
        taken = await session.execute(
            select(User.id).where(User.username == body.username, User.id != user.id),
        )
        if taken.scalar_one_or_none() is not None:
            msg = "Username is already taken"
            raise Unprocessable(msg)
        user.username = body.username

    if body.name is not None:
        user.name = body.name

    if body.onboarding_done is not None:
        user.onboarding_done = body.onboarding_done

    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.get("/me/sessions", response_model=list[MeSessionHistoryItem])
async def get_my_sessions(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[MeSessionHistoryItem]:
    """Retrieve paginated practice session history for the current user."""
    query = (
        select(PracticeSession, Exercise.title, Exercise.instrument)
        .outerjoin(Exercise, col(PracticeSession.exercise_id) == col(Exercise.id))
        .where(col(PracticeSession.user_id) == identity.user_id)
        .order_by(col(PracticeSession.created_at).desc())
        .limit(limit)
        .offset(offset)
    )
    rows = await session.execute(query)

    return [
        MeSessionHistoryItem(
            id=ps.id,
            exercise_id=ps.exercise_id,
            exercise_title=ex_title or "Custom Exercise",
            instrument=ex_instrument or "piano",
            tempo_bpm=ps.tempo_bpm,
            state=ps.state,
            overall_accuracy=ps.overall_accuracy,
            avg_timing_error_ms=ps.avg_timing_error_ms,
            voicing_score=ps.voicing_score,
            created_at=ps.created_at,
        )
        for ps, ex_title, ex_instrument in rows.all()
    ]


@router.get("/me/stats", response_model=MeStatsResponse)
async def get_my_stats(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MeStatsResponse:
    """Retrieve aggregated practice performance statistics and streak data."""
    stats_query = await session.execute(
        select(
            func.count(col(PracticeSession.id)),
            func.avg(col(PracticeSession.overall_accuracy)),
            func.avg(col(PracticeSession.avg_timing_error_ms)),
            func.avg(col(PracticeSession.voicing_score)),
        ).where(
            col(PracticeSession.user_id) == identity.user_id,
            col(PracticeSession.state) == "completed",
        ),
    )
    stats_row = stats_query.one()
    total_count = int(stats_row[0] or 0)
    raw_acc = stats_row[1]
    raw_timing = stats_row[2]
    raw_voicing = stats_row[3]

    avg_acc = (float(raw_acc) * _PERCENT_SCALE) if raw_acc is not None else 0.0
    avg_timing = float(raw_timing) if raw_timing is not None else 0.0
    avg_voicing = float(raw_voicing) if raw_voicing is not None else 0.0

    habits_query = await session.execute(
        select(func.count())
        .select_from(HabitPattern)
        .where(col(HabitPattern.user_id) == identity.user_id),
    )
    active_habits = int(habits_query.scalar() or 0)

    interventions_query = await session.execute(
        select(func.count())
        .select_from(AdaptiveIntervention)
        .where(
            col(AdaptiveIntervention.user_id) == identity.user_id,
            col(AdaptiveIntervention.completed).is_(True),
        ),
    )
    completed_interventions = int(interventions_query.scalar() or 0)

    dates_query = await session.execute(
        select(col(PracticeSession.created_at)).where(
            col(PracticeSession.user_id) == identity.user_id,
            col(PracticeSession.state) == "completed",
        ),
    )
    streak_days = _compute_consecutive_utc_streak(list(dates_query.scalars().all()))

    return MeStatsResponse(
        user_id=identity.user_id,
        total_sessions_completed=total_count,
        overall_accuracy_pct=round(avg_acc, 1),
        avg_timing_error_ms=round(avg_timing, 1),
        avg_voicing_score=round(avg_voicing, 2),
        active_habits_count=active_habits,
        interventions_completed=completed_interventions,
        streak_days=streak_days,
    )


@router.get("/me/interventions", response_model=list[AdaptiveInterventionRead])
async def get_my_interventions(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AdaptiveIntervention]:
    """Retrieve all adaptive drills and interventions generated for the user."""
    query = await session.execute(
        select(AdaptiveIntervention)
        .where(col(AdaptiveIntervention.user_id) == identity.user_id)
        .order_by(col(AdaptiveIntervention.created_at).desc()),
    )
    return list(query.scalars().all())


@router.get("/me/habits", response_model=list[HabitPatternRead])
async def get_my_habits(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[HabitPattern]:
    """Retrieve all detected habit patterns for the signed-in user."""
    query = await session.execute(
        select(HabitPattern)
        .where(col(HabitPattern.user_id) == identity.user_id)
        .order_by(col(HabitPattern.evidence_count).desc()),
    )
    return list(query.scalars().all())


@router.get("/me/mastery", response_model=MeMasteryResponse)
async def get_my_mastery(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MeMasteryResponse:
    """Retrieve active transition mastery states and ranked recommendations."""
    query = await session.execute(
        select(TransitionMastery)
        .where(col(TransitionMastery.user_id) == identity.user_id)
        .order_by(
            col(TransitionMastery.p_known).asc(),
            col(TransitionMastery.ewma_latency_ms).desc(),
        ),
    )
    records = list(query.scalars().all())
    ranked_recommendations = StudentMasteryEngine.rank_transition_prescriptions(records)

    return MeMasteryResponse(
        records=[TransitionMasteryRead.model_validate(r) for r in records],
        recommendations=ranked_recommendations,
    )
