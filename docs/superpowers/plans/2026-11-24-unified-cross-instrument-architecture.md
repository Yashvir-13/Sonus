# Unified Cross-Instrument Architecture & Deterministic Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify musical notation and playback across instruments into a single-source-of-truth canonical note model, implement a Dynamic Programming guitar/piano projection engine, and eliminate the URL routing bug that hijacked routes to *House of the Rising Sun*.

**Architecture:** Songs define canonical, instrument-agnostic note events (`pitch`, `beatOffset`, `duration`, `voice`). An Instrument Lens Projection Engine deterministically transforms these events into VexFlow Grand Staff noteheads (Piano) or ergonomically optimal string/fret tablature via Dynamic Programming (Guitar). The routing system strictly enforces 1-to-1 bidirectional slugs without falling back to catalog index 0.

**Tech Stack:** React 19, TypeScript, VexFlow v5, Web Audio API, FastAPI, SQLModel, PostgreSQL, Vitest, Pytest.

**Spec:** `docs/superpowers/specs/2026-11-24-unified-cross-instrument-architecture-design.md`

## Global Constraints

- Never commit secrets; `.env` is gitignored.
- Only create `__init__.py` at `src/models/__init__.py`.
- Follow SOLID principles; keep modules small, typed, and focused.
- All 20 masterworks must have valid, verified pitches and monotonic beat cursors.
- Pitch conservation invariant: $\text{Pitches}(\text{Piano Projection}) \equiv \text{Pitches}(\text{Guitar Projection})$.
- No URL routing path may fall back to index 0 (`ex_guitar_rising_sun`).

## Review Focus

1. **Routing Fallback Isolation**: An invalid or missing slug (e.g. `/practice/unknown-slug`) must preserve the active session or present a clean picker; it must never rewrite the URL to `/practice/house-of-the-rising-sun`.
2. **Guitar Fret Span Ergonomics**: The Dynamic Programming solver must never assign consecutive frets on the same hand position that require a span $> 4$ frets (excluding open strings $f = 0$).
3. **Simultaneous String Collision**: Two notes sounding at the exact same beat offset within a measure must never be assigned to the same guitar string.
4. **Piano Clef Hand Separation**: Melodic notes $\ge C_4$ (MIDI 60) must render on Treble clef with right-hand color; bass notes $< C_4$ must render on Bass clef with left-hand color.
5. **Cross-Instrument Audio Parity**: When toggling between Piano and Guitar in `PracticeStudioCockpit`, the Web Audio playback must immediately re-anchor and play the exact same pitches and rhythms using the active instrument's physical synthesis.

---

### Task 1: Deterministic URL Routing & Slug Resolution (Fixing Rising Sun Redirect)

**Files:**
- Modify: `apps/web/src/app.tsx:70-260, 390-440`
- Modify: `apps/web/src/components/landing/cinematic-camera-stage.tsx:460-470, 1045-1075`
- Modify: `apps/web/src/lib/adaptive/recommendation-engine.ts:335-370`
- Test: `apps/web/src/__tests__/routing.test.ts`

**Interfaces:**
- Consumes: `ExerciseDto`, `BUILTIN_FULL_SONGS`.
- Produces: Hardened `exerciseIdToSlug(id: string): string`, `slugToExerciseId(slug: string, available?: ExerciseDto[]): string | undefined`, and safe `parseRouteFromPath`.

- [ ] **Step 1: Write failing unit tests in `routing.test.ts`**
  Add tests asserting:
  1. All 20 masterwork IDs resolve bidirectionally: `slugToExerciseId(exerciseIdToSlug(id)) === id`.
  2. Unknown slug `/practice/non-existent-piece` resolves `{ view: 'practice', songId: undefined }` and does **not** map to `ex_guitar_rising_sun`.
  3. Empty practice route `/practice` does not resolve to `ex_guitar_rising_sun`.

- [ ] **Step 2: Run test to verify failure**
  Run: `pnpm --filter web test -- src/__tests__/routing.test.ts --run`
  Expected: FAIL on unmatched slug handling.

