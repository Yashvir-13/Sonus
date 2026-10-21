"""Deep module for decoding and clustering polyphonic acoustic audio with zero retention."""

from __future__ import annotations

import logging
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from src.lib.audio.transcription import async_transcribe_polyphonic_wav
from src.lib.audio.validation import validate_audio_upload
from src.lib.audio.voicing import cluster_chords_from_notes

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class DecodedAudioTake:
    """Immutable result of decoding an acoustic audio buffer."""

    notes: list[dict[str, Any]]
    chords: list[dict[str, Any]]
    duration_seconds: float
    sample_rate: int
    channels: int


class PolyphonicAudioDecoder:
    """Encapsulates audio validation, neural multipitch transcription, and voicing clustering.

    Enforces ADR-0001 (Zero Audio Retention): audio bytes are written exclusively to an
    ephemeral scratch file, transcribed via worker threadpool, and immediately unlinked.
    """

    @classmethod
    def _transcode_non_wav_if_needed(cls, audio_bytes: bytes) -> bytes:
        """If audio_bytes do not have a standard RIFF/WAVE header, attempt transcoding via ffmpeg."""
        if len(audio_bytes) >= 12 and audio_bytes[:4] == b"RIFF" and audio_bytes[8:12] == b"WAVE":
            return audio_bytes

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
                "-ar",
                "22050",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(out_path),
            ]
            res = subprocess.run(cmd, capture_output=True, timeout=15)
            if res.returncode == 0 and out_path.exists() and out_path.stat().st_size > 44:
                return out_path.read_bytes()
        except Exception as exc:
            logger.debug("Automatic audio transcoding non-fatal fallback: %s", exc)
        finally:
            if in_path.exists():
                try:
                    in_path.unlink()
                except OSError:
                    pass
            if out_path and out_path.exists():
                try:
                    out_path.unlink()
                except OSError:
                    pass

        return audio_bytes


    @classmethod
    async def decode(cls, audio_bytes: bytes) -> DecodedAudioTake:
        """Validate audio bytes, transcribe note events, cluster into chords, and clean up temporary storage.

        Transparently transcodes compressed audio formats (e.g. M4A, MP3, AAC, OGG) to 16-bit mono WAV.

        Args:
            audio_bytes: Raw audio byte buffer (WAV or supported compressed format).

        Returns:
            DecodedAudioTake with notes, chords, and audio format metadata.

        Raises:
            Unprocessable: If the audio bytes fail validation, duration or size limits.
        """
        wav_bytes = cls._transcode_non_wav_if_needed(audio_bytes)
        validation_result = validate_audio_upload(wav_bytes)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = Path(tmp.name)
            tmp_path.write_bytes(wav_bytes)

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
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except OSError as exc:
                    logger.warning("Failed to unlink ephemeral audio file %s: %s", tmp_path, exc)

    @classmethod
    async def decode_chords(cls, audio_bytes: bytes) -> list[dict[str, Any]]:
        """Convenience method returning just the clustered played chords."""
        decoded = await cls.decode(audio_bytes)
        return decoded.chords
