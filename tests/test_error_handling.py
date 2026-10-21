from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from fastapi import APIRouter, FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel

from src.lib.exception import NotFound, Unauthorized, Unprocessable
from src.lib.fastapi.handlers import register_error_handlers
from src.lib.fastapi.middleware.correlation import CorrelationIdMiddleware


class DummyPayload(BaseModel):
    tempo: int


@pytest.fixture
def error_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(CorrelationIdMiddleware)
    register_error_handlers(app)

    router = APIRouter()

    @router.get("/trigger-404")
    async def trigger_404() -> None:
        raise NotFound("Practice session not found")

    @router.get("/trigger-401")
    async def trigger_401() -> None:
        raise Unauthorized("Invalid or expired session token")

    @router.get("/trigger-422")
    async def trigger_422() -> None:
        raise Unprocessable("File is not a valid RIFF/WAVE container")

    @router.post("/trigger-validation")
    async def trigger_validation(payload: DummyPayload) -> dict[str, int]:
        return {"tempo": payload.tempo}

    app.include_router(router)
    return app


@pytest.fixture
async def client(error_app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=error_app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.anyio
async def test_not_found_rfc9457(client: AsyncClient) -> None:
    res = await client.get("/trigger-404", headers={"X-Request-ID": "req_test_404"})
    assert res.status_code == 404
    assert res.headers.get("content-type") == "application/problem+json"
    body = res.json()
    assert body["status"] == 404
    assert body["title"] == "Not Found"
    assert body["detail"] == "Practice session not found"
    assert body["instance"] == "/trigger-404"
    assert body["request_id"] == "req_test_404"
    assert "https://errors.sonus.dev" in body["type"]


@pytest.mark.anyio
async def test_unauthorized_rfc9457(client: AsyncClient) -> None:
    res = await client.get("/trigger-401")
    assert res.status_code == 401
    assert res.headers.get("content-type") == "application/problem+json"
    body = res.json()
    assert body["status"] == 401
    assert body["title"] == "Unauthorized"
    assert body["detail"] == "Invalid or expired session token"


@pytest.mark.anyio
async def test_unprocessable_rfc9457(client: AsyncClient) -> None:
    res = await client.get("/trigger-422")
    assert res.status_code == 422
    assert res.headers.get("content-type") == "application/problem+json"
    body = res.json()
    assert body["status"] == 422
    assert body["detail"] == "File is not a valid RIFF/WAVE container"


@pytest.mark.anyio
async def test_request_validation_error_rfc9457(client: AsyncClient) -> None:
    res = await client.post("/trigger-validation", json={"tempo": "not_an_int"})
    assert res.status_code == 422
    assert res.headers.get("content-type") == "application/problem+json"
    body = res.json()
    assert body["status"] == 422
    assert body["title"] == "Validation Error"
    assert "tempo" in str(body["detail"])
