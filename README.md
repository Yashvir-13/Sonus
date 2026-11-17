# § SONUS — Adaptive Musical Practice System

**Sonus** is an end-to-end adaptive guitar and piano practice studio. It renders publication-grade sheet music and tablature, performs real-time browser DSP for live tuning and chord feedback, transcribes and aligns full polyphonic recordings on the backend, and drives a longitudinal cognitive skill engine (BKT, SM-2, CUSUM, Thompson Sampling, and grounded LLM coaching) to target the exact motor habits holding a musician back.

---

## Table of Contents

1. [What Sonus Does](#what-sonus-does)
2. [System Architecture](#system-architecture)
3. [Algorithms & Engineering Deep Dive](#algorithms--engineering-deep-dive)
   - [1. Real-Time Browser Audio DSP & Detection](#1-real-time-browser-audio-dsp--detection)
   - [2. Deterministic Acoustic Synthesis Engine](#2-deterministic-acoustic-synthesis-engine)
   - [3. Server-Side Polyphonic Music Detection & Alignment](#3-server-side-polyphonic-music-detection--alignment)
   - [4. Adaptive Cognitive Modeling & Habit Detection](#4-adaptive-cognitive-modeling--habit-detection)
   - [5. Sheet Music Engraving & Audio-Visual Sync](#5-sheet-music-engraving--audio-visual-sync)
   - [6. Grounded AI Coaching](#6-grounded-ai-coaching)
4. [Data Model & Persistence](#data-model--persistence)
5. [Built-in Repertoire](#built-in-repertoire)
6. [Tech Stack](#tech-stack)
7. [Getting Started](#getting-started)
8. [API Overview](#api-overview)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Privacy, Security & Reliability](#privacy-security--reliability)
11. [Repository Structure](#repository-structure)
12. [License](#license)

---

## What Sonus Does

- **Musician's Practice Studio (`/practice/:slug`)**:
  - **Listen Mode** (continuous score audition) & **Practice Mode** (metronome count-in + microphone take capture).
  - **VexFlow v5 (Bravura SMuFL)** Piano Grand Staff & Guitar Tablature, plus a **Falling Keys** waterfall mode for piano.
  - **Now Playing → Prepare Next** hand-preparation dock (vector guitar fretboards with finger digits and 25-key piano keyboards), click-any-bar seeking, tempo scaling (`70%`, `85%`, `100%`, custom BPM), and **2-Bar Transition Loops**.
  - Dual-Theme Acoustic Studio UI (**Studio Alabaster** light mode & **Deep Obsidian** dark mode).
- **Chords & Scales Compendium (`/chords`)**: All 12 chromatic roots across triads, sevenths, extended/altered voicings, and scales/modes with synchronized guitar/piano diagrams, consistent audio previews, and one-click launch into isolated 4-measure practice drills.
- **Acoustic Guitar Tuner (`/tuner`)**: Live microphone pitch tracker with ±50¢ analog deviation needle, auto-string detection with hysteresis, and deterministic Karplus-Strong reference string plucks (`E2–A2–D3–G3–B3–E4`).
- **Progress, Adaptive Queue & Peer Benchmarks (`/progress`, `/peers`)**: Longitudinal accuracy/latency/voicing charts, CUSUM breakthrough/regression markers, transition mastery matrix, ranked remedial drill queue, and piece-level peer percentile distributions.

---

## System Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend SPA (React 19 · TypeScript · Vite 8)"]
        UI["Studio Cockpit · Chords & Scales · Tuner · Progress"]
        VEX["VexFlow v5 (Bravura SMuFL)<br/>Grand Staff & Guitar TAB + Beat-to-X Map"]
        SYNTH["Web Audio Synthesis<br/>Cached Karplus-Strong · Multi-Partial Piano · Woodblock Click"]
        DSP["Real-Time Browser DSP<br/>Autocorrelation Pitch Tracker · AudioWorklet Chroma · WAV Encoder"]
    end

    subgraph Backend["FastAPI Async API (Python 3.12 · Clerk JWT · RFC 9457 · Sentry)"]
        ROUTES["Thin REST Routes (/api/me · /api/exercises · /api/sessions)"]
        VAL["Audio Validator<br/>RIFF/WAVE Magic Bytes · <=15MB · <=180s"]
        subgraph ML["Threadpool Audio Pipeline (anyio.to_thread)"]
            BP["Spotify Basic Pitch (ONNX Runtime)<br/>+ STFT Harmonic Peak Fallback"]
            CLUS["2-Pass Strum & Arpeggio Clustering<br/>+ F1 Pitch-Class Chord ID & Voicing Check"]
            ALIGN["Needleman-Wunsch DP Alignment<br/>+ Sakoe-Chiba Temporal Band"]
        end
        subgraph COG["Cognitive & Coaching Engine"]
            HABIT["Habit Detector<br/>EWMA · Std Dev · Harmonic Role Weighting · Page's CUSUM"]
            MAST["Student Mastery Engine<br/>BKT HMM · SuperMemo SM-2 · Thompson Sampling / UCB1"]
            LLM["Grounded Coach<br/>Gemini 1.5 Flash + Deterministic Fallback"]
        end
    end

    DB[("PostgreSQL (Neon Serverless / Local)<br/>SQLModel · Async QueuePool · Alembic")]

    UI --> VEX
    UI --> SYNTH
    UI --> DSP
    DSP -->|"Ephemeral Mono WAV"| ROUTES
    ROUTES --> VAL --> BP --> CLUS --> ALIGN
    ALIGN --> HABIT --> MAST --> LLM
    MAST --> DB
    ROUTES --> DB
```

---

## Algorithms & Engineering Deep Dive

### 1. Real-Time Browser Audio DSP & Detection

Located in [`apps/web/src/lib/audio/`](apps/web/src/lib/audio/):

- **Fundamental Pitch Tracking (`realtime-pitch-tracker.ts`)**:
  - Captures live 2048-sample time-domain frames synced to the actual hardware `AudioContext.sampleRate` (`44.1 kHz` / `48 kHz`) across `70 Hz – 1200 Hz`.
  - Applies an **RMS noise gate** (`-34 dB` default) and **harmonic clarity threshold** (`0.35`) to reject room rumble and unvoiced noise.
  - Computes **exact Pearson-normalized autocorrelation** using precomputed cumulative energy sums, followed by **harmonic sub-multiple rejection** ($k \in \{2, 3, 4\}$ checks prevent 2nd/3rd harmonics from overriding the true fundamental) and **parabolic interpolation** for sub-sample frequency precision.
  - Passes raw estimates through a **5-frame rolling median filter** (averaging adjacent median values only within 6% pitch proximity) to eliminate octave glitches without synthesizing phantom notes.
  - Tuner auto-string switching uses a **60-cent hysteresis margin** so the target string doesn't flicker near boundaries.
- **Off-Main-Thread Chromagram & Chord Detection (`chroma-processor.ts`, `chord-detector.ts`)**:
  - Streams 2048-sample PCM buffers from a dedicated **`AudioWorkletProcessor`** without blocking UI rendering.
  - Matches normalized 12-semitone chroma vectors against 7 chord templates (`major`, `m`, `sus4`, `dim`, `7`, `maj7`, `m7`) via **weighted cosine similarity** with a **non-chord-tone energy penalty** (`0.25 × nonChordEnergy`) and a **7th-degree energy gate** (`>= 0.35 × rootEnergy`) to prevent triads from falsely triggering 7th chords.
- **Client-Side WAV Capture (`wav-encoder.ts`)**:
  - Encodes raw microphone PCM directly into standard 16-bit mono `RIFF/WAVE` buffers for upload to the evaluation pipeline.

### 2. Deterministic Acoustic Synthesis Engine

Located in [`apps/web/src/lib/audio/practice-audio-engine.ts`](apps/web/src/lib/audio/practice-audio-engine.ts) and [`metronome.ts`](apps/web/src/lib/audio/metronome.ts):

- **Standard Pitch Grounding**: All notes use exact 12-TET equal temperament: $f = 440 \times 2^{(\text{MIDI} - 69)/12}$ (A4 = 440.00 Hz, C4 = 261.63 Hz, Guitar E2 = 82.41 Hz).
- **Karplus-Strong Guitar String Modeling**:
  - Fractional-sample delay line $N = \lfloor f_s / f_0 - 0.5 \rfloor$ with frequency-dependent 2-point lowpass feedback damping $\alpha \in [0.990, 0.996]$.
  - Uses a **pitch-seeded deterministic LCG excitation** windowed by a half-sine envelope and 1-pole plectrum stiffness filter (zero `Math.random()` timbre jitter), routed through acoustic guitar body resonance peaking + soundboard lowpass filters.
  - Polyphonic strumming applies directional string sweeps (`4 ms` accented / `6 ms` normal) with $0.85 / \sqrt{M}$ headroom scaling.
- **Multi-Partial Inharmonic Piano Synthesis**:
  - 6-partial additive synthesis modeling real piano string stiffness dispersion: $f_k = k f_0 \sqrt{1 + B k^2}$ ($B = 0.00035$ bass, $B = 0.00015$ treble/mid).
  - Dual-stage exponential decay (70% prompt sound + 30% aftersound), 5 ms highpassed felt hammer strike transient, smooth $\sin^2$ attack and $\cos^2$ damper release ramps to exact `0.0`.
- **Dual-Cavity Wooden Metronome (`metronome.ts`)**: Synthesizes distinct `1150 Hz` downbeat and `850 Hz` upbeat acoustic woodblock clicks scheduled directly on the Web Audio timeline.
- **O(1) PCM Buffer Caching & Lookahead Scheduler**:
  - Synthesized guitar plucks (`pluckBufferCache`), strum strings (`guitarStringCache`), and piano notes (`pianoBufferCache`) are cached by quantized parameter keys, dropping per-note synthesis cost from ~15 ms to `<0.001 ms` and eliminating measure-boundary audio stutter.
  - Playback schedules measures up to `2.5 s` ahead on `AudioContext.currentTime` using monotonically advancing absolute beat timestamps so loops and multi-measure pieces never drift or drop audio.

### 3. Server-Side Polyphonic Music Detection & Alignment

Located in [`src/lib/audio/`](src/lib/audio/) and [`src/lib/practice/evaluator.py`](src/lib/practice/evaluator.py):

1. **Upload Security & Validation (`validation.py`)**: Inspects `RIFF`/`WAVE` magic bytes, enforces max payload size (`15 MB`), positive sample rate, and max duration (`180 s`).
2. **Polyphonic Multipitch Transcription (`transcription.py`)**:
   - **Primary Engine**: **Spotify Basic Pitch** neural multipitch estimator running on **ONNX Runtime** (lightweight CPU inference without TensorFlow). Preloaded and warmed up during FastAPI `lifespan` startup and offloaded to worker threads via `anyio.to_thread.run_sync`.
   - **Spectral Fallback**: If `basic-pitch` is absent in minimal environments, falls back to Hann-windowed 2048-sample STFT (hop 1024) peak extraction across `C2–C6` (`65.4–1046.5 Hz`) with 2nd/3rd/4th harmonic overtone suppression and temporal note chaining.
3. **Two-Pass Strum & Arpeggio Clustering (`voicing.py`)**:
   - Groups asynchronous note onsets (such as rolled guitar strums or arpeggiated piano voicings) into chord strikes using a `180 ms` strum window, `350 ms` max strum span, and `400 ms` arpeggio chaining threshold.
4. **Harmonic Voicing & Chord Identification (`voicing.py`, `src/lib/music/chord_model.py`)**:
   - Identifies performed chords across 9 qualities (`major`, `m`, `7`, `maj7`, `m7`, `dim`, `aug`, `sus2`, `sus4`) via F1-scored pitch-class set matching.
   - Evaluates **voicing completeness** note-by-note against expected MIDI pitches (or pitch classes), surfacing exact `matched_pitches`, `missed_notes`, and `extra_notes`.
5. **Global Score-to-Performance Alignment (`alignment.py`)**:
   - Runs **Needleman-Wunsch Dynamic Programming** to align performed chord strikes against the reference score progression, tolerating skipped measures, false starts, and extra strums.
   - Enforces a **Sakoe-Chiba temporal band constraint** ($|t_{\text{det}} - t_{\text{exp}}| \le W$, with $W = \max(2.5\text{ s}, 4 \times \text{beat\_sec})$) so temporally distant occurrences of the same chord cannot falsely align.
   - Outputs per-chord signed timing error (`onset_error_ms`, negative = rushing, positive = dragging), match status, and voicing metrics.

### 4. Adaptive Cognitive Modeling & Habit Detection

Located in [`src/lib/adaptive/`](src/lib/adaptive/):

- **Statistical Habit Pattern Detection (`patterns.py`)**:
  - Computes **Exponentially Weighted Moving Averages (EWMA, $\alpha = 0.35$)** and sample standard deviations across takes to detect four motor habit classes:
    1. **Transition Lag** (persistent hesitation entering a specific chord change)
    2. **Tempo Rushing** (systematic early downbeats)
    3. **Tempo Dragging** (systematic late downbeats)
    4. **Voicing Drops** with **harmonic-role severity weighting** (omitting the chord **root** or **3rd** scores severity `4.0–5.0`, **7th** `3.5`, **5th** `2.2`).
- **Page's Two-Sided CUSUM Change-Point Detection (`patterns.py`, `mastery.py`)**:
  - Tracks sequential latency shifts ($S^+_t = \max(0, S^+_{t-1} + x_t - \mu - k)$ and $S^-_t = \max(0, S^-_{t-1} + \mu - x_t - k)$ with $k = 0.5\sigma, h = 4.0\sigma$) to identify the exact take where a motor habit formed (`deterioration`) or was broken (`improvement`).
- **Bayesian Knowledge Tracing — BKT (`knowledge_tracing.py`)**:
  - Models latent mastery $P(L_t)$ for every `(user, instrument, chord_from -> chord_to)` transition as a 2-state Hidden Markov Model (Corbett & Anderson, 1995) with $P(L_0) = 0.20$, $P(T) = 0.15$, $P(S) = 0.08$, $P(G) = 0.12$, and mastery lock at $P(L_t) \ge 0.95$.
- **SuperMemo SM-2 Spaced Repetition (`spaced_repetition.py`)**:
  - Maps continuous take accuracy, timing deviation (`±25 ms` to `±130 ms`), and voicing completeness into musical quality grades $q \in \{0..5\}$, updating each transition's Ease Factor ($EF' = \max(1.3, EF + 0.1 - (5-q)(0.08 + (5-q)\cdot 0.02))$) and next review interval (`1d → 6d → interval × EF`).
- **Multi-Armed Bandit Drill Selection (`bandit.py`, `interventions.py`, `tracking.py`)**:
  - Persists **Beta-Binomial Thompson Sampling** posteriors ($\theta \sim \text{Beta}(\alpha, \beta)$, plus a deterministic **UCB1** policy) across 4 remedial drill arms:
    - `isolated_transition` (2-bar tempo-ramped loop)
    - `subdivision_click` (rhythmic pulse lock)
    - `voicing_arpeggio` (note-by-note finger clarity drill)
    - `gradual_tempo_ramp` (`70% → 85% → 100% → 105%` progression)
  - Follow-up takes are compared against baseline metrics (`evaluate_drill_outcome`) to update bandit rewards automatically when measurable latency/voicing gains occur.

### 5. Sheet Music Engraving & Audio-Visual Sync

Located in [`apps/web/src/lib/notation/vexflow-score-builder.ts`](apps/web/src/lib/notation/vexflow-score-builder.ts) and [`apps/web/src/components/practice/flowing-notation-stand.tsx`](apps/web/src/components/practice/flowing-notation-stand.tsx):

- Uses **VexFlow v5 (`vexflow/bravura`)** with embedded **Bravura (SMuFL)** and **Academico** fonts (zero external font CDN requests).
- **Piano Grand Staff**: Curly `StaveConnector` brace, Treble + Bass clefs, automatic key/time signatures, `Accidental.applyAccidentals` music-theory accidental engraving, automatic rests & beaming, and joint cross-staff voice formatting.
- **Guitar Tablature**: Vertical `TAB` clef, `SVGContext.backgroundFillStyle` string-line masking for Light & Dark modes, downward rhythmic stems, and flat horizontal beams (`Beam.generateBeams` with `flatBeams: true`).
- **Piecewise Linear Engraved Sync**: Records every formatted note's exact `getAbsoluteX()` into a monotonic `BeatAnchor[]` map and interpolates the GPU `translate3d(...)` scroll position against `AudioContext.currentTime` at 60 fps without re-rendering SVG frames during playback.

### 6. Grounded AI Coaching

Located in [`src/lib/adaptive/llm_coach.py`](src/lib/adaptive/llm_coach.py) and [`src/lib/adaptive/reports.py`](src/lib/adaptive/reports.py):

- Constructs a deterministic, verified JSON fact bundle (accuracy %, signed onset ms, voicing %, missed notes, active habit patterns) before calling **Google Gemini 1.5 Flash** (`httpx` async), preventing hallucinated numbers.
- Automatically falls back to a full deterministic pedagogical coaching letter and structured drill prescription if `GEMINI_API_KEY` is unset or the request times out.

---

## Data Model & Persistence

Defined in [`src/models/user.py`](src/models/user.py) and [`src/models/practice.py`](src/models/practice.py) using **SQLModel** + **Alembic** autogenerated migrations:

| Table | Purpose |
| :--- | :--- |
| `users` | Product user keyed by Clerk JWT `sub` (`id`), profile metadata, onboarding status |
| `exercises` | Curated multi-measure pieces and auto-provisioned custom chord drills (`progression_json`, tempo, instrument, difficulty) |
| `practice_sessions` | Completed takes linked to user, exercise, optional `intervention_id`, accuracy, mean timing error, and voicing score |
| `session_chord_metrics` | Per-chord alignment results (`expected_chord`, `detected_chord`, `onset_error_ms`, `voicing_completeness`, missed/extra notes) |
| `habit_patterns` | Longitudinal habit state (`transition_lag`, `tempo_rushing`, `tempo_dragging`, `voicing_drop`) with evidence count & status |
| `adaptive_interventions` | Generated remedial drills with target tempo, repetitions, completion flag, and measured improvement delta |
| `transition_mastery` | Per-`(user, instrument, chord_from, chord_to)` cognitive state: BKT `p_known`, SM-2 `interval_days`/`ease_factor`/`repetitions`, EWMA latency, and all 4 Thompson Sampling $(\alpha, \beta)$ posterior pairs |

---

## Built-in Repertoire

| Piece | Instrument | Key & Meter | Scope |
| :--- | :--- | :--- | :--- |
| **Waltz No. 2** (Shostakovich) | Piano | C Minor • `3/4` | 32 measures (3/4 waltz accompaniment + melody) |
| **Knockin' Cadence** | Guitar | G Major • `4/4` | 24 measures (Verse / Chorus / Outro strum patterns) |
| **House of the Rising Sun** | Guitar | A Minor • `6/8` | 24 measures (6/8 compound arpeggio/strum feel) |
| **Pachelbel's Canon in C** | Piano | C Major • `4/4` | 32 measures (4 progressive melodic variations) |
| **Four-Chord Anthem** | Guitar | D Major • `4/4` | 32 measures (Intro / Verse / Pre-Chorus / Chorus) |
| **Autumn Jazz Turnaround** | Piano | C Major • `4/4` | 4-bar `Dm7 – G7 – Cmaj7 – A7` shell voicing progression |
| **Pop Ballad Cadence** | Piano | C Major • `4/4` | 4-bar `C – G – Am – F` chord progression |

---

## Tech Stack

| Layer | Tools & Libraries |
| :--- | :--- |
| **Frontend** | React 19, TypeScript (strict), Vite 8, Tailwind CSS 4, Motion, GSAP, Lenis, Lucide |
| **Notation, Theory & DSP** | VexFlow v5 (`vexflow/bravura` SMuFL), Tonal.js, Web Audio API (`AudioWorklet`, `AudioBuffer`) |
| **Backend API** | Python 3.12, FastAPI, SQLModel, SQLAlchemy (Async `QueuePool`), Pydantic v2, Uvicorn, Scalar OpenAPI |
| **Audio & ML** | Spotify Basic Pitch, ONNX Runtime, Librosa, SciPy, NumPy |
| **Adaptive & AI** | Custom BKT / SM-2 / CUSUM / Thompson Sampling / UCB1 engine, Google Gemini 1.5 Flash (`httpx`) |
| **Database & Auth** | PostgreSQL (Neon Serverless / Local), `asyncpg`, `psycopg2`, Alembic, Clerk (`@clerk/react` + `clerk-backend-api`) |
| **Observability & QA** | Sentry (`@sentry/react` + `sentry-sdk`), `X-Request-ID` correlation, Vitest (302 tests), Pytest/AnyIO (102 tests), Playwright, Mypy (strict), Ruff |

---

## Getting Started

### Prerequisites

- **Python**: `>=3.12, <3.13`
- **Node.js**: `v20+` or `v22+`
- **pnpm**: `v9+` (`npm install -g pnpm`)
- **PostgreSQL**: Local Postgres or a [Neon](https://neon.tech) database URL

### 1. Clone & Install

```bash
git clone https://github.com/Yashvir-13/Sonus.git
cd Sonus

# Install frontend & workspace dependencies
pnpm install

# Create and activate Python 3.12 virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install backend dependencies
poetry install
```

### 2. Environment Variables

Configure `.env` (root) and `apps/web/.env` (`.env` files are gitignored; never commit secrets):

```env
# Root .env (Backend API)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sonus
ENV=development
CLERK_SECRET_KEY=your_clerk_secret_key
GEMINI_API_KEY=your_gemini_api_key          # Optional (deterministic fallback works without it)
SENTRY_DSN=                                 # Optional
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

```env
# apps/web/.env (Frontend SPA)
VITE_API_BASE_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 3. Apply Database Migrations

```bash
pnpm run db:upgrade
```

*(For schema edits in `src/models/`, always autogenerate migrations with `pnpm run db:make "describe change"`.)*

### 4. Start Local Development

```bash
# Starts FastAPI (:8000) and Vite (:5173) concurrently
pnpm run dev
```

- Web Studio: [http://localhost:5173](http://localhost:5173)
- Interactive Scalar API Docs (dev only): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## API Overview

Protected endpoints authenticate via Clerk Bearer JWTs (or `Authorization: Bearer dev_token` when `ENV=development`) and return RFC 9457 Problem Details (`application/problem+json`) with `X-Request-ID` tracing.

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/health` | `GET` | Service and database readiness check |
| `/api/me` | `GET` / `POST` / `PATCH` | Read, bootstrap, or update musician profile |
| `/api/me/stats` | `GET` | Longitudinal accuracy, timing error, and voicing stats |
| `/api/me/mastery` | `GET` | BKT mastery records, SM-2 intervals, and Thompson-ranked drill queue |
| `/api/me/habits` | `GET` | Active and emerging motor habit patterns |
| `/api/exercises` | `GET` | List built-in repertoire (`GET /api/exercises/{id}` supports dynamic chord drills) |
| `/api/sessions` | `GET` / `POST` | List history or create a session (auto-provisions custom chord drills) |
| `/api/sessions/{id}/take` | `POST` | Evaluate a recorded `audio/wav` multipart take or symbolic chord JSON payload |

---

## Testing & Quality Assurance

```bash
# Backend test suite (102 tests: transcription, alignment, voicing, BKT, SM-2, CUSUM, bandit, API)
pytest -v

# Backend strict static typing
mypy src/ tests/

# Frontend unit & component test suite (302 tests across 30 files)
pnpm --prefix apps/web test -- --run

# Frontend strict TypeScript & production Vite build
pnpm --prefix apps/web build
```

---

## Privacy, Security & Reliability

- **Zero Audio Retention ([ADR-0001](docs/adr/0001-ephemeral-raw-audio-retention.md))**: Uploaded WAV takes are processed in temporary scratch files and unlinked immediately inside `finally` blocks—raw recordings are never stored in object storage or the database.
- **Non-Blocking ML Inference**: Neural transcription and FFT processing run inside `anyio.to_thread.run_sync` worker pools and are pre-warmed during FastAPI `lifespan` startup to eliminate cold-start latency spikes.
- **Cloud DB Resilience (`src/lib/db.py`)**: Persistent `QueuePool` (`statement_cache_size=0`, `pool_recycle=300`) with `@lru_cache` IPv4 resolution and Neon SNI endpoint routing to avoid dual-stack IPv6 connection timeouts on Windows/cloud hosts.
- **Structured Observability**: `X-Request-ID` correlation middleware bound to `contextvars`, RFC 9457 Problem Details responses, and Sentry error reporting.

---

## Repository Structure

```text
├── apps/web/                        # Vite + React 19 + TypeScript SPA
│   └── src/
│       ├── api/                     # Typed API clients & DTOs
│       ├── components/              # Practice studio, VexFlow stand, waterfall, tuner, chords, progress, peers
│       └── lib/
│           ├── adaptive/            # Frontend cognitive state mappers
│           ├── audio/               # Pitch tracker, AudioWorklet chroma, chord detector, Karplus-Strong & piano DSP
│           ├── instruments/         # Instrument strategies
│           ├── music/               # Repertoire catalog, chord model, voicings, theory lexicon
│           └── notation/            # VexFlow v5 Bravura SMuFL engraving builder & beat-to-X sync
├── src/                             # FastAPI + SQLModel backend
│   ├── alembic/                     # Autogenerated database migrations
│   ├── lib/
│   │   ├── adaptive/                # BKT, SM-2, EWMA/CUSUM habits, Thompson/UCB1 bandit, Gemini coach
│   │   ├── audio/                   # WAV validation, Basic Pitch ONNX + STFT, clustering, voicing, Needleman-Wunsch DP
│   │   ├── auth/                    # Clerk JWT verification & cached email lookup
│   │   ├── fastapi/                 # Server factory, RFC 9457 handlers, X-Request-ID middleware, Scalar docs
│   │   ├── music/                   # Canonical chord theory & repertoire seeding
│   │   └── practice/                # Pure take evaluator & transactional persistence adapter
│   ├── models/                      # SQLModel tables (users, exercises, sessions, metrics, habits, mastery)
│   └── services/api/routes/         # Thin HTTP route modules
├── docs/                            # ADRs (Zero Audio Retention), design specs, research
├── scripts/                         # CLI runners for API, web, DB migrations, auth tokens
└── tests/                           # Pytest + AnyIO backend test suite
```

---

## License

MIT
