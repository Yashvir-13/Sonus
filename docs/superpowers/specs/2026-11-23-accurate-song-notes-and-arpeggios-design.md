# Technical Design Spec: Authentic Note, Arpeggio, and Score Ingestion for Guitar & Piano

**Date**: 2026-11-23  
**Status**: Approved (Brainstorming Complete)  
**Author**: Antigravity  
**Repository**: Sonus (Adaptive Musical Practice System)

---

## 1. Executive Summary

Sonus currently bundles musical measures into monolithic chord blocks with generic strum arrows, lacking single-string guitar arpeggios, precise string muting, and authentic piano multi-voice notation. When a musician practices a fingerpicked arpeggio like the iconic intro to *House of the Rising Sun*, the app incorrectly stamps all six strings at once and plays full chord strums, and the audio tracker penalizes the player for not striking all chord tones simultaneously.

This specification redesigns Sonus's musical data model, notation rendering engine, audio synthesizer, and real-time evaluation pipeline to support:
1. **Single-String Guitar Arpeggios & Fingerpicking**: Measures specify time-aligned `plucked_notes` with exact string numbers (1..6), fret integers, pitch values, and muted strings (`x`), rendered with individual rhythmic stems on VexFlow tablature staves.
2. **Authentic Piano Grand Staff & Subtle Harmonic Labels**: Measures render note-by-note Treble and Bass staves with voice leading (e.g., *Waltz No. 2*'s "boom-chick-chick" bass root + harmony chords) and subdued harmonic annotations above the measure line instead of dominant chord badges.
3. **20 Verified Masterworks**: A curated dataset of 10 Guitar and 10 Piano public-domain and traditional folk/rock masterworks (including *House of the Rising Sun*, *Where Did You Sleep Last Night*, *Spanish Romance*, *Waltz No. 2*, *Pachelbel's Canon*, *Für Elise*, *Gymnopédie No. 1*, and *Bourrée in E minor*).
4. **Adaptive Practice & Real-Time Pitch Tracking Integration**: The microphone pitch tracker evaluates the exact active pitch at the current beat offset rather than testing against the entire measure's chord union, resolving a fundamental bottleneck in practice accuracy scoring.

---

## 2. Architecture & Data Schema

### 2.1 Measure Data Model (`FullSongChordItem`)

The data model maintains hierarchical measure containers for measure barlines, time signature, and harmonic structure, but embeds explicit sub-arrays for plucked notes, strumming, and grand staff polyphony:

```typescript
export type PluckedNoteEvent = {
  beatOffset: number         // 0-indexed beat offset within measure (e.g. 0.0, 1.0, 2.0)
  string: 1 | 2 | 3 | 4 | 5 | 6 // 1 = High e, 6 = Low E
  fret: number | 'x'        // Fret integer (0 = open, 1..24, 'x' = muted/slapped)
  pitch: number             // Exact MIDI pitch (e.g. 45 = A2, 52 = E3, 60 = C4)
  duration: number          // Rhythmic duration in beats (e.g. 1.0 for 8th note in 6/8)
  technique?: 'pick' | 'thumb' | 'index' | 'hammer' | 'pull' | 'slide' | 'mute'
}

export type GrandStaffNote = {
  pitch: string             // Scientific pitch (e.g. 'C3', 'Eb3', 'G4')
  beatOffset: number        // 0-indexed offset within measure
  duration: number          // Duration in beats
  clef?: 'treble' | 'bass'  // Clef assignment
}

export type FullSongChordItem = {
  name: string               // Harmonic chord name (e.g. 'Am', 'Cm', 'G')
  beat: number               // Global beat position in song (1-indexed)
  duration_beats: number     // Total beats in measure
  expected_pitches?: number[]// Union of pitches for backward compatibility
  
  // Guitar: chord shape definition for fretboard diagram & hand posture
  guitar_tabs?: {
    frets: Array<number | null | 'x'>
    strings: string          // e.g. 'x-A-D-G-B-e'
    fingering?: string       // e.g. 'x-0-2-3-1-0'
    fingers?: Array<number | null | string>
    barreFret?: number
    baseFret?: number
  }
  
  // Plucked arpeggio / single note sequence
  plucked_notes?: PluckedNoteEvent[]
  
  // Strumming direction events for rhythmic strummed songs
  strum_events?: StrumEvent[]
  
  // Piano Grand Staff notes
  melody_notes?: GrandStaffNote[]
  piano_voicings?: {
    lh_note: string
    rh_notes: string[]
    lh_pitches: number[]
    rh_pitches: number[]
    inversion?: string
  }
  
  section?: string           // e.g. 'Intro', 'Verse 1', 'Theme A'
  variation?: string         // e.g. 'Variation 1'
}
```

### 2.2 Python Backend Model (`src/lib/music/seed_data.py`)
Matches the frontend schema in `progression_json`, serialized as JSON, and mirrored in `src/lib/schemas/music.py`.

---

## 3. Notation Rendering Engine (`vexflow-score-builder.ts`)

### 3.1 Guitar Tablature: Dual-Mode Rendering
* When `chord.plucked_notes` is present:
  * Creates individual VexFlow `TabNote` instances at discrete beat offsets with single string positions `{ str: pluck.string, fret: pluck.fret }`.
  * Adds downward rhythmic stems below the 6th string with appropriate flags/dots based on duration.
  * Colors bass plucks (strings 4, 5, 6) in Studio Amber (`#FBBF24` / `#B45309`) and treble plucks in standard ink.
  * Formats anchors so the playhead caliper aligns with the exact time offset of each plucked note.
* When `chord.plucked_notes` is absent:
  * Falls back to full-chord strumming block rendering with directional arrows.

### 3.2 Piano Grand Staff: Subtle Harmonic Labels & Polyphony
* Subdued harmonic labels (e.g., *Cm*, *G7*) rendered above the measure bar in small typographical ink (`#71717A` in dark mode, `#A1A1AA` in light mode, font-size 11px).
* Grand Staff staves render multi-voice polyphony:
  * Treble clef (right hand) notes in Emerald (`#34D399` / `#047857`).
  * Bass clef (left hand) notes in Amber (`#FBBF24` / `#B45309`).

---

## 4. Audio Engine & Real-Time Pitch Tracking

### 4.1 Synthesis (`practice-audio-engine.ts`)
* Adds `schedulePluckedNotes(notes: PluckedNoteEvent[], baseTime: number, secondsPerBeat: number)`.
* Triggers individual Karplus-Strong string synthesis instances per plucked note with realistic physical string decay and velocity dynamics.

### 4.2 Real-Time Pitch Tracking (`realtime-pitch-tracker.ts` & Cockpit)
* Determines `activeTargetNote` based on current playback beat offset.
* For arpeggio measures, evaluates the detected microphone fundamental against the single active target note within $\pm 35\text{ cents}$, delivering clean 100% accuracy feedback.
* For strummed chord measures, maintains 12-bin chroma template matching.

---

## 5. Repertoire Catalog (20 Masterworks)

### 🎸 10 Guitar Masterworks
1. **House of the Rising Sun** (*The Animals / Traditional American Folk*) — 6/8 single-string arpeggios ($Am \to C \to D \to F \to Am \to E$).
2. **Where Did You Sleep Last Night** (*Nirvana Unplugged / Traditional Folk*) — 3/4 dark acoustic arpeggio and heavy bass strum ($Em \to A \to G \to B7$).
3. **Spanish Romance (*Romance Anónimo*)** (*Traditional 19th Century Classical*) — 3/4 E minor high melody with steady triplet bass arpeggio.
4. **Scarborough Fair** (*Simon & Garfunkel / 17th Century English Folk*) — 3/4 D minor fingerpicking arpeggio ($Dm \to C \to Dm \to F \to C \to Dm$).
5. **Whiskey in the Jar** (*Thin Lizzy & Metallica / Traditional Irish Folk*) — 4/4 driving acoustic rock strum with root walkdowns ($G \to Em \to C \to G \to D$).
6. **Greensleeves** (*16th-Century Traditional*) — 6/8 E minor fingerstyle melody and arpeggiated bass movement.
7. **Bourrée in E minor (BWV 996)** (*J.S. Bach*) — 4/4 counterpoint fingerpicking riff.
8. **Malagueña** (*Traditional Andalusian Flamenco*) — 3/4 E Phrygian cadence ($Am \to G \to F \to E$) with thumb bass pedal.
9. **Knockin' Cadence** (*Folk-Rock Standard / Dylan style*) — 4/4 authentic open/muted acoustic voicing ($G$, $D/F\#$, $Am$, $C$) with ballad & anthem strums.
10. **12-Bar Delta Blues Shuffle in E** (*Traditional Delta Blues*) — 4/4 shuffle with muted low E string eighths and open string accents.

### 🎹 10 Piano Masterworks
1. **Waltz No. 2** (*Dmitri Shostakovich, Suite for Variety Orchestra*) — 3/4 C minor, right-hand lyrical theme + left-hand "boom-chick-chick" (root on beat 1, $Eb3+G3$ on beats 2 & 3).
2. **Pachelbel's Canon** (*Johann Pachelbel, IMSLP Urtext*) — 4/4 Basso continuo + 4 progressive polyphonic variations.
3. **Für Elise (Bagatelle No. 25, WoO 59)** (*Ludwig van Beethoven*) — 3/8 iconic main theme with left-hand arpeggiated bass leaps.
4. **Gymnopédie No. 1** (*Erik Satie, 1888*) — 3/4 Lento, melancholic floating bass leaps ($G\text{maj7} \to D\text{maj7}$) and gentle chords.
5. **Moonlight Sonata (1st Mvt, Op. 27 No. 2)** (*Ludwig van Beethoven*) — Rolling triplet arpeggios with sustained singing melody.
6. **Minuet in G major (BWV Anh. 114)** (*J.S. Bach / Petzold*) — 3/4 classic two-part counterpoint across Treble and Bass staves.
7. **Prelude in C major (BWV 846)** (*J.S. Bach, Well-Tempered Clavier*) — Continuous rolling 16th-note broken-chord arpeggiation.
8. **Clair de Lune** (*Claude Debussy*) — 9/8 Impressionist harmonic voicings and expressive opening motifs.
9. **The Entertainer** (*Scott Joplin, 1902*) — 2/4 classic ragtime syncopated melody with "oom-pah" stride bass.
10. **Autumn Jazz Turnaround** (*Jazz Standard Cadence*) — Voice-leading study with rich 7th chords ($Dm7 \to G7 \to C\text{maj7} \to A7$).

---

## 6. Verification & Testing Strategy
* **Unit Tests**:
  * `vexflow-score-builder.test.ts`: Test `plucked_notes` generates exact `TabNote`s on specific string lines with correct durations and anchors.
  * `practice-audio-engine.test.ts`: Verify `schedulePluckedNotes` schedules Karplus-Strong audio events at exact time intervals.
  * `song-catalog.test.ts`: Verify all 20 songs have valid progressions, monotonic beat cursors, and valid note pitches.
  * Backend `test_seed_data.py`: Verify JSON schema validity for all 20 exercises in `SEED_EXERCISES`.
* **Visual & Playback Verification**:
  * Verify *House of the Rising Sun* displays single-string tab numbers on strings 5, 4, 3, 2, 1, 2.
  * Verify *Waltz No. 2* displays Grand Staff notes with subtle *Cm*, *G7*, *Fm* annotations and audible "boom-chick-chick" playback.
