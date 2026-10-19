"""Exercise API routes."""

from __future__ import annotations

import json
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.lib.auth.clerk import ClerkIdentityDep
from src.lib.db import get_session
from src.lib.exception import NotFound
from src.lib.schemas.music import CustomExerciseCreate, ExerciseDetailRead, ProgressionData
from src.models.practice import Exercise, ExerciseRead

from sqlmodel import col

NAMED_DIFFICULTIES: dict[str, tuple[int, int]] = {
    "beginner": (1, 2),
    "novice": (1, 1),
    "intermediate": (3, 3),
    "advanced": (4, 5),
    "expert": (5, 5),
}

router = APIRouter(prefix="/exercises", tags=["Exercises"])


@router.get("", response_model=list[ExerciseRead])
async def get_exercises(
    session: Annotated[AsyncSession, Depends(get_session)],
    instrument: Annotated[str | None, Query(description="Filter by instrument ('piano' or 'guitar')")] = None,
    difficulty: Annotated[str | None, Query(description="Filter by difficulty level (1-5, or 'beginner', 'intermediate', 'advanced')")] = None,
    search: Annotated[str | None, Query(description="Search keywords in title or description")] = None,
) -> list[Exercise]:
    """Return all exercises matching optional instrument, difficulty, or search filters."""
    query = select(Exercise)
    if instrument:
        query = query.where(col(Exercise.instrument) == instrument.lower())
    if difficulty:
        diff_str = difficulty.strip().lower()
        if diff_str.isdigit():
            diff_num = int(diff_str)
            query = query.where(col(Exercise.difficulty) == diff_num)
        elif diff_str in NAMED_DIFFICULTIES:
            min_d, max_d = NAMED_DIFFICULTIES[diff_str]
            query = query.where(col(Exercise.difficulty) >= min_d, col(Exercise.difficulty) <= max_d)
    if search:
        query = query.where(col(Exercise.title).ilike(f"%{search}%"))

    result = await session.execute(query.order_by(col(Exercise.difficulty), col(Exercise.title)))
    return list(result.scalars().all())


@router.get("/{exercise_id}", response_model=ExerciseDetailRead)
async def get_exercise_detail(
    exercise_id: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ExerciseDetailRead:
    """Return complete exercise details with fully parsed progression, voicings, tabs, and tempo ranges."""
    exercise = await session.get(Exercise, exercise_id)
    if exercise is None:
        raise NotFound(f"Exercise '{exercise_id}' not found")

    try:
        raw_prog = json.loads(exercise.progression_json)
        if isinstance(raw_prog, list):
            progression = ProgressionData(
                default_tempo_bpm=exercise.tempo_bpm,
                chords=raw_prog,
            )
        else:
            progression = ProgressionData.model_validate(raw_prog)
    except Exception:
        progression = ProgressionData(
            default_tempo_bpm=exercise.tempo_bpm,
            chords=[],
        )

    return ExerciseDetailRead(
        id=exercise.id,
        title=exercise.title,
        description=exercise.description,
        instrument=exercise.instrument,
        tempo_bpm=exercise.tempo_bpm,
        difficulty=exercise.difficulty,
        progression=progression,
    )


@router.post("", response_model=ExerciseDetailRead, status_code=status.HTTP_201_CREATED)
async def create_custom_exercise(
    body: CustomExerciseCreate,
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ExerciseDetailRead:
    """Ingest a new custom chord progression exercise with validated music theory metadata."""
    new_id = f"ex_custom_{uuid4().hex[:12]}"
    prog_json = body.progression.model_dump_json()

    new_exercise = Exercise(
        id=new_id,
        title=body.title,
        description=body.description,
        instrument=body.instrument,
        tempo_bpm=body.tempo_bpm,
        difficulty=body.difficulty,
        progression_json=prog_json,
    )

    session.add(new_exercise)
    await session.commit()
    await session.refresh(new_exercise)

    return ExerciseDetailRead(
        id=new_exercise.id,
        title=new_exercise.title,
        description=new_exercise.description,
        instrument=new_exercise.instrument,
        tempo_bpm=new_exercise.tempo_bpm,
        difficulty=new_exercise.difficulty,
        progression=body.progression,
    )
