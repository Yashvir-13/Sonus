from datetime import UTC, datetime
from typing import Any, cast

from sqlalchemy import DateTime, func
from sqlmodel import Field


class TimestampMixin:
    """Mixin for SQLModel models with audit fields."""

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=cast(Any, DateTime(timezone=True)),
        sa_column_kwargs={
            "server_default": func.now(),
            "nullable": False,
        },
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=cast(Any, DateTime(timezone=True)),
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
            "nullable": False,
        },
    )


class VerificationMixin:
    """Mixin for SQLModel models with verification fields."""

    verified: bool = Field(default=False)
    verified_at: datetime | None = Field(
        default=None,
        sa_type=cast(Any, DateTime(timezone=True)),
        sa_column_kwargs={"nullable": True},
    )
