# Primary Source Research: Precision Web Audio Synthesis, Polyphonic Multi-Voice Scheduling, and Acoustic Modeling for Instrumental Practice

**Project**: Sonus (Adaptive Musical Practice System)  
**Date**: 2026-10-29  
**Scope**: Web Audio API Specifications, Real-Time Lookahead Event Scheduling, Karplus-Strong / Multi-Partial Physical Modeling for Guitar and Piano, Note Length Durations, Strum Dynamics, and Grand Staff Melody/Arpeggio Playback  

---

## 1. Executive Summary

This research investigates the root causes of deficient audio rendering in the Sonus practice stand and establishes the mathematical and architectural blueprints for a high-fidelity Web Audio synthesis and playback engine.

### Diagnosed Failure Modes in Existing Codebase
1. **Single-Event Chord Truncation**: Playback relied on an interval timer firing once per integer beat. On beat 1 of each measure, it invoked `playChord` once. Beats 2, 3, and 4 triggered no musical events whatsoever, rendering only metronome clicks and leaving the user with the impression that "it just plays the first chord."
2. **Premature Note Cutoff (Ignoring Note Length)**: `PracticeAudioEngine.playChord` hardcoded `durationSec = 1.2s`. In a typical practice tempo of 70 BPM, a 4-beat measure spans $3.43\text{ seconds}$ and a 6/8 measure spans $5.14\text{ seconds}$. Because audio faded out after $1.2\text{s}$, over $60\%$ of every measure was dead silence.
3. **Omission of Musical Substructures (Strums, Arpeggios, Melodies)**: Although the song catalog (`song-catalog.ts`) defines detailed musical specifications—including guitar strum vectors (`strum_events` with down/up strokes at sub-beat subdivisions like $0, 1.5, 2.5$), piano grand staff melodies (`melody_notes` with treble/bass clef assignments, note onsets, and exact beat durations), and piano left-hand/right-hand part splits—the playback loop passed none of these to the audio engine.
4. **Timbral Inauthenticity**: Both guitar and piano relied on raw triangle wave oscillators filtered by a static low-pass filter, sounding like a generic video game synth rather than an acoustic guitar or grand piano.
5. **Hardcoded Metronome**: In `practice-testing-studio.tsx`, `const isMetronomeEnabled = true` was hardcoded, and the HUD lacked any toggle for beat ticks.

---

## 2. Web Audio Precision Scheduling Specifications

