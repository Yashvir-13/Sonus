"""HTTP exceptions for API routes."""

from __future__ import annotations

from typing import Any
from fastapi import HTTPException, status

HTTP_422 = 422


class Unauthorized(HTTPException):
    """401 — missing or invalid authentication."""

    def __init__(self, detail: str) -> None:
        """Store ``detail`` as the HTTP error body."""
        super().__init__(
            status.HTTP_401_UNAUTHORIZED,
            detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class NotFound(HTTPException):
    """404 — resource missing."""

    def __init__(self, detail: str) -> None:
        """Store ``detail`` as the HTTP error body."""
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class Unprocessable(HTTPException):
    """422 — invalid input for this operation."""

    def __init__(self, detail: str) -> None:
        """Store ``detail`` as the HTTP error body."""
        super().__init__(HTTP_422, detail)
