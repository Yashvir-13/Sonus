from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from src.lib.auth.clerk import ClerkIdentity, require_clerk_identity
from src.lib.db import get_session
from src.lib.music.seed_data import SEED_EXERCISES
from src.lib.practice.evaluator import PracticeTakeEvaluator
from src.models.practice import Exercise, PracticeSession, SessionChordMetric, TransitionMastery
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
            id="user_test_mastery_student",
            name="Mastery Student",
            username="masterystudent",
            email="mastery@student.com",
            verified=True,
        )
        progression = [
            {"name": "C", "beat": 1, "expected_pitches": [48, 52, 55]},
            {"name": "G", "beat": 5, "expected_pitches": [43, 47, 50]},
            {"name": "Am", "beat": 9, "expected_pitches": [45, 48, 52]},
        ]
        exercise = Exercise(
            id="ex_test_prog_mastery",
            title="Three Chord Flow",
            instrument="guitar",
            tempo_bpm=100,
            difficulty=2,
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
        return ClerkIdentity(user_id="user_test_mastery_student", email="mastery@student.com")

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_require_clerk_identity

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_empty_mastery_endpoint(async_client: AsyncClient) -> None:
    resp = await async_client.get("/api/me/mastery")
    assert resp.status_code == 200
    data = resp.json()
    assert "records" in data
    assert "recommendations" in data
    assert len(data["records"]) == 0
    assert len(data["recommendations"]) == 0


@pytest.mark.anyio
async def test_take_persistence_and_transition_mastery(async_client: AsyncClient) -> None:
    # 1. Create a session
    resp = await async_client.post(
        "/api/sessions",
        json={"exercise_id": "ex_test_prog_mastery", "tempo_bpm": 120},
    )
    assert resp.status_code == 201
    sess_id = resp.json()["id"]

    # 2. Submit Take 1 (accurate onsets within 45ms window at 120 bpm: 0.0s, 2.0s, 4.0s)
    take_1_chords = [
        {"detected_name": "C", "timestamp_sec": 0.01, "pitches": [48, 52, 55]},
        {"detected_name": "G", "timestamp_sec": 2.01, "pitches": [43, 47, 50]},
        {"detected_name": "Am", "timestamp_sec": 4.01, "pitches": [45, 48, 52]},
    ]
    resp_take_1 = await async_client.post(
        f"/api/sessions/{sess_id}/take",
        json={"played_chords": take_1_chords},
    )
    assert resp_take_1.status_code == 200
    take_1_data = resp_take_1.json()
    assert take_1_data["state"] == "completed"
    assert take_1_data["overall_accuracy"] >= 0.0

    # 3. Check /api/me/mastery after Take 1
    resp_mastery_1 = await async_client.get("/api/me/mastery")
    assert resp_mastery_1.status_code == 200
    mastery_1 = resp_mastery_1.json()
    records_1 = mastery_1["records"]
    assert len(records_1) == 2  # C->G and G->Am

    cg_record = next(r for r in records_1 if r["chord_from"] == "C" and r["chord_to"] == "G")
    assert cg_record["opportunities"] == 1
    assert cg_record["instrument"] == "guitar"
    assert cg_record["p_known"] > 0.20  # increased by BKT after successful transition
    assert cg_record["sm2_repetitions"] == 1

    # Recommendations should be ranked
    recs = mastery_1["recommendations"]
    assert len(recs) == 2
    assert "priority_score" in recs[0]
    assert "selected_drill_strategy" in recs[0]

    # 4. Submit Take 2 for the same session (retake with faster tempo 130 BPM)
    # At 130 BPM (0.4615s/beat), beat 1 = 0.0s, beat 5 = 1.846s, beat 9 = 3.692s
    take_2_chords = [
        {"detected_name": "C", "timestamp_sec": 0.015, "pitches": [48, 52, 55]},
        {"detected_name": "G", "timestamp_sec": 1.855, "pitches": [43, 47, 50]},
        {"detected_name": "Am", "timestamp_sec": 3.705, "pitches": [45, 48, 52]},
    ]
    resp_take_2 = await async_client.post(
        f"/api/sessions/{sess_id}/take",
        json={"played_chords": take_2_chords, "tempo_bpm": 130},
    )
    assert resp_take_2.status_code == 200

    # 5. Check /api/me/mastery after Take 2
    resp_mastery_2 = await async_client.get("/api/me/mastery")
    records_2 = resp_mastery_2.json()["records"]
    assert len(records_2) == 2  # still only 2 records, updated in place!
    cg_record_2 = next(r for r in records_2 if r["chord_from"] == "C" and r["chord_to"] == "G")
    assert cg_record_2["opportunities"] == 2
    assert cg_record_2["sm2_repetitions"] == 2
    assert cg_record_2["p_known"] >= cg_record["p_known"]

    # 6. Verify Session Analysis returns chord metrics for latest take (take 2)
    resp_analysis_latest = await async_client.get(f"/api/sessions/{sess_id}/analysis")
    assert resp_analysis_latest.status_code == 200
    analysis_latest = resp_analysis_latest.json()
    assert len(analysis_latest["chord_metrics"]) == 3
    # Check that take_number is 2 and tempo_bpm is 130 on the latest metrics
    assert all(m["take_number"] == 2 for m in analysis_latest["chord_metrics"])
    assert all(m["tempo_bpm"] == 130 for m in analysis_latest["chord_metrics"])

    # 7. Verify Prior Take 1 metrics were NOT deleted and are accessible via take_number=1 query
    resp_analysis_take_1 = await async_client.get(f"/api/sessions/{sess_id}/analysis?take_number=1")
    assert resp_analysis_take_1.status_code == 200
    analysis_1 = resp_analysis_take_1.json()
    assert len(analysis_1["chord_metrics"]) == 3
    assert all(m["take_number"] == 1 for m in analysis_1["chord_metrics"])
    assert all(m["tempo_bpm"] == 120 for m in analysis_1["chord_metrics"])


@pytest.mark.anyio
async def test_incomplete_and_single_chord_takes(async_client: AsyncClient) -> None:
    # 1. Create a session
    resp = await async_client.post(
        "/api/sessions",
        json={"exercise_id": "ex_test_prog_mastery", "tempo_bpm": 100},
    )
    assert resp.status_code == 201
    sess_id = resp.json()["id"]

    # 2. Submit single chord take (only chord 1 'C' played, chords 2 and 3 omitted)
    resp_single = await async_client.post(
        f"/api/sessions/{sess_id}/take",
        json={"played_chords": [{"detected_name": "C", "timestamp_sec": 0.05, "pitches": [48, 52, 55]}]},
    )
    assert resp_single.status_code == 200
    single_data = resp_single.json()
    assert single_data["analysis_status"] == "complete"
    assert len(single_data["chord_metrics"]) == 3

    # Check mastery: G->Am was never reached so it must not have been created as a transition
    resp_mastery = await async_client.get("/api/me/mastery")
    records = resp_mastery.json()["records"]
    # Only C->G could have been touched (as dropped/failed), never G->Am
    assert not any(r["chord_from"] == "G" and r["chord_to"] == "Am" for r in records)

    # 3. Submit empty take
    resp_empty = await async_client.post(
        f"/api/sessions/{sess_id}/take",
        json={"played_chords": []},
    )
    assert resp_empty.status_code == 200
    assert resp_empty.json()["analysis_status"] == "complete"


def test_evaluator_scale_normalization() -> None:
    reference_chords = [
        {"name": "C", "beat": 1, "expected_pitches": [48, 52, 55]},
        {"name": "G", "beat": 5, "expected_pitches": [43, 47, 50]},
    ]
    played_chords = [
        {"detected_name": "C", "timestamp_sec": 0.5, "pitches": [48, 52, 55]},
        {"detected_name": "G", "timestamp_sec": 2.5, "pitches": [43, 47, 50]},
    ]
    result = PracticeTakeEvaluator.evaluate(
        played_chords=played_chords,
        reference_chords=reference_chords,
        tempo_bpm=120,
        session_id="sess_norm_test",
        instrument="guitar",
    )
    payload = result.to_payload(session_id="sess_norm_test")
    # Overall accuracy should be in [0.0, 100.0] percentage range, not [0.0, 1.0]
    assert 0.0 <= payload["overall_accuracy"] <= 100.0
    assert payload["overall_accuracy"] > 1.0  # since this is a clean take, should be 100.0


def test_musicological_catalog_seeds() -> None:
    # 1. Knockin' on Heaven's Door Cadence outro measure 8
    knockin = next(s for s in SEED_EXERCISES if "Knockin" in s["title"])
    knockin_chords = json.loads(knockin["progression_json"])["chords"]
    assert len(knockin_chords) == 24  # 3 sections * 8 measures

    # Section 1 M7 & M8 (C and C)
    assert knockin_chords[6]["name"] == "C"
    assert knockin_chords[7]["name"] == "C"

    # Section 3 (Outro) M7 (C) & M8 (G)
    assert knockin_chords[22]["name"] == "C"
    last_chord = knockin_chords[23]
    assert last_chord["name"] == "G"
    assert last_chord["expected_pitches"] == [43, 47, 50, 55, 59, 67]
    assert last_chord["guitar_tabs"]["frets"] == [3, 2, 0, 0, 0, 3]
    assert last_chord["guitar_tabs"]["fingering"] == "2-1-0-0-0-3"
    assert last_chord["guitar_tabs"]["strings"] == "E-A-D-G-B-e"

    # 2. Pachelbel's Canon finale Variation 4 measure 8
    canon = next(s for s in SEED_EXERCISES if "Canon" in s["title"])
    canon_chords = json.loads(canon["progression_json"])["chords"]
    assert len(canon_chords) == 32  # 4 variations * 8 measures
    canon_last = canon_chords[-1]
    assert canon_last["name"] == "C"
    assert canon_last["expected_pitches"] == [48, 55, 60, 64]
    voicings = canon_last["piano_voicings"]
    assert voicings["lh_note"] == "C3"
    assert voicings["rh_notes"] == ["G3", "C4", "E4"]
    assert voicings["lh_pitches"] == [48]
    assert voicings["rh_pitches"] == [55, 60, 64]

    # 3. Shostakovich Waltz No. 2
    waltz = next(s for s in SEED_EXERCISES if "Waltz No. 2" in s["title"])
    waltz_chords = json.loads(waltz["progression_json"])["chords"]
    assert len(waltz_chords) == 32
    assert len(waltz_chords[0]["piano_voicings"]["rh_notes"]) >= 3
