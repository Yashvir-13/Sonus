from __future__ import annotations

import io
import numpy as np
import pytest
from scipy.io import wavfile

from src.lib.audio.validation import validate_audio_upload, AudioValidationResult
from src.lib.exception import Unprocessable


def _create_synthetic_wav(
    duration_sec: float = 1.0,
    sample_rate: int = 22050,
    channels: int = 1,
) -> bytes:
    num_samples = int(duration_sec * sample_rate)
    if channels == 1:
        data = np.zeros(num_samples, dtype=np.int16)
    else:
        data = np.zeros((num_samples, channels), dtype=np.int16)
    buf = io.BytesIO()
    wavfile.write(buf, sample_rate, data)
    return buf.getvalue()


def test_validate_valid_mono_wav() -> None:
    wav_bytes = _create_synthetic_wav(duration_sec=2.5, sample_rate=22050, channels=1)
    result = validate_audio_upload(wav_bytes)
    assert isinstance(result, AudioValidationResult)
    assert result.sample_rate == 22050
    assert result.channels == 1
    assert 2.4 <= result.duration_seconds <= 2.6


def test_validate_valid_stereo_wav() -> None:
    wav_bytes = _create_synthetic_wav(duration_sec=1.0, sample_rate=44100, channels=2)
    result = validate_audio_upload(wav_bytes)
    assert result.channels == 2
    assert result.sample_rate == 44100
    assert 0.9 <= result.duration_seconds <= 1.1


def test_validate_empty_audio_raises() -> None:
    with pytest.raises(Unprocessable, match="Audio payload is empty"):
        validate_audio_upload(b"")


def test_validate_invalid_magic_bytes_raises() -> None:
    fake_mp3 = b"ID3\x03\x00\x00\x00\x00\x0f" + b"\x00" * 100
    with pytest.raises(Unprocessable, match="RIFF/WAVE"):
        validate_audio_upload(fake_mp3)

    plain_text = b"This is not a wave file at all, just plain text."
    with pytest.raises(Unprocessable, match="RIFF/WAVE"):
        validate_audio_upload(plain_text)


def test_validate_corrupted_truncated_header_raises() -> None:
    corrupted = b"RIFF\x10\x00\x00\x00WAVE"
    with pytest.raises(Unprocessable, match="Invalid or corrupted"):
        validate_audio_upload(corrupted)


def test_validate_payload_size_limit_raises() -> None:
    wav_bytes = _create_synthetic_wav(duration_sec=0.1, sample_rate=16000)
    # Set limit below size
    with pytest.raises(Unprocessable, match="exceeds maximum allowed"):
        validate_audio_upload(wav_bytes, max_size_bytes=len(wav_bytes) - 1)


def test_validate_duration_limit_raises() -> None:
    # 200 seconds of audio exceeds 180s limit
    # We can mock or build a minimal buffer with duration > 180s
    wav_bytes = _create_synthetic_wav(duration_sec=185.0, sample_rate=8000)
    with pytest.raises(Unprocessable, match="exceeds maximum allowed"):
        validate_audio_upload(wav_bytes, max_duration_seconds=180.0)
