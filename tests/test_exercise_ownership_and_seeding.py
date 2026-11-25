"""Tests for custom exercise ownership, pagination, read-only GETs, and catalog parity."""

from __future__ import annotations

import json
import re
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select

from src.lib.auth.clerk import ClerkIdentity, optional_clerk_identity, require_clerk_identity
from src.lib.db import get_session
from src.lib.music.seed_data import SEED_EXERCISES
from src.models.practice import Exercise
from src.models.user import User
from src.services.api.app import app

_REPO_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
async def ownership_env() -> AsyncGenerator[
    tuple[AsyncClient, async_sessionmaker[AsyncSession], dict[str, ClerkIdentity | None]],
    None,
]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with async_session() as session:
        session.add(
            User(
                id="user_owner_a",
                name="User A",
                username="user_owner_a",
                email="owner_a@example.com",
                verified=True,
            ),
        )
        session.add(
            User(
                id="user_owner_b",
                name="User B",
                username="user_owner_b",
                email="owner_b@example.com",
                verified=True,
            ),
        )
        for i in range(5):
            session.add(
                Exercise(
                    id=f"ex_public_{i}",
                    title=f"Public Study {i:02d}",
                    instrument="piano" if i % 2 == 0 else "guitar",
                    tempo_bpm=80 + i * 5,
                    difficulty=(i % 5) + 1,
                    user_id=None,
                    progression_json=json.dumps({
                        "key": "C Major",
                        "default_tempo_bpm": 80,
                        "chords": [
                            {"name": "C", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55]},
                        ],
                    }),
                ),
            )
        await session.commit()

    active_identity: dict[str, ClerkIdentity | None] = {
        "current": ClerkIdentity(user_id="user_owner_a", email="owner_a@example.com"),
    }

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    def override_require() -> ClerkIdentity:
        ident = active_identity["current"]
        assert ident is not None
        return ident

    def override_optional() -> ClerkIdentity | None:
        return active_identity["current"]

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_require
    app.dependency_overrides[optional_clerk_identity] = override_optional

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, async_session, active_identity

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_custom_exercise_ownership_and_isolation(
    ownership_env: tuple[
        AsyncClient,
        async_sessionmaker[AsyncSession],
        dict[str, ClerkIdentity | None],
    ],
) -> None:
    client, async_session, active_identity = ownership_env

    # User A creates a custom exercise
    payload = {
        "title": "Alice Private Progression",
        "description": "Custom ii-V-I practice",
        "instrument": "piano",
        "tempo_bpm": 92,
        "difficulty": 2,
        "progression": {
            "key": "C Major",
            "default_tempo_bpm": 92,
            "chords": [
                {"name": "Dm7", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [50, 53, 57, 60]},
                {"name": "G7", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 53]},
            ],
        },
    }
    create_resp = await client.post("/api/exercises", json=payload)
    assert create_resp.status_code == 201
    custom_id = create_resp.json()["id"]

    # Persisted with user_id == user_owner_a
    async with async_session() as session:
        ex_row = await session.get(Exercise, custom_id)
        assert ex_row is not None
        assert ex_row.user_id == "user_owner_a"

    # User A can list and fetch detail
    list_a = await client.get("/api/exercises")
    assert list_a.status_code == 200
    assert any(item["id"] == custom_id for item in list_a.json())

    detail_a = await client.get(f"/api/exercises/{custom_id}")
    assert detail_a.status_code == 200

    # User B cannot see it in list, detail, or create session on it
    active_identity["current"] = ClerkIdentity(user_id="user_owner_b", email="owner_b@example.com")
    list_b = await client.get("/api/exercises")
    assert list_b.status_code == 200
    assert not any(item["id"] == custom_id for item in list_b.json())

    detail_b = await client.get(f"/api/exercises/{custom_id}")
    assert detail_b.status_code == 404

    sess_b = await client.post("/api/sessions", json={"exercise_id": custom_id, "tempo_bpm": 92})
    assert sess_b.status_code == 404

    # Anonymous guest cannot see private exercise
    active_identity["current"] = None
    list_guest = await client.get("/api/exercises")
    assert list_guest.status_code == 200
    assert len(list_guest.json()) == 5
    assert not any(item["id"] == custom_id for item in list_guest.json())

    detail_guest = await client.get(f"/api/exercises/{custom_id}")
    assert detail_guest.status_code == 404


