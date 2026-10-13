from __future__ import annotations

from sqlmodel import Field,SQLModel
from src.models.base import Base
from src.models.common import TimestampMixin

class Exercise(TimestampMixin, Base, table=True):
    """Exercise model for the platform."""
    __tablename__ = "exercises"

    id: str = Field(primary_key=True, max_length=100)
    title: str = Field(max_length=200)
    description: str | None = None
    instrument: str = Field(max_length=50,default="piano")
    tempo_bpm: int
    difficulty: int
    progression_json: str

class ExerciseCreate(SQLModel):
    """Schema for creating an exercise."""

    title:str=Field(max_length=200)
    description: str|None=None
    instrument:str=Field(max_length=50,default="piano")
    tempo_bpm: int
    difficulty: int
    progression_json: str
class ExerciseRead(SQLModel):
    """Schema for reading an exercise."""

    id:str
    title:str
    description:str|None=None
    instrument:str
    tempo_bpm:int
    difficulty:int
    progression_json:str


class PracticeSession(TimestampMixin, Base, table=True):
    """Practice session model for the platform."""
    __tablename__ = "practice_sessions"

    id: str = Field(primary_key=True, max_length=100)
    user_id: str = Field(
        foreign_key="users.id",
        index=True,
        max_length=255,
    )
    exercise_id: str = Field(
        foreign_key="exercises.id",
        index=True,
        max_length=100,
    )
    tempo_bpm: int
    state: str = Field(default="recording", max_length=50)
    overall_accuracy: float | None = None
    avg_timing_error_ms: float | None = None
    voicing_score: float | None = None


class PracticeSessionCreate(SQLModel):
    """Schema for creating a practice session."""
    
    exercise_id:str
    tempo_bpm:int
    

class PracticeSessionRead(SQLModel):
    """Schema for reading a practice session."""
    id:str
    user_id:str
    exercise_id:str
    tempo_bpm:int
    state:str
    overall_accuracy:float|None=None
    avg_timing_error_ms:float|None=None
    voicing_score:float|None=None