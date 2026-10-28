# Implementation Plan: Audio Rendering & Beat Ticks Metronome Control

**Goal**: Transform Sonus practice audio from a 1.2s static chord into a rich, authentic multi-voice rendering engine supporting guitar strums, piano hammer tones, melodies, arpeggios, and an interactive Beat Ticks HUD toggle.

---

### Proposed Changes

#### 1. Audio Engine Enhancement (`apps/web/src/lib/audio/practice-audio-engine.ts`)
- Add pitch resolver utility converting scientific pitch names (e.g. `'C4'`, `'F#3'`) to MIDI and frequencies.
- Implement `playGuitarPluck(pitch, durationSec, velocity)` with plucked transient and string damping.
- Implement `playGuitarStrum(pitches, direction, isAccented, durationSec)` with directional string sweep dispersion ($4\text{ms}$ per string for downstrokes, upstrokes high-to-low).
- Implement `playPianoNote(pitch, durationSec, velocity, isBass)` with multi-partial hammer strike harmonics and damper release on note cutoff.
- Implement `playPianoVoicing(lhPitches, rhPitches, durationSec)` separating deep bass resonance from treble chord voicings.
- Enhance `playChord(chordName, pitches, durationSec, instrument)` to compute duration from tempo and route to instrument-specific sound synthesis.

#### 2. Metronome Beat Ticks Toggle in HUD (`apps/web/src/components/practice/practice-telemetry-hud.tsx`)
- Add `isMetronomeEnabled: boolean` and `onToggleMetronome: () => void` props to `PracticeTelemetryHUDProps`.
- Render a dedicated tactile button in the top HUD:
  - Display `⏱️ TICKS ON` (dark active style) or `⏱️ TICKS OFF` (muted ghost style).
  - Add accessible label and tooltip.

#### 3. Practice Studio Playback Engine (`apps/web/src/components/dev/practice-testing-studio.tsx`)
- Replace `const isMetronomeEnabled = true` with React state `const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(true)`.
- Connect `isMetronomeEnabled` and `onToggleMetronome={() => setIsMetronomeEnabled(v => !v)}` to `PracticeTelemetryHUD`.
- Upgrade the play-along scheduler from integer beats to sub-beat subdivisions (eighth-notes, $\Delta t = \frac{30}{\text{BPM}}\text{s}$):
  - On integer beats: trigger metronome click if `isMetronomeEnabled`.
  - At each sub-beat offset:
    - If song has `strum_events`: match events at current beat offset and execute `playGuitarStrum` with direction, velocity accent, and remaining chord duration.
    - If song has `melody_notes`: match notes at current beat offset and execute `playPianoNote` / `playGuitarPluck` with exact duration ($d \cdot T_{\text{beat}}$).
    - If song has `piano_voicings`: schedule LH bass note on beat 0 and RH chord tones.
    - If no sub-events exist: play full polyphonic chord voicing sustained for the complete `duration_beats` of the measure.

#### 4. Practice Stand Page (`apps/web/src/components/practice/practice-stand-page.tsx`)
- Add `isMetronomeEnabled` state and wire to `PracticeTelemetryHUD`.
- Connect `PracticeAudioEngine` to play chords/voicings as the playhead advances through measures.
- Guard `playClickSound` with `isMetronomeEnabled`.

#### 5. Tests
- Unit test all new synthesis methods in `practice-audio-engine.test.ts`.
- Component test `PracticeTelemetryHUD` toggle in `practice-telemetry-hud.test.tsx`.
- Update `practice-stand-page.test.tsx` and run full vitest suite.

---

### Verification Checklist
- [ ] `pnpm --dir apps/web test` passes 100% of tests.
- [ ] `pnpm --dir apps/web build` succeeds without TypeScript or Vite errors.
- [ ] Beat ticks toggle cleanly mutes and unmutes metronome clicks without interrupting audio playback.
- [ ] Guitar songs render strums, arpeggios, and accents.
- [ ] Piano songs render melody notes, bass lines, and chord voicings to their exact note length.

