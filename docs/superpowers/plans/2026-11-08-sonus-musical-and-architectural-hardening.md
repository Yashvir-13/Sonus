# Sonus Musical & Architectural Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Sonus into a musically authentic, production-hardened platform by adding sample-accurate rhythmic audio rendering for guitar strumming and piano accompaniment, dynamic meter support for 3/4 waltzes, a real-time chromagram HUD, asynchronous AI coaching, and secured endpoints.

**Architecture:** 
1. Replace main-thread React `setInterval` audio triggers with a Web Audio Lookahead Scheduler that dispatches sub-beat strum events (`D`, `U`) and piano melody/accompaniment notes with hardware DAC clock precision (`ctx.currentTime + delta`).
2. Make meter and downbeats dynamic across [`practice-studio-cockpit.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/practice-studio-cockpit.tsx) and [`flowing-notation-stand.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/flowing-notation-stand.tsx) to authentically support 3/4 waltzes and 4/4 ballads.
3. Wire the real FFT-interpolated chromagram and cosine chord classifier into the practice cockpit HUD, replacing monophonic autocorrelation and hardcoded voicing scores.
4. Eliminate the microphone speaker feedback connection and safely route live input.
5. Convert synchronous `httpx.Client` to `httpx.AsyncClient` in [`llm_coach.py`](file:///d:/Projects/adaptive-music-practice/src/lib/adaptive/llm_coach.py) to prevent freezing FastAPI's event loop.
6. Guard `/api/audio/test-transcribe` and ensure `ENV` defaults securely to `"production"`.

**Tech Stack:** React 19, TypeScript 5.8, Web Audio API, Vitest, Python 3.12, FastAPI, AnyIO, Pytest, SQLModel.

**Spec:** [`docs/superpowers/specs/2026-10-29-audio-rendering-and-beat-ticks-design.md`](file:///d:/Projects/adaptive-music-practice/docs/superpowers/specs/2026-10-29-audio-rendering-and-beat-ticks-design.md) & [`sonus-comprehensive-system-audit.md`](file:///C:/Users/yashv/.gemini/antigravity/brain/027d0f22-f379-4007-a791-03b331db4e93/sonus-comprehensive-system-audit.md).

---

## Global Constraints
- Do not edit `genesys/` or `foundry/`.
- Only create `__init__.py` at `src/models/__init__.py`.
- No hand-written Alembic migrations; autogenerate only.
- All existing 80 backend pytest tests and 244 frontend vitest tests must continue passing.
- Keep mypy strict happy across all modified Python files.

---

## Review Focus
1. **3/4 Meter Metronome Downbeat:** On Shostakovich Waltz No. 2, the high wooden click must strike on Beat 1 of every 3-beat measure, never on Beat 2 or 3.
2. **Strumming Audio Playback:** In *Knockin' Cadence*, guitar strums must audibly sound at Beat 0, Beat 1, Beat 2.5 (upbeat), Beat 3, Beat 3.5 (upbeat), matching the visual arrows.
3. **Piano Accompaniment Playback:** In *Waltz No. 2*, Beat 1 must sound the bass root, and Beats 2 & 3 must sound the harmonic chord voicings with melody notes ringing on top.
4. **Mic Feedback Elimination:** Microphone input processor must never connect to `ctx.destination`.
5. **FastAPI Event Loop Non-Blocking:** `generate_coaching_report` must not block concurrent HTTP requests while waiting for external Gemini API calls.

---

### Task 1: Web Audio Lookahead Rhythmic Playback Engine (Strums & Accompaniment)

**Files:**
- Modify: [`apps/web/src/lib/audio/practice-audio-engine.ts`](file:///d:/Projects/adaptive-music-practice/apps/web/src/lib/audio/practice-audio-engine.ts)
- Test: [`apps/web/src/lib/audio/__tests__/practice-audio-engine.test.ts`](file:///d:/Projects/adaptive-music-practice/apps/web/src/lib/audio/__tests__/practice-audio-engine.test.ts)

- [ ] **Step 1: Write tests for scheduling rhythmic strum events and piano pattern notes at specific AudioContext timestamps**
  - Verify that `scheduleStrumEvents` schedules directional Karplus-Strong strums (`down`/`up`) at exact scheduled times.
  - Verify that `schedulePianoMeasure` schedules bass roots on Beat 1 and chords/melody on Beats 2 & 3.
- [ ] **Step 2: Run vitest to see test failures**
  - Run `pnpm --filter web test practice-audio-engine.test.ts`
- [ ] **Step 3: Implement Lookahead Scheduling methods in `PracticeAudioEngine`**
  - Add `scheduleGuitarStrum(events, baseTime, tempoBpm)` and `schedulePianoEvents(events, baseTime, tempoBpm)`.
- [ ] **Step 4: Verify tests pass**
  - Run `pnpm --filter web test practice-audio-engine.test.ts`

---

### Task 2: Dynamic Time Signatures, 3/4 Waltz Metronome & Loop Slicing

**Files:**
- Modify: [`apps/web/src/components/practice/practice-studio-cockpit.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/practice-studio-cockpit.tsx)
- Modify: [`apps/web/src/components/practice/flowing-notation-stand.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/flowing-notation-stand.tsx)
- Test: [`apps/web/src/components/practice/__tests__/practice-studio-cockpit.test.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/__tests__/practice-studio-cockpit.test.tsx)

- [ ] **Step 1: Write test for dynamic meter and 3/4 time signature in cockpit**
  - Verify that selecting *Waltz No. 2* calculates downbeat as `wholeBeat % 3 === 0`.
  - Verify that `beatsPerMeasure` passed to `FlowingNotationStand` is 3 for waltzes and 4 for ballads.
  - Verify that 2-bar loop slicing inherits the exercise's measure length rather than hardcoding 4.
- [ ] **Step 2: Run vitest to verify failure**
- [ ] **Step 3: Implement dynamic meter and loop slicing in `PracticeStudioCockpit`**
  - Parse `beatsPerMeasure` from selected song (`progression.time_signature` or `firstChord.duration_beats ?? 4`).
  - Update metronome tick calculation: `const isDownbeat = wholeBeat % beatsPerMeasure === 0`.
  - Pass dynamic `beatsPerMeasure` to `FlowingNotationStand`.
  - Fix loop drill slice creation to use `beats: beatsPerMeasure`.
- [ ] **Step 4: Verify cockpit tests pass**
  - Run `pnpm --filter web test practice-studio-cockpit.test.tsx`

---

### Task 3: Hook Rhythmic Strum & Melody Playback into Cockpit Playback Loop

**Files:**
- Modify: [`apps/web/src/components/practice/practice-studio-cockpit.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/practice-studio-cockpit.tsx)
- Test: [`apps/web/src/components/practice/__tests__/flowing-notation-stand.test.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/__tests__/flowing-notation-stand.test.tsx)

- [ ] **Step 1: Write test verifying that strumming events and piano melodies trigger audio synthesis**
- [ ] **Step 2: Implement lookahead scheduling loop in cockpit**
  - In cockpit playback loop, when a measure begins, schedule all of its `strum_events` (for guitar) or `rhMelody` / `lhChord` (for piano) ahead into the Web Audio timeline using `AudioContext.currentTime`.
- [ ] **Step 3: Run vitest to verify all practice room tests pass**
  - Run `pnpm --filter web test`

---

### Task 4: Fix Mic Feedback Loop & Connect Real Polyphonic Chromagram to Live HUD

**Files:**
- Modify: [`apps/web/src/components/practice/practice-studio-cockpit.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/practice-studio-cockpit.tsx)
- Test: [`apps/web/src/lib/audio/__tests__/chord-detector.test.ts`](file:///d:/Projects/adaptive-music-practice/apps/web/src/lib/audio/__tests__/chord-detector.test.ts)
- Test: [`apps/web/src/components/practice/__tests__/practice-studio-cockpit.test.tsx`](file:///d:/Projects/adaptive-music-practice/apps/web/src/components/practice/__tests__/practice-studio-cockpit.test.tsx)

- [ ] **Step 1: Eliminate `processor.connect(ctx.destination)` in `startMicRecording`**
  - Prevent microphone audio from streaming back into the user's speakers.
- [ ] **Step 2: Integrate real-time FFT peak interpolation and `chromaToChord` into cockpit audio frame processor**
  - Replace the monophonic autocorrelation mock with genuine chromagram energy calculation.
  - Compute actual `voicingCompleteness` by comparing detected pitch classes against `activeChord.pitchClasses`.
  - Populate `matchedPitchClasses` and `missingPitchClasses` accurately.
- [ ] **Step 3: Add pre-roll count-in state (1 measure of metronome clicks before take starts)**
- [ ] **Step 4: Verify frontend test suite passes**
  - Run `pnpm --filter web test`

---

### Task 5: Backend Async LLM Coaching & Endpoint Security Hardening

**Files:**
- Modify: [`src/lib/adaptive/llm_coach.py`](file:///d:/Projects/adaptive-music-practice/src/lib/adaptive/llm_coach.py)
- Modify: [`src/services/api/routes/audio_test.py`](file:///d:/Projects/adaptive-music-practice/src/services/api/routes/audio_test.py)
- Modify: [`src/lib/auth/clerk.py`](file:///d:/Projects/adaptive-music-practice/src/lib/auth/clerk.py)
- Test: [`tests/test_llm_coach.py`](file:///d:/Projects/adaptive-music-practice/tests/test_llm_coach.py)
- Test: [`tests/test_audio_test_api.py`](file:///d:/Projects/adaptive-music-practice/tests/test_audio_test_api.py)

- [ ] **Step 1: Write test verifying non-blocking async LLM coaching and test endpoint security**
- [ ] **Step 2: Convert synchronous `httpx.Client` to `httpx.AsyncClient` in `llm_coach.py`**
  - Make `generate_coaching_report` async or wrap external HTTP request in `anyio.to_thread.run_sync`.
- [ ] **Step 3: Secure `/api/audio/test-transcribe`**
  - Restrict `/api/audio/test-transcribe` to require `ClerkIdentityDep` or disable when `ENV=production`.
- [ ] **Step 4: Ensure `ENV` defaults securely**
  - In `src/lib/auth/clerk.py`, ensure dev token bypass only triggers when `ENV` is strictly `"development"`.
- [ ] **Step 5: Run backend pytest suite**
  - Run `.venv\Scripts\python -m pytest tests/`
  - Run `.venv\Scripts\python -m mypy src tests`

---

### Task 6: Final End-to-End Verification

- [ ] Run full backend test suite (`.venv\Scripts\python -m pytest tests/ -v`).
- [ ] Run full frontend test suite (`pnpm --filter web test`).
- [ ] Run frontend build (`pnpm --filter web build`).
- [ ] Run strict static type checking (`.venv\Scripts\python -m mypy src tests`).
