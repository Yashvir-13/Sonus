"""Security boundary, rate limit, validation, and auth hardening tests."""

from __future__ import annotations

import io
import json
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from fastapi import APIRouter, FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError
from scipy.io import wavfile
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from starlette.requests import Request

from src.lib.adaptive.llm_coach import _prepare_gemini_request
from src.lib.audio.decoder import PolyphonicAudioDecoder
from src.lib.auth.clerk import ClerkIdentity, require_clerk_identity
from src.lib.db import get_session
from src.lib.exception import PayloadTooLarge, TooManyRequests, Unprocessable
from src.lib.fastapi.middleware.correlation import CorrelationIdMiddleware
from src.lib.fastapi.server import cors_allow_origins
from src.lib.schemas.music import ChordDefinition, ProgressionData
from src.models.practice import (
    AdaptiveIntervention,
    Exercise,
    HabitPattern,
    PracticeSession,
    PracticeSessionCreate,
)
from src.models.user import User
from src.services.api.app import app
from src.services.api.routes.me import ensure_user_exists


def _make_wav_bytes(duration_sec: float = 0.1, sample_rate: int = 22050) -> bytes:
    buf = io.BytesIO()
    samples = np.zeros(int(duration_sec * sample_rate), dtype=np.float32)
    wavfile.write(buf, sample_rate, samples)
    return buf.getvalue()


