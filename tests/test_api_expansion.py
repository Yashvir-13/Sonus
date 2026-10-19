from __future__ import annotations

import json
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from src.lib.auth.clerk import ClerkIdentity, require_clerk_identity
from src.lib.db import get_session
from src.models.practice import Exercise
from src.models.user import User
from src.services.api.app import app


@pytest.fixture
async def api_client() -> AsyncGenerator[AsyncClient, None]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    # Seed test user and reference exercises
    async with async_session() as session:
        user = User(
            id="user_api_tester",
            name="API Tester",
            username="apitester",
            email="apitester@sonus.com",
            verified=True,
        )
        ex_piano = Exercise(
            id="ex_piano_canon_test",
            title="Canon in C",
            instrument="piano",
            tempo_bpm=80,
            difficulty=1,
            progression_json=json.dumps({
                "key": "C Major",
                "default_tempo_bpm": 80,
                "chords": [
                    {"name": "C", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55]},
                    {"name": "G", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50]},
                ],
            }),
        )
        ex_guitar = Exercise(
            id="ex_guitar_blues_test",
            title="12 Bar Blues",
            instrument="guitar",
            tempo_bpm=100,
            difficulty=2,
            progression_json=json.dumps({
                "key": "E Major",
                "default_tempo_bpm": 100,
                "chords": [
                    {"name": "E7", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 52]},
                ],
            }),
        )
        session.add(user)
        session.add(ex_piano)
        session.add(ex_guitar)
        await session.commit()

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    def override_require_clerk_identity() -> ClerkIdentity:
        return ClerkIdentity(user_id="user_api_tester", email="apitester@sonus.com")

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_require_clerk_identity

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_exercise_filtering_and_detail(api_client: AsyncClient) -> None:
    # 1. Filter by instrument
    resp_guitar = await api_client.get("/api/exercises?instrument=guitar")
    assert resp_guitar.status_code == 200
    g_data = resp_guitar.json()
    assert len(g_data) == 1
    assert g_data[0]["id"] == "ex_guitar_blues_test"

    # 2. Filter by difficulty
    resp_diff = await api_client.get("/api/exercises?difficulty=1")
    assert resp_diff.status_code == 200
    d_data = resp_diff.json()
    assert len(d_data) == 1
    assert d_data[0]["id"] == "ex_piano_canon_test"

    # 3. Get detailed exercise by ID
    resp_detail = await api_client.get("/api/exercises/ex_piano_canon_test")
    assert resp_detail.status_code == 200
    detail = resp_detail.json()
    assert detail["title"] == "Canon in C"
    assert "progression" in detail
    assert detail["progression"]["key"] == "C Major"
    assert len(detail["progression"]["chords"]) == 2
    assert detail["progression"]["chords"][0]["name"] == "C"


@pytest.mark.anyio
async def test_create_custom_exercise(api_client: AsyncClient) -> None:
    custom_payload = {
        "title": "Jazz 2-5-1 in F",
        "description": "Essential jazz standard progression in F Major",
        "instrument": "piano",
        "tempo_bpm": 85,
        "difficulty": 3,
        "progression": {
            "key": "F Major",
            "time_signature": "4/4",
            "default_tempo_bpm": 85,
            "chords": [
                {"name": "Gm7", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [43, 58, 62, 65]},
                {"name": "C7", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [48, 58, 64, 67]},
                {"name": "Fmaj7", "beat": 9.0, "duration_beats": 8.0, "expected_pitches": [41, 57, 64, 69]},
            ],
        },
    }
    create_resp = await api_client.post("/api/exercises", json=custom_payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["id"].startswith("ex_custom_")
    assert created["title"] == "Jazz 2-5-1 in F"
    assert created["progression"]["chords"][0]["name"] == "Gm7"


@pytest.mark.anyio
async def test_session_coaching_and_drill_generation(api_client: AsyncClient) -> None:
    # 1. Create a session
    sess_res = await api_client.post("/api/sessions", json={
        "exercise_id": "ex_piano_canon_test",
        "tempo_bpm": 80,
    })
    assert sess_res.status_code == 201
    sess_id = sess_res.json()["id"]

    # 2. Submit take with minor lag on chord 1
    take_res = await api_client.post(f"/api/sessions/{sess_id}/take", json={
        "played_chords": [
            {"detected_name": "C", "timestamp_sec": 0.05, "pitches": [48, 52, 55]},
            {"detected_name": "G", "timestamp_sec": 3.10, "pitches": [43, 47, 50]},
        ],
    })
    assert take_res.status_code == 200
    take_data = take_res.json()
    assert "coaching_report" in take_data
    assert take_data["coaching_report"]["session_id"] == sess_id

    # 3. Query coaching endpoint directly
    coach_res = await api_client.get(f"/api/sessions/{sess_id}/coaching")
    assert coach_res.status_code == 200
    coach_data = coach_res.json()
    assert "primary_bottleneck" in coach_data
    assert "coaching_letter" in coach_data

    # 4. Generate targeted drill
    drill_res = await api_client.post(f"/api/sessions/{sess_id}/drill")
    assert drill_res.status_code == 201
    drill_data = drill_res.json()
    assert drill_data["id"].startswith("intv_")
    assert drill_data["completed"] is False


@pytest.mark.anyio
async def test_user_history_and_analytics(api_client: AsyncClient) -> None:
    # Query user session history
    history_res = await api_client.get("/api/me/sessions")
    assert history_res.status_code == 200
    assert isinstance(history_res.json(), list)

    # Query user practice statistics
    stats_res = await api_client.get("/api/me/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_sessions_completed" in stats
    assert "overall_accuracy_pct" in stats
    assert "streak_days" in stats

    # Query user interventions
    intv_res = await api_client.get("/api/me/interventions")
    assert intv_res.status_code == 200
    assert isinstance(intv_res.json(), list)
