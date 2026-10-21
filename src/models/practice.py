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
    intervention_id: str | None = Field(
        default=None,
        foreign_key="adaptive_interventions.id",
        index=True,
        max_length=100,
    )


class PracticeSessionCreate(SQLModel):
    """Schema for creating a practice session."""

    exercise_id: str
    tempo_bpm: int
    intervention_id: str | None = None


class PracticeSessionRead(SQLModel):
    """Schema for reading a practice session."""
    id: str
    user_id: str
    exercise_id: str
    tempo_bpm: int
    state: str
    overall_accuracy: float | None = None
    avg_timing_error_ms: float | None = None
    voicing_score: float | None = None
    intervention_id: str | None = None


class SessionChordMetric(Base, table=True):
    """Per-chord analysis metric for a practice session."""
    __tablename__ = "session_chord_metrics"

    id: str = Field(primary_key=True, max_length=100)
    session_id: str = Field(
        foreign_key="practice_sessions.id",
        index=True,
        max_length=100,
    )
    chord_index: int
    expected_chord: str = Field(max_length=50)
    detected_chord: str = Field(max_length=50)
    is_matched: bool
    onset_error_ms: float
    voicing_completeness: float
    missed_notes_json: str
    extra_notes_json: str


class SessionChordMetricRead(SQLModel):
    """Schema for reading session chord metrics."""
    id: str
    session_id: str
    chord_index: int
    expected_chord: str
    detected_chord: str
    is_matched: bool
    onset_error_ms: float
    voicing_completeness: float
    missed_notes_json: str
    extra_notes_json: str


class HabitPattern(TimestampMixin, Base, table=True):
    """Longitudinal habit pattern detected across practice takes."""
    __tablename__ = "habit_patterns"

    id: str = Field(primary_key=True, max_length=100)
    user_id: str = Field(
        foreign_key="users.id",
        index=True,
        max_length=255,
    )
    pattern_type: str = Field(max_length=50)
    trigger_context: str = Field(max_length=255)
    evidence_count: int
    status: str = Field(default="emerging", max_length=50)


class HabitPatternRead(SQLModel):
    """Schema for reading habit patterns."""
    id: str
    user_id: str
    pattern_type: str
    trigger_context: str
    evidence_count: int
    status: str


class AdaptiveIntervention(TimestampMixin, Base, table=True):
    """Targeted practice drill generated to remediate habit patterns."""
    __tablename__ = "adaptive_interventions"

    id: str = Field(primary_key=True, max_length=100)
    pattern_id: str = Field(
        foreign_key="habit_patterns.id",
        index=True,
        max_length=100,
    )
    user_id: str = Field(
        foreign_key="users.id",
        index=True,
        max_length=255,
    )
    drill_type: str = Field(max_length=50)
    target_tempo: int
    target_repetitions: int
    completed: bool = Field(default=False)
    measured_improvement: float | None = None


class AdaptiveInterventionRead(SQLModel):
    """Schema for reading adaptive interventions."""
    id: str
    pattern_id: str
    user_id: str
    drill_type: str
    target_tempo: int
    target_repetitions: int
    completed: bool
    measured_improvement: float | None = None