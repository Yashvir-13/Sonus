"""Blueprint FastAPI application."""

from src.lib.fastapi.server import cors_allow_origins, create_server
from src.lib.schemas.fastapi import Middleware, Server
from src.services.api.routes.audio_test import router as audio_test_router
from src.services.api.routes.exercises import router as exercises_router
from src.services.api.routes.me import router as me_router
from src.services.api.routes.sessions import router as sessions_router
import os
import sentry_sdk

sentry_dsn = os.environ.get("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

server = Server(
    title="Blueprint API",
    description="Blueprint platform API",
    version="0.1.0",
    base_path="/api",
)

middleware = Middleware(
    allow_origins=cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app, router = create_server(server, middleware)
router.include_router(me_router)
router.include_router(exercises_router)
router.include_router(sessions_router)
router.include_router(audio_test_router)
app.include_router(router)
