"""Tests for live anonymized PostgreSQL peer benchmarks endpoint."""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from src.lib.auth.clerk import ClerkIdentity, optional_clerk_identity
from src.lib.db import get_session
from src.models.practice import Exercise, PracticeSession, TransitionMastery
from src.models.user import User
from src.services.api.app import app


def _make_exercise(ex_id: str, title: str, instrument: str, tempo_bpm: int = 90) -> Exercise:
    return Exercise(
        id=ex_id,
        title=title,
        instrument=instrument,
        tempo_bpm=tempo_bpm,
        difficulty=2,
        progression_json=json.dumps({
            "key": "C Major",
            "default_tempo_bpm": tempo_bpm,
            "chords": [
                {"name": "C", "beat": 1.0, "duration_beats": 1.0, "expected_pitches": [48, 52, 55]},
                {"name": "G", "beat": 2.0, "duration_beats": 1.0, "expected_pitches": [43, 47, 50]},
            ],
        }),
    )


@pytest.fixture
async def community_env() -> AsyncGenerator[tuple[AsyncClient, async_sessionmaker[AsyncSession]], None]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    @event.listens_for(test_engine.sync_engine, "connect")
    def _enable_sqlite_fk(dbapi_conn: Any, _connection_record: Any) -> None:
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, async_session

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_community_benchmarks_fallback_anonymizes_and_excludes_pii(
    community_env: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    client, async_session = community_env

    async with async_session() as session:
        ex = _make_exercise("ex_bench_piano", "Autumn Leaves Waltz", "piano", tempo_bpm=88)
        u1 = User(
            id="user_bench_alice",
            name="Alice Wonderland",
            username="alicew",
            email="alice.secret@example.com",
            verified=True,
        )
        u2 = User(
            id="user_bench_bob",
            name="Bob Musician",
            username="bobm",
            email="bob.secret@example.com",
            verified=True,
        )
        session.add_all([ex, u1, u2])
        await session.flush()

        # 3 completed sessions (< 10 threshold -> baseline fallback), plus 1 unfinished session
        session.add_all([
            PracticeSession(
                id="sess_b1",
                user_id="user_bench_alice",
                exercise_id="ex_bench_piano",
                tempo_bpm=88,
                state="completed",
                overall_accuracy=0.95,
                avg_timing_error_ms=14.0,
                voicing_score=0.96,
            ),
            PracticeSession(
                id="sess_b2",
                user_id="user_bench_alice",
                exercise_id="ex_bench_piano",
                tempo_bpm=84,
                state="completed",
                overall_accuracy=0.80,
                avg_timing_error_ms=35.0,
                voicing_score=0.82,
            ),
            PracticeSession(
                id="sess_b3",
                user_id="user_bench_bob",
                exercise_id="ex_bench_piano",
                tempo_bpm=88,
                state="completed",
                overall_accuracy=0.88,
                avg_timing_error_ms=22.0,
                voicing_score=0.90,
            ),
            PracticeSession(
                id="sess_b4_incomplete",
                user_id="user_bench_bob",
                exercise_id="ex_bench_piano",
                tempo_bpm=88,
                state="recording",
                overall_accuracy=1.0,
                avg_timing_error_ms=1.0,
                voicing_score=1.0,
            ),
        ])
        await session.commit()

    # Guest request (no auth header)
    res = await client.get("/api/community/benchmarks")
    assert res.status_code == 200
    payload = res.json()
    raw_json = res.text

    assert payload["is_baseline_fallback"] is True
    assert payload["baseline_label"] == "Simulated Reference Baseline"
    assert payload["total_completed_sessions"] == 3
    assert payload["cohort_size"] == 2

    # Strictly no emails, full surnames, or raw clerk user IDs leaked
    assert "alice.secret@example.com" not in raw_json
    assert "bob.secret@example.com" not in raw_json
    assert "Alice Wonderland" not in raw_json
    assert "Bob Musician" not in raw_json
    assert "user_bench_alice" not in raw_json
    assert "user_bench_bob" not in raw_json

    leaderboard = payload["leaderboard"]
    assert len(leaderboard) == 2
    assert leaderboard[0]["performer_name"] == "Alice W."
    assert leaderboard[0]["handle"] == "@alicew"
    assert leaderboard[0]["verified_takes_count"] == 2
    assert leaderboard[0]["is_current_user"] is False
    assert leaderboard[1]["performer_name"] == "Bob M."
    assert leaderboard[1]["handle"] == "@bobm"


@pytest.mark.anyio
async def test_community_benchmarks_live_empirical_cohort_and_filters(
    community_env: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    client, async_session = community_env

    async with async_session() as session:
        piano_ex = _make_exercise("ex_live_piano", "Canon in D", "piano", tempo_bpm=80)
        guitar_ex = _make_exercise("ex_live_guitar", "Rising Sun", "guitar", tempo_bpm=100)
        session.add_all([piano_ex, guitar_ex])

        users: list[User] = []
        sessions_list: list[PracticeSession] = []
        for idx in range(10):
            uid = f"user_cohort_{idx}"
            users.append(
                User(
                    id=uid,
                    name=f"Player{idx} Last{idx}",
                    username=f"player{idx}",
                    email=f"player{idx}@example.com",
                    verified=True,
                ),
            )
            ex = piano_ex if idx < 6 else guitar_ex
            sessions_list.append(
                PracticeSession(
                    id=f"sess_cohort_{idx}_1",
                    user_id=uid,
                    exercise_id=ex.id,
                    tempo_bpm=ex.tempo_bpm,
                    state="completed",
                    overall_accuracy=0.75 + (idx * 0.025),
                    avg_timing_error_ms=float(45 - idx * 3),
                    voicing_score=0.70 + (idx * 0.03),
                ),
            )
        # Add extra takes so total_completed_sessions == 12 across 10 users
        for extra in range(2):
            sessions_list.append(
                PracticeSession(
                    id=f"sess_cohort_extra_{extra}",
                    user_id=f"user_cohort_{extra}",
                    exercise_id="ex_live_piano",
                    tempo_bpm=84,
                    state="completed",
                    overall_accuracy=0.92,
                    avg_timing_error_ms=16.0,
                    voicing_score=0.94,
                ),
            )
        # Mastered transition for top player (idx=9)
        session.add_all(users)
        await session.flush()
        session.add_all(sessions_list)
        session.add(
            TransitionMastery(
                id="tm_cohort_9",
                user_id="user_cohort_9",
                chord_from="C",
                chord_to="G",
                instrument="guitar",
                p_known=0.97,
                is_mastered=True,
                opportunities=5,
                ewma_latency_ms=18.0,
                voicing_completeness=0.97,
            ),
        )
        await session.commit()

    def override_optional() -> ClerkIdentity:
        return ClerkIdentity(user_id="user_cohort_5", email="player5@example.com")

    app.dependency_overrides[optional_clerk_identity] = override_optional

    res = await client.get("/api/community/benchmarks")
    assert res.status_code == 200
    payload = res.json()

    assert payload["is_baseline_fallback"] is False
    assert payload["cohort_size"] == 10
    assert payload["total_completed_sessions"] == 12

    dists = payload["distributions"]
    assert dists["timing_ms"]["median"] is not None
    assert dists["voicing_pct"]["median"] is not None
    assert dists["accuracy_pct"]["median"] is not None
    assert dists["timing_ms"]["user_percentile"] is not None

    board = payload["leaderboard"]
    assert len(board) == 10
    assert board[0]["rank"] == 1
    assert board[0]["performer_name"] == "Player9 L."
    assert board[0]["bkt_mastered_count"] == 1

    current_rows = [row for row in board if row["is_current_user"]]
    assert len(current_rows) == 1
    assert current_rows[0]["handle"] == "@player5"

    # Scores strictly descending
    scores = [row["challenge_score"] for row in board]
    assert scores == sorted(scores, reverse=True)

    # Filter by instrument=guitar -> 4 users / 4 sessions -> falls back honestly for narrow slice
    guitar_res = await client.get("/api/community/benchmarks", params={"instrument": "guitar"})
    assert guitar_res.status_code == 200
    guitar_payload = guitar_res.json()
    assert guitar_payload["cohort_size"] == 4
    assert guitar_payload["total_completed_sessions"] == 4
    assert guitar_payload["is_baseline_fallback"] is True
    assert all(row["instrument"] == "guitar" for row in guitar_payload["leaderboard"])

    # Filter by piece_id=ex_live_piano
    piano_piece_res = await client.get(
        "/api/community/benchmarks",
        params={"piece_id": "ex_live_piano"},
    )
    assert piano_piece_res.status_code == 200
    assert all(row["exercise_id"] == "ex_live_piano" for row in piano_piece_res.json()["leaderboard"])
