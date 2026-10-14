from __future__ import annotations

import json
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from src.lib.adaptive.interventions import generate_intervention
from src.lib.adaptive.patterns import detect_habits
from src.lib.adaptive.reports import generate_grounded_report
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

    # Seed test user and standard pop progression exercise
    async with async_session() as session:
        user = User(
            id="user_e2e_tester",
            name="E2E Tester",
            username="e2etester",
            email="tester@e2e.com",
            onboarding_done=True,
        )
        progression = [
            {"name": "C", "beat": 1, "duration_beats": 4, "expected_pitches": [48, 52, 55, 60, 64]},
            {"name": "G", "beat": 5, "duration_beats": 4, "expected_pitches": [43, 47, 50, 55, 59, 67]},
            {"name": "Am", "beat": 9, "duration_beats": 4, "expected_pitches": [45, 52, 57, 60, 64]},
            {"name": "F", "beat": 13, "duration_beats": 4, "expected_pitches": [41, 48, 53, 57, 60, 65]},
        ]
        exercise = Exercise(
            id="ex_pop_cadence_e2e",
            title="Pop Cadence (I-V-vi-IV)",
            instrument="guitar",
            tempo_bpm=80,
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
        return ClerkIdentity(user_id="user_e2e_tester", email="tester@e2e.com")

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_require_clerk_identity

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_full_practice_cycle(async_client: AsyncClient) -> None:
    """Full vertical slice:
    1. Fetch available exercises
    2. Start practice session
    3. Verify session state is 'recording'
    4. Submit take with played chord sequence
    5. Fetch post-take polyphonic analysis and grounded report
    6. Run adaptive habit detector and verify intervention generation
    """
    # 1. Fetch pop exercise
    ex_res = await async_client.get("/api/exercises")
    assert ex_res.status_code == 200
    exercises = ex_res.json()
    assert len(exercises) > 0
    ex_id = exercises[0]["id"]
    tempo = exercises[0]["tempo_bpm"]

    # 2. Start session
    sess_res = await async_client.post(
        "/api/sessions",
        json={"exercise_id": ex_id, "tempo_bpm": tempo},
    )
    assert sess_res.status_code == 201
    session_data = sess_res.json()
    sess_id = session_data["id"]
    assert session_data["state"] == "recording"

    # 3. Verify session state via GET
    status_res = await async_client.get(f"/api/sessions/{sess_id}")
    assert status_res.status_code == 200
    assert status_res.json()["state"] in ["recording", "analysing", "ready"]

    # 4. Submit take with played chords (C, G, Am, F)
    played_chords = [
        {"detected_name": "C", "timestamp_sec": 0.05, "pitches": [48, 52, 55, 60, 64]},
        {"detected_name": "G", "timestamp_sec": 3.02, "pitches": [43, 47, 50, 55, 59, 67]},
        {"detected_name": "Am", "timestamp_sec": 6.04, "pitches": [45, 52, 57, 60, 64]},
        {"detected_name": "F", "timestamp_sec": 9.08, "pitches": [41, 48, 53, 57, 60, 65]},
    ]
    take_res = await async_client.post(
        f"/api/sessions/{sess_id}/take",
        json={"played_chords": played_chords},
    )
    assert take_res.status_code == 200
    take_body = take_res.json()
    assert take_body["session_id"] == sess_id
    assert take_body["analysis_status"] == "complete"

    # 5. Retrieve session analysis
    analysis_res = await async_client.get(f"/api/sessions/{sess_id}/analysis")
    assert analysis_res.status_code == 200
    analysis_data = analysis_res.json()
    assert analysis_data["session"]["id"] == sess_id
    assert analysis_data["session"]["state"] == "completed"
    metrics = analysis_data["chord_metrics"]
    assert len(metrics) == 4

    # 6. Generate grounded report and habit pattern
    metric_dicts = [
        {
            "chord": m["expected_chord"],
            "onset_error_ms": m["onset_error_ms"],
            "voicing_completeness": m["voicing_completeness"],
            "missed_notes": [],
            "is_matched": m["is_matched"],
        }
        for m in metrics
    ]
    report = generate_grounded_report(sess_id, metric_dicts)
    assert report["facts"]["accuracy_pct"] == 100.0

    # Simulate historical rushing pattern to test adaptive intervention
    rushed_metrics = [
        {"chord": "C", "onset_error_ms": -45.0, "missed_notes": []},
        {"chord": "G", "onset_error_ms": -52.0, "missed_notes": []},
        {"chord": "Am", "onset_error_ms": -48.0, "missed_notes": []},
    ]
    patterns = detect_habits("user_e2e_tester", rushed_metrics)
    assert len(patterns) > 0
    rushing_pat = next(p for p in patterns if p["pattern_type"] == "tempo_rushing")
    intervention = generate_intervention(rushing_pat, user_id="user_e2e_tester", reference_tempo=tempo)
    assert intervention["drill_type"] == "subdivision_click"
    assert intervention["target_tempo"] == tempo
