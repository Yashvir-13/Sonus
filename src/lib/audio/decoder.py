"""Deep module for decoding and clustering polyphonic acoustic audio with zero retention."""

from __future__ import annotations

import logging
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
    async def decode(cls, audio_bytes: bytes) -> DecodedAudioTake:
        """Validate WAV bytes, transcribe note events, cluster into chords, and clean up temporary storage.

        Args:
            audio_bytes: Raw 16-bit mono WAV audio byte buffer.

        Returns:
            DecodedAudioTake with notes, chords, and audio format metadata.

        Raises:
            Unprocessable: If the audio bytes fail RIFF validation, duration or size limits.
        """
        validation_result = validate_audio_upload(audio_bytes)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = Path(tmp.name)
            tmp_path.write_bytes(audio_bytes)

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
