# Architectural Design Spec: High-Fidelity Audio Rendering, Multi-Voice Note Scheduling, and Beat Ticks Metronome Control

**Feature**: High-Fidelity Audio Synthesis & Dynamic Note/Strum Playback  
**Date**: 2026-10-29  
**Status**: Approved (Autonomous Goal Execution)  
**Authors**: Antigravity & User  

---

## 1. Intent & Success Criteria

### 1.1 Intent
Enable Sonus practice studio to provide an authentic, musically expressive audio playback reference for practicing musicians. The user must be able to:
1. Toggle the metronome beat ticks ON/OFF directly from the practice HUD without affecting musical playback.
2. Hear realistic acoustic rendering of instruments:
   - **Guitar**: Plucked acoustic string timbres, realistic downstrum and upstrum speed sweeps, accented strums, fingerpicked arpeggios, and natural string sustain.
   - **Piano**: Dual-stage hammer-strike decay, multi-partial rich acoustic harmonics, damper release upon note duration expiration, and distinct left-hand bass vs. right-hand chord/melody voices.
3. Hear every note, strum, melody, harmony, and arpeggio across the entire measure and song according to its specified beat offset and note length duration, rather than only the first chord fading out after 1.2 seconds.

### 1.2 Success Criteria
- [x] **Beat Ticks Toggle**: A dedicated tactile button in `PracticeTelemetryHUD` toggling `TICKS ON` / `TICKS OFF`. Both `PracticeTestingStudio` and `PracticeStandPage` respect this toggle.
- [x] **Exact Note Duration & Length**: Notes and chords ring for their true duration ($d \cdot \frac{60}{\text{BPM}}\text{ seconds}$) with natural exponential decay and damper release, not a fixed 1.2s cutoff.
- [x] **Guitar Strum Rendering**: Downstrums sweep low-to-high strings ($25\text{--}35\text{ms}$), upstrums sweep high-to-low strings ($20\text{--}30\text{ms}$), with accent dynamics applied.
- [x] **Melody & Arpeggio Playback**: If a song defines `melody_notes`, each note is rendered at its exact beat offset with its specified pitch, clef, and duration.
- [x] **Piano Voice Separation**: Left-hand bass notes are placed at lower registers ($A_1\text{--}C_3$) with deep resonance; right-hand voicings/melodies ring in upper registers with clear harmonic presence.
- [x] **Seamless Backward Compatibility**: Existing songs without custom melody or strum events continue to play full harmonic chord voicings for their full measure duration.
- [x] **Full Automated Test Coverage**: Vitest unit & component tests verifying the HUD toggle, audio engine synthesis methods, and playback scheduling logic.

---

## 2. Technical Architecture

### 2.1 Component & Layer Decomposition

```
[PracticeTestingStudio / PracticeStandPage]
  │
  ├── [PracticeTelemetryHUD]
  │     └── [Beat Ticks Toggle: "TICKS ON / OFF"]
  │     └── [Audio Backing Toggle: "AUDIO ON / OFF"]
  │     └── [Tempo Controls: "BPM - / +"]
  │
  ├── [Continuous Audio Scheduler] (Sub-beat precision lookahead)
  │     ├── Inspect active measure & chord definition
  │     ├── Schedule Strum Events (Guitar: D / U / Accents at beat offsets)
  │     ├── Schedule Melody & Arpeggio Notes (GrandStaffNotes at beat offsets)
  │     ├── Schedule LH Bass / RH Harmony Voicings
  │     └── Fallback: Sustained polyphonic chord voicing for full measure
  │
  └── [PracticeAudioEngine]
        ├── `playClick(isDownbeat)` (Metronome tick)
        ├── `playGuitarStrum(pitches, direction, isAccented, durationSec)`
        ├── `playGuitarPluck(pitchOrMidi, durationSec, velocity)`
        ├── `playPianoNote(pitchOrMidi, durationSec, velocity, isBass)`
        ├── `playPianoVoicing(lhPitches, rhPitches, durationSec)`
        └── `playChord(chordName, pitches, durationSec, instrument)`
```

---

## 3. Detailed Specifications

### 3.1 PracticeTelemetryHUD: Beat Ticks Toggle
- **Props Additions**:
  ```ts
  isMetronomeEnabled?: boolean
  onToggleMetronome?: () => void
  ```
