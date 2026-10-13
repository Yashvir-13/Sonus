# Polyphonic Adaptive Music Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, free, and open-source adaptive music practice loop for piano and guitar chords that listens in real time, provides low-latency feedback, performs deep post-take polyphonic analysis, and generates adaptive drills based on longitudinal habits.

**Architecture:** A hybrid pipeline combining in-browser AudioWorklet Chromagram detection (<30ms) for live HUD performance feedback with a Python FastAPI + Spotify Basic Pitch backend for deep per-note chord voicing verification, error-tolerant progression alignment, and habit-based drill generation.

**Tech Stack:** 
- Frontend: Vite, React 19, TypeScript, Web Audio API (AudioWorklet), `@spotify/basic-pitch`, `tonal` (music theory), Clerk, `@sentry/react`.
- Backend: Python 3.12, FastAPI, SQLModel, PostgreSQL (Neon Serverless via GitHub Student Developer Pack), Alembic, `sentry-sdk[fastapi]`, `basic-pitch`, `librosa`, `scipy`, `numpy`, `pytest`.
- Infrastructure & Tooling (GitHub Student Developer Pack): Sentry (real-time AudioWorklet & API observability), Doppler (SecretOps for multi-env `.env` sync), GitHub Actions (automated CI testing & typechecking), Snyk (vulnerability scanning), Postman (API contract testing).

