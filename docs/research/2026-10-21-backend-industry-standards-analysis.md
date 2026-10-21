# Backend Industry Standards & Architectural Best Practices Analysis

**Project**: Sonus (Adaptive Music Practice System)  
**Date**: 2026-10-21  
**Scope**: FastAPI, Polyphonic MIR Audio Pipeline, Neon PostgreSQL, Observability, and Reliability

---

## 1. Executive Summary

This document evaluates the current backend architecture against modern production industry standards across four engineering domains:
1. **Audio & MIR (Music Information Retrieval) Pipeline Orchestration**
2. **FastAPI & Async Architecture (Concurrency, I/O Bound vs. CPU Bound Separation)**
3. **API Reliability, Security, & RFC Standards**
4. **Observability, Tracing, & Database Connection Life-cycle**

---

## 2. Literature & Primary Source Review

### 2.1 Spotify Basic Pitch & Polyphonic Audio ML Inference
- **Source**: Bittner, R. M., Bosch, J. J., Rubinstein, D., Meseguer-Brocal, G., & Ewert, S. (2022). *Basic Pitch: A Lightweight, Fast, and Accurate Audio-to-MIDI Converter*. ICASSP / Spotify Audio Research.
- **Key Finding**: Basic Pitch uses a multi-task convolutional network with harmonic stacking. While lightweight compared to full Transformers (e.g. Hawthorne et al., 2021), inference on 15–30 second polyphonic audio still consumes 500ms–2000ms of intensive CPU float computations.
- **Industry Standard**: ML model inference must **never block the async event loop** of an HTTP web server (`uvicorn`/`asyncio`). Running inference directly in an `async def` route without threadpool delegation (`starlette.concurrency.run_in_threadpool` or a task queue like Celery/Arq) blocks concurrent HTTP requests across the entire process.

### 2.2 Automatic Music Performance Assessment (AMPA) Alignment
- **Source**: Román, M. A., Pertusa, A., & Calvo-Zaragoza, J. (2019). *A holistic approach to polyphonic music transcription with neural networks*. ISMIR / Pattern Recognition.
- **Key Finding**: In evaluation of polyphonic instrument practice (piano/guitar), temporal onset error $\le \pm 50\text{ ms}$ and intonation $\le 50\text{ cents}$ define human musical tolerance. Alignment engines require strict monotonic sequence dynamic programming with harmonic penalty matrices.
- **Industry Standard**: Decouple raw note extraction from musical score alignment; calibrate confidence thresholds with test benchmarks against synthetic ground truth.

---

## 3. Gap Analysis of Current Backend Implementation

| Dimension | Current Implementation | Production Industry Standard | Priority |
| :--- | :--- | :--- | :--- |
| **Model Lifecycle** | Model is loaded on-demand during the first inference request. | **Startup Lifespan Warmup**: Preload ONNX session during FastAPI `lifespan` with dummy 0.1s buffer to eliminate cold-start spikes. | High |
| **Concurrency & Workers** | `submit_take` executes synchronous audio reading & transcription inside route execution. | **Job Queue / 202 Accepted**: Enqueue audio analysis jobs via `BackgroundTasks` or async worker; return `202 Accepted` with a job status polling/WebSocket endpoint. | High |
| **Request Tracing** | Standard python `logging` with basic formatting. | **Correlation IDs (`X-Request-ID`)**: Injected via ASGI middleware into contextvars, logs, and propagated into Sentry transactions. | High |
| **API Error Format** | Custom JSON error payloads (`{"detail": ...}`). | **RFC 9457 Problem Details**: Standardized error schema (`type`, `title`, `status`, `detail`, `instance`). | Medium |
| **Audio File Hardening** | Relies on client `Content-Type` header and file extension. | **Magic Byte Inspection**: Validate RIFF/WAV headers in memory before saving to disk; enforce max payload byte limit (`Content-Length` clamp). | Medium |
| **Caching Layer** | Every `/api/exercises` request hits PostgreSQL. | **Cache-Aside / HTTP ETag**: Cache static exercise progressions in-memory (`aiocache` or LRU) with `ETag` / `If-None-Match` 304 response. | Medium |
| **Idempotency** | No idempotency header check on take submissions. | **`Idempotency-Key`**: Prevent duplicate take submissions on network retries. | Low / Medium |

---

## 4. Proposed Architectural Enhancements

### Pillar 1: High-Performance Audio Dispatch (Decoupled Concurrency)
- Implement FastAPI `lifespan` event handler to load the Basic Pitch ONNX runtime model and perform an initial dummy warmup pass.
- Offload `transcribe_polyphonic_wav` and `cluster_chords_from_notes` to a dedicated `ThreadPoolExecutor` or `anyio.to_thread.run_sync` so the event loop remains responsive.
- Formalize async job tracking for takes: return `202 Accepted` with `Location: /api/sessions/{id}/takes/{take_id}` when async processing is chosen.

### Pillar 2: Reliability & Error Standardization (RFC 9457)
- Standardize error handling to RFC 9457:
  ```json
  {
    "type": "https://errors.sonus.dev/audio/invalid-format",
    "title": "Invalid Audio Format",
    "status": 422,
    "detail": "The uploaded file is not a valid 16-bit mono PCM WAV file.",
    "instance": "/api/sessions/sess_123/take"
  }
  ```
- Implement magic-byte validation (`b"RIFF"....b"WAVE"`) ensuring corrupted uploads or malicious files fail instantly before invoking ML engines.

### Pillar 3: Telemetry, Observability & Structured Logging
- Implement an ASGI Middleware for `X-Request-ID` generation and contextvar tracking.
- Output structured JSON logs in production (`timestamp`, `level`, `request_id`, `route`, `latency_ms`).
- Instrument audio transcription and alignment steps with distinct Sentry spans for granular performance monitoring.

### Pillar 4: Query Optimization & Caching
- Implement in-memory caching with TTL and ETag support for the exercise catalog (`/api/exercises`).
- Add database indexes for frequently filtered combinations (`instrument`, `difficulty`).
