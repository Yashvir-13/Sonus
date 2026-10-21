"""Correlation ID & telemetry middleware for distributed request tracing."""

from __future__ import annotations

import logging
from contextvars import ContextVar
from typing import Callable
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

_REQUEST_ID_CTX: ContextVar[str] = ContextVar("request_id", default="-")


def get_request_id() -> str:
    """Retrieve the correlation request ID for the active execution context."""
    return _REQUEST_ID_CTX.get()


class CorrelationIdFilter(logging.Filter):
    """Logging filter that attaches the current correlation request ID to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        return True


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """ASGI middleware injecting unique X-Request-ID headers and binding telemetry context."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        header_val = request.headers.get("X-Request-ID")
        req_id = header_val.strip() if header_val and header_val.strip() else f"req_{uuid4().hex[:12]}"

        token = _REQUEST_ID_CTX.set(req_id)
        request.state.request_id = req_id

        # Bind to Sentry scope if Sentry SDK is active
        try:
            import sentry_sdk

            sentry_sdk.set_tag("request_id", req_id)
        except Exception:
            pass

        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = req_id
            return response
        finally:
            _REQUEST_ID_CTX.reset(token)
