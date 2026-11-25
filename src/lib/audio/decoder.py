"""Deep module for polyphonic audio decoding and clustering with zero retention."""

from __future__ import annotations

import logging
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import anyio
from src.lib.audio.transcription import async_transcribe_polyphonic_wav
from src.lib.audio.validation import (
    DEFAULT_MAX_AUDIO_DURATION_SECONDS,
    DEFAULT_MAX_AUDIO_SIZE_BYTES,
    validate_audio_upload,
)
from src.lib.audio.voicing import cluster_chords_from_notes
from src.lib.exception import PayloadTooLarge, Unprocessable
from src.lib.rate_limit import ml_concurrency_limiter

logger = logging.getLogger(__name__)

_WAV_HEADER_MIN_BYTES = 12
_WAV_BODY_MIN_BYTES = 44
_FFMPEG_TIMEOUT_SECONDS = 15
_MAX_FFMPEG_DURATION_SECONDS = int(DEFAULT_MAX_AUDIO_DURATION_SECONDS)


@dataclass(frozen=True, slots=True)
class DecodedAudioTake:
    """Immutable result of decoding an acoustic audio buffer."""

    notes: list[dict[str, Any]]
    chords: list[dict[str, Any]]
    duration_seconds: float
    sample_rate: int
    channels: int


def _safe_unlink(path: Path | None) -> None:
    if path is not None and path.exists():
        try:
            path.unlink()
        except OSError as exc:
            logger.warning("Failed to unlink ephemeral audio file %s: %s", path, exc)


def _write_temp_wav(wav_bytes: bytes) -> Path:
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        tmp_path.write_bytes(wav_bytes)
    return tmp_path


class PolyphonicAudioDecoder:
    """Encapsulates audio validation, neural transcription, and voicing clustering.

    Enforces ADR-0001 (Zero Audio Retention): audio bytes are written exclusively to an
    ephemeral scratch file, transcribed via worker threadpool, and immediately unlinked.
    """

    @classmethod
    def _transcode_non_wav_if_needed(cls, audio_bytes: bytes) -> bytes:
        """Transcode non-RIFF/WAVE compressed audio via bounded ffmpeg."""
        if (
            len(audio_bytes) >= _WAV_HEADER_MIN_BYTES
            and audio_bytes[:4] == b"RIFF"
            and audio_bytes[8:12] == b"WAVE"
        ):
            return audio_bytes

        if len(audio_bytes) > DEFAULT_MAX_AUDIO_SIZE_BYTES:
            msg = (
                f"Audio payload size ({len(audio_bytes)} bytes) exceeds maximum "
                f"allowed ({DEFAULT_MAX_AUDIO_SIZE_BYTES} bytes)"
            )
            raise PayloadTooLarge(msg)

        out_path: Path | None = None
        with tempfile.NamedTemporaryFile(suffix=".raw_audio", delete=False) as in_tmp:
            in_path = Path(in_tmp.name)
            in_path.write_bytes(audio_bytes)

        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out_tmp:
                out_path = Path(out_tmp.name)

            cmd = [
                "ffmpeg",
                "-y",
                "-i",
                str(in_path),
                "-t",
                str(_MAX_FFMPEG_DURATION_SECONDS),
                "-fs",
                str(DEFAULT_MAX_AUDIO_SIZE_BYTES),
                "-ar",
                "22050",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(out_path),
            ]
            res = subprocess.run(  # noqa: S603
                cmd,
                capture_output=True,
                timeout=_FFMPEG_TIMEOUT_SECONDS,
                check=False,
            )
            if (
                res.returncode == 0
                and out_path.exists()
                and out_path.stat().st_size > _WAV_BODY_MIN_BYTES
            ):
                return out_path.read_bytes()
        except (OSError, subprocess.SubprocessError) as exc:
            logger.debug("Automatic audio transcoding non-fatal fallback: %s", exc)
        finally:
            _safe_unlink(in_path)
            _safe_unlink(out_path)

        return audio_bytes

    @classmethod
    async def decode(cls, audio_bytes: bytes) -> DecodedAudioTake:
        """Validate audio bytes, transcribe note events, and cluster into chords.

        Args:
            audio_bytes: Raw audio byte buffer (WAV or supported compressed format).

        Returns:
            DecodedAudioTake with notes, chords, and audio format metadata.

        Raises:
            PayloadTooLarge: If the raw buffer exceeds the 15 MB upload ceiling.
            Unprocessable: If the audio bytes fail validation or duration limits.

        """
        if not audio_bytes:
            msg = "Audio payload is empty"
            raise Unprocessable(msg)

        if len(audio_bytes) > DEFAULT_MAX_AUDIO_SIZE_BYTES:
            msg = (
                f"Audio payload size ({len(audio_bytes)} bytes) exceeds maximum "
                f"allowed ({DEFAULT_MAX_AUDIO_SIZE_BYTES} bytes)"
            )
            raise PayloadTooLarge(msg)

        async with ml_concurrency_limiter():
            wav_bytes = await anyio.to_thread.run_sync(
                cls._transcode_non_wav_if_needed,
                audio_bytes,
            )
            validation_result = validate_audio_upload(wav_bytes)

            tmp_path = await anyio.to_thread.run_sync(_write_temp_wav, wav_bytes)
            try:
                notes = await async_transcribe_polyphonic_wav(tmp_path)
                chords = cluster_chords_from_notes(notes)
                return DecodedAudioTake(
                    notes=notes,
                    chords=chords,
                    duration_seconds=validation_result.duration_seconds,
                    sample_rate=validation_result.sample_rate,
                    channels=validation_result.channels,
                )
            finally:
                await anyio.to_thread.run_sync(_safe_unlink, tmp_path)

    @classmethod
    async def decode_chords(cls, audio_bytes: bytes) -> list[dict[str, Any]]:
        """Return just the clustered played chords."""
        decoded = await cls.decode(audio_bytes)
        return decoded.chords
