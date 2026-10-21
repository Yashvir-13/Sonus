"""Blueprint FastAPI application."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

import anyio
from fastapi import FastAPI
import sentry_sdk

from src.lib.audio.transcription import warmup_transcription_engine
from src.lib.fastapi.handlers import register_error_handlers
from src.lib.fastapi.middleware.correlation import CorrelationIdMiddleware
from src.lib.fastapi.server import cors_allow_origins, create_server
from src.lib.schemas.fastapi import Middleware, Server
from src.services.api.routes.audio_test import router as audio_test_router
from src.services.api.routes.exercises import router as exercises_router
from src.services.api.routes.me import router as me_router
from src.services.api.routes.sessions import router as sessions_router

logger = logging.getLogger(__name__)

sentry_dsn = os.environ.get("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )


@asynccontextmanager
async def app_lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup and shutdown lifecycle manager."""
    logger.info("Initializing Sonus API server and warming up transcription engine...")
    await anyio.to_thread.run_sync(warmup_transcription_engine)
    yield


server = Server(
    title="Sonus Adaptive Music Practice API",
    description="Production-grade adaptive music practice platform with real-time and polyphonic audio analysis",
    version="0.1.0",
    base_path="/api",
)

middleware = Middleware(
    allow_origins=cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app, router = create_server(server, middleware, lifespan=app_lifespan)
app.add_middleware(CorrelationIdMiddleware)
register_error_handlers(app)

router.include_router(me_router)
router.include_router(exercises_router)
router.include_router(sessions_router)
router.include_router(audio_test_router)
app.include_router(router)
