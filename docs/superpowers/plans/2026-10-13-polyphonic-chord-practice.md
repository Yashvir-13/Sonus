# Polyphonic Adaptive Music Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

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

- [x] **Step 1: Write the failing test for practice models**

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

- [x] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_models.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.models.practice'`

- [x] **Step 3: Implement SQLModel table definitions in `src/models/practice.py`**

Define `Exercise`, `PracticeSession`, `SessionChordMetric`, `HabitPattern`, and `AdaptiveIntervention` inheriting from `Base` and `TimestampMixin`. Barrel export table classes in `src/models/__init__.py`.

- [x] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_models.py -v`  
Expected: PASS

- [x] **Step 5: Configure Neon PostgreSQL connection & pooler handling**

Update `src/lib/db.py` to detect Neon hostnames (`neon.tech`), enable `ssl=require` / `sslmode=require`, configure transaction pooler mode, and update `.env.example.api`.

- [x] **Step 6: Autogenerate Alembic migration**

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

- [x] **Step 1: Write the failing test for dynamic programming chord alignment**

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

- [x] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_audio_alignment.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.lib.audio.alignment'`

- [x] **Step 3: Implement dynamic programming sequence alignment in `src/lib/audio/alignment.py`**

Implement Needleman-Wunsch / Levenshtein-variant weighted sequence alignment tailored to music chord progressions.

- [x] **Step 4: Implement Basic Pitch wrapper and strum clustering**

Implement `transcribe_polyphonic_wav` in `src/lib/audio/transcription.py` and strum clustering in `src/lib/audio/voicing.py`.

- [x] **Step 5: Run test to verify it passes**

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

- [x] **Step 1: Write the failing API test**

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

- [x] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_sessions_api.py -v`  
Expected: FAIL with 404 Not Found (router not mounted)

- [x] **Step 3: Implement exercise and session routers**

Build `src/services/api/routes/exercises.py` and `src/services/api/routes/sessions.py`. Wire into `src/services/api/app.py`.

- [x] **Step 4: Run test to verify it passes**

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

- [x] **Step 1: Write the failing test for habit pattern detection**

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

- [x] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_adaptive_engine.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.lib.adaptive'`

- [x] **Step 3: Implement pattern detection and intervention generator**

Implement transition lag, tempo threshold, and voicing drop detection in `src/lib/adaptive/patterns.py` and rule-based drill generation in `src/lib/adaptive/interventions.py`.

- [x] **Step 4: Implement grounded fact-bundle report generation**

Build `src/lib/adaptive/reports.py` generating deterministic summaries strictly tied to fact IDs.

- [x] **Step 5: Run test to verify it passes**

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

- [x] **Step 1: Write the failing Vitest test for chroma chord resolution**

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

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test`  
Expected: FAIL with `Cannot find module '../chord-detector'`

- [x] **Step 3: Implement `chromaToChord` using `tonal`**

Install `tonal` dependency in `apps/web` and implement template matching with bass note detection in `apps/web/src/lib/audio/chord-detector.ts`.

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test`  
Expected: PASS

- [x] **Step 5: Implement `AudioWorklet` processor for non-blocking buffer capture**

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

