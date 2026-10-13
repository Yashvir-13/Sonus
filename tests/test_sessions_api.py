from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Any

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
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    # Seed test user and exercise
    async with async_session() as session:
        user = User(
            id="user_clerk_session_test",
            name="Session Tester",
            username="sessiontester",
            email="tester@sessions.com",
            verified=True,
        )
        progression = [
            {"name": "C", "beat": 1, "expected_pitches": [48, 52, 55]},
            {"name": "G", "beat": 5, "expected_pitches": [43, 47, 50]},
        ]
        exercise = Exercise(
            id="ex_test_prog",
            title="Two Chord Groove",
            instrument="piano",
            tempo_bpm=120,
            difficulty=1,
            progression_json=json.dumps(progression),
        )
        session.add(user)
        session.add(exercise)
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
        return ClerkIdentity(user_id="user_clerk_session_test", email="tester@sessions.com")

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_require_clerk_identity

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_get_exercises(async_client: AsyncClient) -> None:
    resp = await async_client.get("/api/exercises")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert data[0]["id"] == "ex_test_prog"
    assert data[0]["title"] == "Two Chord Groove"


@pytest.mark.anyio
async def test_create_practice_session(async_client: AsyncClient) -> None:
    payload = {
        "exercise_id": "ex_test_prog",
        "tempo_bpm": 120,
    }
    resp = await async_client.post("/api/sessions", json=payload)
    assert resp.status_code == 201
    session_data = resp.json()
    assert session_data["id"] is not None
    assert session_data["user_id"] == "user_clerk_session_test"
    assert session_data["exercise_id"] == "ex_test_prog"
    assert session_data["state"] == "recording"
    assert session_data["tempo_bpm"] == 120


@pytest.mark.anyio
async def test_submit_take_and_analyze(async_client: AsyncClient) -> None:
    # 1. Create session
    create_resp = await async_client.post("/api/sessions", json={
        "exercise_id": "ex_test_prog",
        "tempo_bpm": 120,
    })
    assert create_resp.status_code == 201
    sess_id = create_resp.json()["id"]

    # 2. Submit take with played chord sequence
    take_payload = {
        "played_chords": [
            {"detected_name": "C", "timestamp_sec": 0.05, "pitches": [48, 52, 55]},
            {"detected_name": "G", "timestamp_sec": 2.02, "pitches": [43, 47, 50]},
        ]
    }
    take_resp = await async_client.post(f"/api/sessions/{sess_id}/take", json=take_payload)
    assert take_resp.status_code == 200
    analysis = take_resp.json()
    assert analysis["session_id"] == sess_id
    assert analysis["state"] == "completed"
    assert analysis["overall_accuracy"] == 1.0
    assert analysis["voicing_score"] == 1.0
    assert len(analysis["chord_metrics"]) == 2
    assert analysis["chord_metrics"][0]["expected_chord"] == "C"
    assert analysis["chord_metrics"][0]["is_matched"] is True

    # 3. Retrieve session analysis
    get_analysis_resp = await async_client.get(f"/api/sessions/{sess_id}/analysis")
    assert get_analysis_resp.status_code == 200
    retrieved = get_analysis_resp.json()
    assert retrieved["session"]["id"] == sess_id
    assert len(retrieved["chord_metrics"]) == 2


@pytest.mark.anyio
async def test_session_not_found(async_client: AsyncClient) -> None:
    resp = await async_client.get("/api/sessions/non_existent_id")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_submit_take_wav_file(async_client: AsyncClient, tmp_path: Path) -> None:
    import io
    import numpy as np
    from scipy.io import wavfile

    # 1. Create session
    create_resp = await async_client.post("/api/sessions", json={
        "exercise_id": "ex_test_prog",
        "tempo_bpm": 120,
    })
    assert create_resp.status_code == 201
    sess_id = create_resp.json()["id"]

    # 2. Synthesize audio
    sr = 22050
    t = np.linspace(0, 0.5, int(sr * 0.5), endpoint=False)
    audio = (0.5 * np.sin(2 * np.pi * 261.63 * t)).astype(np.float32)  # C4 ~ 261.6 Hz
    buf = io.BytesIO()
    wavfile.write(buf, sr, audio)
    buf.seek(0)

    # 3. Post multipart
    files = {"audio_file": ("take.wav", buf.read(), "audio/wav")}
    take_resp = await async_client.post(f"/api/sessions/{sess_id}/take", files=files)
    assert take_resp.status_code == 200
    analysis = take_resp.json()
    assert analysis["session_id"] == sess_id
    assert analysis["state"] == "completed"
    assert "chord_metrics" in analysis
