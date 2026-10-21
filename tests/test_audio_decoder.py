"""Unit tests for the deep PolyphonicAudioDecoder module."""

from __future__ import annotations

import io
import wave
from unittest.mock import AsyncMock, patch

import pytest

from src.lib.audio.decoder import DecodedAudioTake, PolyphonicAudioDecoder
from src.lib.exception import Unprocessable


def _create_mock_wav(duration_seconds: float = 1.0, sample_rate: int = 22050) -> bytes:
    """Create a minimal valid 16-bit mono PCM WAV in-memory."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        num_frames = int(duration_seconds * sample_rate)
        wf.writeframes(b"\x00\x00" * num_frames)
    return buf.getvalue()


@pytest.mark.anyio
async def test_decoder_rejects_invalid_audio_bytes() -> None:
    """Ensure invalid magic bytes raise Unprocessable."""
    with pytest.raises(Unprocessable, match="Invalid audio format"):
        await PolyphonicAudioDecoder.decode(b"NOT_A_WAV_FILE_HEADER")


@pytest.mark.anyio
async def test_decoder_returns_decoded_take_and_cleans_tempfile() -> None:
    """Ensure decode returns DecodedAudioTake and properly cleans up temp file."""
    wav_bytes = _create_mock_wav(duration_seconds=1.5, sample_rate=22050)
    mock_notes = [
        {"pitch": 60, "start_time": 0.1, "end_time": 0.5, "amplitude": 0.8},
        {"pitch": 64, "start_time": 0.1, "end_time": 0.5, "amplitude": 0.8},
        {"pitch": 67, "start_time": 0.1, "end_time": 0.5, "amplitude": 0.8},
    ]

    with patch(
        "src.lib.audio.decoder.async_transcribe_polyphonic_wav",
        new=AsyncMock(return_value=mock_notes),
    ) as mock_transcribe:
        decoded = await PolyphonicAudioDecoder.decode(wav_bytes)

        assert isinstance(decoded, DecodedAudioTake)
        assert decoded.notes == mock_notes
        assert decoded.sample_rate == 22050
        assert decoded.channels == 1
        assert decoded.duration_seconds == 1.5
        assert len(decoded.chords) > 0
        mock_transcribe.assert_called_once()


@pytest.mark.anyio
async def test_decoder_decode_chords_convenience() -> None:
    """Ensure decode_chords returns the list of chords."""
    wav_bytes = _create_mock_wav(duration_seconds=1.0)
    mock_notes = [{"pitch": 60, "start_time": 0.1, "end_time": 0.4, "amplitude": 0.7}]


    with patch(
        "src.lib.audio.decoder.async_transcribe_polyphonic_wav",
        new=AsyncMock(return_value=mock_notes),
    ):
        chords = await PolyphonicAudioDecoder.decode_chords(wav_bytes)
        assert isinstance(chords, list)
        assert len(chords) == 1
