# SONUS Precision Flowing Practice Stand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the SONUS Precision Musical Practice Stand featuring a continuous left-to-right flowing music sheet (6-line guitar tablature & piano grand staff) with a fixed center playhead, live microphone chord intonation/latency scoring, arbitrary chord progression support, and an authentic Traditional Ivory & Archival Ink aesthetic strictly devoid of verbose AI text clutter.

**Architecture:** A high-performance Web Audio real-time pitch and voicing detector tracks microphone input at $\le 20\text{ms}$ latency. A continuous Canvas/SVG notation engine glides smoothly leftwards synchronized to the audio context clock and BPM. Telemetry and active chord voicing cards are decoupled from AI commentary, displaying only high-density, precision musical metrics.

**Tech Stack:** React 19, TypeScript, Web Audio API (AnalyserNode, Autocorrelation/YIN pitch detection), Vitest + Testing Library, Tailwind CSS 4, Tonal.js.

**Spec:** [`docs/superpowers/specs/2026-10-28-sonus-precision-flowing-practice-stand-design.md`](file:///D:/Projects/adaptive-music-practice/docs/superpowers/specs/2026-10-28-sonus-precision-flowing-practice-stand-design.md)

## Global Constraints

- Palette strictly follows Traditional Ivory (`#F7F5F0`), Linen (`#FCFBF8`, `#EFECE6`), Iron Gall Charcoal (`#242321`), Terracotta (`#9A2A2A`), and Sage Green (`#4A6B5B`). Zero neon, zero glowing cards.
- STRICT RULE: No verbose AI text, motivational quotes, advice cards, or paragraphs. Only musical notation, fret diagrams, and numerical telemetry.
- Support both 6-line Guitar Tablature and Piano Grand Staff (Treble + Bass clefs).
- Microphone chord detection must run in real-time as the playhead hits each chord block.
- Support arbitrary chord progression sequences (not locked to 6 static exercises).

## Review Focus

1. Microphone pitch tracker handling low-frequency guitar notes (E2 @ 82.4 Hz, A2 @ 110 Hz) with autocorrelation window size $\ge 2048$ samples without lagging.
2. Smooth continuous scroll animation must avoid frame drops or tempo jitter when switching tabs or varying BPM (driven by `requestAnimationFrame` + `AudioContext.currentTime`).
3. Guitar tab fingering generator correctly handles barre chords, muted strings (`x`), and open strings without invalid negative fret indices.
4. Pitch class intersection accurately scores partial voicings (e.g., 5-string strum missing high E) without falsely registering a 0% complete miss.
5. Mode switching between Guitar Tab and Piano Grand Staff preserves practice session time, tempo, and playhead position without memory leaks.

---

### Task 1: Dynamic Chord Voicing & Progression Generator

**Files:**
- Create: `apps/web/src/lib/music/chord-voicings.ts`
- Test: `apps/web/src/lib/music/__tests__/chord-voicings.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GuitarTabVoicing = {
    frets: (number | null)[] // 6 strings: [lowE, A, D, G, B, highE]
    fingering: string
    barreFret?: number
    strings: string
  }
  export type PianoVoicing = {
    lhNotes: string[]
    rhNotes: string[]
    lhPitches: number[]
    rhPitches: number[]
  }
  export type VoicingDefinition = {
    chordName: string
    root: string
    quality: string
    expectedPitches: number[]
    pitchClasses: number[]
    guitarTab: GuitarTabVoicing
    pianoVoicing: PianoVoicing
    pitchSpelling: { note: string; role: string }[]
  }
  export function resolveChordVoicing(chordName: string): VoicingDefinition
  export function parseProgressionSequence(sequence: string[]): VoicingDefinition[]
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { resolveChordVoicing, parseProgressionSequence } from '../chord-voicings'

describe('resolveChordVoicing', () => {
  it('resolves Bm barre chord accurately with 6-string frets and pitches', () => {
    const voicing = resolveChordVoicing('Bm')
    expect(voicing.chordName).toBe('Bm')
    expect(voicing.guitarTab.frets).toEqual([null, 2, 4, 4, 3, 2])
    expect(voicing.guitarTab.barreFret).toBe(2)
    expect(voicing.pitchClasses).toContain(11) // B
    expect(voicing.pitchClasses).toContain(2)  // D
    expect(voicing.pitchClasses).toContain(6)  // F#
    expect(voicing.pitchSpelling.length).toBeGreaterThanOrEqual(3)
  })

  it('resolves open G major chord accurately', () => {
    const voicing = resolveChordVoicing('G')
    expect(voicing.guitarTab.frets).toEqual([3, 2, 0, 0, 3, 3])
    expect(voicing.pitchClasses).toEqual([7, 11, 2]) // G, B, D
  })

  it('parses arbitrary progression sequences into chained voicings', () => {
    const prog = parseProgressionSequence(['D', 'A', 'Bm', 'G'])
    expect(prog).toHaveLength(4)
    expect(prog.map(p => p.chordName)).toEqual(['D', 'A', 'Bm', 'G'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test apps/web/src/lib/music/__tests__/chord-voicings.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `resolveChordVoicing` and `parseProgressionSequence` in `apps/web/src/lib/music/chord-voicings.ts`**

Implement deterministic chord parser, guitar fretboard lookup, piano shell voicing builder, and pitch spelling using standard music theory rules.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test apps/web/src/lib/music/__tests__/chord-voicings.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/music/chord-voicings.ts apps/web/src/lib/music/__tests__/chord-voicings.test.ts
git commit -m "feat(music): implement dynamic chord voicing generator for guitar and piano"
```

---

### Task 2: Real-Time Audio Pitch & Voicing Detector

**Files:**
- Create: `apps/web/src/lib/audio/realtime-pitch-tracker.ts`
- Test: `apps/web/src/lib/audio/__tests__/realtime-pitch-tracker.test.ts`

**Interfaces:**
- Consumes: `VoicingDefinition` from Task 1.
- Produces:
  ```ts
  export type PitchDetectionResult = {
    detectedFreqHz: number | null
    detectedNote: string | null
    centsDeviation: number
    rmsDb: number
    voicingCompleteness: number // 0.0 to 1.0
    matchedPitchClasses: number[]
    missingPitchClasses: number[]
    timingDeltaMs: number
  }
  export class RealtimePitchTracker {
    constructor(sampleRate?: number)
    detectPitch(timeData: Float32Array): { freq: number; cents: number; note: string } | null
    evaluateChordMatch(
      timeData: Float32Array,
      expected: VoicingDefinition,
      targetTimestampMs: number,
      currentTimestampMs: number
    ): PitchDetectionResult
  }
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { RealtimePitchTracker } from '../realtime-pitch-tracker'
import { resolveChordVoicing } from '../../music/chord-voicings'

describe('RealtimePitchTracker', () => {
  it('detects 440Hz A4 accurately via autocorrelation', () => {
    const tracker = new RealtimePitchTracker(44100)
    const buffer = new Float32Array(2048)
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.sin((2 * Math.PI * 440 * i) / 44100)
    }
    const result = tracker.detectPitch(buffer)
    expect(result).not.toBeNull()
    expect(result?.note).toBe('A4')
    expect(Math.abs(result!.freq - 440)).toBeLessThan(1.0)
  })

  it('evaluates chord match and timing delta against expected voicing', () => {
    const tracker = new RealtimePitchTracker(44100)
    const voicing = resolveChordVoicing('D')
    const buffer = new Float32Array(2048)
    // synthesize D4 fundamental
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = 0.5 * Math.sin((2 * Math.PI * 293.66 * i) / 44100)
    }
    const match = tracker.evaluateChordMatch(buffer, voicing, 1000, 1012)
    expect(match.detectedNote).toBe('D4')
    expect(match.matchedPitchClasses).toContain(2) // D
    expect(match.timingDeltaMs).toBe(12) // 1012 - 1000
    expect(match.voicingCompleteness).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test apps/web/src/lib/audio/__tests__/realtime-pitch-tracker.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `RealtimePitchTracker` in `apps/web/src/lib/audio/realtime-pitch-tracker.ts`**

Implement normalized square difference function (NSDF) / autocorrelation pitch detection with parabolic interpolation for accurate cents calculation, decibel RMS calculation, and pitch-class set matching.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test apps/web/src/lib/audio/__tests__/realtime-pitch-tracker.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/audio/realtime-pitch-tracker.ts apps/web/src/lib/audio/__tests__/realtime-pitch-tracker.test.ts
git commit -m "feat(audio): add real-time pitch tracker and harmonic voicing matcher"
```

---

### Task 3: Continuous Flowing Music Sheet & Tab Ribbon Canvas

**Files:**
- Create: `apps/web/src/components/practice/flowing-notation-stand.tsx`
- Test: `apps/web/src/components/practice/__tests__/flowing-notation-stand.test.tsx`

**Interfaces:**
- Consumes: `VoicingDefinition` from Task 1, `PitchDetectionResult` from Task 2.
- Produces:
  ```tsx
  export type FlowingNotationStandProps = {
    instrument: 'guitar' | 'piano'
    progression: VoicingDefinition[]
    currentBeat: number
    tempoBpm: number
    isPlaying: boolean
    activeHitResult?: PitchDetectionResult | null
    onSeekBeat?: (beat: number) => void
  }
  export function FlowingNotationStand(props: FlowingNotationStandProps): JSX.Element
  ```

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FlowingNotationStand } from '../flowing-notation-stand'
import { parseProgressionSequence } from '@/lib/music/chord-voicings'

