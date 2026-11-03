# Current File Structure

This document shows the current file structure and short descriptions.

## Root

- `apps/` - Frontend workspace (`apps/web` Vite + React 19 + TypeScript + Tailwind CSS 4).
- `docs/` - Project documentation, ADRs (`docs/adr/`), research, and design specifications.
- `infra/` - Empty infrastructure placeholder (no CDK yet).
- `scripts/` - Helper scripts for local development and end-to-end simulation workflows.
- `src/` - Backend Python 3.12 + FastAPI + SQLModel source.
- `tests/` - Backend Pytest test suite (unit, integration, and cognitive adaptive models).
- `.agents/rules/` - Modular agent rules (`archival-music-desk-design.md`, TypeScript, SQLModel, auth/db, SOLID, commits).
- `.agents/skills/` - Superpowers skills framework (TDD, systematic debugging, planning, etc.).
- `.cursor/rules/` - Cursor `.mdc` rules with globs / always-apply.
- `AGENTS.md` - Shared coding-agent instructions (Cursor, Claude Code, Codex, Antigravity).
- `CLAUDE.md` / `GEMINI.md` - Thin pointers to `AGENTS.md` and Superpowers for Claude Code / Antigravity.
- `Project_proposal.pdf` - Project proposal for Adaptive Musical Practice System.
- `implementation_plan.pdf` - Phased eight-week implementation plan.
- `.env.example` / `.env.example.api` - Root environment templates.
- `alembic.ini` - Alembic migration configuration.
- `package.json` - Root Node scripts and workspace commands (`pnpm run dev`, `npm run dev`).
- `pnpm-workspace.yaml` & `pnpm-lock.yaml` - PNPM workspace configuration and lockfile.
- `pyproject.toml` - Python project metadata and dependencies.
- `README.md` - Project overview, architecture, cognitive models, and setup guide.

## Apps

### `apps/web`

Vite + React 19 SPA with Clerk (`@clerk/react`), Web Audio synthesis, and real-time pitch tracking.

#### `apps/web/src`

- `api/` - Typed HTTP helpers (`me.ts`, `exercises.ts`, `sessions.ts`).
- `components/`
  - `auth/` - Clerk sign-in shell and modal (`auth-shell.tsx`, `sign-in-modal.tsx`).
  - `landing/` - Dual-theme cinematic scroll landing page (`landing-page.tsx`, `cinematic-camera-stage.tsx`, `volumetric-smoke-canvas.tsx`, `masthead-nav.tsx`, `colophon-footer.tsx`).
  - `practice/` - Musician's Practice Room (`practice-studio-cockpit.tsx`, `flowing-notation-stand.tsx`, `piano-waterfall-stand.tsx`, `guitar-fretboard-diagram.tsx`, `piano-keyboard-diagram.tsx`, `grand-staff-diagram.tsx`, `codex-repertoire-drawer.tsx`, `take-evaluation-drawer.tsx`).
  - `progress/` - Longitudinal Progress, History & Cognitive Exercise Coach (`progress-dashboard-page.tsx`).
  - `community/` - Peer Percentile Distributions & Piece Leaderboards (`peer-comparison-page.tsx`).
  - `theme/` - Synchronized Light/Dark mode toggle (`theme-toggle.tsx`).
  - `dev/` - Acoustic & FFT developer test bench (`audio-test-bench.tsx`).
- `hooks/` - React hooks (`use-theme.ts`, `use-audio-recorder.ts`).
- `lib/`
  - `adaptive/` - Hybrid BKT + SuperMemo SM-2 + Thompson Sampling Bandit recommendation engine (`recommendation-engine.ts`).
  - `audio/` - Web Audio synthesis & real-time pitch tracking (`practice-audio-engine.ts`, `realtime-pitch-tracker.ts`, `wav-encoder.ts`).
  - `music/` - Polyphonic chord voicings, repertoire catalog, and Tonal.js helpers (`chord-voicings.ts`, `repertoire-catalog.ts`).
- `styles/` - Global (`index.css`) and app (`app.css`) styles with Light & Dark mode CSS custom properties.
- `app.tsx` - Root view router connecting Landing, Practice Room, Progress & Coach, Peer Benchmarks, and Acoustic Bench.
- `main.tsx` - Entry point wrapping `App` in `ClerkProvider`.

## Scripts

- `scripts/run.py` - Unified CLI for db, apps, and API commands (supports `pnpm` and `npm` fallback).
- `scripts/simulate_practice_flow.py` - End-to-end CLI simulation across all 15 operational blocks.

## Backend `src`

- `alembic/` - Database migration scripts and Alembic runtime files.
- `constants/` - Shared SQLAlchemy `MetaData` and naming conventions.
- `enums/` - Enumerations.
- `lib/` - Auth (`clerk.py`), database (`db.py`), RFC 9457 exceptions (`exception.py`), audio transcription (`audio/`), sequence alignment (`alignment/`), adaptive habit & BKT/SM-2/Bandit engines (`adaptive/`), and grounded AI coaching (`coaching/`).
- `models/` - SQLModel table definitions (`user.py`, `exercise.py`, `practice_session.py`, `habit.py`, `intervention.py`).
- `services/api/` - FastAPI application and route modules (`me.py`, `exercises.py`, `sessions.py`, `audio_test.py`).
