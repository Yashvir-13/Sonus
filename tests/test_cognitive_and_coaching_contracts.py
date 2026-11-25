"""Tests for Task 3: model caching, CUSUM/bandit persistence, coaching DTO, and health/DB."""

from __future__ import annotations

import io
import json
import sys
from collections.abc import AsyncGenerator
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient
from scipy.io import wavfile
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from src.lib.adaptive.mastery import StudentMasteryEngine
from src.lib.adaptive.reports import generate_grounded_report
from src.lib.audio.transcription import transcribe_polyphonic_wav
from src.lib.auth.clerk import ClerkIdentity, require_clerk_identity
from src.lib.db import engine as async_db_engine
from src.lib.db import get_session
from src.lib.practice.evaluator import PracticeTakeEvaluator
from src.lib.practice.persistence import TakePersistenceAdapter
from src.models.practice import (
    AdaptiveIntervention,
    Exercise,
    HabitPattern,
    PracticeSession,
    TransitionMastery,
)
from src.models.user import User
from src.services.api.app import app

_REPO_ROOT = Path(__file__).resolve().parents[1]


def _make_wav_file(tmp_path: Path, name: str = "sample.wav") -> Path:
    path = tmp_path / name
    sr = 22050
    samples = np.zeros(int(sr * 0.2), dtype=np.float32)
    wavfile.write(str(path), sr, samples)
    return path


def test_transcribe_caches_basic_pitch_model_once(tmp_path: Path) -> None:
    from src.lib.audio import transcription

    transcription.get_basic_pitch_model.cache_clear()
    wav1 = _make_wav_file(tmp_path, "one.wav")
    wav2 = _make_wav_file(tmp_path, "two.wav")

    fake_model = object()
    mock_model_cls = MagicMock(return_value=fake_model)
    mock_predict = MagicMock(return_value=({}, None, [(0.05, 0.45, 60, 0.8, None)]))
    fake_bp_inference = SimpleNamespace(Model=mock_model_cls, predict=mock_predict)
    fake_bp = SimpleNamespace(
        ICASSP_2022_MODEL_PATH="/fake/icassp_2022_model.onnx",
        inference=fake_bp_inference,
    )

    with patch.dict(
        sys.modules,
        {"basic_pitch": fake_bp, "basic_pitch.inference": fake_bp_inference},
    ):
        n1 = transcribe_polyphonic_wav(wav1)
        n2 = transcribe_polyphonic_wav(wav2)

    assert len(n1) == 1 and len(n2) == 1
    assert mock_model_cls.call_count == 1
    assert mock_predict.call_count == 2
    assert mock_predict.call_args_list[0].kwargs.get("model_or_model_path") is fake_model
    assert mock_predict.call_args_list[1].kwargs.get("model_or_model_path") is fake_model
    transcription.get_basic_pitch_model.cache_clear()


