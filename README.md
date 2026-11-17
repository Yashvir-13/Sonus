# § SONUS — Adaptive Musical Practice System

**Sonus** is an interactive guitar and piano practice studio that engraves real sheet music and tablature, listens to your instrument through your microphone, pinpoints exact millisecond timing slips and missed chord notes, and adapts your practice routine over time.

Instead of rhythm-game abstractions or passive metronomes, Sonus focuses on real musicianship: **VexFlow SMuFL engraved notation**, **Current Chord → Next Chord** hand preparation, **objective polyphonic take evaluation**, and **longitudinal cognitive skill tracking**.

---

## Why Sonus?

- **Real sheet music & tablature, not toy grids** — Powered by **VexFlow v5 + Bravura (SMuFL)** for publication-grade piano Grand Staff (curly brace, automatic key & time signatures, music-theory accidental engraving, rests, beaming) and Guitar `TAB` (vertical `TAB` clef, string-masked fret numerals, downward rhythmic stems & flat beams).
- **Sub-millisecond audio-to-sheet synchronization** — The scrolling sight-reading caliper interpolates piecewise linearly across VexFlow's exact engraved notehead coordinates (`note.getAbsoluteX()`) locked directly to the Web Audio hardware clock (`AudioContext.currentTime`).
- **Standard-pitch, deterministic acoustic synthesis** — Every note uses exact equal temperament ($f = 440 \times 2^{(\text{MIDI}-69)/12}$) with cached Karplus-Strong guitar strings, multi-partial inharmonic piano buffers, and dual-cavity wooden metronome clicks—zero main-thread stutter and bit-identical reference tones.
- **Objective acoustic mistake pinpointing** — Recorded takes are transcribed polyphonically with **Spotify Basic Pitch (ONNX)** and aligned to the target score via dynamic programming to measure exact onset error (rushing vs. dragging in ms) and note-by-note voicing completeness.
- **Privacy-first by architecture (Zero Audio Retention)** — Audio uploads are validated, analyzed in memory/ephemeral scratch space, and immediately discarded. Only symbolic timing and harmony metrics are persisted.

---

## Key Features

### 1. Musician's Practice Room (`/practice/:slug`)
- **Dual Modes**: Switch seamlessly between **Listen Mode** (continuous score preview) and **Practice Mode** (metronome count-in + live microphone recording).
- **VexFlow v5 Engraved Notation Stand**:
  - **Piano Mode**: Flowing **Grand Staff** (Treble + Bass with curly brace, key/time signatures, natural/sharp/flat rules, subtle RH Emerald / LH Amber notehead accents) or **Falling Keys** waterfall view.
  - **Guitar Mode**: Continuous **6-string `TAB`** with pixel-aligned tuning rail (`1 (e) 329Hz` – `6 (E) 82Hz`), rhythmic stems & eighth-note beams, and directional strum indicators (`↓D>`, `↑U`).
- **Hand Preparation Dock**: Side-by-side **Now Playing → Prepare Next** diagrams (6-string guitar fretboards with finger digits + 25-key piano keyboards) so your fingers prepare before the barline arrives.
- **Interactive Controls**: Click any bar on the score or bar jump strip to seek instantly, adjust tempo (`70%`, `85%`, `100%`, or custom BPM), or isolate any tricky chord change in a **2-Bar Transition Loop**.
- **Dual-Theme Acoustic Studio Design**: High-contrast **Studio Alabaster** (Light) and **Deep Obsidian** (Dark) themes with live SVG re-engraving.

### 2. Chords & Scales Compendium (`/chords`)
- Complete harmonic reference across all **12 chromatic roots** (triads, sevenths, extended/altered voicings, and scales/modes).
- Synchronized guitar fretboard and piano keyboard diagrams with consistent strummed and arpeggiated audio previews.
- **One-click Studio Drills**: Launch any chord directly into an isolated 4-measure practice drill (`/practice/chord-<name>`), auto-provisioned seamlessly on both frontend and backend.

### 3. Precision Acoustic Guitar Tuner (`/tuner`)
- Real-time autocorrelation pitch tracker with ±50¢ analog deviation needle and auto-string detection with hysteresis.
- Bit-identical Karplus-Strong reference string plucks for standard tuning (`E2`, `A2`, `D3`, `G3`, `B3`, `E4`).