- [x] **Step 1: Write the failing test for WAV encoding**

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

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test`  
Expected: FAIL with `Cannot find module '../wav-encoder'`

- [x] **Step 3: Implement 16-bit WAV encoder and metronome scheduler**

Implement standard RIFF header formatting in `wav-encoder.ts` and lookahead audio timing scheduler in `metronome.ts`.

- [x] **Step 4: Implement typed session API client in `apps/web/src/api/sessions.ts`**

Implement `uploadSessionTake` and `fetchSessionAnalysis` following `AGENTS.md` API conventions.

- [x] **Step 5: Run test to verify it passes**

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

- [x] **Step 1: Write end-to-end integration test**

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

- [x] **Step 2: Run integration tests to verify complete vertical slice**

Run: `pytest tests/test_e2e_practice_loop.py -v`  
Expected: PASS

- [x] **Step 3: Wire Sentry observability into frontend and backend**

Add Sentry initialization in `src/services/api/app.py` (`sentry_sdk.init(...)`) and in `apps/web/src/main.tsx` (`Sentry.init(...)`) conditioned on `SENTRY_DSN` / `VITE_SENTRY_DSN`.

- [x] **Step 4: Create automated GitHub Actions CI workflow**

Create `.github/workflows/ci.yml` executing Python tests (pytest, mypy, ruff) and frontend tests (vitest, typecheck, build) on push and pull requests.

- [x] **Step 5: Run full repo lint, typecheck, and build checks**

Run: `pnpm --filter web build` and `pytest tests/`  
Expected: All TypeScript and Python tests pass cleanly with zero errors.

---

### Task 9: Temporary Audio Test Bench & Chord Detection Playground (Dev Testing Frontend)

**Files:**
- Create: `src/services/api/routes/audio_test.py`
- Create: `apps/web/src/components/dev/audio-test-bench.tsx`
- Modify: `src/services/api/app.py`
- Modify: `apps/web/src/app.tsx`
- Test: `tests/test_audio_test_api.py`
- Test: `apps/web/src/components/dev/__tests__/audio-test-bench.test.tsx`

**Interfaces:**
- Consumes:
  - `apps/web/src/lib/audio/chord-detector.ts`
  - `apps/web/src/lib/audio/wav-encoder.ts`
  - `src.lib.audio.transcription.transcribe_polyphonic_wav`
  - `src.lib.audio.voicing.cluster_chords_from_notes`
- Produces:
  - `POST /api/audio/test-transcribe`: Unauthenticated developer test endpoint accepting a WAV audio file, running Spotify Basic Pitch ONNX transcription, clustering notes into chords, and returning `{ "notes": [...], "chords": [...], "duration_seconds": float }`.
  - `AudioTestBench`: Interactive testing component with:
    - Microphone capture toggle with visual audio volume / waveform meter.
    - Real-time client chromagram chord identifier (e.g. "Detected: C Major (C, E, G)").
    - 5-second take recorder with instant WAV submission to `/api/audio/test-transcribe`.
    - Chord Accuracy Checker: User selects target chord from a dropdown, plays it on piano/guitar, and gets instant green/red accuracy verification with detected notes and confidence score.

- [x] **Step 1: Write the failing test for the audio test endpoint**

```python
# tests/test_audio_test_api.py
import pytest
from httpx import AsyncClient, ASGITransport
from src.services.api.app import app

@pytest.mark.asyncio
async def test_transcribe_test_wav_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Generate dummy 0.1-second WAV
        from scipy.io import wavfile
        import io, numpy as np
        buf = io.BytesIO()
        wavfile.write(buf, 22050, np.zeros(2205, dtype=np.float32))
        buf.seek(0)
        
        res = await client.post("/api/audio/test-transcribe", files={"file": ("test.wav", buf, "audio/wav")})
        assert res.status_code == 200
        data = res.json()
        assert "notes" in data
        assert "chords" in data
```

- [x] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_audio_test_api.py -v`  
Expected: FAIL with 404 Not Found

- [x] **Step 3: Implement `src/services/api/routes/audio_test.py`**

Implement `POST /api/audio/test-transcribe` accepting multipart WAV audio, saving temporarily, invoking `transcribe_polyphonic_wav` and `cluster_chords_from_notes`, and returning structured notes and chords without requiring Clerk authentication. Register in `src/services/api/app.py`.

- [x] **Step 4: Write failing test for the frontend `AudioTestBench` component**

```tsx
// apps/web/src/components/dev/__tests__/audio-test-bench.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AudioTestBench } from '../audio-test-bench'

describe('AudioTestBench', () => {
  it('renders chord selection dropdown and recording controls', () => {
    render(<AudioTestBench />)
    expect(screen.getByText(/Audio Test Bench/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Start Listening/i })).toBeDefined()
  })
})
```

