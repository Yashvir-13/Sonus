"""Exercise API routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002
from src.lib.db import get_session
from src.models.practice import Exercise, ExerciseRead

router = APIRouter(prefix="/exercises", tags=["Exercises"])


@router.get("", response_model=list[ExerciseRead])
async def get_exercises(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[Exercise]:
    """Return all exercises."""
    result = await session.execute(select(Exercise))
    return list(result.scalars().all())



