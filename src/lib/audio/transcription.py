"""Polyphonic WAV transcription using cached Basic Pitch ONNX or STFT fallback."""

from __future__ import annotations

import contextlib
import logging
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Any

import anyio
import numpy as np
from scipy.io import wavfile

logger = logging.getLogger(__name__)

_MIN_AUDIO_DURATION_SEC = 0.1
_FRAME_SIZE = 2048
_HOP_SIZE = 1024
_SPEC_FLOOR = 1e-4
_PEAK_THRESHOLD_RATIO = 0.08
_MIN_MUSICAL_FREQ_HZ = 65.4
_MAX_MUSICAL_FREQ_HZ = 1046.5
_HARMONIC_TOLERANCE = 0.04


@lru_cache(maxsize=1)
def get_basic_pitch_model() -> Any:  # noqa: ANN401
    """Load and cache the Basic Pitch ONNX inference model once per process."""
    from basic_pitch import ICASSP_2022_MODEL_PATH  # noqa: PLC0415
    from basic_pitch.inference import Model  # noqa: PLC0415

    return Model(ICASSP_2022_MODEL_PATH)


def warmup_transcription_engine() -> bool:
    """Preload and warm up neural transcription weights to reduce latency."""
    logger.info("Initializing and warming up polyphonic transcription engine...")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        sample_rate = 22050
        silence = np.zeros(int(sample_rate * 0.05), dtype=np.float32)
        wavfile.write(str(tmp_path), sample_rate, silence)

    try:
        transcribe_polyphonic_wav(tmp_path)
        logger.info("Transcription engine warmed up successfully.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Transcription engine warmup failed (non-fatal): %s", exc)
        return False
    else:
        return True
    finally:
        if tmp_path.exists():
            with contextlib.suppress(OSError):
                tmp_path.unlink()


async def async_transcribe_polyphonic_wav(wav_path: str | Path) -> list[dict[str, Any]]:
    """Asynchronously transcribe polyphonic audio via worker threadpool."""
    return await anyio.to_thread.run_sync(transcribe_polyphonic_wav, Path(wav_path))


def _extract_frame_fundamentals(
    spec: np.ndarray,
    fft_freqs: np.ndarray,
    max_spec: float,
) -> list[tuple[int, float, float]]:
    raw_peaks = np.where((spec[1:-1] > spec[:-2]) & (spec[1:-1] > spec[2:]))[0] + 1
    peaks = [
        int(p)
        for p in raw_peaks
        if spec[p] > _PEAK_THRESHOLD_RATIO * max_spec
        and _MIN_MUSICAL_FREQ_HZ <= fft_freqs[p] <= _MAX_MUSICAL_FREQ_HZ
    ]
    peaks.sort(key=lambda p: float(spec[p]), reverse=True)

    fundamentals: list[tuple[int, float, float]] = []
    suppressed: set[int] = set()
    for p in peaks:
        if p in suppressed:
            continue
        freq = float(fft_freqs[p])
        fundamentals.append((p, freq, float(spec[p])))
        for other in peaks:
            if other != p and other not in suppressed:
                other_freq = float(fft_freqs[other])
                for harmonic in (2, 3, 4, 5):
                    target = harmonic * freq
                    if abs(other_freq - target) <= _HARMONIC_TOLERANCE * target:
                        suppressed.add(other)
                        break
    return fundamentals


def _transcribe_with_stft_fallback(path: Path) -> list[dict[str, Any]]:
    try:
        sample_rate, data = wavfile.read(str(path))
    except Exception as exc:
        msg = f"Failed to read WAV file: {exc}"
        raise ValueError(msg) from exc

    if data.ndim > 1:
        data = data.mean(axis=1)
    if data.dtype != np.float32:
        max_val = (
            np.iinfo(data.dtype).max
            if np.issubdtype(data.dtype, np.integer)
            else 1.0
        )
        data = (data / max_val).astype(np.float32)

    if (len(data) / sample_rate) < _MIN_AUDIO_DURATION_SEC:
        return []

    num_frames = (len(data) - _FRAME_SIZE) // _HOP_SIZE
    detected_notes: list[dict[str, Any]] = []
    active_notes: dict[int, dict[str, Any]] = {}
    fft_freqs = np.fft.rfftfreq(_FRAME_SIZE, d=1.0 / sample_rate)

    for frame_idx in range(max(0, num_frames)):
        start_samp = frame_idx * _HOP_SIZE
        frame = data[start_samp : start_samp + _FRAME_SIZE] * np.hanning(_FRAME_SIZE)
        spec = np.abs(np.fft.rfft(frame))

        time_sec = start_samp / sample_rate
        max_spec = float(np.max(spec))
        if max_spec < _SPEC_FLOOR:
            continue

        fundamentals = _extract_frame_fundamentals(spec, fft_freqs, max_spec)
        frame_pitches: set[int] = set()
        for _, freq, amp_val in fundamentals:
            midi_pitch = round(69 + 12 * np.log2(freq / 440.0))
            amp = float(amp_val / (max_spec + 1e-6))
            frame_pitches.add(midi_pitch)

            if midi_pitch in active_notes:
                active_notes[midi_pitch]["end_time"] = round(time_sec + 0.25, 3)
                active_notes[midi_pitch]["amplitude"] = max(
                    active_notes[midi_pitch]["amplitude"],
                    round(amp, 2),
                )
            else:
                active_notes[midi_pitch] = {
                    "pitch": midi_pitch,
                    "start_time": round(time_sec, 3),
                    "end_time": round(time_sec + 0.25, 3),
                    "amplitude": round(amp, 2),
                }

        expired = [
            p
            for p, note in active_notes.items()
            if p not in frame_pitches and time_sec > note["end_time"]
        ]
        detected_notes.extend(active_notes.pop(p) for p in expired)

    detected_notes.extend(active_notes.values())
    detected_notes.sort(key=lambda n: (float(n["start_time"]), int(n["pitch"])))
    return detected_notes


def transcribe_polyphonic_wav(wav_path: str | Path) -> list[dict[str, Any]]:
    """Transcribe polyphonic audio to discrete MIDI note events.

    Uses cached Spotify Basic Pitch ONNX model if available, falling back to STFT.
    """
    path = Path(wav_path)
    if not path.exists():
        msg = f"Audio file not found: {path}"
        raise FileNotFoundError(msg)

    try:
        from basic_pitch.inference import predict  # noqa: PLC0415

        model = get_basic_pitch_model()
        _, _, note_events = predict(str(path), model_or_model_path=model)
    except ImportError:
        logger.info("basic-pitch not available; using spectral STFT fallback.")
        return _transcribe_with_stft_fallback(path)
    else:
        return [
            {
                "pitch": round(pitch),
                "start_time": float(start),
                "end_time": float(end),
                "amplitude": float(amp),
            }
            for start, end, pitch, amp, _ in note_events
        ]
