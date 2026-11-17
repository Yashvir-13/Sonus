from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any

import anyio
import numpy as np
from scipy.io import wavfile

logger = logging.getLogger(__name__)


def warmup_transcription_engine() -> bool:
    """Preload and warm up neural transcription weights to eliminate cold-start latency."""
    logger.info("Initializing and warming up polyphonic transcription engine...")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        # 0.05s synthetic silence at 22050 Hz
        sample_rate = 22050
        silence = np.zeros(int(sample_rate * 0.05), dtype=np.float32)
        wavfile.write(str(tmp_path), sample_rate, silence)

    try:
        transcribe_polyphonic_wav(tmp_path)
        logger.info("Transcription engine warmed up successfully.")
        return True
    except Exception as exc:
        logger.warning("Transcription engine warmup failed (non-fatal): %s", exc)
        return False
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass


async def async_transcribe_polyphonic_wav(wav_path: str | Path) -> list[dict[str, Any]]:
    """Asynchronously transcribe polyphonic audio by offloading CPU computation to a threadpool."""
    return await anyio.to_thread.run_sync(transcribe_polyphonic_wav, Path(wav_path))



def transcribe_polyphonic_wav(wav_path: str | Path) -> list[dict[str, Any]]:
    """Transcribe polyphonic audio to discrete MIDI note events.

    Uses Spotify Basic Pitch model if available, falling back to STFT peak analysis.
    Returns:
        List of note events: [{"pitch": int, "start_time": float, "end_time": float, "amplitude": float}]
    """
    path = Path(wav_path)
    if not path.exists():
        raise FileNotFoundError(f"Audio file not found: {path}")

    # Attempt Spotify Basic Pitch inference if installed
    try:
        from basic_pitch.inference import predict

        _, _, note_events = predict(str(path))
        notes: list[dict[str, Any]] = []
        for start, end, pitch, amp, _ in note_events:
            notes.append({
                "pitch": int(round(pitch)),
                "start_time": float(start),
                "end_time": float(end),
                "amplitude": float(amp),
            })
        return notes
    except ImportError:
        logger.info("basic-pitch not available; using spectral STFT transcription fallback.")

    # Fallback: Read WAV and perform STFT harmonic peak extraction
    try:
        sample_rate, data = wavfile.read(str(path))
    except Exception as exc:
        raise ValueError(f"Failed to read WAV file: {exc}") from exc

    # Convert to mono float32
    if data.ndim > 1:
        data = data.mean(axis=1)
    if data.dtype != np.float32:
        max_val = np.iinfo(data.dtype).max if np.issubdtype(data.dtype, np.integer) else 1.0
        data = (data / max_val).astype(np.float32)

    total_duration = len(data) / sample_rate
    if total_duration < 0.1:
        return []

    # Frame-based FFT peak detection with harmonic overtone suppression and temporal note chaining
    frame_size = 2048
    hop_size = 1024
    num_frames = (len(data) - frame_size) // hop_size

    detected_notes: list[dict[str, Any]] = []
    active_notes: dict[int, dict[str, Any]] = {}
    fft_freqs = np.fft.rfftfreq(frame_size, d=1.0 / sample_rate)

    for frame_idx in range(max(0, num_frames)):
        start_samp = frame_idx * hop_size
        frame = data[start_samp : start_samp + frame_size] * np.hanning(frame_size)
        spec = np.abs(np.fft.rfft(frame))

        time_sec = start_samp / sample_rate
        max_spec = float(np.max(spec))
        if max_spec < 1e-4:
            continue

        # Detect frequency peaks above noise floor in musical frequency range (C2 to C6)
        raw_peaks = np.where((spec[1:-1] > spec[:-2]) & (spec[1:-1] > spec[2:]))[0] + 1
        peaks = [
            int(p)
            for p in raw_peaks
            if spec[p] > 0.08 * max_spec and 65.4 <= fft_freqs[p] <= 1046.5
        ]
        peaks.sort(key=lambda p: float(spec[p]), reverse=True)

        # Harmonic overtone suppression: prevent 2nd/3rd/4th harmonics from registering as discrete notes
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
                        if abs(other_freq - harmonic * freq) <= 0.04 * (harmonic * freq):
                            suppressed.add(other)
                            break

        frame_pitches: set[int] = set()
        for _, freq, amp_val in fundamentals:
            midi_pitch = int(round(69 + 12 * np.log2(freq / 440.0)))
            amp = float(amp_val / (max_spec + 1e-6))
            frame_pitches.add(midi_pitch)

            if midi_pitch in active_notes:
                active_notes[midi_pitch]["end_time"] = round(time_sec + 0.25, 3)
                active_notes[midi_pitch]["amplitude"] = max(
                    active_notes[midi_pitch]["amplitude"], round(amp, 2)
                )
            else:
                active_notes[midi_pitch] = {
                    "pitch": midi_pitch,
                    "start_time": round(time_sec, 3),
                    "end_time": round(time_sec + 0.25, 3),
                    "amplitude": round(amp, 2),
                }

        # Retire notes that are no longer sustained in current frame
        for p in list(active_notes.keys()):
            if p not in frame_pitches and time_sec > active_notes[p]["end_time"]:
                detected_notes.append(active_notes.pop(p))

    # Commit any notes still active at the end of the file
    detected_notes.extend(active_notes.values())
    detected_notes.sort(key=lambda n: (float(n["start_time"]), int(n["pitch"])))
    return detected_notes
