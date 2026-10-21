# Design Specification: Backend Production Hardening & Industry Standards

**Date**: 2026-10-21  
**Status**: Pending Review  
**Target Domain**: Production readiness, async concurrency, telemetry, error contracts, and audio validation

---

## 1. Context & Motivation

Sonus (Adaptive Musical Practice System) has a functional prototype backend implementing Spotify Basic Pitch transcription, sequence alignment, habit detection, and Gemini 1.5 Flash coaching. However, to meet industry standards for production web services handling audio ML workloads, the backend requires hardening in four key areas:
1. **Async Concurrency & Worker Offloading**: Basic Pitch ML inference is CPU-bound. Executing it directly in the HTTP request loop blocks the `asyncio` event loop for 500ms–2500ms per take.
2. **Model Lifespan & Cold-Start Elimination**: The first request currently pays a 5-8 second model load penalty. Pre-warming the model during server startup ensures deterministic sub-second responsiveness.
3. **Structured Telemetry & Correlation IDs**: Production distributed systems require end-to-end request tracing via `X-Request-ID` across logs, HTTP headers, and Sentry spans.
4. **Audio Ingestion Hardening & RFC 9457 Compliance**: Audio endpoints must strictly validate RIFF/WAVE magic bytes, clamp maximum payload size (15 MB), and return standard RFC 9457 Problem Details error schemas.

---

## 2. Architecture & Components

```
Client (HTTP Request with audio/wav)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Request ID & Telemetry Middleware                       │
│    • Ingests or generates X-Request-ID                     │
│    • Binds to ContextVar and Sentry Scope                  │
│    • Attaches X-Request-ID to HTTP Response headers         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Audio Ingestion Hardening (RFC 9457)                     │
│    • Enforces Content-Length limit (15 MB)                  │
│    • Validates RIFF/WAVE magic bytes                        │
│    • Verifies duration <= 180s                              │
│    • Raises ProblemDetailsException (RFC 9457) on failure   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Non-Blocking Audio Dispatcher (anyio.to_thread)          │
│    • Offloads Basic Pitch ONNX to threadpool                │
│    • Event loop remains 100% responsive for concurrent I/O  │
│    • Model already warmed up via FastAPI lifespan           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Take Evaluator & AI Coaching                             │
│    • Sequence alignment + habit pattern updates             │
│    • Grounded fact summary generation                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Designs

### 3.1 Startup Lifespan & Model Warmup
- **Location**: `src/lib/audio/transcription.py` and `src/services/api/app.py`
- **Function**: `warmup_transcription_engine() -> None`
- **Mechanism**:
  - Synthesize a 0.05-second silence WAV in-memory (`numpy.zeros(1102, dtype=np.float32)`).
  - Execute `transcribe_polyphonic_wav()` on the synthetic buffer during the FastAPI `@asynccontextmanager async def lifespan(app: FastAPI)` hook.
  - Logs startup duration and confirms ONNX inference engine is warm in memory.

### 3.2 Non-Blocking Threadpool Dispatch
- **Location**: `src/lib/audio/transcription.py`
- **Function**: `async def async_transcribe_polyphonic_wav(wav_path: str | Path) -> list[dict[str, Any]]`
- **Mechanism**:
  - Uses `anyio.to_thread.run_sync(transcribe_polyphonic_wav, wav_path)`.
  - Ensures routes like `POST /api/sessions/{id}/take` and `POST /api/audio/test-transcribe` never block concurrent connections.

### 3.3 Correlation ID & Structured Logging Middleware
- **Location**: `src/lib/fastapi/middleware/correlation.py`
- **Mechanism**:
  - Reads `request.headers.get("X-Request-ID")` or creates `req_{uuid4().hex[:12]}`.
  - Binds to `request_id_ctx: ContextVar[str]`.
  - Attaches `X-Request-ID` to response headers.
  - Adds `request_id` tag to Sentry scope if Sentry SDK is active.
  - Custom log filter injects `record.request_id = request_id_ctx.get("-")` for structured logs.

### 3.4 Audio Upload Hardening & Magic-Byte Validation
- **Location**: `src/lib/audio/validation.py`
- **Function**: `validate_audio_upload(content: bytes, max_size_bytes: int = 15 * 1024 * 1024) -> AudioValidationResult`
- **Checks**:
  - `len(content) > 0` and `len(content) <= max_size_bytes`.
  - Magic byte check: `content[:4] == b"RIFF"` and `content[8:12] == b"WAVE"`.
  - Parses sample rate and length via `scipy.io.wavfile.read` or `wave.open`.
  - Calculates duration: fails if duration > 180 seconds.
  - Returns `AudioValidationResult(sample_rate=..., duration_seconds=..., channels=...)`.

### 3.5 RFC 9457 Problem Details Error Formatting
- **Location**: `src/lib/exception.py` and `src/lib/fastapi/handlers.py`
- **Format**:
  ```json
  {
    "type": "https://sonus.dev/errors/invalid-audio-format",
    "title": "Unprocessable Audio",
    "status": 422,
    "detail": "File header does not match valid RIFF/WAVE PCM format.",
    "instance": "/api/sessions/sess_123/take",
    "request_id": "req_a1b2c3d4"
  }
  ```
- **Backward Compatibility**: Maintains `detail` field so existing frontend callers reading `error.detail` continue to work without breaking changes.

---

## 4. Verification & Testing Strategy

1. **Unit Tests**:
   - `tests/test_audio_validation.py`: Tests valid WAV, truncated WAV, non-WAV files (e.g. text/MP3 disguised as WAV), oversized files (>15MB), duration limits (>180s).
   - `tests/test_correlation_middleware.py`: Verifies `X-Request-ID` is echoed in responses, generated if missing, and preserved if supplied by client.
   - `tests/test_error_handling.py`: Tests RFC 9457 formatted error responses.
2. **Concurrency & Warmup Tests**:
   - `tests/test_audio_warmup.py`: Verifies `warmup_transcription_engine` runs cleanly in <1s on test startup.
   - `tests/test_async_transcription.py`: Verifies `async_transcribe_polyphonic_wav` executes asynchronously without blocking the event loop.
3. **Full Regression Suite**:
   - Run all 44 existing Python tests to ensure zero regressions across models, sessions, and evaluation engines.
