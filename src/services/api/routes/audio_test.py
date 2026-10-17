"""Developer audio testing and verification endpoints."""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Request, status
from scipy.io import wavfile
from starlette.datastructures import UploadFile as StarletteUploadFile

from src.lib.audio.transcription import transcribe_polyphonic_wav
from src.lib.audio.voicing import cluster_chords_from_notes
from src.lib.exception import Unprocessable

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audio", tags=["Audio Developer Testing"])


@router.post("/test-transcribe", status_code=status.HTTP_200_OK)
async def test_transcribe(request: Request) -> dict[str, Any]:
    """Developer test endpoint to transcribe WAV audio without authentication."""
    content_type = request.headers.get("content-type", "").lower()
    if "multipart/form-data" not in content_type:
        msg = "Content-Type must be multipart/form-data"
        raise Unprocessable(msg)

    form = await request.form()
    uploaded_file = form.get("file") or form.get("audio_file")
    if not isinstance(uploaded_file, StarletteUploadFile):
        msg = "Missing audio file ('file' or 'audio_file') in multipart form"
        raise Unprocessable(msg)

    content = await uploaded_file.read()
    if not content:
        msg = "Uploaded audio file is empty"
        raise Unprocessable(msg)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        tmp_path.write_bytes(content)

    try:
        duration_seconds = 0.0
        try:
            sample_rate, data = wavfile.read(str(tmp_path))
            duration_seconds = round(float(len(data) / sample_rate), 3)
        except (ValueError, OSError) as exc:
            logger.debug("Failed reading WAV sample rate: %s", exc)

        notes = transcribe_polyphonic_wav(tmp_path)
        chords = cluster_chords_from_notes(notes)

        if duration_seconds == 0.0 and notes:
            max_end = max(float(n.get("end_time", 0.0)) for n in notes)
            duration_seconds = round(max_end, 3)

        return {
            "notes": notes,
            "chords": chords,
            "duration_seconds": duration_seconds,
        }
    finally:
        if tmp_path.exists():
            tmp_path.unlink()
