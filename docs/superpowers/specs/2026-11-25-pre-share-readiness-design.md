# Sonus Pre-Share Readiness Design Specification

**Date:** 2026-11-25  
**Target Posture:** Public live demo at `sonus.yashvirafterhours.me` (Reddit/external users signing up, playing, recording takes, and testing coaching/progress/benchmarks) + public open-source GitHub repository welcoming external contributors.  
**Approach:** Harden the existing FastAPI + SQLModel + Vite React monolith cleanly without adding new database tables, external queues, or unnecessary infrastructure.

---

## 1. Security, Trust Boundaries & Data Ownership

### 1.1 Access & Guest Boundary
- **Guest Access:** Unauthenticated visitors can enter the Practice Studio, Guitar Tuner, Chords & Scales Compendium, and Peer Benchmarks directly using client-side Web Audio DSP (`masthead-nav.tsx` header CTA enters Practice Studio in guest mode instead of gating behind `SignInModal`).
- **Authenticated Access:** Clerk JWT verification (`ClerkIdentityDep`) is required for creating sessions, submitting audio/chord takes, saving custom exercises, fetching personal history/mastery, and triggering Gemini coaching.
- **Dev Routes & Identities:**
  - `POST /api/audio/test-transcribe` in `src/services/api/routes/audio_test.py` fails **closed** (`404 NotFound`) unless `ENV == "development"`.
  - Remove all personal emails (`yashvir.126@gmail.com`, `yashvir13112004@gmail.com`) and personal Clerk user IDs (`user_3KEP7OZiiKMswrl5f28AjxOV7Kl`) from `apps/web/src/app.tsx` (`isDeveloper` check), `src/lib/auth/clerk.py`, `scripts/simulate_practice_flow.py`, and `postman/environments/adaptive-music-practice.environment.yaml`, substituting synthetic dev placeholders (`user_dev_local_001`, `dev@example.com`).

### 1.2 Upload Bounds, Concurrency & Rate Limiting
- **Streaming Upload Size Enforcement:** Replace unbounded `await uploaded_file.read()` in `src/services/api/routes/sessions.py` and `src/services/api/routes/audio_test.py` with a shared chunked reader (`read_bounded_upload`) that aborts at `15 * 1024 * 1024` bytes (`413 PayloadTooLarge`) before holding arbitrary buffers in RAM.
- **Non-Blocking Transcoding:** In `src/lib/audio/decoder.py`, verify compressed input size $\le 15\text{ MB}$ first, offload `ffmpeg` invocation to `anyio.to_thread.run_sync`, add `-t 180` and `-fs 15728640` caps, and then run `validate_audio_upload` (`RIFF/WAVE`, $\le 15\text{ MB}$, $\le 180\text{s}$).
- **Concurrency & Rate Limiting:** Introduce `src/lib/rate_limit.py` with:
  - An `anyio.CapacityLimiter(2)` gating concurrent audio transcode + transcription operations.
  - An in-memory per-user sliding-window rate limiter (`TooManyRequests` / HTTP `429`, RFC 9457 Problem Details) protecting `/api/sessions/{id}/take`, `/api/sessions/{id}/coaching`, and `/api/exercises` (`POST`), with configurable limits disabled or elevated in test mode if explicitly needed.

### 1.3 Input Validation, Ownership & Secrets
- **Custom Exercise Isolation:** Add `user_id: str | None` (nullable FK to `users.id`, indexed, `ondelete="CASCADE"`) on `Exercise` in `src/models/practice.py` via `pnpm run db:make`. Seeded public exercises have `user_id = None`. `POST /api/exercises` assigns `user_id = identity.user_id`. `GET /api/exercises` and `GET /api/exercises/{id}` (using optional Clerk identity) expose only public (`user_id IS NULL`) or caller-owned exercises, and never mutate/insert DB rows on `GET`.
- **Schema & Session Bounds:** Enforce `max_length=256` on `ProgressionData.chords` (`src/lib/schemas/music.py`), `tempo_bpm: int = Field(ge=30, le=260)` on `PracticeSessionCreate` (`src/models/practice.py`), and verify `body.intervention_id` exists and belongs to `identity.user_id` in `create_practice_session`.
- **Email Collision & Secret Hygiene:**
  - In `ensure_user_exists` (`src/services/api/routes/me.py`), never return another `user_id`'s row on email collision; bind strictly to `identity.user_id` and raise `Unprocessable` if a conflicting Clerk subject attempts to claim an existing verified email.
  - Move `GEMINI_API_KEY` from the URL query string in `src/lib/adaptive/llm_coach.py` to the `x-goog-api-key` header and target `gemini-2.5-flash` (overridable via `GEMINI_MODEL`).
  - Omit localhost origins in `src/lib/fastapi/server.py` when `ENV == "production"`. Sanitize `X-Request-ID` against `^[A-Za-z0-9_.-]{1,64}$` in `src/lib/fastapi/middleware/correlation.py`.
