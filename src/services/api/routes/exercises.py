from src.models.practice import Exercise, ExerciseRead, PracticeSession
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.db import get_session
from __future__ import annotations
from typing import annotated

router=APIRouter(prefix="/exercises",tags=["exercises"])
@router.get("/",response_model=list[ExerciseRead])
async def get_exercises(session: AsyncSession = Depends(get_session)):
    """Get all exercises."""
    result = await session.execute(select(Exercise))
    exercises = result.scalars().all()
    if exercises is None:
        raise HTTPException(status_code=404, detail="No exercises found")
    return exercises


4
