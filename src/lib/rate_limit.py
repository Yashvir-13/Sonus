"""Rate limiting, bounded streaming upload reader, and ML concurrency guardrails."""

from __future__ import annotations

import math
import threading
import time
from collections import deque
from typing import TYPE_CHECKING

import anyio
from src.lib.audio.validation import DEFAULT_MAX_AUDIO_SIZE_BYTES
from src.lib.exception import PayloadTooLarge, TooManyRequests

if TYPE_CHECKING:
    from starlette.datastructures import UploadFile as StarletteUploadFile

DEFAULT_UPLOAD_CHUNK_SIZE = 64 * 1024  # 64 KiB
DEFAULT_MAX_CONCURRENT_ML_JOBS = 2
DEFAULT_MAX_MULTIPART_OVERHEAD_BYTES = 1024 * 1024  # 1 MiB for form metadata
DEFAULT_MAX_JSON_BODY_BYTES = 2 * 1024 * 1024  # 2 MiB
_MAX_TRACKED_BUCKETS = 1024

AUDIO_ML_LIMITER = anyio.CapacityLimiter(DEFAULT_MAX_CONCURRENT_ML_JOBS)


def ml_concurrency_limiter() -> anyio.CapacityLimiter:
    """Return the shared capacity limiter guarding CPU-bound audio ML tasks."""
    return AUDIO_ML_LIMITER


async def read_bounded_upload(
    upload: StarletteUploadFile,
    max_bytes: int = DEFAULT_MAX_AUDIO_SIZE_BYTES,
    chunk_size: int = DEFAULT_UPLOAD_CHUNK_SIZE,
) -> bytes:
    """Stream an uploaded file in chunks and abort with 413 if over ``max_bytes``."""
    declared_size = getattr(upload, "size", None)
    if isinstance(declared_size, int) and declared_size > max_bytes:
        msg = (
            f"Uploaded file size ({declared_size} bytes) exceeds maximum allowed "
            f"({max_bytes} bytes)"
        )
        raise PayloadTooLarge(msg)

    buffer = bytearray()
    while True:
        chunk = await upload.read(chunk_size)
        if not chunk:
            break
        if len(buffer) + len(chunk) > max_bytes:
            msg = f"Uploaded file exceeds maximum allowed size ({max_bytes} bytes)"
            raise PayloadTooLarge(msg)
        buffer.extend(chunk)

    return bytes(buffer)


class SlidingWindowRateLimiter:
    """Thread-safe in-memory per-key sliding-window rate limiter."""

    def __init__(self, max_requests: int, window_seconds: float) -> None:
        """Configure maximum allowed requests within ``window_seconds``."""
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._events: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> None:
        """Record an event for ``key`` or raise ``TooManyRequests`` when over quota."""
        now = time.monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            # Periodically prune stale keys to keep memory bounded
            if len(self._events) > _MAX_TRACKED_BUCKETS:
                stale = [k for k, q in self._events.items() if not q or q[-1] <= cutoff]
                for k in stale:
                    del self._events[k]

            timestamps = self._events.get(key)
            if timestamps is None:
                timestamps = deque()
                self._events[key] = timestamps

            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) >= self.max_requests:
                retry_after = math.ceil((timestamps[0] + self.window_seconds) - now)
                msg = (
                    f"Rate limit exceeded: max {self.max_requests} requests "
                    f"per {int(self.window_seconds)}s"
                )
                raise TooManyRequests(msg, retry_after_seconds=max(1, retry_after))

            timestamps.append(now)

    def reset(self) -> None:
        """Clear all tracked rate-limit buckets."""
        with self._lock:
            self._events.clear()


TAKE_RATE_LIMIT = SlidingWindowRateLimiter(max_requests=15, window_seconds=60.0)
COACHING_RATE_LIMIT = SlidingWindowRateLimiter(max_requests=20, window_seconds=60.0)
EXERCISE_CREATE_RATE_LIMIT = SlidingWindowRateLimiter(
    max_requests=10,
    window_seconds=60.0,
)
