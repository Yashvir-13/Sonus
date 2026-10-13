from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from starlette.datastructures import UploadFile as StarletteUploadFile

from src.lib.audio.alignment import align_chord_sequence
from src.lib.audio.transcription import transcribe_polyphonic_wav
from src.lib.audio.voicing import cluster_chords_from_notes
from src.lib.auth.clerk import ClerkIdentityDep
from src.lib.db import get_session
from src.lib.exception import NotFound, Unprocessable
from src.models.practice import (
    Exercise,
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

    reference_chords: list[dict[str, Any]] = json.loads(exercise.progression_json)

    played_chords: list[dict[str, Any]] = []

    content_type = request.headers.get("content-type", "").lower()
    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("audio_file")
        if isinstance(uploaded_file, StarletteUploadFile):
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = Path(tmp.name)
                content = await uploaded_file.read()
                tmp_path.write_bytes(content)

            try:
                notes = transcribe_polyphonic_wav(tmp_path)
                played_chords = cluster_chords_from_notes(notes)
            finally:
                if tmp_path.exists():
                    tmp_path.unlink()
        else:
            raise Unprocessable("Missing audio_file in multipart form")
    elif "application/json" in content_type:
        raw_body = await request.json()
        if isinstance(raw_body, dict) and "played_chords" in raw_body and isinstance(raw_body["played_chords"], list):
            played_chords = raw_body["played_chords"]
        else:
            raise Unprocessable("JSON body must contain 'played_chords' list")
    else:
        raise Unprocessable("Content-Type must be application/json or multipart/form-data")

    # Run dynamic programming sequence alignment
    alignment = align_chord_sequence(
        played_chords=played_chords,
        reference_chords=reference_chords,
        tempo_bpm=practice_session.tempo_bpm,
    )

    matched = [m for m in alignment if m["is_matched"]]
    overall_accuracy = (len(matched) / len(alignment)) if alignment else 0.0

    timing_errors = [abs(float(m["onset_error_ms"])) for m in matched]
    avg_timing_error = (sum(timing_errors) / len(timing_errors)) if timing_errors else 0.0

    voicing_scores = [float(m["voicing_completeness"]) for m in matched]
    voicing_score = (sum(voicing_scores) / len(voicing_scores)) if voicing_scores else 0.0

    # Delete existing metrics if take is being re-submitted
    existing_metrics = await session.execute(
        select(SessionChordMetric).where(SessionChordMetric.session_id == session_id)
    )
    for row in existing_metrics.scalars().all():
        await session.delete(row)

    # Persist chord metrics
    for m in alignment:
        metric = SessionChordMetric(
            id=f"metric_{uuid4().hex[:16]}",
            session_id=practice_session.id,
            chord_index=int(m["chord_index"]),
            expected_chord=str(m["expected_chord"]),
            detected_chord=str(m["detected_chord"]),
            is_matched=bool(m["is_matched"]),
            onset_error_ms=float(m["onset_error_ms"]),
            voicing_completeness=float(m["voicing_completeness"]),
            missed_notes_json=json.dumps(m["missed_notes"]),
            extra_notes_json=json.dumps(m["extra_notes"]),
        )
        session.add(metric)

    practice_session.state = "completed"
    practice_session.overall_accuracy = round(overall_accuracy, 3)
    practice_session.avg_timing_error_ms = round(avg_timing_error, 2)
    practice_session.voicing_score = round(voicing_score, 3)
    session.add(practice_session)
    await session.commit()
    await session.refresh(practice_session)

    return {
        "session_id": practice_session.id,
        "state": practice_session.state,
        "overall_accuracy": practice_session.overall_accuracy,
        "avg_timing_error_ms": practice_session.avg_timing_error_ms,
        "voicing_score": practice_session.voicing_score,
        "chord_metrics": alignment,
    }


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