### 4. Longitudinal Progress, Cognitive Coaching & Peers (`/progress`, `/peers`)
- **Cognitive Skill Modeling**: Tracks chord transition mastery using **Bayesian Knowledge Tracing (BKT)**, schedules spaced reviews via **SM-2**, detects plateaus and breakthroughs with **CUSUM**, and recommends targeted isolation drills using **Thompson Sampling**.
- **Grounded AI Coaching**: Generates actionable practice feedback via Gemini strictly grounded in pre-computed timing and pitch fact bundles (with deterministic offline fallbacks when `GEMINI_API_KEY` is omitted).
- **Peer Benchmarks**: Compare accuracy, timing latency, and voicing completeness against piece-level distributions.

### 5. Built-in Repertoire
| Piece | Instrument | Key & Meter | Scope |
| :--- | :--- | :--- | :--- |
| **Waltz No. 2** (Shostakovich) | Piano | C Minor • `3/4` | 32 measures (Boom-Chick-Chick LH + melody) |
| **Knockin' Cadence** | Guitar | G Major • `4/4` | 24 measures (Verse / Chorus / Outro strumming) |
| **House of the Rising Sun** | Guitar | A Minor • `6/8` | 24 measures (6/8 compound arpeggio/strum feel) |
| **Pachelbel's Canon in C** | Piano | C Major • `4/4` | 32 measures (4 melodic variations) |
| **Four-Chord Anthem** | Guitar | D Major • `4/4` | 32 measures (Intro / Verse / Pre-Chorus / Chorus) |
| **Autumn Jazz Turnaround** | Piano | C Major • `4/4` | 4-bar ii–V–I–VI7 shell voicing progression |
| **Pop Ballad Cadence** | Piano | C Major • `4/4` | 4-bar I–V–vi–IV chord progression |

---

## System Architecture

```mermaid
flowchart LR
    subgraph Web["Frontend SPA (apps/web)"]
        UI["React 19 + TypeScript + Tailwind"]
        VEX["VexFlow v5 (Bravura SMuFL)<br/>Grand Staff & Guitar TAB"]
        AUDIO["Web Audio Engine<br/>Cached Karplus-Strong & Piano DSP"]
        MIC["Mic Recorder & Pitch Tracker<br/>(WAV + Autocorrelation)"]
    end

    subgraph API["Backend API (FastAPI + Python 3.12)"]
        ROUTES["Thin REST Routes<br/>Clerk JWT + RFC 9457 Errors"]
        ML["Threadpool Audio Pipeline<br/>Basic Pitch ONNX + DP Alignment"]
        COG["Cognitive Engine<br/>BKT · SM-2 · CUSUM · Thompson"]
        COACH["Grounded Coach<br/>Gemini + Deterministic Fallback"]
    end

    DB[("PostgreSQL (Neon / Local)<br/>SQLModel + Alembic")]

    UI --> VEX
    UI --> AUDIO
    MIC -->|"Ephemeral WAV (<=15MB)"| ROUTES
    ROUTES --> ML
    ML --> COG
    COG --> COACH
    ROUTES --> DB
    COG --> DB
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript (strict), Vite 8, Tailwind CSS 4, Motion, GSAP, Lenis, Lucide |
| **Music Engraving & Theory** | VexFlow v5 (`vexflow/bravura` SMuFL), Tonal.js, Web Audio API |
| **Authentication** | Clerk (`@clerk/react` + backend JWT verification with `dev_token` local mode) |
| **Backend API** | Python 3.12, FastAPI, SQLModel, SQLAlchemy (Async `QueuePool`), Pydantic v2 |
| **Audio & ML** | Spotify Basic Pitch (ONNX Runtime), NumPy, SciPy, Librosa |
| **Database** | PostgreSQL (Neon serverless / local Postgres), Alembic autogenerated migrations |
| **Testing & Tooling** | Vitest + Testing Library (302 tests), Pytest + AnyIO (102 tests), Playwright, Mypy (strict), pnpm |

---

## Getting Started

### Prerequisites

- **Python**: `>=3.12, <3.13`
- **Node.js**: `v20+` or `v22+`
- **pnpm**: `v9+` (`npm install -g pnpm`)
- **PostgreSQL**: Local Postgres instance or a [Neon](https://neon.tech) connection string

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Yashvir-13/Sonus.git
cd Sonus

# Install frontend and workspace packages
pnpm install

# Create and activate Python 3.12 virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install Python dependencies
poetry install
# (or: pip install -e .)
```

### 2. Configure Environment Variables

Copy the example files and populate your keys (`.env` files are gitignored—never commit secrets):