**Spec:** [`docs/superpowers/specs/2026-10-13-polyphonic-chord-practice-design.md`](file:///d:/Projects/adaptive-music-practice/docs/superpowers/specs/2026-10-13-polyphonic-chord-practice-design.md)

## Global Constraints

- 100% free and open-source tools; zero chargeable third-party APIs.
- Python `>=3.12,<3.13` following [`AGENTS.md`](file:///d:/Projects/adaptive-music-practice/AGENTS.md) conventions.
- Only create `__init__.py` at `src/models/__init__.py`. Table models live in `src/models/`, routes stay thin in `src/services/api/routes/`.
- Frontend path alias: `@/*` → `apps/web/src/*`.
- Single take maximum duration: 3 minutes.
- Strict test-driven development (TDD): write the failing test first, verify failure, implement minimal code, verify pass.

## Review Focus

1. **Strum vs. Block Chord Asynchrony**: Guitar strums roll across strings over 30–60ms while piano chords strike simultaneously; onset clustering must not split a slow strum into separate single notes.
2. **Harmonic Bass Inversions**: Playing $C/E$ (first inversion) vs. root $C$ must be differentiated via bass-energy weighting.
3. **Muted Strings and Partial Voicings**: Detecting when a required note (e.g., 3rd or 7th) is missing without misclassifying the entire chord.
4. **Accidental Strums and Skips**: Alignment must handle extra passing strums or hesitation pauses without cascading alignment offsets across future measures.
5. **Noisy Background & Room Reverb**: Adaptive noise floor thresholding must prevent ambient resonance or background speech from triggering phantom chords.

---

### Task 1: Core Music Theory & Chord Representation (Backend)

**Files:**
- Create: `src/lib/music/chords.py`
- Create: `src/lib/music/progressions.py`
- Test: `tests/test_chords.py`

**Interfaces:**
- Consumes: None (pure Python standard library / math)
- Produces:
  - `parse_chord_notes(chord_name: str) -> list[int]`: Maps chord symbols (e.g., "C", "Am7", "G/B") to MIDI pitch classes (0-11).
  - `chord_similarity(expected_notes: list[int], detected_notes: list[int]) -> float`: Returns harmonic overlap score (0.0 to 1.0).
  - `validate_progression_schema(progression: dict) -> bool`: Verifies progression timing, beat offsets, and pitch lists.

- [x] **Step 1: Write the failing test for chord parsing and similarity**

```python
# tests/test_chords.py
from src.lib.music.chords import parse_chord_notes, chord_similarity

def test_parse_c_major():
    assert parse_chord_notes("C") == [0, 4, 7]

def test_parse_am7():
    assert parse_chord_notes("Am7") == [9, 0, 4, 7]

def test_chord_similarity_exact():
    assert chord_similarity([0, 4, 7], [0, 4, 7]) == 1.0

def test_chord_similarity_partial():
    # C major vs C power chord (missing 3rd)
    sim = chord_similarity([0, 4, 7], [0, 7])
    assert 0.6 <= sim < 1.0
```

- [x] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_chords.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.lib.music'`

- [x] **Step 3: Implement chord parsing and similarity in `src/lib/music/chords.py`**

Implement chord dictionary mappings (Major, Minor, 7, maj7, m7, dim, sus4) and Jaccard-weighted harmonic similarity.

- [x] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_chords.py -v`  
Expected: PASS

- [x] **Step 5: Write progression schema validation and tests**

Add `validate_progression_schema` in `src/lib/music/progressions.py` and test in `tests/test_chords.py`.

---

### Task 2: SQLModel Database Schema, Neon PostgreSQL Persistence & Migrations

**Files:**
- Create: `src/models/practice.py`
- Modify: `src/models/__init__.py`
- Modify: `src/lib/db.py`
- Modify: `.env.example.api`
- Test: `tests/test_models.py`

**Interfaces:**
- Consumes: `src/models/base.py`, `src/models/user.py`, `src/lib/db.py`
- Produces:
  - Table models: `Exercise`, `PracticeSession`, `SessionChordMetric`, `HabitPattern`, `AdaptiveIntervention`
  - Neon Serverless PostgreSQL connection support (PgBouncer transaction pooler & SSL)
  - Alembic migration revision for practice tables

- [ ] **Step 1: Write the failing test for practice models**

```python
# tests/test_models.py
import pytest
from sqlmodel import SQLModel, create_engine, Session, select
from src.models.user import User
from src.models.practice import (
    Exercise,
    PracticeSession,
    SessionChordMetric,
    HabitPattern,
    AdaptiveIntervention,
)

def test_create_exercise_and_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(id="user_clerk_123", name="Test Musician", username="musician1", email="test@music.com")
        exercise = Exercise(id="ex_1", title="Pop Progression", instrument="guitar", tempo_bpm=80, difficulty=1, progression_json="[]")
        session.add(user)
        session.add(exercise)
        session.commit()
        
        practice_session = PracticeSession(id="sess_1", user_id=user.id, exercise_id=exercise.id, tempo_bpm=80, state="recording")
        session.add(practice_session)
        session.commit()
        
        retrieved = session.exec(select(PracticeSession).where(PracticeSession.id == "sess_1")).first()
        assert retrieved is not None
        assert retrieved.user_id == "user_clerk_123"
        assert retrieved.exercise_id == "ex_1"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_models.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.models.practice'`

- [ ] **Step 3: Implement SQLModel table definitions in `src/models/practice.py`**

Define `Exercise`, `PracticeSession`, `SessionChordMetric`, `HabitPattern`, and `AdaptiveIntervention` inheriting from `Base` and `TimestampMixin`. Barrel export table classes in `src/models/__init__.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_models.py -v`  
Expected: PASS

- [ ] **Step 5: Configure Neon PostgreSQL connection & pooler handling**

Update `src/lib/db.py` to detect Neon hostnames (`neon.tech`), enable `ssl=require` / `sslmode=require`, configure transaction pooler mode, and update `.env.example.api`.

- [ ] **Step 6: Autogenerate Alembic migration**

Run: `pnpm run db:make "add practice tables"`  
Expected: Successfully generates new migration revision script in `src/alembic/versions/`.

---

### Task 3: Backend Polyphonic Audio Transcription & Alignment Pipeline

**Files:**
- Create: `src/lib/audio/transcription.py`
- Create: `src/lib/audio/alignment.py`
- Create: `src/lib/audio/voicing.py`
- Test: `tests/test_audio_alignment.py`

**Interfaces:**
- Consumes: `basic-pitch`, `src/lib/music/chords.py`
- Produces:
  - `transcribe_polyphonic_wav(wav_path: str) -> list[dict]`: Runs Spotify Basic Pitch, returning discrete note events `[{pitch, start_time, end_time, amplitude}]`.
  - `cluster_chords_from_notes(notes: list[dict], strum_window_ms: float = 50.0) -> list[dict]`: Clusters asynchronous strums into discrete chord strike events.
  - `align_chord_sequence(played_chords: list[dict], reference_chords: list[dict]) -> list[dict]`: Weighted dynamic programming sequence alignment returning matched chord metrics, timing offsets, and voicing accuracy.

- [ ] **Step 1: Write the failing test for dynamic programming chord alignment**

```python
# tests/test_audio_alignment.py
from src.lib.audio.alignment import align_chord_sequence

def test_align_exact_progression():
    ref = [
        {"name": "C", "beat": 1, "expected_pitches": [48, 52, 55]},
        {"name": "G", "beat": 5, "expected_pitches": [43, 47, 50]}
    ]
    played = [
        {"detected_name": "C", "timestamp_sec": 0.8, "pitches": [48, 52, 55]},
        {"detected_name": "G", "timestamp_sec": 3.8, "pitches": [43, 47, 50]}
    ]
    matches = align_chord_sequence(played, ref)
    assert len(matches) == 2
    assert matches[0]["is_matched"] is True
    assert matches[0]["expected_chord"] == "C"

def test_align_with_skipped_chord():
    ref = [
        {"name": "C", "beat": 1, "expected_pitches": [48, 52, 55]},
        {"name": "Am", "beat": 5, "expected_pitches": [45, 52, 57]},
        {"name": "G", "beat": 9, "expected_pitches": [43, 47, 50]}
    ]
    # Player skipped Am completely
    played = [
        {"detected_name": "C", "timestamp_sec": 0.8, "pitches": [48, 52, 55]},
        {"detected_name": "G", "timestamp_sec": 6.8, "pitches": [43, 47, 50]}
    ]
    matches = align_chord_sequence(played, ref)
    assert len(matches) == 3
    assert matches[1]["is_matched"] is False # Am was missed
    assert matches[2]["is_matched"] is True  # G still aligns correctly
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_audio_alignment.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.lib.audio.alignment'`

- [ ] **Step 3: Implement dynamic programming sequence alignment in `src/lib/audio/alignment.py`**

Implement Needleman-Wunsch / Levenshtein-variant weighted sequence alignment tailored to music chord progressions.

- [ ] **Step 4: Implement Basic Pitch wrapper and strum clustering**

Implement `transcribe_polyphonic_wav` in `src/lib/audio/transcription.py` and strum clustering in `src/lib/audio/voicing.py`.

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_audio_alignment.py -v`  
Expected: PASS

---

### Task 4: API Endpoints for Exercises, Take Upload & Session Analysis

**Files:**
- Create: `src/services/api/routes/exercises.py`
- Create: `src/services/api/routes/sessions.py`
- Modify: `src/services/api/app.py`
- Test: `tests/test_sessions_api.py`

**Interfaces:**
- Consumes: `src/lib/auth/clerk.py`, `src/lib/db.py`, `src/models/practice.py`, `src/lib/audio/alignment.py`
- Produces:
  - `GET /api/exercises`: List available chord progressions
  - `POST /api/sessions`: Create practice session
  - `POST /api/sessions/{id}/take`: Upload WAV take for async polyphonic processing
  - `GET /api/sessions/{id}/analysis`: Retrieve per-chord metrics and timing

- [ ] **Step 1: Write the failing API test**

```python
# tests/test_sessions_api.py
import pytest
from httpx import AsyncClient, ASGITransport
from src.services.api.app import app

@pytest.mark.asyncio
async def test_create_and_get_exercise():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/exercises")
        assert res.status_code == 200
        assert isinstance(res.json(), list)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_sessions_api.py -v`  
Expected: FAIL with 404 Not Found (router not mounted)

- [ ] **Step 3: Implement exercise and session routers**

Build `src/services/api/routes/exercises.py` and `src/services/api/routes/sessions.py`. Wire into `src/services/api/app.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_sessions_api.py -v`  
Expected: PASS

---

### Task 5: Adaptive Habit Engine & Grounded Fact Reporting

**Files:**
- Create: `src/lib/adaptive/patterns.py`
- Create: `src/lib/adaptive/interventions.py`
- Create: `src/lib/adaptive/reports.py`
- Test: `tests/test_adaptive_engine.py`

**Interfaces:**
- Consumes: `src/models/practice.py`
- Produces:
  - `detect_habits(user_id: str, sessions: list[PracticeSession]) -> list[HabitPattern]`
  - `generate_intervention(pattern: HabitPattern) -> AdaptiveIntervention`
  - `generate_grounded_report(session_id: str, metrics: list[SessionChordMetric]) -> dict`

- [ ] **Step 1: Write the failing test for habit pattern detection**

```python
# tests/test_adaptive_engine.py
from src.lib.adaptive.patterns import detect_transition_lag_patterns

def test_detect_f_to_g_transition_lag():
    # 4 sessions where F -> G transition latency exceeds 120ms
    metric_history = [
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 140},
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 135},
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 125},
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 150},
    ]
    patterns = detect_transition_lag_patterns(metric_history, threshold_ms=100, min_evidence=3)
    assert len(patterns) == 1
    assert patterns[0]["context"] == "F -> G"
    assert patterns[0]["status"] == "active"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_adaptive_engine.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.lib.adaptive'`