- **Edge Security Headers:** Configure `apps/web/vercel.json` with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self), camera=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, and an enforceable `Content-Security-Policy` (`frame-ancestors 'none'; object-src 'none'; base-uri 'none'`, Clerk/Sentry/API connect/script origins).

---

## 2. Accuracy, Cognitive Engine, Audio DSP & Live Peer Benchmarks

### 2.1 Fresh-DB Seeding & Catalog Parity
- Run `python scripts/seed_exercises.py` idempotently during container startup in `scripts/docker-entrypoint.sh` (supporting `DATABASE_URL` or `DATABASE_HOST` env configurations, logging errors loudly rather than swallowing failures).
- Remove automatic creation of fake `"C, C, C, C"` placeholder rows for missing song IDs in `POST /api/sessions`; return `404 NotFound` for unknown catalog IDs while allowing deterministic `drill_chord_*` creation only when `parse_chord_notes` succeeds.
- Deduplicate `ex_piano_autumn_turnaround` in `apps/web/src/lib/music/song-catalog.ts` and include `ex_piano_pop_ballad` in `src/lib/music/seed_data.py` so FE and BE share the exact same 21 built-in exercises.

### 2.2 ML Inference & Browser Web Audio
- **Cached ONNX Session:** Cache `basic_pitch.inference.Model(ICASSP_2022_MODEL_PATH)` with `@lru_cache(maxsize=1)` inside `src/lib/audio/transcription.py` and pass it as `model_or_model_path` to `predict(...)`, ensuring `warmup_transcription_engine()` actually persists across takes.
- **AudioWorklet & Lifecycle Fixes:**
  - Serve a static same-origin worklet script (`apps/web/public/worklets/chroma-audio-processor.js`) via `createAudioWorkletNode` (avoiding `blob:` URLs for CSP compatibility), with a fallback to `ScriptProcessorNode` only when `AudioWorklet` is unavailable (e.g., unit test DOM mocks).
  - Fix stale `onaudioprocess` closures in `apps/web/src/components/practice/practice-studio-cockpit.tsx` using refs (`instrumentRef`, `currentMeasureIdxRef`, `flowingProgressionRef`, `beatsPerMeasureRef`, `micSensitivityDbRef`), clear `countInTimerRef` on pause/unmount, make `startMicRecording()` return `Promise<boolean>` so failed mic access never starts count-in playback, and close every `AudioContext` in both `practice-studio-cockpit.tsx` and `settings-modal.tsx`.
  - Honor all `StudioPreferences` (`concertPitchHz` in `guitar-tuner-page.tsx`, `micSensitivityDb`, `metronomeSound`, `defaultNotation`) and pause `PianoWaterfallStand`'s `requestAnimationFrame` loop when paused with zero active particles.

### 2.3 Cognitive Engine, Coaching DTO & Live Peer Benchmarks
- **CUSUM, Bandit & Transition Tracking:**
  - In `TakePersistenceAdapter.persist_take` (`src/lib/practice/persistence.py`), pass recent historical transition latencies to `StudentMasteryEngine.assess_transition(..., latency_history=...)` so CUSUM runs on real DB takes, fix `"subdivid"` -> `"subdivision"` and handle `"pocket_groove"` in bandit updates, and record distinct `from_chord` / `to_chord` pairs in `fetch_baseline_metrics` and `evaluator.py`.
  - In `create_session_drill` (`src/services/api/routes/sessions.py`), ensure a real `HabitPattern` row exists in Postgres before creating `AdaptiveIntervention` (no synthetic unpersisted `pat_default_*` FK) and pass aggregated user bandit `alpha`/`beta` priors into `StudentMasteryEngine.select_remedial_strategy`. Have `PracticeStudioCockpit` invoke `POST /api/sessions/{id}/drill` instead of fabricating local `drill_` IDs.
  - Compute real consecutive UTC practice-day `streak_days` in `get_my_stats` (`src/services/api/routes/me.py`).