- [x] **Step 5: Run test to verify it fails**

Run: `pnpm --filter web test`  
Expected: FAIL with `Cannot find module '../audio-test-bench'`

- [x] **Step 6: Implement `AudioTestBench` in `apps/web/src/components/dev/audio-test-bench.tsx`**

Build clean, reactive test bench with:
- Microphone permission and audio analyzer node.
- Live pitch class visualizer and Tonal.js chord detector.
- Take recording with WAV export and submission to `/api/audio/test-transcribe`.
- Target chord verification badge (Matched / Missed).
Mount into `apps/web/src/app.tsx` with a prominent dev toggle.

- [x] **Step 7: Run tests to verify they pass**

Run: `pytest tests/test_audio_test_api.py -v` and `pnpm --filter web test`  
Expected: PASS

- [x] **Step 8: Commit**

```bash
git add src/services/api/routes/audio_test.py src/services/api/app.py apps/web/src/components/dev/ apps/web/src/app.tsx tests/test_audio_test_api.py
git commit -m "feat(dev): add temporary audio test bench and chord detection playground frontend"
```

---

### Task 10: Grounded AI Practice Coach via Google Gemini 1.5 Flash (F-15)

**Files:**
- Create: `src/lib/adaptive/llm_coach.py`
- Modify: `src/services/api/routes/sessions.py`
- Test: `tests/test_llm_coach.py`

**Interfaces:**
- Consumes:
  - `src.lib.adaptive.reports.generate_grounded_report`
  - `src.lib.adaptive.patterns.detect_habits`
  - `GEMINI_API_KEY` environment variable
- Produces:
  - `generate_coaching_report(session_id: str, chord_metrics: list[dict], habits: list[dict], instrument: str = "piano") -> dict[str, Any]`: Returns structured coaching object containing:
    - `status`: `"ai_grounded"` or `"deterministic_fallback"`
    - `primary_bottleneck`: specific mechanical or transition issue identified
    - `ergonomic_advice`: instrument-specific posture/fretting guidance
    - `coaching_letter`: encouraging, pedagogical feedback
    - `tailored_drills`: prioritized list of drills with target BPMs

- [ ] **Step 1: Write the failing test for the grounded Gemini coach**

```python
# tests/test_llm_coach.py
from unittest.mock import patch
from src.lib.adaptive.llm_coach import generate_coaching_report

def test_generate_coaching_report_deterministic_fallback():
    # Without GEMINI_API_KEY, gracefully returns grounded deterministic report
    metrics = [{
        "chord_index": 0,
        "expected_chord": "C",
        "detected_chord": "C",
        "is_matched": True,
        "onset_error_ms": 12.0,
        "voicing_completeness": 1.0,
    }]
    with patch.dict("os.environ", {}, clear=True):
        report = generate_coaching_report("sess_test", metrics, habits=[])
        assert report["status"] == "deterministic_fallback"
        assert "sess_test" in report["summary"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_llm_coach.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.lib.adaptive.llm_coach'`

- [ ] **Step 3: Implement `generate_coaching_report` in `src/lib/adaptive/llm_coach.py`**

Implement Google Gemini integration using `google-genai` SDK (`gemini-1.5-flash`), strictly prompting with the pre-computed fact bundle (onset timing errors, voicing drops, habit patterns). Catch exceptions or missing API key and return deterministic fallback report.

- [ ] **Step 4: Integrate AI coaching generation into `POST /api/sessions/{session_id}/take`**

Modify `src/services/api/routes/sessions.py` to invoke `generate_coaching_report` and return coaching insights in the take response.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pytest tests/test_llm_coach.py tests/test_sessions_api.py -v`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/adaptive/llm_coach.py src/services/api/routes/sessions.py tests/test_llm_coach.py
git commit -m "feat(ai): add grounded Gemini 1.5 Flash music coaching with offline fallback"
```

---

