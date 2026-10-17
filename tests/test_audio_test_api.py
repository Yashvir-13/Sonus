from __future__ import annotations

import io
import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient
from scipy.io import wavfile

from src.services.api.app import app


@pytest.mark.anyio
async def test_transcribe_test_wav_endpoint() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Generate dummy 0.1-second WAV
        buf = io.BytesIO()
        wavfile.write(buf, 22050, np.zeros(2205, dtype=np.float32))
        buf.seek(0)

        res = await client.post(
            "/api/audio/test-transcribe",
            files={"file": ("test.wav", buf.read(), "audio/wav")},
        )
        assert res.status_code == 200
        data = res.json()
        assert "notes" in data
        assert "chords" in data
        assert "duration_seconds" in data
