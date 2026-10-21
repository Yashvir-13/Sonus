from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient

from src.lib.adaptive.interventions import generate_intervention
from src.lib.adaptive.patterns import (
    detect_habits,
    detect_tempo_dragging_patterns,
    detect_tempo_rushing_patterns,
    detect_transition_lag_patterns,
    detect_voicing_drop_patterns,
)
from src.lib.adaptive.tracking import evaluate_drill_outcome


def test_transition_lag_statistical_ewma_and_variance() -> None:
    # Sequence of latencies over time (oldest to newest)
    # The student initially hesitated (150ms), but practiced and dropped to 70ms
    metric_history = [
        {"from_chord": "Am", "to_chord": "F", "transition_latency_ms": 150.0},
        {"from_chord": "Am", "to_chord": "F", "transition_latency_ms": 140.0},
        {"from_chord": "Am", "to_chord": "F", "transition_latency_ms": 130.0},
        {"from_chord": "Am", "to_chord": "F", "transition_latency_ms": 75.0},
        {"from_chord": "Am", "to_chord": "F", "transition_latency_ms": 70.0},
    ]
    patterns = detect_transition_lag_patterns(metric_history, threshold_ms=90.0, min_evidence=3)
    assert len(patterns) == 1
    pattern = patterns[0]
    assert pattern["context"] == "Am -> F"
    assert "std_dev_ms" in pattern
    assert "ewma_lag_ms" in pattern
    assert "severity" in pattern
    assert "confidence" in pattern
    # EWMA gives more weight to recent 70-75ms, so ewma_lag_ms should be lower than arithmetic mean
    arithmetic_mean = (150 + 140 + 130) / 3.0  # among excessive
    assert pattern["ewma_lag_ms"] < arithmetic_mean


def test_detect_tempo_dragging_patterns() -> None:
    # Player systematically drags behind the beat (positive onset error >= +35ms)
    metrics = [
        {"chord": "C", "onset_error_ms": 45.0},
        {"chord": "G", "onset_error_ms": 55.0},
        {"chord": "Am", "onset_error_ms": 40.0},
        {"chord": "F", "onset_error_ms": 50.0},
    ]
    dragging = detect_tempo_dragging_patterns(metrics, drag_threshold_ms=30.0, min_evidence=3)
    assert len(dragging) == 1
    assert dragging[0]["pattern_type"] == "tempo_dragging"
    assert dragging[0]["evidence_count"] == 4
    assert dragging[0]["avg_drag_ms"] >= 45.0
    assert dragging[0]["severity"] >= 2.0


def test_voicing_drop_harmonic_importance() -> None:
    # Omitting 3rd (E in C major) vs omitting 5th (G in C major)
    metrics_third_dropped = [
        {"chord": "C", "missed_notes": ["E4"], "is_matched": True},
        {"chord": "C", "missed_notes": ["E4"], "is_matched": True},
        {"chord": "C", "missed_notes": ["E4"], "is_matched": True},
    ]
    patterns_third = detect_voicing_drop_patterns(metrics_third_dropped, min_evidence=2)
    assert len(patterns_third) == 1
    assert patterns_third[0]["harmonic_role"] == "third"
    assert patterns_third[0]["severity"] >= 3.5  # Crucial harmonic identifier

    metrics_fifth_dropped = [
        {"chord": "C", "missed_notes": ["G4"], "is_matched": True},
        {"chord": "C", "missed_notes": ["G4"], "is_matched": True},
        {"chord": "C", "missed_notes": ["G4"], "is_matched": True},
    ]
    patterns_fifth = detect_voicing_drop_patterns(metrics_fifth_dropped, min_evidence=2)
    assert len(patterns_fifth) == 1
    assert patterns_fifth[0]["harmonic_role"] == "fifth"
    assert patterns_fifth[0]["severity"] < patterns_third[0]["severity"]


def test_generate_progressive_multi_stage_drill() -> None:
    pattern = {
        "pattern_type": "transition_lag",
        "context": "F -> G",
        "evidence_count": 4,
        "avg_lag_ms": 140.0,
        "ewma_lag_ms": 135.0,
        "severity": 4.2,
        "status": "active",
    }
    drill = generate_intervention(pattern, user_id="user_test_pro", reference_tempo=100)
    assert drill["drill_type"] == "isolated_transition"
    assert "progression" in drill
    assert len(drill["progression"]) == 2  # F and G
    assert drill["progression"][0]["name"] == "F"
    assert drill["progression"][1]["name"] == "G"

    # Multi-stage tempo ramp
    assert "tempo_stages" in drill
    stages = drill["tempo_stages"]
    assert stages["isolation_bpm"] < stages["target_bpm"] <= 100
    assert stages["goal_bpm"] >= stages["target_bpm"]

    # Spaced repetition prioritization
    assert "spaced_repetition" in drill
    assert drill["spaced_repetition"]["priority"] > 0
    assert "review_interval_days" in drill["spaced_repetition"]


