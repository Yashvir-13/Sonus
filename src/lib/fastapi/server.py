"""FastAPI server."""

import os
from collections.abc import AsyncIterator
from typing import Any, Callable

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from src.lib.fastapi.routes.health import router as health_router
from src.lib.fastapi.templates.scalar import DOCS_TEMPLATE
from src.lib.schemas.fastapi import Middleware, Server

load_dotenv(".env")


def cors_allow_origins() -> list[str]:
    """Parse ``CORS_ALLOWED_ORIGINS``: comma-separated scheme+host+port origins with safe production defaults."""
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    default_origins = [
        "https://sonus.yashvirafterhours.me",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    for d in default_origins:
        if d not in origins:
            origins.append(d)
    return origins


def create_server(
    server: Server,
    middleware: Middleware,
    *,
    lifespan: Any = None,
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
