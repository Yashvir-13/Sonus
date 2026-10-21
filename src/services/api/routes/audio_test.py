"""Developer audio testing and verification endpoints."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Request, status

from starlette.datastructures import UploadFile as StarletteUploadFile

from src.lib.audio.decoder import PolyphonicAudioDecoder
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

    decoded = await PolyphonicAudioDecoder.decode(content)

    return {
        "notes": decoded.notes,
        "chords": decoded.chords,
        "duration_seconds": decoded.duration_seconds,
        "sample_rate": decoded.sample_rate,
        "channels": decoded.channels,
    }