- [ ] **Step 3: Implement deterministic routing & remove index 0 fallbacks**
  1. Update `exerciseIdToSlug` and `slugToExerciseId` in `app.tsx` with complete 1-to-1 table for all 20 songs.
  2. In `app.tsx`, replace `availableExercises[0] ?? BUILTIN_FULL_SONGS[0]` with `selectedSongId` lookup or safe state fallback without mutating history.
  3. In `cinematic-camera-stage.tsx`, replace `filteredSongs[0] || BUILTIN_FULL_SONGS[0]` with current selection preservation.
  4. In `recommendation-engine.ts`, diversify initial transitions across *Waltz No. 2*, *Canon in D*, *Für Elise*, *Knockin'*, and *Rising Sun*.

- [ ] **Step 4: Run routing tests to verify pass**
  Run: `pnpm --filter web test -- src/__tests__/routing.test.ts --run`
  Expected: PASS.

- [ ] **Step 5: Commit**
  `git commit -m "fix(routing): eliminate index-0 Rising Sun redirect and enforce deterministic slugs"`

---

### Task 2: Canonical Note Model & Schema Unification

**Files:**
- Modify: `apps/web/src/lib/music/song-catalog.ts:1-70`
- Modify: `apps/web/src/lib/notation/vexflow-score-builder.ts:40-60`
- Modify: `src/lib/schemas/music.py:10-50`
- Test: `apps/web/src/lib/music/__tests__/song-catalog.test.ts`

**Interfaces:**
- Consumes: None (base types).
- Produces: `CanonicalNoteEvent`, `MusicalVoiceRole`, `UnifiedMeasureItem`, updated `FullSongChordItem`.

- [ ] **Step 1: Write failing test for canonical notes schema**
  In `song-catalog.test.ts`, assert measures support `notes: CanonicalNoteEvent[]` with `pitch`, `beatOffset`, `duration`, and optional `voice`.

- [ ] **Step 2: Run test to verify failure**
  Run: `pnpm --filter web test -- src/lib/music/__tests__/song-catalog.test.ts --run`
  Expected: FAIL.

- [ ] **Step 3: Define canonical schemas**
  1. In `song-catalog.ts`, define `CanonicalNoteEvent` and add `notes?: CanonicalNoteEvent[]` to `FullSongChordItem`.
  2. In `vexflow-score-builder.ts`, add `notes?: CanonicalNoteEvent[]` to `FlowingChordItem`.
  3. In `src/lib/schemas/music.py`, add `CanonicalNoteEvent` Pydantic model.

- [ ] **Step 4: Run test to verify pass**
  Run: `pnpm --filter web test -- src/lib/music/__tests__/song-catalog.test.ts --run`
  Expected: PASS.

- [ ] **Step 5: Commit**
  `git commit -m "feat(music): define CanonicalNoteEvent and UnifiedMeasureItem schemas"`

---

### Task 3: Dynamic Programming Instrument Lens Projection Engine

**Files:**
- Create: `apps/web/src/lib/music/instrument-lens.ts`
- Test: `apps/web/src/lib/music/__tests__/instrument-lens.test.ts`

**Interfaces:**
- Consumes: `CanonicalNoteEvent`, `FullSongChordItem`, `FlowingChordItem`.
- Produces:
  - `projectToPiano(measure: FullSongChordItem): FlowingChordItem`
  - `projectToGuitar(measure: FullSongChordItem): FlowingChordItem`
  - `projectSongToInstrument(song: ExerciseDto, instrument: 'guitar' | 'piano'): FlowingChordItem[]`

- [ ] **Step 1: Write failing unit tests in `instrument-lens.test.ts`**
  1. Test piano lens partitions notes into treble ($\ge C_4$) and bass ($< C_4$) clefs.
  2. Test guitar lens runs DP to find playable string/fret for melody notes without exceeding a 4-fret span.
  3. Test guitar lens snaps notes to open chord box when chord name is supplied (e.g. Am frets $0..2$).
  4. Test pitch conservation: every note in `canonicalNotes` has matching pitch in both piano and guitar outputs.

- [ ] **Step 2: Run test to verify failure**
  Run: `pnpm --filter web test -- src/lib/music/__tests__/instrument-lens.test.ts --run`
  Expected: FAIL with module not found.

- [ ] **Step 3: Implement `instrument-lens.ts`**
  1. Implement pitch conversion helpers (`noteToMidi`, `midiToNote`, `pitchToVexKey`).
  2. Implement `projectToPiano`: partition by voice/C4, build `melodyNotes`, generate `pianoVoicing`.
  3. Implement `projectToGuitar`:
     - Candidate search across $T = [40, 45, 50, 55, 59, 64]$.
     - Viterbi shortest-path cost minimization (shift + stretch + collision - chord bias).
     - Output `plucked_notes` (sequential) or `strum_events` + `guitar_tabs` (simultaneous).
  4. Implement `projectSongToInstrument(song, instrument)` with memoization.

