# Architecture Specification: Polyphonic Adaptive Music Practice System (Piano & Guitar)

**Date**: 2026-10-13  
**Status**: Approved Design  
**Target Domain**: Polyphonic chord practice for Piano and Guitar with longitudinal habit tracking  

---

## 1. Executive Summary & Purpose

The Adaptive Musical Practice System is an intelligent practice companion for polyphonic instruments (Piano and Guitar). Rather than acting merely as a static tuner that flags immediate errors, the system answers two fundamental questions:
1. *What keeps going wrong across multiple sessions, and under what specific conditions (e.g., tempo, chord transitions, finger voicings)?*
2. *What targeted intervention drill should the player practice next to measurably fix the problem?*

All core technologies, libraries, models, and runtimes used in this architecture leverage **100% free and open-source software** and verified developer grants from the **GitHub Student Developer Pack**:
- **Database & Storage**: **Neon Serverless PostgreSQL** (compute autoscaling, PgBouncer pooling, SSL enforcement, and instant database branching).
- **Error Tracking & Observability**: **Sentry** (free student tier with 500k monthly events, tracing real-time Web Audio API exceptions, AudioWorklet message drops, and FastAPI transcription latency).
- **SecretOps & Configuration**: **Doppler** (centralized secret management replacing unencrypted `.env` files and eliminating configuration drift).
- **Authentication**: **Clerk** (free student/developer tier for React frontend and FastAPI backend session verification).
- **CI/CD & Code Quality**: **GitHub Actions & GitHub Pro** (automated testing, strict Mypy/TypeScript type checking, and ephemeral PR branch testing).
- **Security & Dependency Auditing**: **Snyk** (continuous vulnerability scanning across npm and pip manifests).
- **API Testing & Contracts**: **Postman** (API documentation, collection tests, and mock verification).
- **Audio & ML**: **Spotify Basic Pitch** (neural multipitch transcription, Apache 2.0), **Web Audio API** (in-browser AudioWorklet chromagram), **Tonal.js** (open-source music theory), and **Librosa / Scipy**.

---

## 2. Processing Boundaries (Frontend vs. Backend)