- [ ] **Step 3: Implement pattern detection and intervention generator**

Implement transition lag, tempo threshold, and voicing drop detection in `src/lib/adaptive/patterns.py` and rule-based drill generation in `src/lib/adaptive/interventions.py`.

- [ ] **Step 4: Implement grounded fact-bundle report generation**

Build `src/lib/adaptive/reports.py` generating deterministic summaries strictly tied to fact IDs.

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_adaptive_engine.py -v`  
Expected: PASS

---

### Task 6: Frontend Real-Time AudioWorklet & Chromagram Detection

**Files:**
- Create: `apps/web/src/lib/audio/chroma-processor.ts`
- Create: `apps/web/src/lib/audio/chord-detector.ts`
- Create: `apps/web/src/lib/audio/worklet-loader.ts`
- Test: `apps/web/src/lib/audio/__tests__/chord-detector.test.ts`

**Interfaces:**
- Consumes: Web Audio API, `tonal` (music theory)
- Produces:
  - `chromaToChord(chromaVector: number[]): { chord: string; confidence: number; bass: string }`
  - `createAudioWorkletNode(ctx: AudioContext): Promise<AudioWorkletNode>`

- [ ] **Step 1: Write the failing Vitest test for chroma chord resolution**

```ts
// apps/web/src/lib/audio/__tests__/chord-detector.test.ts
import { describe, it, expect } from 'vitest'
import { chromaToChord } from '../chord-detector'