@pytest.fixture
async def security_client() -> AsyncGenerator[tuple[AsyncClient, async_sessionmaker[AsyncSession]], None]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with async_session() as session:
        user_a = User(
            id="user_sec_a",
            name="Alice Practice",
            username="alice_sec",
            email="alice_sec@example.com",
            verified=True,
        )
        user_b = User(
            id="user_sec_b",
            name="Bob Practice",
            username="bob_sec",
            email="bob_sec@example.com",
            verified=True,
        )
        ex = Exercise(
            id="ex_sec_test",
            title="Security Test Exercise",
            instrument="guitar",
            tempo_bpm=90,
            difficulty=1,
            progression_json=json.dumps({
                "key": "C Major",
                "default_tempo_bpm": 90,
                "chords": [
                    {"name": "C", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55]},
                    {"name": "G", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50]},
                ],
            }),
        )
        habit_b = HabitPattern(
            id="pat_sec_b",
            user_id="user_sec_b",
            pattern_type="transition_lag",
            trigger_context="C -> G",
            evidence_count=3,
            status="active",
        )
        intv_b = AdaptiveIntervention(
            id="intv_sec_b",
            pattern_id="pat_sec_b",
            user_id="user_sec_b",
            drill_type="isolated_transition",
            target_tempo=70,
            target_repetitions=4,
            completed=False,
        )
        session.add_all([user_a, user_b, ex, habit_b, intv_b])
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
        return ClerkIdentity(user_id="user_sec_a", email="alice_sec@example.com")

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[require_clerk_identity] = override_identity

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, async_session

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_audio_test_transcribe_fails_closed_outside_development(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    wav_bytes = _make_wav_bytes()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for env_val in (None, "", "staging", "production"):
            if env_val is None:
                monkeypatch.delenv("ENV", raising=False)
            else:
                monkeypatch.setenv("ENV", env_val)

            res = await client.post(
                "/api/audio/test-transcribe",
                files={"file": ("test.wav", wav_bytes, "audio/wav")},
            )
            assert res.status_code == 404, f"Expected 404 for ENV={env_val!r}, got {res.status_code}"

        monkeypatch.setenv("ENV", "development")
        res_dev = await client.post(
            "/api/audio/test-transcribe",
            files={"file": ("test.wav", wav_bytes, "audio/wav")},
        )
        assert res_dev.status_code == 200


@pytest.mark.anyio
async def test_read_bounded_upload_aborts_early_without_full_buffering() -> None:
    from src.lib.rate_limit import read_bounded_upload

    class FakeChunkedUpload:
        size: int | None = None

        def __init__(self, chunk_bytes: bytes, total_chunks: int) -> None:
            self._chunk = chunk_bytes
            self._remaining = total_chunks
            self.reads = 0

        async def read(self, size: int = -1) -> bytes:
            self.reads += 1
            if self._remaining <= 0:
                return b""
            self._remaining -= 1
            return self._chunk[:size] if size > 0 else self._chunk

    fake_upload = FakeChunkedUpload(b"A" * 512, total_chunks=1000)
    with pytest.raises(PayloadTooLarge):
        await read_bounded_upload(fake_upload, max_bytes=1024, chunk_size=512)  # type: ignore[arg-type]

    # Must abort right after crossing 1024 bytes (3 reads * 512 = 1536 > 1024), NOT 1000 reads
    assert fake_upload.reads <= 3


@pytest.mark.anyio
async def test_decoder_rejects_oversized_before_tempfile_and_caps_ffmpeg() -> None:
    oversized = b"RIFF\x00\x00\x00\x00WAVE" + (b"\x00" * (15 * 1024 * 1024 + 10))
    with patch("src.lib.audio.decoder.tempfile.NamedTemporaryFile") as mock_tmp:
        with pytest.raises(PayloadTooLarge):
            await PolyphonicAudioDecoder.decode(oversized)
        mock_tmp.assert_not_called()

    # Check ffmpeg flags when transcoding non-WAV
    with patch("src.lib.audio.decoder.subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(returncode=1)
        PolyphonicAudioDecoder._transcode_non_wav_if_needed(b"ID3_FAKE_MP3")
        cmd = mock_run.call_args[0][0]
        assert "-t" in cmd and cmd[cmd.index("-t") + 1] == "180"
        assert "-fs" in cmd and cmd[cmd.index("-fs") + 1] == str(15 * 1024 * 1024)


@pytest.mark.anyio
async def test_session_creation_bounds_and_intervention_ownership(
    security_client: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    client, _ = security_client

    # Tempo bounds
    with pytest.raises(ValidationError):
        PracticeSessionCreate(exercise_id="ex_sec_test", tempo_bpm=0)

    res_zero = await client.post("/api/sessions", json={"exercise_id": "ex_sec_test", "tempo_bpm": 0})
    assert res_zero.status_code == 422

    res_neg = await client.post("/api/sessions", json={"exercise_id": "ex_sec_test", "tempo_bpm": -5})
    assert res_neg.status_code == 422

    res_high = await client.post("/api/sessions", json={"exercise_id": "ex_sec_test", "tempo_bpm": 350})
    assert res_high.status_code == 422

    # Missing intervention_id
    res_missing_intv = await client.post(
        "/api/sessions",
        json={"exercise_id": "ex_sec_test", "tempo_bpm": 90, "intervention_id": "intv_missing"},
    )
    assert res_missing_intv.status_code == 404

    # Foreign user's intervention_id
    res_foreign_intv = await client.post(
        "/api/sessions",
        json={"exercise_id": "ex_sec_test", "tempo_bpm": 90, "intervention_id": "intv_sec_b"},
    )
    assert res_foreign_intv.status_code == 404


def test_progression_data_rejects_excessive_chord_count() -> None:
    chords = [ChordDefinition(name="C", beat=float(i + 1)) for i in range(257)]
    with pytest.raises(ValidationError):
        ProgressionData(chords=chords)


@pytest.mark.anyio
async def test_ensure_user_exists_blocks_email_collision_takeover(
    security_client: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    _, async_session = security_client
    async with async_session() as session:
        with pytest.raises(Unprocessable):
            await ensure_user_exists(
                session,
                ClerkIdentity(user_id="user_attacker_999", email="alice_sec@example.com"),
            )


@pytest.mark.anyio
async def test_me_stats_computes_real_consecutive_utc_streak(
    security_client: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
) -> None:
    client, async_session = security_client
    now = datetime.now(UTC)

    async with async_session() as session:
        # Insert 5 consecutive days of completed sessions (exceeds old cap of 3)
        # plus multiple sessions on day 0
        for idx, days_ago in enumerate([0, 0, 1, 2, 3, 4, 7]):
            ps = PracticeSession(
                id=f"sess_streak_{idx}",
                user_id="user_sec_a",
                exercise_id="ex_sec_test",
                tempo_bpm=90,
                state="completed",
                overall_accuracy=0.9,
                avg_timing_error_ms=15.0,
                voicing_score=0.95,
                created_at=now - timedelta(days=days_ago),
            )
            session.add(ps)
        await session.commit()

    res = await client.get("/api/me/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_sessions_completed"] == 7
    assert data["streak_days"] == 5


def test_cors_allow_origins_excludes_localhost_in_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENV", "production")
    monkeypatch.delenv("CORS_ALLOWED_ORIGINS", raising=False)
    prod_origins = cors_allow_origins()
    assert "https://sonus.yashvirafterhours.me" in prod_origins
    assert all("localhost" not in o and "127.0.0.1" not in o for o in prod_origins)

    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,https://partner.example.com")
    prod_filtered = cors_allow_origins()
    assert "https://partner.example.com" in prod_filtered
    assert all("localhost" not in o and "127.0.0.1" not in o for o in prod_filtered)

    monkeypatch.setenv("ENV", "development")
    monkeypatch.delenv("CORS_ALLOWED_ORIGINS", raising=False)
    dev_origins = cors_allow_origins()
    assert "http://localhost:5173" in dev_origins


@pytest.mark.anyio
async def test_correlation_middleware_replaces_unsafe_request_id() -> None:
    test_app = FastAPI()
    test_app.add_middleware(CorrelationIdMiddleware)
    router = APIRouter()

    @router.get("/ping")
    async def ping() -> dict[str, str]:
        return {"ok": "true"}

    test_app.include_router(router)
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for bad_id in ["bad id with spaces", "bad\nid", "evil<script>", "a" * 65]:
            res = await client.get("/ping", headers={"X-Request-ID": bad_id})
            assert res.status_code == 200
            returned = res.headers.get("x-request-id", "")
            assert returned.startswith("req_")
            assert returned != bad_id

        res_ok = await client.get("/ping", headers={"X-Request-ID": "req_safe.123-abc"})
        assert res_ok.headers.get("x-request-id") == "req_safe.123-abc"


def test_prepare_gemini_request_passes_key_in_header_not_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    url, headers, payload = _prepare_gemini_request(
        grounded_data={"facts": {"accuracy_pct": 90.0}},
        habit_list=[],
        instrument="piano",
        gemini_key="AIzaSySecretUnitTestKey",
    )
    assert "key=" not in url
    assert "AIzaSySecretUnitTestKey" not in url
    assert "gemini-2.5-flash" in url
    assert headers["x-goog-api-key"] == "AIzaSySecretUnitTestKey"
    assert "contents" in payload


@pytest.mark.anyio
async def test_rate_limiter_enforces_429_rfc9457(
    security_client: tuple[AsyncClient, async_sessionmaker[AsyncSession]],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from src.lib.rate_limit import SlidingWindowRateLimiter

    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=60.0)
    limiter.check("user_1")
    limiter.check("user_1")
    with pytest.raises(TooManyRequests):
        limiter.check("user_1")

    # Verify HTTP endpoint integration returns 429 RFC 9457 JSON
    client, _ = security_client
    monkeypatch.setattr(
        "src.services.api.routes.sessions.COACHING_RATE_LIMIT",
        SlidingWindowRateLimiter(max_requests=1, window_seconds=60.0),
    )
    sess_res = await client.post("/api/sessions", json={"exercise_id": "ex_sec_test", "tempo_bpm": 90})
    assert sess_res.status_code == 201
    sess_id = sess_res.json()["id"]

    r1 = await client.get(f"/api/sessions/{sess_id}/coaching")
    assert r1.status_code == 200
    r2 = await client.get(f"/api/sessions/{sess_id}/coaching")
    assert r2.status_code == 429
    assert r2.headers.get("content-type") == "application/problem+json"


def test_clerk_dev_token_defaults_have_no_personal_pii(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENV", "development")
    monkeypatch.setenv("ALLOW_DEV_TOKEN_AUTH", "true")
    monkeypatch.delenv("DEV_USER_ID", raising=False)
    monkeypatch.delenv("DEV_USER_EMAIL", raising=False)

    req = Request({
        "type": "http",
        "method": "GET",
        "headers": [(b"authorization", b"Bearer dev_token")],
    })
    identity = require_clerk_identity(req)
    assert identity.user_id == "user_dev_local_001"
    assert identity.email == "dev@example.com"
    assert "yashvir" not in (identity.email or "").lower()
    assert "3KEP7O" not in identity.user_id
