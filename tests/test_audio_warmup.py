from __future__ import annotations

import io
from pathlib import Path
import numpy as np
import pytest
from scipy.io import wavfile

from src.lib.audio.transcription import (
    async_transcribe_polyphonic_wav,
    warmup_transcription_engine,
)


def _make_temp_wav(tmp_path: Path, duration_sec: float = 0.2) -> Path:
    sample_rate = 22050
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
    # 440 Hz pure tone (MIDI 69 - A4)
    samples = 0.5 * np.sin(2 * np.pi * 440.0 * t)
    wav_file = tmp_path / "test_tone.wav"
    wavfile.write(str(wav_file), sample_rate, samples.astype(np.float32))
    return wav_file


def test_warmup_transcription_engine() -> None:
    # Warmup must execute and return without errors
    result = warmup_transcription_engine()
    assert result is True or result is None


@pytest.mark.anyio
async def test_async_transcribe_polyphonic_wav(tmp_path: Path) -> None:
    wav_file = _make_temp_wav(tmp_path, duration_sec=0.3)
    notes = await async_transcribe_polyphonic_wav(wav_file)
    assert isinstance(notes, list)