### 2.1 Primary Sources
- **W3C Web Audio Working Group**: *Web Audio API W3C Recommendation (2021)*. [w3.org/TR/webaudio](https://www.w3.org/TR/webaudio/)
  - `AudioContext.currentTime`: Hardware-driven, monotonically increasing monotonic audio clock accurate to sample-level precision ($1/44100\text{s} \approx 22.7\mu\text{s}$).
  - `AudioParam.setValueAtTime`, `exponentialRampToValueAtTime`, `setTargetAtTime`.
- **Chris Wilson (W3C Audio WG)**: *A Tale of Two Clocks - Scheduling Web Audio with Precision* (HTML5 Rocks / Web.dev).
  - Clarifies why JavaScript `setInterval` and `requestAnimationFrame` suffer from $10\text{--}50\text{ms}$ UI thread jitter and garbage collection hiccups.
  - The Gold Standard pattern: Combine loose JS timers (lookahead scheduler running every $25\text{ms}$) with strict hardware Web Audio parameter scheduling ($100\text{ms}$ scheduling window ahead of `audioContext.currentTime`).

### 2.2 Time and Duration Equations
For any tempo $B$ (beats per minute), the duration of one beat in seconds $T_{\text{beat}}$ is:
$$T_{\text{beat}} = \frac{60}{B}$$

For a musical event occurring at measure-relative beat offset $b_{\text{offset}} \in [0, M)$ with duration $d$ beats:
$$t_{\text{start}} = t_{\text{measure\_start}} + b_{\text{offset}} \cdot T_{\text{beat}}$$
$$\text{duration}_{\text{seconds}} = d \cdot T_{\text{beat}}$$
$$t_{\text{end}} = t_{\text{start}} + \text{duration}_{\text{seconds}}$$

---

## 3. Acoustic Modeling & Timbral Synthesis

### 3.1 Acoustic Guitar Synthesis
#### Primary Sources
- **Karplus, K. & Strong, A.** (1983). *Digital Synthesis of Plucked-String and Drum Timbres*. Computer Music Journal, 7(2), 43–55.
- **Jaffe, D. A. & Smith, J. O.** (1983). *Extensions of the Karplus-Strong Plucked-String Algorithm*. Computer Music Journal, 7(2), 56–69.

#### Acoustic Characteristics
1. **String Pluck Transient**: A sharp excitation containing high-frequency energy decaying within $10\text{--}30\text{ms}$.
2. **String Dispersion & Low-pass Decay**: Fundamental harmonic frequencies are sustained while high harmonics decay rapidly via internal string friction.
3. **Strum Sweep Dispersion**: When a plectrum or finger sweeps across guitar strings:
   - **Downstroke ($\downarrow$)**: Sweeps low strings (String 6) to high strings (String 1). Sweep duration is $\Delta t_{\text{strum}} \approx 25\text{--}35\text{ms}$. For $N$ active strings, string $i$ begins at:
     $$t_i = t_{\text{event}} + i \cdot \frac{\Delta t_{\text{strum}}}{N - 1}$$
   - **Upstroke ($\uparrow$)**: Sweeps high strings (String 1) to low strings (String 6). Sweep duration is $\Delta t_{\text{strum}} \approx 20\text{--}30\text{ms}$. String $i$ begins at:
     $$t_i = t_{\text{event}} + (N - 1 - i) \cdot \frac{\Delta t_{\text{strum}}}{N - 1}$$
   - **Dynamic Accents**: Accented strums have higher peak amplitude and faster sweep ($15\text{--}20\text{ms}$).
4. **Body Resonance**: Acoustic guitar soundbox exhibits prominent resonance peaks around $100\text{Hz}$ (Helmholtz air cavity) and $200\text{Hz}$ (top plate resonance).

### 3.2 Acoustic Piano Synthesis
#### Primary Sources
- **Fletcher, N. H. & Rossing, T. D.** (1998). *The Physics of Musical Instruments* (2nd ed.). Springer-Verlag. Chapter 12: The Piano.
- **Bank, B., Zambon, S., & Fontana, F.** (2010). *Physics-based sound synthesis of the piano*. IEEE Signal Processing Magazine, 27(2), 85–94.

#### Acoustic Characteristics
1. **Hammer Strike & Dual Decay**:
   - The strike introduces a prominent initial impulse.
   - Piano tone displays **two-stage exponential decay**: an initial prompt decay followed by a long, warm aftersound:
     $$A(t) = w_1 e^{-t / \tau_{\text{prompt}}} + w_2 e^{-t / \tau_{\text{after}}}$$
     where $\tau_{\text{prompt}} \approx 0.3\text{--}0.8\text{s}$ and $\tau_{\text{after}} \approx 2.5\text{--}6.0\text{s}$ depending on register.
2. **Harmonic Multi-Partials**:
   - Fundamental $f_0$ (weight 1.0)
   - 2nd harmonic $2f_0$ (weight 0.45, decays $1.5\times$ faster)
   - 3rd harmonic $3f_0$ (weight 0.22, decays $2.5\times$ faster)
   - 4th harmonic $4f_0$ (weight 0.08, decays $4.0\times$ faster)
3. **Damper Release / Note Duration**:
   - As long as the key is held, the string rings out.
   - Upon key release at $t_{\text{end}} = t_{\text{start}} + d \cdot T_{\text{beat}}$, felt dampers contact the string, decaying remaining energy to zero within $60\text{--}90\text{ms}$.

---

## 4. Multi-Voice Playback Architecture for Sonus

### 4.1 Hierarchical Song Structure
A song measure in Sonus contains multiple concurrent and sequential musical elements:
```
Song Measure (e.g. 4 Beats)
├── Accompaniment Layer
│   ├── Guitar Mode:
│   │   ├── Strum Events (e.g. at 0.0, 1.0, 1.5, 2.5, 3.0, 3.5)
│   │   │   ├── Direction (Down / Up)
│   │   │   ├── Voicing String Frequencies
│   │   │   └── Accent (Velocity boost)
│   │   └── Ringing Sustain (Strings sustain across sub-beats)
│   └── Piano Mode:
│       ├── Left Hand Bass Note (Root at beat 0, or Oom-pah-pah in 3/4)
│       └── Right Hand Shell Voicing (Chords on beat 0 or syncopated)
└── Melody / Harmony Layer
    └── Grand Staff Notes (Treble & Bass)
        ├── Note Pitch (e.g. 'C5', 'E5', 'G4')
        ├── Beat Offset (e.g. 0.0, 1.0, 2.0, 3.0)
        └── Duration in Beats (e.g. 1.0 quarter, 0.5 eighth, 2.0 half)
```

### 4.2 Beat Ticks Metronome Toggle Specification
- In `PracticeTelemetryHUD`, replace the unlinked design with an explicit toggle button:
  - Label: `TICKS ON` / `TICKS OFF` (or `METRONOME ON / OFF`).
  - Active visual style: Charcoal filled pill when ON, ghost outline with muted text when OFF.
  - State: Controlled by `isMetronomeEnabled` prop.
  - Callback: `onToggleMetronome: () => void`.
- In `PracticeTestingStudio` and `PracticeStandPage`:
  - Provide `isMetronomeEnabled` state (persisted or defaulted to `true`).
  - Wire callback to toggle between `true` and `false`.
  - In the audio loop, guard all `audioEngine.playClick()` calls with `if (isMetronomeEnabled)`.