- [ ] **Step 4: Run test to verify pass**
  Run: `pnpm --filter web test -- src/lib/music/__tests__/instrument-lens.test.ts --run`
  Expected: PASS.

- [ ] **Step 5: Commit**
  `git commit -m "feat(music): implement DP guitar and grand-staff piano instrument lenses"`

---

### Task 4: Practice Cockpit & Audio Scheduler Integration

**Files:**
- Modify: `apps/web/src/components/practice/practice-studio-cockpit.tsx:505-555, 1630-1650`
- Test: `apps/web/src/components/practice/__tests__/playback-audio-scheduler.test.tsx`
- Test: `apps/web/src/components/practice/__tests__/flowing-notation-stand.test.tsx`

**Interfaces:**
- Consumes: `projectSongToInstrument` from `instrument-lens.ts`.
- Produces: Dynamic cross-instrument `flowingProgression` that re-renders notation and synthesizes audio.

- [ ] **Step 1: Write failing integration test**
  In `playback-audio-scheduler.test.tsx`, add a test that renders a guitar song (`ex_guitar_rising_sun`) in piano mode, asserting that piano multi-partial notes are scheduled, and renders a piano song (`ex_piano_fur_elise`) in guitar mode, asserting that guitar plucks are scheduled.

- [ ] **Step 2: Run test to verify failure**
  Run: `pnpm --filter web test -- src/components/practice/__tests__/playback-audio-scheduler.test.tsx --run`
  Expected: FAIL (empty or mismatched plucks/melody notes).

- [ ] **Step 3: Wire `instrument-lens.ts` into `practice-studio-cockpit.tsx`**
  1. Replace legacy manual extraction in `flowingProgression` with `projectSongToInstrument(selectedSong, instrument)`.
  2. Ensure instrument toggle re-anchors playback smoothly without losing beat cursor or crashing.

- [ ] **Step 4: Run playback and notation tests to verify pass**
  Run: `pnpm --filter web test -- src/components/practice/__tests__/playback-audio-scheduler.test.tsx src/components/practice/__tests__/flowing-notation-stand.test.tsx --run`
  Expected: PASS.

- [ ] **Step 5: Commit**
  `git commit -m "feat(practice): integrate instrument lens into cockpit and audio scheduler"`

---

### Task 5: Populate Canonical Notes Across Catalog & Re-seed Database

**Files:**
- Modify: `apps/web/src/lib/music/song-catalog.ts`
- Modify: `src/lib/music/seed_data.py`
- Modify: `scripts/seed_exercises.py`
- Test: `tests/test_seed_data.py`
- Test: `apps/web/src/lib/music/__tests__/song-catalog.test.ts`

**Interfaces:**
- Consumes: `instrument-lens.ts` and catalog seed builders.
- Produces: 20 updated songs with dual canonical note representation in database and web catalog.

- [ ] **Step 1: Write verification test in `test_seed_data.py`**
  Assert all 20 exercises in database seed have non-empty `notes` array in their `progression_json` with valid pitches and positive durations.

- [ ] **Step 2: Run test to verify failure**
  Run: `.\.venv\Scripts\pytest.exe tests/test_seed_data.py`
  Expected: FAIL on missing canonical notes.

- [ ] **Step 3: Update catalog generator & regenerate files**
  1. Enhance catalog script to populate canonical `notes` for all 20 songs.
  2. Regenerate `apps/web/src/lib/music/song-catalog.ts` and `src/lib/music/seed_data.py`.
  3. Run `.\.venv\Scripts\python.exe scripts/seed_exercises.py` to update active PostgreSQL database.

- [ ] **Step 4: Run full test suites to verify pass**
  Run:
  - `pnpm --filter web test --run`
  - `.\.venv\Scripts\pytest.exe tests/test_seed_data.py tests/test_cognitive_persistence.py`
  Expected: All tests PASS.

- [ ] **Step 5: Commit**
  `git commit -m "feat(catalog): populate canonical notes across all 20 masterworks and seed DB"`
