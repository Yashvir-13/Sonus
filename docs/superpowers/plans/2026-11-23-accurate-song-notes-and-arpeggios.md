# Accurate Song Notes, Arpeggios, and 20 Masterworks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Sonus from static block-chord representations into authentic, note-by-note musical scores with guitar arpeggios, single-string plucks, string muting, and classical piano Grand Staff polyphony across 20 verified public-domain and traditional masterworks.

**Architecture:** Hierarchical measure containers embed explicit, time-aligned `plucked_notes` (guitar) and `melody_notes` (piano) with sub-measure beat offsets. VexFlow engraves individual string tablature with rhythmic stems; Karplus-Strong physical string synthesis schedules single-note plucks; and the real-time pitch tracker evaluates against the active note frequency at each beat offset.

**Tech Stack:** React 19, TypeScript, VexFlow v5 (Bravura SMuFL), Web Audio API (Karplus-Strong string synthesis, Autocorrelation pitch tracking), FastAPI, SQLModel, PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-11-23-accurate-song-notes-and-arpeggios-design.md`

## Global Constraints

- Never commit secrets; `.env` is gitignored.
- Only create `__init__.py` at `src/models/__init__.py`.
- Follow SOLID principles; small typed modules over monolithic god-files.
- Preserve backward compatibility for existing chord exercises (`strum_events` fallback).
- All 20 masterworks must have valid, monotonic beat cursors, authentic key signatures, and verified pitches.

## Review Focus

1. **Compound 6/8 meter calculation**: Rhythmic stem decomposition in 6/8 (*House of the Rising Sun*) must correctly map 6 eighth-note divisions per measure to 1.0 beat offsets.
2. **String muting representation**: When a string is marked `'x'` in `plucked_notes`, VexFlow must render an `X` on that string line and the audio synthesizer must play a muted percussive thump rather than a pitched note.
3. **Bass note color contrast**: In guitar tabs, bass string plucks (strings 4, 5, 6) must render in Amber (`#FBBF24` / `#B45309`) while treble strings render in standard ink.
4. **Piano Grand Staff ledger lines**: Notes above the treble staff or below the bass staff (e.g. C6 or C2) must have mathematically verified ledger line rendering without clipping.
5. **Autocorrelation pitch evaluation window**: Real-time microphone tracking must evaluate against the specific note within its $[ \text{beatOffset}, \text{nextBeatOffset} )$ time bracket, not the entire measure.

---

### Task 1: Type System & Schema Enhancements

**Files:**
- Modify: `apps/web/src/lib/music/song-catalog.ts`
- Modify: `apps/web/src/lib/notation/vexflow-score-builder.ts`
- Modify: `src/lib/schemas/music.py`
- Test: `apps/web/src/lib/music/__tests__/song-catalog.test.ts`

**Interfaces:**
- Consumes: Existing `FullSongChordItem` and `GrandStaffNote` definitions.
- Produces: `PluckedNoteEvent`, enhanced `FullSongChordItem` with `plucked_notes` and muted string union.

- [ ] **Step 1: Write failing unit test for `PluckedNoteEvent` schema**
  Verify that song catalog items correctly parse `plucked_notes` with string, fret, pitch, and beatOffset.
- [ ] **Step 2: Run test to verify it fails**
  `pnpm run test:unit apps/web/src/lib/music/__tests__/song-catalog.test.ts`
- [ ] **Step 3: Update `song-catalog.ts`, `vexflow-score-builder.ts`, and `music.py`**
  Add `PluckedNoteEvent` definition and add `plucked_notes?: PluckedNoteEvent[]` to `FullSongChordItem` and `FlowingChordItem`.
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
  `git commit -m "feat(music): add PluckedNoteEvent schema for guitar arpeggios"`

---

### Task 2: VexFlow Tablature & Grand Staff Notation Upgrades

**Files:**
- Modify: `apps/web/src/lib/notation/vexflow-score-builder.ts`
- Test: `apps/web/src/components/practice/__tests__/flowing-notation-stand.test.tsx`
- Test: `apps/web/src/lib/notation/__tests__/vexflow-score-builder.test.ts`

**Interfaces:**
- Consumes: `plucked_notes` from `FlowingChordItem`.
- Produces: Single-string `TabNote`s with rhythmic stems, muted strings `x`, and subtle chord annotations.

- [ ] **Step 1: Write failing unit test for single-string tab engraving**
  Test that a measure with 6 `plucked_notes` produces 6 distinct `TabNote`s with individual string coordinates rather than a 6-string chord block.
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement single-string tab engraving and subtle chord annotations in `vexflow-score-builder.ts`**
  - Branch on `chord.plucked_notes`.
  - Format `TabNote` for each pluck event with stem direction -1.
  - Map beat offsets to `BeatAnchor` coordinates.
  - Subdue chord labels in `renderPianoGrandStaff`.
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
  `git commit -m "feat(notation): support single-string guitar arpeggio engraving and subtle piano annotations"`

