from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, cast

from sqlalchemy import DateTime, Index, UniqueConstraint, func
from sqlmodel import Field, SQLModel
from src.models.base import Base
from src.models.common import TimestampMixin

class Exercise(TimestampMixin, Base, table=True):
    """Exercise model for the platform."""
    __tablename__ = "exercises"

    id: str = Field(primary_key=True, max_length=100)
    title: str = Field(max_length=200)
    description: str | None = None
    instrument: str = Field(max_length=50, default="piano")
    tempo_bpm: int
    difficulty: int
    progression_json: str

    __table_args__ = (
        Index("ix_exercises_instrument_difficulty", "instrument", "difficulty"),
    )

class ExerciseCreate(SQLModel):
    """Schema for creating an exercise."""

    title: str = Field(max_length=200)
    description: str | None = None
    instrument: str = Field(max_length=50, default="piano")
    tempo_bpm: int
    difficulty: int
    progression_json: str
class ExerciseRead(SQLModel):
    """Schema for reading an exercise."""

    id: str
    title: str
    description: str | None = None
    instrument: str
    tempo_bpm: int
    difficulty: int
    progression_json: str


class PracticeSession(TimestampMixin, Base, table=True):
    """Practice session model for the platform."""
    __tablename__ = "practice_sessions"

    id: str = Field(primary_key=True, max_length=100)
    user_id: str = Field(
        foreign_key="users.id",
        ondelete="CASCADE",
        index=True,
        max_length=255,
    )
    exercise_id: str = Field(
        foreign_key="exercises.id",
        ondelete="CASCADE",
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

    __table_args__ = (
        Index("ix_practice_sessions_user_created", "user_id", "created_at"),
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
        ondelete="CASCADE",
        index=True,
        max_length=100,
    )
    take_number: int = Field(default=1)
    tempo_bpm: int = Field(default=120)
    chord_index: int
    expected_chord: str = Field(max_length=50)
    detected_chord: str = Field(max_length=50)
    is_matched: bool
    onset_error_ms: float
    voicing_completeness: float
    missed_notes_json: str
    extra_notes_json: str

    __table_args__ = (
        Index("ix_chord_metrics_session_chord_idx", "session_id", "chord_index"),
    )


class SessionChordMetricRead(SQLModel):
    """Schema for reading session chord metrics."""
    id: str
    session_id: str
    take_number: int = 1
    tempo_bpm: int = 120
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
        ondelete="CASCADE",
        index=True,
        max_length=255,
    )
    pattern_type: str = Field(max_length=50)
    trigger_context: str = Field(max_length=255)
    evidence_count: int
    status: str = Field(default="emerging", max_length=50)

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "pattern_type",
            "trigger_context",
            name="uq_habit_patterns_user_type_context",
        ),
    )


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
        ondelete="CASCADE",
        index=True,
        max_length=100,
    )
    user_id: str = Field(
        foreign_key="users.id",
        ondelete="CASCADE",
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


class TransitionMastery(TimestampMixin, Base, table=True):
    """Student transition skill cognitive mastery (BKT, SM-2, Bandit posteriors)."""
    __tablename__ = "transition_mastery"

    id: str = Field(primary_key=True, max_length=100)
    user_id: str = Field(
        foreign_key="users.id",
        ondelete="CASCADE",
        index=True,
        max_length=255,
    )
    chord_from: str = Field(max_length=50)
    chord_to: str = Field(max_length=50)
    instrument: str = Field(default="guitar", max_length=50)
    p_known: float = Field(default=0.20)
    is_mastered: bool = Field(default=False)
    opportunities: int = Field(default=0)
    ewma_latency_ms: float = Field(default=0.0)
    voicing_completeness: float = Field(default=1.0)
    sm2_interval_days: int = Field(default=1)
    sm2_ease_factor: float = Field(default=2.5)
    sm2_repetitions: int = Field(default=0)
    last_practiced_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=cast(Any, DateTime(timezone=True)),
        sa_column_kwargs={"server_default": func.now(), "nullable": False},
    )
    bandit_alpha_isolated: float = Field(default=1.0)
    bandit_beta_isolated: float = Field(default=1.0)
    bandit_alpha_subdivision: float = Field(default=1.0)
    bandit_beta_subdivision: float = Field(default=1.0)
    bandit_alpha_voicing: float = Field(default=1.0)
    bandit_beta_voicing: float = Field(default=1.0)
    bandit_alpha_ramp: float = Field(default=1.0)
    bandit_beta_ramp: float = Field(default=1.0)

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "instrument",
            "chord_from",
            "chord_to",
            name="uq_transition_mastery_user_inst_from_to",
        ),
    )


class TransitionMasteryRead(SQLModel):
    """Schema for reading transition mastery state."""
    id: str
    user_id: str
    chord_from: str
    chord_to: str
    instrument: str
    p_known: float
    is_mastered: bool
    opportunities: int
    ewma_latency_ms: float
    voicing_completeness: float
    sm2_interval_days: int
    sm2_ease_factor: float
    sm2_repetitions: int
    last_practiced_at: datetime
    bandit_alpha_isolated: float
    bandit_beta_isolated: float
    bandit_alpha_subdivision: float
    bandit_beta_subdivision: float
    bandit_alpha_voicing: float
    bandit_beta_voicing: float
    bandit_alpha_ramp: float
    bandit_beta_ramp: float