from __future__ import annotations

from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from starlette.datastructures import UploadFile as StarletteUploadFile

from src.lib.adaptive.mastery import StudentMasteryEngine
from src.lib.adaptive.llm_coach import generate_coaching_report
from src.lib.auth.clerk import ClerkIdentityDep
from src.lib.db import get_session
from src.lib.exception import NotFound, Unprocessable
from src.lib.practice.evaluator import TakeEvaluator
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
)

router = APIRouter(prefix="/sessions", tags=["Practice Sessions"])


class TakeSubmission(BaseModel):
    played_chords: list[dict[str, Any]] | None = None


class SessionAnalysisResponse(BaseModel):
    session: PracticeSessionRead
    chord_metrics: list[SessionChordMetricRead]


@router.post("", response_model=PracticeSessionRead, status_code=status.HTTP_201_CREATED)
async def create_practice_session(
    body: PracticeSessionCreate,
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PracticeSession:
    """Create a new practice session for the authenticated user."""
    exercise = await session.get(Exercise, body.exercise_id)
    if exercise is None:
        raise NotFound("Exercise not found")

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
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PracticeSession:
    """Retrieve practice session details."""
    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        raise NotFound("Practice session not found")
    return practice_session


@router.post("/{session_id}/take")
@router.post("/{session_id}/takes")
async def submit_take(
    session_id: str,
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request,
) -> dict[str, Any]:
    """Submit recorded audio WAV or played chord events for sequence alignment and evaluation."""
    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        raise NotFound("Practice session not found")

    exercise = await session.get(Exercise, practice_session.exercise_id)
    if exercise is None:
        raise NotFound("Associated exercise not found")

    audio_bytes: bytes | None = None
    played_chords: list[dict[str, Any]] | None = None

    content_type = request.headers.get("content-type", "").lower()
    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("audio_file") or form.get("file")
        if isinstance(uploaded_file, StarletteUploadFile):
            audio_bytes = await uploaded_file.read()
        else:
            raise Unprocessable("Missing audio_file or file in multipart form")
    elif "application/json" in content_type:
        raw_body = await request.json()
        chords_list = raw_body.get("played_chords") if isinstance(raw_body, dict) else None
        if chords_list is None and isinstance(raw_body, dict):
            chords_list = raw_body.get("chords")

        if isinstance(chords_list, list):
            played_chords = chords_list
        else:
            raise Unprocessable("JSON body must contain 'played_chords' or 'chords' list")
    else:
        raise Unprocessable("Content-Type must be application/json or multipart/form-data")

    # Delegate full evaluation pipeline to deep TakeEvaluator module
    return await TakeEvaluator.evaluate_take(
        session=session,
        practice_session=practice_session,
        exercise=exercise,
        audio_bytes=audio_bytes,
        played_chords=played_chords,
    )


@router.get("/{session_id}/analysis", response_model=SessionAnalysisResponse)
async def get_session_analysis(
    session_id: str,
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Retrieve full session results and per-chord metrics."""
    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        raise NotFound("Practice session not found")

    result = await session.execute(
        select(SessionChordMetric)
        .where(SessionChordMetric.session_id == session_id)
        .order_by(SessionChordMetric.chord_index)  # type: ignore[arg-type]
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
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Retrieve pedagogical AI coaching report for a completed session."""
    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        raise NotFound("Practice session not found")

    exercise = await session.get(Exercise, practice_session.exercise_id)
    instrument = exercise.instrument if exercise else "piano"

    metrics_res = await session.execute(
        select(SessionChordMetric)
        .where(SessionChordMetric.session_id == session_id)
        .order_by(SessionChordMetric.chord_index)  # type: ignore[arg-type]
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
        select(HabitPattern).where(HabitPattern.user_id == identity.user_id)
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

    return generate_coaching_report(
        session_id=session_id,
        chord_metrics=metrics,
        habits=habits,
        instrument=instrument,
    )


@router.post("/{session_id}/drill", response_model=AdaptiveInterventionRead, status_code=status.HTTP_201_CREATED)
async def create_session_drill(
    session_id: str,
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AdaptiveIntervention:
    """Generate and persist an adaptive practice drill to remediate detected bottlenecks."""
    practice_session = await session.get(PracticeSession, session_id)
    if practice_session is None or practice_session.user_id != identity.user_id:
        raise NotFound("Practice session not found")

    # Find the most prominent active or emerging habit pattern for this user
    habit_query = await session.execute(
        select(HabitPattern)
        .where(HabitPattern.user_id == identity.user_id)
        .order_by(HabitPattern.evidence_count.desc())  # type: ignore[attr-defined]
    )
    pattern = habit_query.scalars().first()

    pattern_dict = {
        "id": pattern.id if pattern else f"pat_default_{session_id[:6]}",
        "pattern_type": pattern.pattern_type if pattern else "transition_lag",
        "context": pattern.trigger_context if pattern else "General progression",
    }

    drill_data = StudentMasteryEngine.generate_adaptive_drill_plan(
        habit_pattern=pattern_dict,
        user_id=identity.user_id,
        reference_tempo=practice_session.tempo_bpm,
    )


    new_intervention = AdaptiveIntervention(
        id=drill_data["id"],
        pattern_id=drill_data["pattern_id"],
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