---

### Task 3: Audio Synthesis & Real-Time Pitch Tracking Updates

**Files:**
- Modify: `apps/web/src/lib/audio/practice-audio-engine.ts`
- Modify: `apps/web/src/components/practice/practice-studio-cockpit.tsx`
- Test: `apps/web/src/lib/audio/__tests__/practice-audio-engine.test.ts`
- Test: `apps/web/src/components/practice/__tests__/practice-studio-cockpit.test.tsx`

**Interfaces:**
- Consumes: `schedulePluckedNotes` in audio engine.
- Produces: Sequential Karplus-Strong string playback and sub-measure pitch matching.

- [ ] **Step 1: Write failing unit test for `schedulePluckedNotes`**
  Verify that `schedulePluckedNotes` triggers `playGuitarNote` at calculated audio timestamps.
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `schedulePluckedNotes` in `practice-audio-engine.ts` and active note matching in `practice-studio-cockpit.tsx`**
- [ ] **Step 4: Run tests to verify pass**
- [ ] **Step 5: Commit**
  `git commit -m "feat(audio): add plucked guitar scheduling and sub-measure note matching"`

---

### Task 4: Ingest 10 Authentic Guitar Masterworks

**Files:**
- Modify: `apps/web/src/lib/music/song-catalog.ts`
- Modify: `src/lib/music/seed_data.py`
- Test: `apps/web/src/lib/music/__tests__/song-catalog.test.ts`

**Repertoire:**
1. House of the Rising Sun (The Animals) — 6/8 Arpeggio
2. Where Did You Sleep Last Night (Nirvana Unplugged) — 3/4 Folk Arpeggio & Strum
3. Spanish Romance (Romance Anónimo) — 3/4 Classical Arpeggio
4. Scarborough Fair (Simon & Garfunkel) — 3/4 Fingerpicking
5. Greensleeves — 6/8 Fingerstyle
6. Bourrée in E minor (J.S. Bach) — 4/4 Polyphonic Counterpoint
7. Whiskey in the Jar (Thin Lizzy / Metallica) — 4/4 Driving Strum
8. Malagueña — 3/4 Flamenco Cadence
9. Knockin' Cadence (Bob Dylan) — 4/4 Acoustic Voicing
10. 12-Bar Delta Blues Shuffle in E — 4/4 Blues Shuffle

- [ ] **Step 1: Write tests verifying all 10 guitar songs have valid tabs and monotonic beats**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Encode full, authentic note-by-note data for all 10 guitar pieces**
- [ ] **Step 4: Run tests to verify pass**
- [ ] **Step 5: Commit**
  `git commit -m "feat(songs): ingest 10 authentic guitar masterworks with note-by-note tabs"`

---

### Task 5: Ingest 10 Authentic Piano Masterworks

**Files:**
- Modify: `apps/web/src/lib/music/song-catalog.ts`
- Modify: `src/lib/music/seed_data.py`
- Test: `apps/web/src/lib/music/__tests__/song-catalog.test.ts`

**Repertoire:**
1. Waltz No. 2 (Shostakovich) — 3/4 Boom-Chick-Chick
2. Pachelbel's Canon — 4/4 32-Measure Score
3. Für Elise (Beethoven) — 3/8 Main Theme & Arpeggios
4. Gymnopédie No. 1 (Satie) — 3/4 Lento Bass Leaps
5. Moonlight Sonata (Beethoven) — Triplet Arpeggios
6. Minuet in G major (Bach / Petzold) — 3/4 Counterpoint
7. Prelude in C major (Bach) — 16th-Note Broken Chords
8. Clair de Lune (Debussy) — 9/8 Impressionist Voicings
9. The Entertainer (Joplin) — 2/4 Ragtime Stride
10. Autumn Jazz Turnaround — 4/4 7th Chord Voice Leading

- [ ] **Step 1: Write tests verifying all 10 piano songs have valid Grand Staff notes and clef assignments**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Encode full, authentic note-by-note data for all 10 piano pieces**
- [ ] **Step 4: Run tests to verify pass**
- [ ] **Step 5: Commit**
  `git commit -m "feat(songs): ingest 10 authentic piano masterworks with Grand Staff scores"`

---

### Task 6: Database Seeding & End-to-End Verification

**Files:**
- Modify: `scripts/seed_exercises.py`
- Test: `tests/test_seed_data.py`

- [ ] **Step 1: Write backend tests verifying `SEED_EXERCISES` contains all 20 masterworks**
- [ ] **Step 2: Run `pytest tests/test_seed_data.py`**
- [ ] **Step 3: Run `python scripts/seed_exercises.py` to seed database**
- [ ] **Step 4: Run full test suites (`pnpm test` and `pytest`)**
- [ ] **Step 5: Commit**
  `git commit -m "feat(db): seed 20 guitar and piano masterworks into PostgreSQL"`