- **Root `.env`** (Backend API):
  ```env
  DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sonus
  ENV=development
  CLERK_SECRET_KEY=your_clerk_secret_key
  GEMINI_API_KEY=your_gemini_api_key   # Optional: deterministic coaching works without it
  ```
- **`apps/web/.env`** (Frontend SPA):
  ```env
  VITE_API_BASE_URL=http://localhost:8000
  VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
  ```

### 3. Run Database Migrations

```bash
pnpm run db:upgrade
```

*(When modifying SQLModel tables in `src/models/`, generate migrations via `pnpm run db:make "describe change"` — never hand-write Alembic revisions.)*

### 4. Start the Development Servers

Run both the FastAPI backend (`http://127.0.0.1:8000`) and Vite frontend (`http://localhost:5173`) concurrently:

```bash
pnpm run dev
```

Or run them individually:

```bash
pnpm run service:api   # FastAPI backend (:8000)
pnpm run dev:web       # Vite frontend (:5173)
```

---

## Core API Endpoints

All protected endpoints verify Clerk Bearer JWTs (supporting `Authorization: Bearer dev_token` when `ENV=development`) and return RFC 9457 Problem Details (`application/problem+json`) on errors.

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/health` | `GET` | Service and database health check |
| `/api/me` | `GET` / `POST` / `PATCH` | Fetch, bootstrap, or update the authenticated musician profile |
| `/api/me/stats` | `GET` | Aggregated accuracy, timing latency, and voicing statistics |
| `/api/me/mastery` | `GET` | BKT mastery records, SM-2 review schedule, and ranked drill recommendations |
| `/api/me/habits` | `GET` | Detected recurring timing/voicing habit patterns |
| `/api/exercises` | `GET` | Full built-in repertoire catalog (`GET /api/exercises/{id}` supports dynamic chord drills) |
| `/api/sessions` | `GET` / `POST` | List practice history or start a new practice session (auto-provisions chord drills) |
| `/api/sessions/{id}/take` | `POST` | Evaluate a recorded WAV take (`multipart/form-data`) or symbolic chord JSON payload |

---

## Testing & Verification

```bash
# Backend test suite (102 tests: audio alignment, voicing, BKT/SM-2, sessions, auth)
pytest -v

# Backend strict type check
mypy src/ tests/

# Frontend unit & component test suite (302 tests across 30 files)
pnpm --prefix apps/web test -- --run

# Frontend strict TypeScript & production Vite build
pnpm --prefix apps/web build
```

---

## Project Structure

```text
├── apps/
│   └── web/                         # Vite + React 19 + TypeScript SPA
│       └── src/
│           ├── api/                 # Typed fetch clients & DTOs
│           ├── components/
│           │   ├── auth/            # Clerk sign-in modal, page & shell
│           │   ├── community/       # Peer percentile benchmarks
│           │   ├── landing/         # Single-room cinematic stage
│           │   ├── practice/        # Studio cockpit, VexFlow stand, waterfall, fretboards
│           │   ├── progress/        # BKT mastery, CUSUM trajectory & drill queue
│           │   ├── settings/        # Studio preferences & calibration modal
│           │   ├── theory/          # 12-root Chords & Scales compendium
│           │   └── tuner/           # Acoustic guitar tuner
│           └── lib/
│               ├── adaptive/        # Frontend BKT/SM-2/recommendation mappers
│               ├── audio/           # Cached Karplus-Strong, piano DSP, pitch tracker, WAV encoder
│               ├── instruments/     # Instrument strategy helpers
│               ├── music/           # Repertoire catalog, chord model, voicings, theory lexicon
│               └── notation/        # VexFlow v5 Bravura SMuFL engraving builder & beat-to-X sync
├── src/                             # FastAPI + SQLModel backend
│   ├── alembic/                     # Autogenerated database migrations
│   ├── lib/
│   │   ├── adaptive/                # BKT, SM-2, CUSUM, Thompson Sampling, Gemini coach
│   │   ├── audio/                   # WAV validation, Basic Pitch ONNX, alignment, voicing
│   │   ├── auth/                    # Clerk JWT verification & lazy email resolution
│   │   ├── music/                   # Canonical chord theory & exercise seeding
│   │   └── practice/                # Take evaluation pipeline & transactional persistence
│   ├── models/                      # SQLModel tables (users, exercises, sessions, mastery)
│   └── services/api/routes/         # Thin HTTP route handlers
├── docs/                            # ADRs (e.g. Zero Audio Retention), design docs, research
├── scripts/                         # CLI helpers (db, API, web, auth token)
└── tests/                           # Pytest + AnyIO backend test suite
```

---

## License

MIT