- **Coaching DTO Alignment:** Align `src/lib/adaptive/llm_coach.py` and `apps/web/src/api/sessions.ts`: emit `letter_grade`, `recommended_tempo_adjustment_bpm` (preserving `recommended_tempo_adjustment` for compatibility), `summary`, and `tailored_drills[].description` (preserving `instructions`). Filter `get_session_coaching` metrics to the latest `take_number`, and compute absolute timing error consistency alongside signed bias in `src/lib/adaptive/reports.py`.
- **Dashboard & Frontend Accuracy:** Guard `fetchUserMastery()` in `progress-dashboard-page.tsx` when `!isSignedIn`, fix `{masteredCount} / {filteredTransitions.length}`, and fix `app.tsx` (`handleTakeCompleted`) so it only updates transitions belonging to `selectedSongId` rather than mutating `transitions[0]` unconditionally.
- **Live PostgreSQL Peer Benchmarks:** Add `GET /api/community/benchmarks` (`src/services/api/routes/community.py`) querying real completed `PracticeSession`, `TransitionMastery`, `Exercise`, and anonymized `User` records (display name `First L.` + `@username`, never emails). Compute empirical cohort medians, user percentiles, and top piece scores; when real completed cohort takes `< 10`, return `is_baseline_fallback: true` with real `cohort_size` and transparently labeled `"Reference Practice Targets (Simulated Baseline)"` entries rather than fabricated `"N = 1,420 Active Musicians"` claims.

---

## 3. Modern Web Platform, Honesty, Repo Hygiene & Scalability

### 3.1 Modern Web Guidance Compliance
- **`dialog`:** Migrate `SignInModal`, `SettingsModal`, `StudioSessionSelector`, `CodexRepertoireDrawer`, and `TakeEvaluationDrawer` to native `<dialog>.showModal()` with `dialog:modal` and `dialog::backdrop { overflow: hidden; overscroll-behavior: contain; }` (removing manual `role="dialog"` / `aria-modal` wrappers), and add lightweight `HTMLDialogElement` test support in `apps/web/src/vitest.setup.ts`.
- **`dark-mode`:** Add `<meta name="color-scheme" content="light dark">` and early theme initialization in `apps/web/index.html`, separate light `:root` tokens from `.dark` tokens in `apps/web/src/styles/theme.css`, and remove unused `@fontsource/cormorant-garamond` imports from `apps/web/src/main.tsx`.
- **`trusted-types` & JS Array Methods:** Replace `container.innerHTML = ''` with `container.replaceChildren()` in `vexflow-score-builder.ts` and replace `[...arr].sort` / `[...arr].reverse` with `toSorted()` / `toReversed()` across all 8 `legacy-scan` occurrences.
- **`optimize-image-priority`:** Generate WebP/AVIF variants of the hero room photo (`<picture>`) and set `fetchpriority="high"` with explicit dimensions on the LCP `<img>`.
- **Accessibility & Bundle Size:** Replace clickable `<div>`/`<motion.div>` cards with native `<button type="button">` elements (keeping preview buttons as siblings, never nested) in `studio-session-selector.tsx`, `chords-scales-page.tsx`, and `guitar-tuner-page.tsx`; add `aria-label` on close buttons; lazy-load `PracticeStudioCockpit` in `app.tsx`; replace the 579 KB base64 `favicon.svg` with a lean vector SVG.

### 3.2 Scalability, Honesty, Repo Hygiene & CI
- **DB & Health Scaling:** Add `pool_pre_ping=True` in `src/lib/db.py`, commit `get_session` only when pending session changes exist, add `limit`/`offset` pagination to `GET /api/exercises`, and add `/api/health/live` (no DB round-trip) for `Dockerfile` `HEALTHCHECK` so Neon Serverless can scale to zero.
- **License, Docs & Repo Cleanup:** Add MIT `LICENSE` matching `"license": "MIT"` in `package.json`; update `README.md` to accurately reflect `uv pip install -r pyproject.toml`, actual test counts, `AudioWorklet` + `84` templates, actual BKT (`P(G)=0.12`, `P(S)=0.08`), CUSUM (`4.0σ`), EWMA (`0.3`), current Gemini model, and live/baseline Peer Benchmarks. Delete unused scratch/agent artifacts (`public/`, `.agents/teamwork/`, `apps/web/public/screens/`, `apps/web/src/assets/react.svg`, `apps/web/src/assets/vite.svg`) while preserving `docs/` completely (`AGENTS.md` #8).
- **CI & Test Completeness:** Fix `tests/test_audio_alignment.py` to use `tmp_path` instead of writing `test_a4.wav` to repo root; fix `scroll-choreography.test.ts` ESM import and `playwright.config.ts` (`baseURL: 'http://localhost:5173'` + `webServer`); clean `ruff` errors in `src/` and `oxlint` warnings in `apps/web/src`; add `ruff`, `oxlint`, and `scroll-choreography.test.ts` to `.github/workflows/ci.yml`.
- **Git History Scrub Readiness:** Leave git history/commits untouched during implementation (`AGENTS.md`: commit only when asked) and verify a reproducible `git-filter-repo` command/expressions file for final pre-push PII/artifact history cleanup after user review.
