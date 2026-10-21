"""RFC 9457 Problem Details error handlers for FastAPI."""

from __future__ import annotations

import http
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.lib.fastapi.middleware.correlation import get_request_id


def register_error_handlers(app: FastAPI) -> None:
    """Register RFC 9457 compliant error handlers on the FastAPI application."""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        try:
            status_obj = http.HTTPStatus(exc.status_code)
            title = status_obj.phrase
        except ValueError:
            title = "HTTP Error"

        req_id = getattr(request.state, "request_id", None) or get_request_id()

        content = {
            "type": f"https://errors.sonus.dev/{exc.status_code}",
            "title": title,
            "status": exc.status_code,
            "detail": exc.detail,
            "instance": request.url.path,
            "request_id": req_id,
        }

        headers = {"Content-Type": "application/problem+json"}
        if exc.headers:
            headers.update(exc.headers)

        return JSONResponse(
            status_code=exc.status_code,
            content=content,
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        req_id = getattr(request.state, "request_id", None) or get_request_id()

        content = {
            "type": "https://errors.sonus.dev/422",
            "title": "Validation Error",
            "status": 422,
            "detail": exc.errors(),
            "instance": request.url.path,
            "request_id": req_id,
        }

        return JSONResponse(
            status_code=422,
            content=content,
            headers={"Content-Type": "application/problem+json"},
        )