@pytest.mark.anyio
async def test_get_exercises_pagination_limit_and_offset(
    ownership_env: tuple[
        AsyncClient,
        async_sessionmaker[AsyncSession],
        dict[str, ClerkIdentity | None],
    ],
) -> None:
    client, _, active_identity = ownership_env
    active_identity["current"] = None

    p1 = await client.get("/api/exercises?limit=2&offset=0")
    p2 = await client.get("/api/exercises?limit=2&offset=2")
    p3 = await client.get("/api/exercises?limit=2&offset=4")

    assert p1.status_code == 200 and len(p1.json()) == 2
    assert p2.status_code == 200 and len(p2.json()) == 2
    assert p3.status_code == 200 and len(p3.json()) == 1

    all_ids = [item["id"] for item in p1.json() + p2.json() + p3.json()]
    assert len(set(all_ids)) == 5


@pytest.mark.anyio
async def test_get_dynamic_drill_is_read_only_and_rejects_bogus_chords(
    ownership_env: tuple[
        AsyncClient,
        async_sessionmaker[AsyncSession],
        dict[str, ClerkIdentity | None],
    ],
) -> None:
    client, async_session, _ = ownership_env

    async with async_session() as session:
        before_count = int((await session.execute(select(func.count()).select_from(Exercise))).scalar() or 0)

    res = await client.get("/api/exercises/drill_chord_am")
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == "drill_chord_am"
    assert len(body["progression"]["chords"]) == 4

    async with async_session() as session:
        after_count = int((await session.execute(select(func.count()).select_from(Exercise))).scalar() or 0)
        assert after_count == before_count
        assert await session.get(Exercise, "drill_chord_am") is None

    # Invalid chord symbol must return 404 rather than synthesizing "C"
    bad_res = await client.get("/api/exercises/drill_chord_totally_invalid_xyz")
    assert bad_res.status_code == 404


@pytest.mark.anyio
async def test_create_session_rejects_unknown_exercise_without_creating_placeholder(
    ownership_env: tuple[
        AsyncClient,
        async_sessionmaker[AsyncSession],
        dict[str, ClerkIdentity | None],
    ],
) -> None:
    client, async_session, _ = ownership_env

    resp = await client.post(
        "/api/sessions",
        json={"exercise_id": "ex_nonexistent_song", "tempo_bpm": 80},
    )
    assert resp.status_code == 404

    resp_bad_drill = await client.post(
        "/api/sessions",
        json={"exercise_id": "drill_chord_notachord_zzz", "tempo_bpm": 80},
    )
    assert resp_bad_drill.status_code == 404

    async with async_session() as session:
        assert await session.get(Exercise, "ex_nonexistent_song") is None
        assert await session.get(Exercise, "drill_chord_notachord_zzz") is None

    # Valid dynamic chord drill still succeeds
    resp_ok = await client.post(
        "/api/sessions",
        json={"exercise_id": "drill_chord_dm7", "tempo_bpm": 72},
    )
    assert resp_ok.status_code == 201


def test_seed_exercises_matches_frontend_catalog_parity() -> None:
    be_ids = [str(e["id"]) for e in SEED_EXERCISES]
    assert len(be_ids) == 21
    assert len(set(be_ids)) == 21
    assert "ex_piano_pop_ballad" in be_ids

    ts_catalog = (_REPO_ROOT / "apps" / "web" / "src" / "lib" / "music" / "song-catalog.ts").read_text(
        encoding="utf-8",
    )
    # Extract top-level exercise IDs inside BUILTIN_FULL_SONGS and BUILTIN_ADDITIONAL_EXERCISES
    start_idx = ts_catalog.index("export const BUILTIN_FULL_SONGS")
    end_idx = ts_catalog.index("export const ALL_BUILTIN_EXERCISES")
    fe_section = ts_catalog[start_idx:end_idx]
    fe_ids = re.findall(r"id:\s*['\"](ex_[a-z0-9_]+)['\"]", fe_section)

    assert len(fe_ids) == 21
    assert len(set(fe_ids)) == 21
    assert set(be_ids) == set(fe_ids)


def test_docker_entrypoint_runs_migrations_and_seed() -> None:
    entrypoint = (_REPO_ROOT / "scripts" / "docker-entrypoint.sh").read_text(encoding="utf-8")
    assert "alembic upgrade head" in entrypoint
    assert "scripts/seed_exercises.py" in entrypoint
    assert "DATABASE_HOST" in entrypoint
    assert "|| echo" not in entrypoint
