"""FastAPI server."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING, Any
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from src.lib.fastapi.routes.health import router as health_router
from src.lib.fastapi.templates.scalar import DOCS_TEMPLATE

if TYPE_CHECKING:
    from src.lib.schemas.fastapi import Middleware, Server
    from starlette.types import Lifespan

load_dotenv(".env")


def _is_loopback_origin(origin: str) -> bool:
    host = (urlparse(origin).hostname or "").lower()
    return host in {"localhost", "127.0.0.1", "::1"}


def cors_allow_origins() -> list[str]:
    """Parse ``CORS_ALLOWED_ORIGINS`` with production-safe defaults."""
    env = os.getenv("ENV", "development").strip().lower()
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
    origins = [
        o.strip()
        for o in raw.split(",")
        if o.strip() and (env != "production" or not _is_loopback_origin(o.strip()))
    ]
    default_origins = ["https://sonus.yashvirafterhours.me"]
    if env != "production":
        default_origins.extend([
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ])
    for default_origin in default_origins:
        if default_origin not in origins:
            origins.append(default_origin)
    return origins


def create_server(
    server: Server,
    middleware: Middleware,
    *,
    lifespan: Lifespan[FastAPI] | None = None,
) -> tuple[FastAPI, APIRouter]:
    """Create a FastAPI server."""
    env = os.getenv("ENV", "development").strip().lower()
    app = FastAPI(
        title=server.title,
        description=server.description,
        version=server.version,
        docs_url=None,
        redoc_url=None,
        openapi_url="/openapi.json" if env != "production" else None,
        lifespan=lifespan,
    )

    app.add_middleware(CORSMiddleware, **middleware.model_dump())

    router = APIRouter(prefix=server.base_path)
    router.include_router(health_router)
    app.include_router(health_router)

    @app.get("/", include_in_schema=False)
    async def root_index() -> dict[str, Any]:
        """Root API metadata and health pointers."""
        return {
            "name": server.title,
            "version": server.version,
            "status": "online",
            "docs_url": "/docs" if env != "production" else None,
            "health_url": f"{server.base_path}/health",
            "api_prefix": server.base_path,
        }

    if env != "production":

        @app.get("/docs", include_in_schema=False)
        async def docs() -> HTMLResponse:
            """Scalar based documentation."""
            html = DOCS_TEMPLATE.replace("{{title}}", server.title)
            return HTMLResponse(html)

    return app, router