### Task 11: Longitudinal Outcome Tracking & Follow-Up Comparison (F-07, F-09)

**Files:**
- Modify: `src/models/practice.py` (add `intervention_id` foreign key on `PracticeSession`)
- Create: `src/lib/adaptive/tracking.py`
- Modify: `src/services/api/routes/sessions.py`
- Test: `tests/test_outcome_tracking.py`

**Interfaces:**
- Consumes:
  - `src.models.practice.PracticeSession`
  - `src.models.practice.AdaptiveIntervention`
  - `src.models.practice.SessionChordMetric`
- Produces:
  - `evaluate_drill_outcome(baseline_metrics: list[dict], follow_up_metrics: list[dict], drill_type: str) -> dict[str, Any]`: Computes delta on the targeted metric (e.g., transition latency reduction, onset rushing improvement, voicing recovery), returns `outcome` (`"improved" | "steady" | "worsened" | "inconclusive"`) and numeric `measured_improvement`.

- [ ] **Step 1: Write the failing test for outcome tracking**

```python
# tests/test_outcome_tracking.py
from src.lib.adaptive.tracking import evaluate_drill_outcome

def test_transition_lag_improvement():
    baseline = [{"from_chord": "Am", "to_chord": "F", "transition_latency_ms": 140.0}]
    follow_up = [{"from_chord": "Am", "to_chord": "F", "transition_latency_ms": 85.0}]
    
    result = evaluate_drill_outcome(baseline, follow_up, drill_type="isolated_transition")
    assert result["outcome"] == "improved"
    assert result["measured_improvement"] == 55.0  # 55 ms latency reduction
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_outcome_tracking.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'src.lib.adaptive.tracking'`

- [ ] **Step 3: Implement outcome evaluation in `src/lib/adaptive/tracking.py`**

Implement metric delta calculations for `isolated_transition` (latency reduction), `subdivision_click` (rushing reduction), and `voicing_arpeggio` (voicing completeness gain).

- [ ] **Step 4: Update `PracticeSession` model and migration**

Add `intervention_id: str | None = Field(default=None, foreign_key="adaptive_interventions.id", index=True, max_length=100)` to `PracticeSession`.

- [ ] **Step 5: Wire outcome tracking into sessions API route**

When a take is submitted for a session linked to an `intervention_id`, calculate the outcome against the baseline session and update `AdaptiveIntervention.measured_improvement` and `AdaptiveIntervention.completed = True`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pytest tests/test_outcome_tracking.py -v`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/models/practice.py src/lib/adaptive/tracking.py src/services/api/routes/sessions.py tests/test_outcome_tracking.py
git commit -m "feat(adaptive): add longitudinal outcome tracking and intervention follow-up evaluation"
```

---

### Task 12: User Privacy, Consent & Self-Service Data Deletion Controls (F-01, F-10)

**Files:**
- Create: `src/services/api/routes/privacy.py`
- Modify: `src/services/api/app.py`
- Test: `tests/test_privacy_api.py`

**Interfaces:**
- Consumes: `ClerkIdentityDep`, `get_session`
- Produces:
  - `GET /api/me/privacy-status`: Returns `{ "raw_audio_stored": False, "data_retention_days": 90, "total_sessions_saved": int }`
  - `DELETE /api/me/practice-data`: Deletes all `PracticeSession`, `SessionChordMetric`, `HabitPattern`, and `AdaptiveIntervention` records belonging to the authenticated Clerk user without deleting their Clerk user account.

- [ ] **Step 1: Write the failing test for privacy status and data deletion**

```python
# tests/test_privacy_api.py
import pytest
from httpx import AsyncClient, ASGITransport
from src.services.api.app import app

@pytest.mark.asyncio
async def test_privacy_status_and_deletion(async_client: AsyncClient):
    # 1. Fetch privacy policy status
    res = await async_client.get("/api/me/privacy-status")
    assert res.status_code == 200
    assert res.json()["raw_audio_stored"] is False
    
    # 2. Request complete data wipe
    del_res = await async_client.delete("/api/me/practice-data")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_privacy_api.py -v`  
