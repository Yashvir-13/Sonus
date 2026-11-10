from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from src.lib.auth.clerk import ClerkIdentity, require_clerk_identity
from src.lib.db import get_session
from src.models.user import User
from src.services.api.app import app


@pytest.fixture
async def me_client() -> AsyncGenerator[AsyncClient, None]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with async_session() as session:
        user = User(
            id="user_clerk_me_test",
            name="Original Musician",
            username="original_user",
            email="original@sonus.studio",
            verified=True,
            onboarding_done=False,
        )
        session.add(user)
        await session.commit()

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with async_session() as s:
            yield s

    async def override_clerk() -> ClerkIdentity:
        return ClerkIdentity(user_id="user_clerk_me_test", email="original@sonus.studio")

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_clerk

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_patch_me_updates_name_and_username(me_client: AsyncClient) -> None:
    resp = await me_client.patch(
        "/api/me",
        json={"name": "Updated Musician", "username": "updated_user", "onboarding_done": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Updated Musician"
    assert data["username"] == "updated_user"
    assert data["onboarding_done"] is True


@pytest.mark.anyio
async def test_patch_me_rejects_invalid_username(me_client: AsyncClient) -> None:
    resp = await me_client.patch(
        "/api/me",
        json={"username": "ab"},  # Too short (< 3 chars)
    )
    assert resp.status_code == 422
