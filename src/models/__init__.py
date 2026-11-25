"""SQLModel domain models.

Import all table models here so metadata is registered for Alembic and the ORM.
"""

from src.models.base import Base
from src.models.practice import (
    AdaptiveIntervention,
    Exercise,
    HabitPattern,
    PracticeSession,
    SessionChordMetric,
    TransitionMastery,
)
from src.models.user import User

User.model_rebuild()
Exercise.model_rebuild()
PracticeSession.model_rebuild()
SessionChordMetric.model_rebuild()
HabitPattern.model_rebuild()
AdaptiveIntervention.model_rebuild()
TransitionMastery.model_rebuild()

__all__ = [
    "AdaptiveIntervention",
    "Base",
    "Exercise",
    "HabitPattern",
    "PracticeSession",
    "SessionChordMetric",
    "TransitionMastery",
    "User",
]

