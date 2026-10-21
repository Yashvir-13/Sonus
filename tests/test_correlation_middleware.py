from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

import pytest
from fastapi import APIRouter, FastAPI
from httpx import ASGITransport, AsyncClient

from src.lib.fastapi.middleware.correlation import (
    CorrelationIdFilter,
    CorrelationIdMiddleware,
    get_request_id,
)


@pytest.fixture
def test_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(CorrelationIdMiddleware)

    router = APIRouter()

    @router.get("/test-endpoint")
    async def sample_endpoint() -> dict[str, str]:
        return {"current_request_id": get_request_id()}

    app.include_router(router)
    return app


@pytest.fixture
async def client(test_app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.anyio
async def test_echoes_client_request_id(client: AsyncClient) -> None:
    res = await client.get("/test-endpoint", headers={"X-Request-ID": "custom-uuid-9876"})
    assert res.status_code == 200
    assert res.headers.get("x-request-id") == "custom-uuid-9876"
    assert res.json()["current_request_id"] == "custom-uuid-9876"


@pytest.mark.anyio
async def test_generates_request_id_when_omitted(client: AsyncClient) -> None:
    res = await client.get("/test-endpoint")
    assert res.status_code == 200
    req_id = res.headers.get("x-request-id")
    assert req_id is not None
    assert req_id.startswith("req_")
    assert res.json()["current_request_id"] == req_id


def test_correlation_id_log_filter() -> None:
    log_filter = CorrelationIdFilter()
    record = logging.LogRecord("test", logging.INFO, "test.py", 1, "test message", (), None)
    log_filter.filter(record)
    assert hasattr(record, "request_id")