@pytest.fixture
async def cog_env() -> AsyncGenerator[tuple[AsyncClient, async_sessionmaker[AsyncSession]], None]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    @event.listens_for(test_engine.sync_engine, "connect")
    def _enable_sqlite_fk(dbapi_conn: Any, _connection_record: Any) -> None:
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with async_session() as session:
        session.add(
            User(
                id="user_cog_tester",
                name="Cognitive Tester",
                username="cogtester",
                email="cog@example.com",
                verified=True,
            ),
        )
        session.add(
            Exercise(
                id="ex_cog_prog",
                title="C to G to Am Flow",
                instrument="guitar",
                tempo_bpm=60,
                difficulty=2,
                progression_json=json.dumps({
                    "key": "C Major",
                    "default_tempo_bpm": 60,
                    "chords": [
                        {"name": "C", "beat": 1.0, "duration_beats": 1.0, "expected_pitches": [48, 52, 55]},
                        {"name": "G", "beat": 2.0, "duration_beats": 1.0, "expected_pitches": [43, 47, 50]},
                        {"name": "Am", "beat": 3.0, "duration_beats": 1.0, "expected_pitches": [45, 52, 57]},
                    ],
                }),
            ),
        )
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
        return ClerkIdentity(user_id="user_cog_tester", email="cog@example.com")

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_identity

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, async_session

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_persist_take_runs_cusum_on_history_and_updates_subdivision_pocket_bandit(
    cog_env: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    _, async_session = cog_env

    async with async_session() as session:
        ps = PracticeSession(
            id="sess_cusum_1",
            user_id="user_cog_tester",
            exercise_id="ex_cog_prog",
            tempo_bpm=60,
            state="recording",
        )
        pat = HabitPattern(
            id="pat_pocket_1",
            user_id="user_cog_tester",
            pattern_type="tempo_dragging",
            trigger_context="C -> G",
            evidence_count=3,
            status="active",
        )
        intv = AdaptiveIntervention(
            id="intv_pocket_1",
            pattern_id="pat_pocket_1",
            user_id="user_cog_tester",
            drill_type="pocket_groove",
            target_tempo=60,
            target_repetitions=4,
            completed=False,
        )
        session.add_all([ps, pat])
        await session.flush()
        session.add(intv)
        await session.commit()

        # Submit 4 baseline steady takes (12ms, 14ms, 13ms, 15ms), then 4 deteriorated takes
        # so cumulative Page's CUSUM s_pos cleanly exceeds threshold h = 4 * std.
        captured_histories: list[list[float] | None] = []
        captured_changepoints: list[bool] = []
        orig_assess = StudentMasteryEngine.assess_transition

        def spy_assess(*args: Any, **kwargs: Any) -> Any:
            captured_histories.append(kwargs.get("latency_history"))
            res = orig_assess(*args, **kwargs)
            captured_changepoints.append(res.is_changepoint)
            return res

        with patch.object(StudentMasteryEngine, "assess_transition", side_effect=spy_assess):
            for lag_ms in [12.0, 14.0, 13.0, 15.0, 180.0, 190.0, 200.0, 210.0]:
                records = [
                    {
                        "chord_index": 0,
                        "expected_chord": "C",
                        "detected_chord": "C",
                        "is_matched": True,
                        "onset_error_ms": 5.0,
                        "voicing_completeness": 1.0,
                    },
                    {
                        "chord_index": 1,
                        "expected_chord": "G",
                        "detected_chord": "G",
                        "is_matched": True,
                        "onset_error_ms": lag_ms,
                        "voicing_completeness": 1.0,
                    },
                ]
                await TakePersistenceAdapter.persist_take(
                    session=session,
                    practice_session=ps,
                    overall_accuracy=1.0,
                    avg_timing_error_ms=lag_ms,
                    voicing_score=1.0,
                    chord_metric_records=records,
                    detected_habits=[],
                    intervention=intv,
                    instrument="guitar",
                )

        # On take 8, history has 7 entries and CUSUM cleanly detects deterioration!
        assert captured_histories[-1] is not None
        assert len(captured_histories[-1]) >= 7
        assert any(captured_changepoints[-3:])
        assert captured_changepoints[-1] is True

        # Check pocket_groove updated bandit_alpha_subdivision (4 successes) and beta (4 failures)
        tm = (
            await session.execute(
                SQLModel.metadata.tables["transition_mastery"].select().where(
                    TransitionMastery.user_id == "user_cog_tester",  # type: ignore[arg-type]
                ),
            )
        ).mappings().first()
        assert tm is not None
        assert tm["bandit_alpha_subdivision"] == 5.0  # 1.0 + 4 successes
        assert tm["bandit_beta_subdivision"] == 5.0   # 1.0 + 4 failures


@pytest.mark.anyio
async def test_fetch_baseline_metrics_and_evaluator_use_distinct_chord_pairs(
    cog_env: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    _, async_session = cog_env

    async with async_session() as session:
        ps1 = PracticeSession(
            id="sess_base_1",
            user_id="user_cog_tester",
            exercise_id="ex_cog_prog",
            tempo_bpm=60,
            state="completed",
        )
        session.add(ps1)
        await session.commit()

        await TakePersistenceAdapter.persist_take(
            session=session,
            practice_session=ps1,
            overall_accuracy=1.0,
            avg_timing_error_ms=40.0,
            voicing_score=1.0,
            chord_metric_records=[
                {
                    "chord_index": 0,
                    "expected_chord": "C",
                    "detected_chord": "C",
                    "is_matched": True,
                    "onset_error_ms": 5.0,
                    "voicing_completeness": 1.0,
                },
                {
                    "chord_index": 1,
                    "expected_chord": "G",
                    "detected_chord": "G",
                    "is_matched": True,
                    "onset_error_ms": 60.0,
                    "voicing_completeness": 1.0,
                },
                {
                    "chord_index": 2,
                    "expected_chord": "Am",
                    "detected_chord": "Am",
                    "is_matched": True,
                    "onset_error_ms": 55.0,
                    "voicing_completeness": 1.0,
                },
            ],
            detected_habits=[],
            instrument="guitar",
        )

        baseline = await TakePersistenceAdapter.fetch_baseline_metrics(
            session=session,
            user_id="user_cog_tester",
            current_session_id="sess_other_2",
        )
        transition_entries = [m for m in baseline if "from_chord" in m and "to_chord" in m]
        assert len(transition_entries) >= 2
        assert all(m["from_chord"] != m["to_chord"] for m in transition_entries)
        pairs = {(m["from_chord"], m["to_chord"]) for m in transition_entries}
        assert ("C", "G") in pairs
        assert ("G", "Am") in pairs

    # Pure evaluator follow-up metrics must also emit distinct from_chord != to_chord
    captured_follow_up: list[list[dict[str, Any]]] = []

    def spy_outcome(
        baseline_metrics: list[dict[str, Any]],
        follow_up_metrics: list[dict[str, Any]],
        drill_type: str,
    ) -> dict[str, Any]:
        captured_follow_up.append(follow_up_metrics)
        return {"drill_type": drill_type, "outcome": "improved", "completed": True, "measured_improvement": 20.0}

    with patch("src.lib.practice.evaluator.evaluate_drill_outcome", side_effect=spy_outcome):
        PracticeTakeEvaluator.evaluate(
            played_chords=[
                {"chord": "C", "pitches": [48, 52, 55], "timestamp_sec": 0.0},
                {"chord": "G", "pitches": [43, 47, 50], "timestamp_sec": 1.02},
                {"chord": "Am", "pitches": [45, 52, 57], "timestamp_sec": 2.02},
            ],
            reference_chords=[
                {"name": "C", "beat": 1.0, "expected_pitches": [48, 52, 55]},
                {"name": "G", "beat": 2.0, "expected_pitches": [43, 47, 50]},
                {"name": "Am", "beat": 3.0, "expected_pitches": [45, 52, 57]},
            ],
            tempo_bpm=60,
            session_id="sess_eval_pairs",
            baseline_metrics=[{"from_chord": "C", "to_chord": "G", "transition_latency_ms": 120.0}],
            drill_type="isolated_transition",
        )

    assert len(captured_follow_up) == 1
    follow_transitions = [m for m in captured_follow_up[0] if "from_chord" in m and "to_chord" in m]
    assert len(follow_transitions) == 2
    assert all(m["from_chord"] != m["to_chord"] for m in follow_transitions)


@pytest.mark.anyio
async def test_create_session_drill_persists_valid_habit_fk_and_passes_bandit_priors(
    cog_env: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    client, async_session = cog_env

    # Brand new user has 0 HabitPattern rows; seed TransitionMastery priors
    async with async_session() as session:
        session.add(
            TransitionMastery(
                id="tm_prior_test",
                user_id="user_cog_tester",
                chord_from="C",
                chord_to="G",
                instrument="guitar",
                bandit_alpha_voicing=10.0,
                bandit_beta_voicing=2.0,
            ),
        )
        await session.commit()

    sess_res = await client.post("/api/sessions", json={"exercise_id": "ex_cog_prog", "tempo_bpm": 60})
    assert sess_res.status_code == 201
    sess_id = sess_res.json()["id"]

    captured_history: list[dict[str, tuple[float, float]] | None] = []
    orig_select = StudentMasteryEngine.select_remedial_strategy

    def spy_select(*args: Any, **kwargs: Any) -> str:
        captured_history.append(kwargs.get("strategy_history"))
        return orig_select(*args, **kwargs)

    with patch.object(StudentMasteryEngine, "select_remedial_strategy", side_effect=spy_select):
        drill_res = await client.post(f"/api/sessions/{sess_id}/drill")

    assert drill_res.status_code == 201
    drill = drill_res.json()

    # HabitPattern referenced by pattern_id MUST exist in DB (no FK violation)
    async with async_session() as session:
        pat = await session.get(HabitPattern, drill["pattern_id"])
        assert pat is not None
        assert pat.user_id == "user_cog_tester"

    assert len(captured_history) == 1
    assert captured_history[0] is not None
    assert captured_history[0]["voicing_arpeggio"][0] >= 9


@pytest.mark.anyio
async def test_session_coaching_filters_latest_take_and_emits_aligned_dto_and_consistency(
    cog_env: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    client, _ = cog_env

    sess_res = await client.post("/api/sessions", json={"exercise_id": "ex_cog_prog", "tempo_bpm": 60})
    assert sess_res.status_code == 201
    sess_id = sess_res.json()["id"]

    # Take 1: empty/poor take
    t1 = await client.post(f"/api/sessions/{sess_id}/take", json={"played_chords": []})
    assert t1.status_code == 200

    # Take 2: clean take (C, G, Am matched)
    t2 = await client.post(
        f"/api/sessions/{sess_id}/take",
        json={
            "played_chords": [
                {"chord": "C", "timestamp_sec": 0.0, "pitches": [48, 52, 55]},
                {"chord": "G", "timestamp_sec": 1.01, "pitches": [43, 47, 50]},
                {"chord": "Am", "timestamp_sec": 2.01, "pitches": [45, 52, 57]},
            ],
        },
    )
    assert t2.status_code == 200

    coach_res = await client.get(f"/api/sessions/{sess_id}/coaching")
    assert coach_res.status_code == 200
    coach = coach_res.json()

    assert coach["facts"]["total_chords"] == 3
    assert coach["facts"]["accuracy_pct"] == 100.0
    assert "letter_grade" in coach
    assert "recommended_tempo_adjustment_bpm" in coach
    assert "recommended_tempo_adjustment" in coach
    assert "summary" in coach
    assert len(coach["tailored_drills"]) >= 1
    assert "description" in coach["tailored_drills"][0]
    assert "instructions" in coach["tailored_drills"][0]

    # Signed bias vs absolute timing consistency in grounded reports
    report = generate_grounded_report(
        "sess_spread",
        [
            {"expected_chord": "C", "is_matched": True, "onset_error_ms": -100.0, "voicing_completeness": 1.0},
            {"expected_chord": "G", "is_matched": True, "onset_error_ms": 100.0, "voicing_completeness": 1.0},
        ],
    )
    assert report["facts"]["avg_onset_error_ms"] == 0.0
    assert report["facts"]["avg_abs_timing_error_ms"] == 100.0


@pytest.mark.anyio
async def test_health_live_skips_db_and_db_pool_pre_ping_enabled() -> None:
    assert async_db_engine.pool._pre_ping is True

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("src.lib.fastapi.routes.health.database_ping_ok", side_effect=AssertionError("Should not ping DB")):
            res = await client.get("/api/health/live")
            assert res.status_code == 200
            assert res.json()["status"] == "alive"

    dockerfile = (_REPO_ROOT / "Dockerfile").read_text(encoding="utf-8")
    assert "/api/health/live" in dockerfile
    assert "--forwarded-allow-ips='*'" not in dockerfile


@pytest.mark.anyio
async def test_get_session_does_not_commit_when_read_only() -> None:
    mock_session = AsyncMock(spec=AsyncSession)
    mock_session.new = ()
    mock_session.dirty = ()
    mock_session.deleted = ()
    mock_session.info = {}

    class FakeCtx:
        async def __aenter__(self) -> AsyncSession:
            return mock_session

        async def __aexit__(self, *_args: Any) -> None:
            return None

    with patch("src.lib.db.AsyncSessionLocal", return_value=FakeCtx()):
        gen = get_session()
        yielded = await gen.__anext__()
        assert yielded is mock_session
        with pytest.raises(StopAsyncIteration):
            await gen.__anext__()

    mock_session.commit.assert_not_awaited()
    mock_session.close.assert_awaited_once()