Expected: FAIL with 404 Not Found on `/api/me/privacy-status`

- [ ] **Step 3: Implement privacy routes in `src/services/api/routes/privacy.py`**

Implement `GET /api/me/privacy-status` and `DELETE /api/me/practice-data` with atomic cascading deletion across SQLModel practice tables. Register router in `src/services/api/app.py`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_privacy_api.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/api/routes/privacy.py src/services/api/app.py tests/test_privacy_api.py
git commit -m "feat(privacy): add user privacy status and self-service data deletion endpoint"
```

---

### Task 13: Interactive Browser Practice Studio UI & Drill Runner (F-02, F-03, F-04, F-06, F-08)

**Files:**
- Create: `apps/web/src/components/practice/exercise-selector.tsx`
- Create: `apps/web/src/components/practice/practice-room.tsx`
- Create: `apps/web/src/components/practice/session-summary.tsx`
- Create: `apps/web/src/components/practice/ai-coach-card.tsx`
- Modify: `apps/web/src/app.tsx`
- Test: `apps/web/src/components/practice/__tests__/practice-flow.test.tsx`

**Interfaces:**
- Consumes:
  - `apps/web/src/api/sessions.ts`
  - `apps/web/src/lib/audio/metronome.ts`
  - `apps/web/src/lib/audio/wav-encoder.ts`
  - `@clerk/react` auth hooks
- Produces:
  - `ExerciseSelector`: Browse piano/guitar chord exercises by difficulty and tempo.
  - `PracticeRoom`: Metronome audio scheduler, visual beat flasher, microphone input level meter, start/stop/discard take controls.
  - `SessionSummary`: Chord-by-chord performance cards with timing latency gauges (ms), voicing tags, and score.
  - `AiCoachCard`: Renders Gemini 1.5 Flash coaching advice with a single-click "Practice Recommended Drill" button that automatically launches the remedial drill at the recommended tempo.

- [ ] **Step 1: Write failing component tests in Vitest**

```tsx
// apps/web/src/components/practice/__tests__/practice-flow.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AiCoachCard } from '../ai-coach-card'