describe('FlowingNotationStand', () => {
  const prog = parseProgressionSequence(['G', 'D', 'Am', 'C'])

  it('renders 6 guitar strings with frequency labels in guitar mode', () => {
    render(
      <FlowingNotationStand
        instrument="guitar"
        progression={prog}
        currentBeat={1}
        tempoBpm={80}
        isPlaying={false}
      />
    )
    expect(screen.getByTestId('flowing-notation-canvas')).toBeDefined()
    expect(screen.getByText(/1 \(e\) 329Hz/i)).toBeDefined()
    expect(screen.getByText(/6 \(E\) 82Hz/i)).toBeDefined()
  })

  it('renders central playhead hit point indicator', () => {
    render(
      <FlowingNotationStand
        instrument="guitar"
        progression={prog}
        currentBeat={4}
        tempoBpm={80}
        isPlaying={true}
      />
    )
    expect(screen.getByTestId('center-playhead')).toBeDefined()
    expect(screen.getByText(/HIT POINT/i)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test apps/web/src/components/practice/__tests__/flowing-notation-stand.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `FlowingNotationStand` in `apps/web/src/components/practice/flowing-notation-stand.tsx`**

Render the traditional ivory parchment background (`#F7F5F0`), horizontal 6-line guitar tab with string labels, vertical measure bars, chord symbol banners, fret indicators on string coordinates, and the central terracotta caliper playhead. Support dynamic smooth sliding based on `currentBeat`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test apps/web/src/components/practice/__tests__/flowing-notation-stand.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/practice/flowing-notation-stand.tsx apps/web/src/components/practice/__tests__/flowing-notation-stand.test.tsx
git commit -m "feat(web): build continuous flowing notation and guitar tab ribbon canvas"
```

---

### Task 4: Precision Telemetry & Minimalist Transport HUD

**Files:**
- Create: `apps/web/src/components/practice/practice-telemetry-hud.tsx`
- Test: `apps/web/src/components/practice/__tests__/practice-telemetry-hud.test.tsx`

**Interfaces:**
- Produces:
  ```tsx
  export type PracticeTelemetryHUDProps = {
    instrument: 'guitar' | 'piano'
    onInstrumentChange: (inst: 'guitar' | 'piano') => void
    pieceTitle: string
    keySignature: string
    currentMeasure: number
    totalMeasures: number
    tempoBpm: number
    onTempoChange: (bpm: number) => void
    activeChord: VoicingDefinition
    intonationAccuracy: number
    timingSyncMs: number
    voicingStringsCount: number
    isPlaying: boolean
    onTogglePlay: () => void
    onRestart: () => void
    livePitchText?: string
    liveRmsDb?: number
  }
  export function PracticeTelemetryHUD(props: PracticeTelemetryHUDProps): JSX.Element
  ```

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PracticeTelemetryHUD } from '../practice-telemetry-hud'
import { resolveChordVoicing } from '@/lib/music/chord-voicings'

describe('PracticeTelemetryHUD', () => {
  const chord = resolveChordVoicing('Bm')

  it('renders top HUD with BPM, metronome controls, and instrument toggle', () => {
    const onTempoChange = vi.fn()
    render(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={14}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={onTempoChange}
        activeChord={chord}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={6}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )
    expect(screen.getByText('80')).toBeDefined()
    expect(screen.getByText(/Four-Chord Anthem/i)).toBeDefined()
    expect(screen.getByText(/98.4%/i)).toBeDefined()
    expect(screen.getByText(/±6 ms/i)).toBeDefined()

    // Test tempo adjust button
    const plusBtn = screen.getByRole('button', { name: /\+/i })
    fireEvent.click(plusBtn)
    expect(onTempoChange).toHaveBeenCalledWith(81)
  })

  it('displays vector fretboard diagram without verbose text', () => {
    render(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={14}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={chord}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={6}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )
    expect(screen.getByTestId('fretboard-diagram')).toBeDefined()
    expect(screen.queryByText(/AI advice/i)).toBeNull()
    expect(screen.queryByText(/pedagogical/i)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test apps/web/src/components/practice/__tests__/practice-telemetry-hud.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `PracticeTelemetryHUD` in `apps/web/src/components/practice/practice-telemetry-hud.tsx`**

Build the precision header and bottom telemetry deck with woodcut fretboard rendering, intonation gauge, timing needle, mechanical buttons, and zero verbose copy.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test apps/web/src/components/practice/__tests__/practice-telemetry-hud.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/practice/practice-telemetry-hud.tsx apps/web/src/components/practice/__tests__/practice-telemetry-hud.test.tsx
git commit -m "feat(web): add traditional ivory telemetry and transport HUD"
```

---

### Task 5: Complete Practice Stand Page Assembly & Custom Progression Builder

**Files:**
- Create: `apps/web/src/components/practice/practice-stand-page.tsx`
- Modify: `apps/web/src/app.tsx`
- Test: `apps/web/src/components/practice/__tests__/practice-stand-page.test.tsx`

**Interfaces:**
- Connects `FlowingNotationStand`, `RealtimePitchTracker`, `PracticeTelemetryHUD`, and `PracticeAudioEngine`.
- Supports selecting default progressions or entering custom chord strings (e.g. `D - A - Bm - G`).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PracticeStandPage } from '../practice-stand-page'

describe('PracticeStandPage', () => {
  it('renders the complete SONUS practice stand interface', () => {
    render(<PracticeStandPage />)
    expect(screen.getByText(/SONUS/i)).toBeDefined()
    expect(screen.getByTestId('flowing-notation-canvas')).toBeDefined()
    expect(screen.getByTestId('fretboard-diagram')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test apps/web/src/components/practice/__tests__/practice-stand-page.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `PracticeStandPage` and integrate into `apps/web/src/app.tsx`**

Compose the components with high-resolution Web Audio loop, microphone stream listener, metronome audio synthesis, and custom progression selector.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test apps/web/src/components/practice/__tests__/practice-stand-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify all web tests and build**

Run: `pnpm --filter web test && pnpm --filter web build`
Expected: ALL PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/practice/practice-stand-page.tsx apps/web/src/app.tsx apps/web/src/components/practice/__tests__/practice-stand-page.test.tsx
git commit -m "feat(web): integrate complete SONUS precision flowing practice stand"
```
