"""HTTP exceptions for API routes."""

from __future__ import annotations

from fastapi import HTTPException, status

HTTP_413 = 413
HTTP_422 = 422
HTTP_429 = 429


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


class PayloadTooLarge(HTTPException):
    """413 — uploaded payload exceeds configured size limit."""

    def __init__(self, detail: str) -> None:
        """Store ``detail`` as the HTTP error body."""
        super().__init__(HTTP_413, detail)


class Unprocessable(HTTPException):
    """422 — invalid input for this operation."""

    def __init__(self, detail: str) -> None:
        """Store ``detail`` as the HTTP error body."""
        super().__init__(HTTP_422, detail)


class TooManyRequests(HTTPException):
    """429 — caller exceeded sliding-window rate limit."""

    def __init__(self, detail: str, retry_after_seconds: int | None = None) -> None:
        """Store ``detail`` and optional ``Retry-After`` header."""
        headers = (
            {"Retry-After": str(max(1, retry_after_seconds))}
            if retry_after_seconds is not None
            else None
        )
        super().__init__(HTTP_429, detail, headers=headers)
