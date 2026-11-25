"""Correlation ID & telemetry middleware for distributed request tracing."""

from __future__ import annotations

import logging
import re
from contextvars import ContextVar
from typing import TYPE_CHECKING
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

if TYPE_CHECKING:
    from starlette.requests import Request
    from starlette.responses import Response

_REQUEST_ID_CTX: ContextVar[str] = ContextVar("request_id", default="-")
_SAFE_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9_.-]{1,64}\Z")


def get_request_id() -> str:
    """Retrieve the correlation request ID for the active execution context."""
    return _REQUEST_ID_CTX.get()


def _sanitize_request_id(raw_header: str | None) -> str:
    if raw_header is not None and "\r" not in raw_header and "\n" not in raw_header:
        candidate = raw_header.strip()
        if _SAFE_REQUEST_ID_RE.fullmatch(candidate):
            return candidate
    return f"req_{uuid4().hex[:12]}"


class CorrelationIdFilter(logging.Filter):
    """Logging filter that attaches the active request ID to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Attach active request_id to log records."""
        record.request_id = get_request_id()
        return True


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """ASGI middleware injecting unique X-Request-ID headers and telemetry tags."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        """Propagate a sanitized request ID across contextvars, Sentry, and response."""
        req_id = _sanitize_request_id(request.headers.get("X-Request-ID"))

        token = _REQUEST_ID_CTX.set(req_id)
        request.state.request_id = req_id

        # Bind to Sentry scope if Sentry SDK is active
        try:
            import sentry_sdk  # noqa: PLC0415

            sentry_sdk.set_tag("request_id", req_id)
        except ImportError:
            pass

        try:
            response = await call_next(request)
        finally:
            _REQUEST_ID_CTX.reset(token)

        response.headers["X-Request-ID"] = req_id
        return response