def test_outcome_tracking_transition_lag_improvement() -> None:
    baseline = [{"from_chord": "F", "to_chord": "G", "transition_latency_ms": 140.0}]
    follow_up = [{"from_chord": "F", "to_chord": "G", "transition_latency_ms": 95.0}]

    result = evaluate_drill_outcome(baseline, follow_up, drill_type="isolated_transition")
    assert result["outcome"] == "improved"
    assert result["measured_improvement_pct"] >= 30.0  # (140 - 95) / 140 = 32%
    assert result["completed"] is True


def test_outcome_tracking_voicing_recovery() -> None:
    baseline = [{"chord": "C", "voicing_completeness": 0.60}]
    follow_up = [{"chord": "C", "voicing_completeness": 1.00}]

    result = evaluate_drill_outcome(baseline, follow_up, drill_type="voicing_arpeggio")
    assert result["outcome"] == "improved"
    assert result["measured_improvement_pct"] >= 40.0
    assert result["completed"] is True


@pytest.fixture
async def habit_drill_client() -> AsyncGenerator[AsyncClient, None]:
    import json
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlmodel import SQLModel
    from httpx import ASGITransport, AsyncClient
    from src.lib.auth.clerk import ClerkIdentity, require_clerk_identity
    from src.lib.db import get_session
    from src.models.practice import Exercise, HabitPattern
    from src.models.user import User
    from src.services.api.app import app

    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    user_id = "user_habit_drill_test"
    async with async_session() as session:
        user = User(
            id=user_id,
            name="Habit Tester",
            username="habittester",
            email="habit@tester.com",
            verified=True,
        )
        session.add(user)
        prog = [
            {"name": "F", "beat": 1, "expected_pitches": [53, 57, 60]},
            {"name": "G", "beat": 5, "expected_pitches": [55, 59, 62]},
        ]
        ex = Exercise(
            id="ex_fg_test",
            title="F to G Practice",
            instrument="piano",
            tempo_bpm=100,
            difficulty=2,
            progression_json=json.dumps(prog),
        )
        session.add(ex)
        hp = HabitPattern(
            id="pat_fg_lag",
            user_id=user_id,
            pattern_type="transition_lag",
            trigger_context="F -> G",
            evidence_count=5,
            status="active",
        )
        session.add(hp)
        await session.commit()

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    def override_identity() -> ClerkIdentity:
        return ClerkIdentity(user_id=user_id, email="habit@tester.com")

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_identity

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_get_my_habits_endpoint(habit_drill_client: AsyncClient) -> None:
    resp = await habit_drill_client.get("/api/me/habits")
    assert resp.status_code == 200
    habits = resp.json()
    assert len(habits) >= 1
    assert habits[0]["pattern_type"] == "transition_lag"
    assert habits[0]["trigger_context"] == "F -> G"


@pytest.mark.anyio
async def test_intervention_creation_and_take_outcome_tracking(habit_drill_client: AsyncClient) -> None:
    # 1. Create a baseline practice session
    create_sess_resp = await habit_drill_client.post("/api/sessions", json={
        "exercise_id": "ex_fg_test",
        "tempo_bpm": 100,
    })
    assert create_sess_resp.status_code == 201
    baseline_sess_id = create_sess_resp.json()["id"]

    # 2. Submit initial take with transition latency (baseline)
    baseline_take = await habit_drill_client.post(f"/api/sessions/{baseline_sess_id}/take", json={
        "played_chords": [
            {"chord": "F", "onset_time": 0.0, "notes": ["F3", "A3", "C4"]},
            {"chord": "G", "onset_time": 2.5, "notes": ["G3", "B3", "D4"]},
        ]
    })
    assert baseline_take.status_code == 200

    # 3. Request a remedial drill for this session
    drill_resp = await habit_drill_client.post(f"/api/sessions/{baseline_sess_id}/drill")
    assert drill_resp.status_code == 201
    drill = drill_resp.json()
    assert drill["id"] is not None
    assert drill["drill_type"] == "isolated_transition"
    assert drill["completed"] is False
    intervention_id = drill["id"]

    # 4. Create follow-up session linked to this intervention
    remedial_sess_resp = await habit_drill_client.post("/api/sessions", json={
        "exercise_id": "ex_fg_test",
        "tempo_bpm": 100,
        "intervention_id": intervention_id,
    })
    assert remedial_sess_resp.status_code == 201
    remedial_sess_id = remedial_sess_resp.json()["id"]

    # 5. Submit improved take on the remedial session
    improved_take = await habit_drill_client.post(f"/api/sessions/{remedial_sess_id}/take", json={
        "played_chords": [
            {"chord": "F", "onset_time": 0.0, "notes": ["F3", "A3", "C4"]},
            {"chord": "G", "onset_time": 2.41, "notes": ["G3", "B3", "D4"]},
        ]
    })
    assert improved_take.status_code == 200
    res_data = improved_take.json()
    assert "drill_outcome" in res_data
    assert res_data["drill_outcome"]["drill_type"] == "isolated_transition"
    assert res_data["drill_outcome"]["outcome"] in ("improved", "steady")

    # 6. Verify intervention status reflects completed
    intv_resp = await habit_drill_client.get("/api/me/interventions")
    assert intv_resp.status_code == 200
    all_intvs = intv_resp.json()
    matching = [i for i in all_intvs if i["id"] == intervention_id]
    assert len(matching) == 1
    assert matching[0]["completed"] is True