describe('AiCoachCard', () => {
  it('renders bottleneck and drill recommendation', () => {
    const report = {
      primary_bottleneck: 'F to G transition latency',
      ergonomic_advice: 'Pivot on the index finger when shifting to G.',
      tailored_drills: [{ drill_type: 'isolated_transition', target_tempo: 75, target_repetitions: 5 }]
    }
    render(<AiCoachCard report={report} onStartDrill={() => {}} />)
    expect(screen.getByText(/F to G transition latency/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Practice Recommended Drill/i })).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test`  
Expected: FAIL with `Cannot find module '../ai-coach-card'`

- [ ] **Step 3: Implement Practice Studio components**

Build `ExerciseSelector`, `PracticeRoom`, `SessionSummary`, and `AiCoachCard` using standard React and the existing design tokens in `index.css`. Wire into `apps/web/src/app.tsx` replacing the starter placeholder.

- [ ] **Step 4: Run tests and frontend build to verify they pass**

Run: `pnpm --filter web test` and `pnpm --filter web build`  
Expected: PASS with 0 TypeScript/Vitest errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/practice/ apps/web/src/app.tsx
git commit -m "feat(web): add interactive practice studio, take recorder, and AI coach card UI"
```

---

### Task 14: Labelled Audio Benchmark Evaluation & Uncertainty Calibration (Objective 1, 6, Table 5)

**Files:**
- Create: `scripts/benchmark_evaluation.py`
- Create: `tests/benchmarks/test_labelled_benchmarks.py`

**Interfaces:**
- Consumes:
  - Labelled synthetic & acoustic audio samples
  - `src.lib.audio.transcription.transcribe_polyphonic_wav`
  - `src.lib.audio.alignment.align_chord_sequence`
- Produces:
  - Benchmark evaluation reporting:
    - Note Precision $\ge 80\%$
    - Note Recall $\ge 80\%$
    - Onset Timing Error within $\pm 100\text{ ms}$
    - Intonation / Pitch Class Accuracy within $\le 50\text{ cents}$
    - Separate verification tables for Piano and Guitar solo tracks.

- [ ] **Step 1: Write the failing benchmark test**

```python
# tests/benchmarks/test_labelled_benchmarks.py
from scripts.benchmark_evaluation import run_evaluation_benchmark

def test_benchmark_targets_satisfied():
    results = run_evaluation_benchmark()
    assert results["precision"] >= 0.80
    assert results["recall"] >= 0.80
    assert results["mean_onset_error_ms"] <= 100.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/benchmarks/test_labelled_benchmarks.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'scripts.benchmark_evaluation'`

- [ ] **Step 3: Implement benchmark evaluation harness in `scripts/benchmark_evaluation.py`**

Generate ground-truth synthetic test takes for piano and guitar across supported registers, run through Basic Pitch + Alignment pipeline, and compute precision, recall, and onset delta statistics.

- [ ] **Step 4: Run benchmark test to verify it passes**

Run: `pytest tests/benchmarks/test_labelled_benchmarks.py -v`  
Expected: PASS with documented precision/recall $\ge 80\%$.

- [ ] **Step 5: Commit**

```bash
git add scripts/benchmark_evaluation.py tests/benchmarks/
git commit -m "test(benchmarks): add automated evaluation benchmark harness for piano and guitar transcription"
```

---

### Task 15 (P2 / Stretch Goal): Opt-In Asynchronous Jam & Matched-Exercise Comparison (F-12, F-14)

**Files:**
- Create: `src/models/collaboration.py`
- Create: `src/services/api/routes/jam.py`
- Modify: `src/models/__init__.py`
- Modify: `src/services/api/app.py`
- Test: `tests/test_jam_api.py`

**Interfaces:**
- Consumes: `ClerkIdentityDep`, `get_session`, `PracticeSession`
- Produces:
  - `POST /api/jam/tracks`: Create an asynchronous turn-taking jam session over a shared exercise backing track.
  - `POST /api/jam/tracks/{id}/contribute`: Submit a user take to the jam sequence.
  - `GET /api/jam/compare`: Compare two opted-in takes on the exact same exercise and tempo using objective metrics (timing error ms, voicing score) under pseudonyms without an arbitrary ranking.

- [ ] **Step 1: Write the failing test for asynchronous jam and comparison**

```python
# tests/test_jam_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_jam_track_creation_and_matched_comparison(async_client: AsyncClient):
    # 1. Create jam prompt
    res = await async_client.post("/api/jam/tracks", json={"title": "Pop Cadence Turn-Taking", "exercise_id": "ex_pop_01"})
    assert res.status_code == 201
    track_id = res.json()["id"]

    # 2. Compare matched exercise takes
    comp_res = await async_client.get(f"/api/jam/tracks/{track_id}/compare")
    assert comp_res.status_code == 200
    assert "comparison_metrics" in comp_res.json()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_jam_api.py -v`  
Expected: FAIL with 404 Not Found on `/api/jam/tracks`

- [ ] **Step 3: Implement Jam models in `src/models/collaboration.py`**

Define `JamTrack` and `JamContribution` SQLModel tables. Export from `src/models/__init__.py`.

- [ ] **Step 4: Implement routes in `src/services/api/routes/jam.py`**

Implement turn-taking contribution endpoints and pseudonymized matched-exercise comparison logic. Register in `src/services/api/app.py`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pytest tests/test_jam_api.py -v`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/models/collaboration.py src/models/__init__.py src/services/api/routes/jam.py src/services/api/app.py tests/test_jam_api.py
git commit -m "feat(collaboration): add opt-in asynchronous jam turn-taking and matched-exercise comparison"
```