describe('chromaToChord', () => {
  it('identifies C Major from pure C, E, G chroma energy', () => {
    // 12-semitone array: C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7...
    const vector = [1.0, 0, 0, 0, 0.9, 0, 0, 0.95, 0, 0, 0, 0]
    const result = chromaToChord(vector)
    expect(result.chord).toBe('C')
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('identifies A minor 7th', () => {
    // A=9, C=0, E=4, G=7
    const vector = [0.9, 0, 0, 0, 0.85, 0, 0, 0.8, 0, 1.0, 0, 0]
    const result = chromaToChord(vector)
    expect(result.chord).toBe('Am7')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test`  
Expected: FAIL with `Cannot find module '../chord-detector'`

- [ ] **Step 3: Implement `chromaToChord` using `tonal`**

Install `tonal` dependency in `apps/web` and implement template matching with bass note detection in `apps/web/src/lib/audio/chord-detector.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test`  
Expected: PASS

- [ ] **Step 5: Implement `AudioWorklet` processor for non-blocking buffer capture**

Create `chroma-processor.ts` for zero-allocation audio streaming.

---

### Task 7: Frontend Take Recorder, Metronome & Session API Client

**Files:**
- Create: `apps/web/src/lib/audio/metronome.ts`
- Create: `apps/web/src/lib/audio/wav-encoder.ts`
- Create: `apps/web/src/api/sessions.ts`
- Test: `apps/web/src/api/__tests__/sessions.test.ts`

**Interfaces:**
- Consumes: `apps/web/src/lib/api/config.ts`
- Produces:
  - `startMetronome(bpm: number, onBeat: (beat: number) => void): () => void`
  - `encodeMonoWav(samples: Float32Array, sampleRate: number): Blob`
  - `uploadSessionTake(sessionId: string, audioBlob: Blob, token: string): Promise<{ jobId: string }>`
  - `fetchSessionAnalysis(sessionId: string, token: string): Promise<SessionAnalysisDto>`

- [ ] **Step 1: Write the failing test for WAV encoding**

```ts
// apps/web/src/lib/audio/__tests__/wav-encoder.test.ts
import { describe, it, expect } from 'vitest'
import { encodeMonoWav } from '../wav-encoder'

describe('encodeMonoWav', () => {
  it('creates valid 16-bit PCM WAV container', () => {
    const samples = new Float32Array(44100) // 1 second of audio
    const blob = encodeMonoWav(samples, 44100)
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + 44100 * 2) // 44 header bytes + 2 bytes per sample
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test`  
Expected: FAIL with `Cannot find module '../wav-encoder'`

- [ ] **Step 3: Implement 16-bit WAV encoder and metronome scheduler**

Implement standard RIFF header formatting in `wav-encoder.ts` and lookahead audio timing scheduler in `metronome.ts`.

- [ ] **Step 4: Implement typed session API client in `apps/web/src/api/sessions.ts`**

Implement `uploadSessionTake` and `fetchSessionAnalysis` following `AGENTS.md` API conventions.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter web test`  
Expected: PASS

---

### Task 8: End-to-End System Integration, Observability & CI/CD Gating

**Files:**
- Create: `tests/test_e2e_practice_loop.py`
- Create: `.github/workflows/ci.yml`
- Modify: `src/services/api/app.py` (wire Sentry middleware)
- Modify: `apps/web/src/main.tsx` (wire Sentry React error boundary)
- Test: Full integration test suite and CI workflow

**Interfaces:**
- Consumes: All components from Tasks 1–7, Sentry DSN, GitHub Actions
- Produces:
  - End-to-end verified practice cycle:
    `Create Session -> Synthesize/Load Take Audio -> Align Chords -> Detect Habit Pattern -> Recommend Adaptive Drill`
  - Automated CI pipeline (lint, typecheck, pytest, vitest, build)
  - Real-time client & backend observability with Sentry
  - Doppler SecretOps workflow documentation

- [ ] **Step 1: Write end-to-end integration test**

```python
# tests/test_e2e_practice_loop.py
import pytest
from httpx import AsyncClient, ASGITransport
from src.services.api.app import app

@pytest.mark.asyncio
async def test_full_practice_cycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Fetch pop exercise
        ex_res = await client.get("/api/exercises")
        assert ex_res.status_code == 200
        ex_id = ex_res.json()[0]["id"]
        
        # 2. Start session
        sess_res = await client.post("/api/sessions", json={"exercise_id": ex_id, "tempo_bpm": 80})
        assert sess_res.status_code == 201
        sess_id = sess_res.json()["id"]
        
        # 3. Verify session state
        status_res = await client.get(f"/api/sessions/{sess_id}")
        assert status_res.status_code == 200
        assert status_res.json()["state"] in ["recording", "analysing", "ready"]
```

- [ ] **Step 2: Run integration tests to verify complete vertical slice**

Run: `pytest tests/test_e2e_practice_loop.py -v`  
Expected: PASS

- [ ] **Step 3: Wire Sentry observability into frontend and backend**

Add Sentry initialization in `src/services/api/app.py` (`sentry_sdk.init(...)`) and in `apps/web/src/main.tsx` (`Sentry.init(...)`) conditioned on `SENTRY_DSN` / `VITE_SENTRY_DSN`.

- [ ] **Step 4: Create automated GitHub Actions CI workflow**

Create `.github/workflows/ci.yml` executing Python tests (pytest, mypy, ruff) and frontend tests (vitest, typecheck, build) on push and pull requests.

- [ ] **Step 5: Run full repo lint, typecheck, and build checks**

Run: `pnpm --filter web build` and `pytest tests/`  
Expected: All TypeScript and Python tests pass cleanly with zero errors.
