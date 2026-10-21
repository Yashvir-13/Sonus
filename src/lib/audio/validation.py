"""Audio upload validation and security hardening."""

from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Any

from scipy.io import wavfile

from src.lib.exception import Unprocessable

DEFAULT_MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
DEFAULT_MAX_AUDIO_DURATION_SECONDS = 180.0  # 3 minutes


@dataclass(frozen=True, slots=True)
class AudioValidationResult:
    """Diagnostic properties of verified audio upload."""

    sample_rate: int
    channels: int
    duration_seconds: float
    num_samples: int


def validate_audio_upload(
    content: bytes,
    max_size_bytes: int = DEFAULT_MAX_AUDIO_SIZE_BYTES,
    max_duration_seconds: float = DEFAULT_MAX_AUDIO_DURATION_SECONDS,
) -> AudioValidationResult:
    """Validate raw audio bytes against production size, magic bytes, and duration limits.

    Raises:
        Unprocessable: If the payload is empty, corrupted, non-WAV, oversized, or exceeds duration caps.
    """
    if not content:
        raise Unprocessable("Audio payload is empty")

    if len(content) > max_size_bytes:
        raise Unprocessable(
            f"Audio payload size ({len(content)} bytes) exceeds maximum allowed ({max_size_bytes} bytes)"
        )

    # Magic byte inspection: RIFF ... WAVE
    if len(content) < 12 or content[:4] != b"RIFF" or content[8:12] != b"WAVE":
        raise Unprocessable("Invalid audio format: file must contain standard RIFF/WAVE header")

    try:
        sample_rate, data = wavfile.read(io.BytesIO(content))
    except Exception as exc:
        raise Unprocessable(f"Invalid or corrupted WAV audio content: {exc}") from exc

    if sample_rate <= 0:
        raise Unprocessable(f"Invalid sample rate detected: {sample_rate} Hz")

    num_samples = len(data)
    channels = 1 if data.ndim == 1 else data.shape[1]
    duration_seconds = round(float(num_samples / sample_rate), 3)

    if duration_seconds > max_duration_seconds:
        raise Unprocessable(
            f"Audio duration ({duration_seconds}s) exceeds maximum allowed ({max_duration_seconds}s)"
        )

    return AudioValidationResult(
        sample_rate=int(sample_rate),
        channels=int(channels),
        duration_seconds=duration_seconds,
        num_samples=num_samples,
    )
