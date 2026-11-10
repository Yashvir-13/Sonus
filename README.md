# Sonus — Adaptive Music Practice

Sonus is an interactive practice companion for guitar and piano. It listens to you play through your microphone, catches timing slips and chord transition bottlenecks in real time, and builds personalized practice routines based on what your hands actually need to work on.

Unlike rhythm games or passive metronomes, Sonus focuses on real instrument mechanics: preparing your fingers for the next chord shape ahead of time, identifying whether you're rushing or dragging transitions, and tracking which chord changes you've genuinely mastered over time.

---

## Highlights

- **Musician's Practice Room**:
  - Side-by-side **Current Chord → Next Chord** hand preparation dock (guitar fretboards with finger placement and 25-key piano keyboards).
  - Interactive metronome with dynamic time signatures (e.g. 4/4 ballads, 3/4 waltzes).
  - Realistic built-in audio synthesis for guitar strumming patterns (Karplus-Strong) and multi-partial piano accompaniment so you can practice with authentic audio references.
  - In-browser low-latency chromagram HUD (<30ms) for instant visual feedback.

- **Objective Mistake Pinpointing**:
  - Neural polyphonic multipitch transcription (powered by Spotify Basic Pitch) and sequence alignment.
  - Measures onset timing error in milliseconds (spotting whether you're rushing early by 25ms or dragging behind by 40ms) and checks chord voicing completeness note-by-note.

- **Cognitive Practice Queue**:
  - Tracks transition mastery across practice sessions using Bayesian Knowledge Tracing (BKT) and spaced review intervals (SM-2).
  - Automatically isolates tricky 2-chord transitions and recommends targeted practice drills (tempo ramps, subdivision clicks, arpeggio sweeps) via reinforcement learning bandit algorithms.

- **Grounded AI Coaching**:
  - Pedagogical practice summaries and tailored feedback letters powered by Gemini 1.5 Flash, strictly grounded on your take's measured timing and pitch data (with deterministic offline fallbacks).

- **Authentic Built-in Repertoire**:
  - Guitar and piano repertoire with full multi-measure scores: Bob Dylan's *Knockin' on Heaven's Door*, Pachelbel's *Canon in C*, *House of the Rising Sun*, and Shostakovich's *Waltz No. 2*.

- **Zero Audio Storage**:
  - Takes are evaluated ephemerally. Raw audio is processed and discarded immediately—only symbolic timing and note statistics are saved.

---

## Tech Stack

| Layer | Tools |
|---|---|
| **Web App** | React 19, TypeScript, Vite, Tailwind CSS, Web Audio API |
| **Backend API** | Python 3.12, FastAPI, SQLModel / SQLAlchemy (Async), Pydantic v2 |
| **Database & Migrations** | PostgreSQL (Neon serverless / local Postgres), Alembic |
| **Audio & ML** | Spotify Basic Pitch (ONNX Runtime), Tonal.js, NumPy, SciPy |
| **Testing & CI** | Pytest (AnyIO), Vitest, Mypy (strict), GitHub Actions |

---

## Getting Started

### Prerequisites

- **Python**: 3.12 (>= 3.12, < 3.13)
- **Node.js**: v20 or v22
- **pnpm**: v9 or v10 (`npm install -g pnpm`)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Yashvir-13/Sonus.git
cd Sonus

# Install frontend and workspace tools
pnpm install

# Setup Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt  # or: poetry install
```

### 2. Environment Setup

Create `.env` files in the root and in `apps/web`:

```bash
# Root API environment (.env)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sonus
ENV=development
CLERK_SECRET_KEY=your_clerk_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here  # Optional; fallback reports work without it

# Frontend environment (apps/web/.env)
VITE_API_BASE_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

### 3. Database Migrations

Apply the database schema:

```bash
pnpm run db:upgrade
```

### 4. Run the Development Server

Start both the FastAPI backend (`:8000`) and the Vite web client (`:5173`) concurrently:

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running Tests & Type Checks

Both frontend and backend are covered by comprehensive automated test suites:

```bash
# Run backend tests (87 passing tests covering audio alignment, BKT, API routes)
pytest tests/

# Run backend strict typecheck
mypy src/ tests/

# Run frontend unit & component tests (251 passing tests)
pnpm --filter web test -- --run

# Run frontend build check
pnpm --filter web build
```

---

## Project Structure

```text
├── apps/
│   └── web/                   # Vite + React + TypeScript frontend
│       ├── src/
│       │   ├── api/           # Typed API fetch clients
│       │   ├── components/    # Practice room cockpit, notation stand, progress charts
│       │   ├── lib/audio/     # Web Audio API engine, synthesis, pitch tracking
│       │   └── lib/music/     # Repertoire catalog and chord voicings
├── src/                       # FastAPI backend
│   ├── alembic/               # Database migrations
│   ├── lib/
│   │   ├── adaptive/          # Cognitive modeling (BKT, SM-2, bandit, CUSUM)
│   │   ├── audio/             # Decoder, validation, and multipitch inference
│   │   ├── music/             # Seed repertoire and chord utilities
│   │   └── practice/          # Dynamic programming alignment & evaluators
│   ├── models/                # SQLModel database tables and schemas
│   └── services/api/routes/   # FastAPI route handlers
└── tests/                     # Pytest suite
```

---

## License

MIT
