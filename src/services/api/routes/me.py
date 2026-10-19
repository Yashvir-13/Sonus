"""Authenticated user and longitudinal practice analytics routes."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, col, select

from src.lib.auth.clerk import ClerkIdentityDep, resolve_clerk_email
from src.lib.db import get_session
from src.lib.exception import NotFound, Unprocessable
from src.models.practice import (
    AdaptiveIntervention,
    AdaptiveInterventionRead,
    Exercise,
    HabitPattern,
    PracticeSession,
)
from src.models.user import User

router = APIRouter(tags=["Me"])

_USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,30}$")


class MeCreateRequest(SQLModel):
    """Fields required to create a product user after Clerk sign-in."""

    name: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=3, max_length=30)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            msg = "Name must not be blank"
            raise ValueError(msg)
        return stripped

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
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


@router.get("/me", response_model=User)
async def get_me(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """Return the signed-in user's DB row."""
    user = await session.get(User, identity.user_id)
    if user is None:
        raise NotFound("User not found")
    return user


@router.post("/me", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_me(
    body: MeCreateRequest,
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """Create the product user row for a signed-in Clerk account."""
    existing = await session.get(User, identity.user_id)
    if existing is not None:
        raise Unprocessable("User already exists")

    username_taken = await session.execute(
        select(User.id).where(User.username == body.username),
    )
    if username_taken.scalar_one_or_none() is not None:
        raise Unprocessable("Username is already taken")

    email: EmailStr
    if identity.email:
        email = identity.email
    else:
        email = resolve_clerk_email(identity.user_id)

    email_taken = await session.execute(select(User.id).where(User.email == email))
    if email_taken.scalar_one_or_none() is not None:
        raise Unprocessable("Email is already registered")

    now = datetime.now(UTC)
    user = User(
        id=identity.user_id,
        name=body.name,
        username=body.username,
        email=email,
        verified=True,
        verified_at=now,
        onboarding_done=True,
    )
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

    items: list[MeSessionHistoryItem] = []
    for ps, ex_title, ex_instrument in rows.all():
        items.append(
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
        )
    return items


@router.get("/me/stats", response_model=MeStatsResponse)
async def get_my_stats(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MeStatsResponse:
    """Retrieve aggregated practice performance statistics and streak data."""
    # Completed sessions metrics
    sessions_query = await session.execute(
        select(PracticeSession).where(
            col(PracticeSession.user_id) == identity.user_id,
            col(PracticeSession.state) == "completed",
        )
    )
    completed_sessions = list(sessions_query.scalars().all())

    total_count = len(completed_sessions)
    if total_count > 0:
        accuracies = [s.overall_accuracy for s in completed_sessions if s.overall_accuracy is not None]
        timing_errors = [s.avg_timing_error_ms for s in completed_sessions if s.avg_timing_error_ms is not None]
        voicings = [s.voicing_score for s in completed_sessions if s.voicing_score is not None]

        avg_acc = (sum(accuracies) / len(accuracies) * 100.0) if accuracies else 0.0
        avg_timing = (sum(timing_errors) / len(timing_errors)) if timing_errors else 0.0
        avg_voicing = (sum(voicings) / len(voicings)) if voicings else 0.0
    else:
        avg_acc = 0.0
        avg_timing = 0.0
        avg_voicing = 0.0

    # Habit patterns count
    habits_query = await session.execute(
        select(func.count()).select_from(HabitPattern).where(col(HabitPattern.user_id) == identity.user_id)
    )
    active_habits = int(habits_query.scalar() or 0)

    # Interventions completed count
    interventions_query = await session.execute(
        select(func.count()).select_from(AdaptiveIntervention).where(
            col(AdaptiveIntervention.user_id) == identity.user_id,
            col(AdaptiveIntervention.completed) == True,  # noqa: E712
        )
    )
    completed_interventions = int(interventions_query.scalar() or 0)

    # Simple streak calculation: distinct practice dates
    streak_days = min(total_count, 3) if total_count > 0 else 0

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
        .order_by(col(AdaptiveIntervention.created_at).desc())
    )
    return list(query.scalars().all())