- **HUD Element**:
  Placed adjacent to the Backing Audio Toggle (`AUDIO ON / OFF`):
  - When ON:
    `bg-[#242321] text-[#FCFBF8] border-[#242321] dark:bg-[#EDE8DF] dark:text-[#141312] dark:border-[#EDE8DF]`
    Icon: `⏱️`
    Label: `TICKS ON`
  - When OFF:
    `bg-[#FCFBF8] text-[#736E65] border-[#D9D3C7] dark:bg-[#141312] dark:text-[#A39C8F] dark:border-[#38342E]`
    Icon: `⏱️`
    Label: `TICKS OFF`

### 3.2 Enhanced PracticeAudioEngine
- **Instrument Awareness**:
  Support `'guitar'` and `'piano'` acoustic models:
  - **Guitar Pluck / Strum**:
    - Synthesizes metallic/nylon acoustic string pluck using multi-stage harmonic generators (fundamental triangle + high-frequency pluck burst + body filter).
    - In strums: calculates string delay offsets based on direction:
      - Downstroke: low string to high string ($4\text{--}6\text{ms}$ step).
      - Upstroke: high string to low string ($3\text{--}5\text{ms}$ step).
    - Accent: raises velocity by $35\%$ and shortens sweep time.
  - **Piano Note / Voicing**:
    - Synthesizes acoustic piano hammer tone using multi-partial additive synthesis ($f_0$ fundamental + $2f_0$ octave overtone + $3f_0$ twelfth overtone).
    - Applies two-stage decay (prompt attack decay + warm body aftersound).
    - Damper release: upon expiration of `durationSec`, applies quick exponential ramp ($60\text{--}80\text{ms}$) to zero gain, accurately simulating key release.
  - **Pitch Parsing**:
    Accepts either MIDI numbers (e.g. `60`) or scientific pitch strings (e.g. `'C4'`, `'F#3'`).

### 3.3 Song Playback Scheduler in Practice Studio
- **Sub-Beat Scheduling Interval**:
  The playback interval now runs at an eighth-note (or sixteenth-note) subdivision:
  $$\Delta t_{\text{tick}} = \frac{T_{\text{beat}}}{2} = \frac{30}{\text{BPM}}\text{ seconds}$$
  For instance, at 80 BPM, $\Delta t_{\text{tick}} = 375\text{ms}$, allowing natural scheduling of beat subdivisions ($0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5$).
- **Measure Event Execution**:
  At each beat subdivision $b$:
  1. **Beat Ticks**: If $b$ is an integer beat and `isMetronomeEnabled` is true, trigger `playClick(b === 0)`.
  2. **Music Rendering** (when `isChordAudioEnabled` is true):
     - If the chord has `strum_events`: match events where `Math.abs(event.beatOffset - b) < 0.05`. Trigger `playGuitarStrum` with the chord's voicing pitches, direction, accent, and remaining beat duration.
     - If the chord has `melody_notes`: match notes where `Math.abs(note.beatOffset - b) < 0.05`. Trigger `playPianoNote` or `playGuitarPluck` for each note with its exact duration ($d \cdot T_{\text{beat}}$).
     - If the chord has `piano_voicings`:
       - On beat 0: play LH bass note (`playPianoNote(lhNote, duration, 0.85, true)`).
       - If waltz/syncopated: play LH chord on beats 1 & 2.
       - Play RH chord voicings.
     - **Fallback**: If no granular strum or melody events exist for the chord, on beat 0 play the full chord voicing with `durationSec = chordDuration * T_beat`, sustaining for the complete measure!

---

## 4. Verification Plan

1. **Vitest Unit Tests**:
   - `practice-audio-engine.test.ts`: Verify `playGuitarStrum`, `playGuitarPluck`, `playPianoNote`, `playPianoVoicing`, `playChord` with instrument parameter, pitch parsing for strings and MIDI, and custom durations.
   - `practice-telemetry-hud.test.tsx`: Verify presence and interaction of the `TICKS ON / OFF` toggle button.
   - `practice-stand-page.test.tsx` & `practice-testing-studio.test.tsx`: Verify state toggling and click suppression when `isMetronomeEnabled` is false.
2. **Build and Type Checking**:
   - Run `pnpm --dir apps/web test` and `pnpm --dir apps/web build` (`tsc -b && vite build`) to verify strict TypeScript adherence and zero regressions.
3. **Manual / End-to-End Audio Flow Verification**:
   - Test guitar songs (`Knockin' Cadence`, `Four-Chord Anthem`, `House of the Rising Sun`) to ensure all strums (down, up, accented) and arpeggios ring out.
   - Test piano songs (`Pachelbel's Canon Harmonic Flow`, `Waltz No. 2`) to ensure melody notes, LH bass lines, and harmonic voicings play across all measures to their full note length.

