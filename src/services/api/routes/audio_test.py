"""Developer audio testing and verification endpoints."""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Request, status
from starlette.datastructures import UploadFile as StarletteUploadFile

from src.lib.audio.transcription import async_transcribe_polyphonic_wav
from src.lib.audio.validation import validate_audio_upload
from src.lib.audio.voicing import cluster_chords_from_notes
from src.lib.exception import Unprocessable

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audio", tags=["Audio Developer Testing"])


@router.post("/test-transcribe", status_code=status.HTTP_200_OK)
async def transcribe_test_audio(request: Request) -> dict[str, Any]:
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

    validation_result = validate_audio_upload(content)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        tmp_path.write_bytes(content)

    try:
        notes = await async_transcribe_polyphonic_wav(tmp_path)
        chords = cluster_chords_from_notes(notes)

        return {
            "notes": notes,
            "chords": chords,
            "duration_seconds": validation_result.duration_seconds,
            "sample_rate": validation_result.sample_rate,
            "channels": validation_result.channels,
        }
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass
