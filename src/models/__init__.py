"""SQLModel domain models.

Import all table models here so metadata is registered for Alembic and the ORM.
"""

from src.models.base import Base  # noqa: F401
from src.models.practice import (  # noqa: F401
    AdaptiveIntervention,
    Exercise,
    HabitPattern,
    PracticeSession,
    SessionChordMetric,
)
from src.models.user import User  # noqa: F401

User.model_rebuild()
Exercise.model_rebuild()
PracticeSession.model_rebuild()
SessionChordMetric.model_rebuild()
HabitPattern.model_rebuild()
AdaptiveIntervention.model_rebuild()

__all__ = [
    "AdaptiveIntervention",
    "Base",
    "Exercise",
    "HabitPattern",
    "PracticeSession",
    "SessionChordMetric",
    "User",
]