To guarantee sub-30ms visual feedback while enabling deep per-note chord voicing diagnostics, the system adopts a **Hybrid Processing Pipeline**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. REAL-TIME CLIENT (Browser: Vite + React + TypeScript)                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Microphone Capture: navigator.mediaDevices.getUserMedia (clean audio, no AGC)        │
│ • AudioWorklet: High-performance PCM frame streaming to Web Worker                     │
│ • Chromagram Web Worker: Computes 12-semitone pitch class energy profile (C, C# ... B)  │
│ • Live Chord Identification: Tonal.js matches peak chroma vectors to chord qualities   │
│   (e.g., C Major, Am7, G7, F#dim, Dsus4)                                               │
│ • Live HUD Feed: Instant target chord match and early/late timing indicator (30 Hz)    │
│ • Take Recorder: Collects 16-bit mono WAV into memory and posts on take complete       │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ POST /api/sessions/{id}/take (WAV file)
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│ 2. INGESTION & DISPATCH (FastAPI + Python 3.12)                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Validates WAV header and enforces boundaries (mono, 44.1 kHz, duration ≤ 3 min)      │
│ • Enqueues background analysis job; responds with 202 Accepted and tracking ID         │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Asynchronous worker dispatch
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│ 3. DEEP POLYPHONIC ANALYSIS (Python Worker: Spotify Basic Pitch + Librosa)             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Multipitch Extraction: Runs Spotify Basic Pitch (neural polyphonic transcription)    │
│   Produces discrete note events: [midi_pitch, start_time, end_time, amplitude]         │
│ • Chord Strike/Strum Slicing: Groups note onsets within 35–60 ms temporal windows      │
│ • Voicing Breakdown: Compares detected MIDI notes against expected chord voicing:      │
│   - Guitar: Evaluates string-by-string resonance, detecting muted or buzzing strings   │
│   - Piano: Evaluates simultaneous strike of root, 3rd, 5th, and extensions (7th/9th)   │
│ • Error-Tolerant Score Alignment: Weighted Dynamic Programming maps played chords to   │
│   exercise reference progression, identifying dropped, substituted, or extra strums    │
│ • Per-Chord Metrics: Timing error (ms), voicing completeness (%), transition latency   │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Persists to SQLModel / PostgreSQL
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│ 4. LONGITUDINAL PROFILE & ADAPTIVE INTERVENTIONS                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Pattern Engine: Detects persistent habits across >= 3 sessions                       │
│ • Intervention Library: Recommends deterministic drills (e.g., 2-chord isolation loop) │
│ • Grounded Reporting: Generates verified fact bundles and readable markdown summaries  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Audio & Music Theory Pipeline Details

### 3.1 Client-Side Real-Time Chromagram
- **Capture**: Mono 44.1 kHz input with browser audio constraints: `{ echoCancellation: false, noiseSuppression: false, autoGainControl: false }`.
- **Frame Buffer**: 2048 samples (~46 ms) with 50% overlap.
- **Pitch Class Folding**: Bins frequency bins into 12 semitone chroma vectors.
- **Tonal.js Chord Detection**: Matches active semitones against chord dictionaries. Identifies root note and bass inversion (e.g. $C/E$).

### 3.2 Server-Side Polyphonic Analysis (`basic-pitch`)
- **Model**: Spotify Basic Pitch (open-source Apache 2.0).
- **Execution**: Runs in Python CPU runtime using ONNX / TensorFlow Lite.
- **Output**: Discrete note events with onset/offset timestamps and MIDI pitches.
- **Clustering**: Groups contiguous note attacks into chord events.

### 3.3 Score Alignment & Representation
Exercises are represented as structured immutable JSON objects:
```json
{
  "id": "ex_pop_chords_01",
  "name": "Standard Pop Cadence (I - V - vi - IV)",
  "instrument": "guitar",
  "tempo_bpm": 80,
  "chords": [
    { "name": "C", "beat": 1, "duration_beats": 4, "expected_pitches": [48, 52, 55, 60, 64] },
    { "name": "G", "beat": 5, "duration_beats": 4, "expected_pitches": [43, 47, 50, 55, 59, 67] },
    { "name": "Am", "beat": 9, "duration_beats": 4, "expected_pitches": [45, 52, 57, 60, 64] },
    { "name": "F", "beat": 13, "duration_beats": 4, "expected_pitches": [41, 48, 53, 57, 60, 65] }
  ]
}
```
- **Weighted Dynamic Programming**: Aligns played chord sequence to reference sequence with customizable penalties:
  - *Harmonic Substitution Cost*: Small penalty for partial voicings (e.g. $C$ instead of $C\text{maj7}$); heavy penalty for wrong root or unrelated chord.
  - *Insertion/Deletion Cost*: Accounts for accidental extra strums or omitted chords without throwing off future alignment.

---

## 4. Backend Database Architecture & Data Models (PostgreSQL & Neon)

### 4.1 Neon Serverless PostgreSQL Infrastructure
The persistent store is standard **PostgreSQL 16+** provisioned via **Neon Serverless** through the GitHub Student Developer Pack:
- **Connection Modes**:
  - **FastAPI Async Engine**: Uses `postgresql+asyncpg` with `ssl=require`. Connects to the Neon pooled endpoint (`ep-*-pooler.<region>.aws.neon.tech:5432`) running PgBouncer in transaction mode with disabled prepared statement caches (`statement_cache_size=0`) and `NullPool`.
  - **Alembic Sync Engine**: Uses `postgresql+psycopg2` with `sslmode=require` for autogenerated migrations (`pnpm run db:make` and `pnpm run db:upgrade`).
- **Database Branching**:
  - Leverages Neon's instant Copy-on-Write (CoW) branching for development, staging, and ephemeral integration testing without cross-environment state pollution.
- **Identity & Foreign Keys**:
  - Primary key for `User` is the Clerk user ID (JWT `sub`), binding frontend Clerk sessions directly to PostgreSQL rows.

### 4.2 SQLModel Table Definitions

Models are placed in `src/models/` following `AGENTS.md` conventions:

```python
from __future__ import annotations
from datetime import datetime
from sqlmodel import Field, SQLModel
from src.models.base import Base
from src.models.common import TimestampMixin

class Exercise(SQLModel, Base, table=True):
    __tablename__ = "exercises"
    id: str = Field(primary_key=True, max_length=100)
    title: str = Field(max_length=200)
    instrument: str = Field(max_length=50) # "piano" | "guitar"
    tempo_bpm: int
    difficulty: int
    progression_json: str # JSON list of expected chords & notes

class PracticeSession(TimestampMixin, Base, table=True):
    __tablename__ = "practice_sessions"
    id: str = Field(primary_key=True, max_length=100)
    user_id: str = Field(foreign_key="users.id", index=True, max_length=255)
    exercise_id: str = Field(foreign_key="exercises.id", index=True, max_length=100)
    tempo_bpm: int
    state: str = Field(default="recording", max_length=50) # "recording" | "analysing" | "completed" | "failed"
    overall_accuracy: float | None = None
    avg_timing_error_ms: float | None = None
    voicing_score: float | None = None

class SessionChordMetric(SQLModel, Base, table=True):
    __tablename__ = "session_chord_metrics"
    id: str = Field(primary_key=True, max_length=100)
    session_id: str = Field(foreign_key="practice_sessions.id", index=True, max_length=100)
    chord_index: int
    expected_chord: str = Field(max_length=50)
    detected_chord: str = Field(max_length=50)
    is_matched: bool
    onset_error_ms: float
    voicing_completeness: float
    missed_notes_json: str
    extra_notes_json: str

class HabitPattern(TimestampMixin, Base, table=True):
    __tablename__ = "habit_patterns"
    id: str = Field(primary_key=True, max_length=100)
    user_id: str = Field(foreign_key="users.id", index=True, max_length=255)
    pattern_type: str = Field(max_length=50) # "transition_lag" | "tempo_threshold" | "voicing_drop"
    trigger_context: str = Field(max_length=255) # e.g. "F -> G at >85 BPM"
    evidence_count: int
    status: str = Field(default="emerging", max_length=50) # "emerging" | "active" | "improving"

class AdaptiveIntervention(TimestampMixin, Base, table=True):
    __tablename__ = "adaptive_interventions"
    id: str = Field(primary_key=True, max_length=100)
    pattern_id: str = Field(foreign_key="habit_patterns.id", index=True, max_length=100)
    user_id: str = Field(foreign_key="users.id", index=True, max_length=255)
    drill_type: str = Field(max_length=50) # "isolation_loop" | "tempo_ladder" | "voicing_dissection"
    target_tempo: int
    target_repetitions: int
    completed: bool = Field(default=False)
    measured_improvement: float | None = None
```

---

## 5. Adaptive Habit & Intervention Engine

### 5.1 Pattern Recognition Gates
- **Transition Lag**: Flags when transition time between two specific chords exceeds $100\text{ ms}$ in $\ge 3$ distinct sessions.
- **Tempo Threshold**: Detects when chord accuracy drops $>20\%$ between two tempos (e.g. 75 BPM vs. 90 BPM).
- **Voicing Drop**: Detects recurring failure to sound specific chord voices (e.g., high string on guitar $D$ shape).

### 5.2 Deterministic Practice Drills
1. **Isolation Loop**: Generates a 2-chord loop focused solely on the troubled transition at $80\%$ tempo.
2. **Tempo Ladder**: Steps up BPM by $+4$ after 3 successful clean takes.
3. **Voicing Dissection**: Requires arpeggiated deliberate notes before strumming full chord.

---

## 6. Testing & Evaluation Strategy

1. **Pure Unit Tests**:
   - Chromagram calculation on synthetic audio tones.
   - `Tonal.js` chord template resolution.
   - Dynamic programming score alignment under missed, extra, and substituted chord scenarios.
   - In-memory SQLite / mock session tests for isolated, zero-latency unit testing of models.
2. **Database & Migration Verification**:
   - Alembic schema migrations autogenerated and verified against Neon PostgreSQL dev/test branch.
   - Verified async query execution with pooler configuration.
3. **Golden Audio Benchmarks**:
   - Fixed WAV recordings of acoustic guitar and piano chord progressions with pre-annotated ground truth.
   - Validates that `basic-pitch` extracts chord onsets within $\pm 40\text{ ms}$ and identifies correct chord quality $\ge 90\%$.
4. **API Integration Tests**:
   - Session lifecycle: create session $\rightarrow$ upload take $\rightarrow$ poll status $\rightarrow$ receive per-chord metrics $\rightarrow$ verify pattern extraction on Neon PostgreSQL.

---

## 7. GitHub Student Developer Pack Infrastructure & Operational Architecture

The system utilizes verified resources from the GitHub Student Developer Pack to achieve production-grade infrastructure without recurring cost:

| Functional Layer | Service / Tool | Student Pack Benefit | Project Application |
| :--- | :--- | :--- | :--- |
| **Relational Database** | **Neon Serverless PostgreSQL** | Free tier + autoscaling compute + branching | Primary SQLModel data store for exercises, sessions, metrics, habits, and drills. |
| **Application Observability** | **Sentry** | 500,000 free events/mo + performance tracing | Real-time monitoring of Web Audio worklets, mic latency, and backend ML inference exceptions. |
| **Secret Management** | **Doppler** | Free Team Subscription | Centralized SecretOps managing API keys, DB connection strings, and Clerk secrets without `.env` leaks. |
| **Authentication** | **Clerk** | Free developer tier | JWT session verification for React frontend and FastAPI backend (`ClerkIdentityDep`). |
| **CI/CD & Code Quality** | **GitHub Actions & Pro** | Free GitHub Pro + expanded runner minutes | Automated PR gating: Mypy/TS typechecks, Pytest suite, Vitest suite, and build validation. |
| **Security Auditing** | **Snyk** | Developer security platform | Continuous automated vulnerability scanning across npm and pip manifests. |
| **API Contract Testing** | **Postman** | Postman Student Program | Standardized collection for testing audio upload, status polling, and metrics retrieval. |
| **Hosting & Cloud Compute** | **Microsoft Azure / Heroku** | $100 Azure credit / $13/mo Heroku credit | Containerized FastAPI + Spotify Basic Pitch backend deployment. |
| **Domain & SSL** | **Name.com / .TECH** | Free 1-year custom domain + SSL certificate | Production landing and app domain (e.g. `sonus-music.tech`). |

### 7.1 Real-Time Audio & Backend Error Tracing (Sentry)
Audio processing in modern browsers encounters subtle client-side failure modes (e.g., sample rate mismatches, user denying microphone access, AudioWorklet thread suspension, or audio buffer under-runs).
- **Frontend SDK (`@sentry/react`)**: Initialized in `main.tsx`. Configured with breadcrumbs tracking AudioContext state changes, microphone permission status, and chroma buffer health.
- **Backend SDK (`sentry-sdk[fastapi]`)**: Configured with transaction tracing for WAV ingestion, Spotify Basic Pitch model inference latency, and sequence alignment execution times.

### 7.2 Multi-Environment Secret Management (Doppler)
To satisfy [`AGENTS.md`](file:///d:/Projects/adaptive-music-practice/AGENTS.md) Rule #6 (*"Never commit secrets"*), Doppler provides centralized SecretOps:
- Syncs environment variables to local development via `doppler run -- pnpm run dev`.
- Injects environment variables directly into GitHub Actions CI/CD workflows and deployment environments.
- Manages separate environments (`dev`, `stg`, `prd`) for Neon branch connection strings, Clerk publishable/secret keys, and Sentry DSNs.

### 7.3 Automated Continuous Integration (GitHub Actions)
A standardized `.github/workflows/ci.yml` pipeline runs on every push and pull request:
1. **Frontend Job**: `pnpm install`, `pnpm run lint`, `pnpm --filter web typecheck`, `pnpm --filter web test`, and `pnpm --filter web build`.
2. **Backend Job**: `uv pip install -r pyproject.toml`, `ruff check .`, `mypy --explicit-package-bases src`, and `pytest tests/ -v`.
3. **Security Job**: Snyk scan on dependencies to alert on emerging vulnerabilities before merge.

