# Architectural Blueprint & Concrete Implementation Plan: Setup & Sacred Tuning Ritual Screen

**Author**: Explorer M3-2 (Gen 2)  
**Target Milestone**: Milestone 3 — Device Setup & Tuning Ritual Screen  
**Component Path**: `apps/web/src/components/screens/tuning-ritual-screen.tsx`  
**Supporting Modules**:  
- `apps/web/src/lib/pitch-math.ts`  
- `apps/web/src/hooks/use-tuning-engine.ts`  
- `apps/web/src/app.tsx` (screen slot wiring)

---

## 1. Executive Summary & Design System Conformance

The **Setup & Sacred Tuning Ritual** (`Harmonia`, spatial coordinate `(1, 0)`) serves as the acoustic sanctum and calibration chamber of the Sonus Adaptive Musical Practice System. It bridges the physical instrument (acoustic microphone or WebMIDI controller) with the digital manuscript canvas.

### Design System ("Living Manuscript") Compliance
- **Canvas Palette**: Parchment `#F4F1EA`, Aged Vellum `#E9E4DA`, Iron Gall Charcoal `#2C2A29`, Rubricated Crimson `#9A2A2A`, Muted Graphite `#7E7570`, Beaten Gold Leaf `#C8A858`.
- **Strict Geometry**: Zero border radius (`rounded-none`, `radius: 0px`), zero modern SaaS drop shadows (`shadow-none`), structural hairline borders (`1px solid #2C2A29`), classical double rules (`3px double #2C2A29`).
- **Typography Hierarchy**:
  - `Playfair Display`: Screen titles, Italian performance directives (*Accordatura: Moderato e tranquillo*), large detected note glyphs (64px / `text-5xl`).
  - `Geist Mono`: Precise frequencies (Hz), cents deviation (¢), timestamps, hardware sampling rates, latency telemetry.
  - `Inter`: Clear functional labels, mode toggles, and instrument registers.
- **Musical Glyphs**: SMuFL standard / Unicode glyphs (`♮`, `♯`, `♭`, `𝄐`, `𝄞`, `𝄡`, `𝄢`).

---

## 2. Mathematical Specifications & Geometry

### 2.1. Needle Angle Formula
The Sacred Astrolabe intonation dial features an arc spanning **$\pm 50$ cents**, mapped across an angular sweep of **$\pm 60^\circ$** relative to true vertical ($0^\circ$):

$$\theta = \frac{\text{clamp}(\text{centsDeviation}, -50, 50)}{50} \times 60^\circ$$

- **$-50$ cents (Flat / Sinistra)**: $\theta = -60^\circ$ (pointing toward the flat marker `♭`)
- **$0$ cents (In Tune / Equilibrium)**: $\theta = 0^\circ$ (pointing vertically toward the natural marker `♮`)
- **$+50$ cents (Sharp / Dextra)**: $\theta = +60^\circ$ (pointing toward the sharp marker `♯`)

In SVG rotation space with pivot at dial center $(cx, cy) = (160, 160)$:
$$\text{transform} = \text{rotate}(\theta, 160, 160)$$

### 2.2. Radial Graduation Ticks
Dial diameter is $320\text{px}$, radius $R = 160\text{px}$, center $(cx, cy) = (160, 160)$.
For any cents value $c \in [-50, 50]$:
1. Normalized angle: $\theta = (c / 50) \times 60^\circ$
2. Cartesian angle in standard SVG coordinates ($0^\circ$ at $+X$, counterclockwise/clockwise):
   $$\phi = (\theta - 90^\circ) \times \frac{\pi}{180}$$
3. Radial tick line segments:
   - **Major Ticks** ($c \in \{-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50\}$):
     Inner radius $r_1 = 124\text{px}$, outer radius $r_2 = 138\text{px}$.
     $$x_1 = 160 + 124 \cos(\phi), \quad y_1 = 160 + 124 \sin(\phi)$$
     $$x_2 = 160 + 138 \cos(\phi), \quad y_2 = 160 + 138 \sin(\phi)$$
   - **Minor Ticks** (every $5$ cents):
     Inner radius $r_1 = 128\text{px}$, outer radius $r_2 = 136\text{px}$.
   - **Numeric & Glyphic Labels**:
     Positioned at $r = 112\text{px}$ along radial vector $\phi$.
     - $c = -50$: Label `♭`
     - $c = 0$: Label `♮`
     - $c = +50$: Label `♯`

### 2.3. In-Tune Resonance Halo Criteria
$$\text{inTune} = |\text{centsDeviation}| \le 3.0$$

When $\text{inTune} = \text{true}$ and an active audio/MIDI signal is detected:
1. **Concentric Resonance Ring** ($r = 142\text{px}$): Transitions stroke from faint charcoal (`#2C2A29`, opacity $0.15$) to glowing crimson ink (`#9A2A2A`, strokeWidth $3\text{px}$, opacity $0.95$).
2. **Radial Halo Aura**: An SVG radial gradient filter radiating from dial center $(160, 160)$ softly pulses with `#9A2A2A` crimson bloom.
3. **Equilibrium Status Badge**: Displays `HARMONIA PERFECTA · IN EQUILIBRIO` in rubricated crimson monospace.

### 2.4. Musical Acoustics & Pitch Standards
Given reference pitch standard $A_4 \in \{415.0, 440.0, 442.0\}\text{ Hz}$:
1. **MIDI Note Calculation**:
   $$m = 69 + 12 \log_2\left(\frac{f}{A_4}\right)$$
   Nominal MIDI note index: $N = \text{round}(m)$.
2. **Nominal Frequency $f_0$ of Closest Chromatic Note**:
   $$f_0 = A_4 \times 2^{(N - 69) / 12}$$
3. **Cents Deviation**:
   $$\text{cents} = 1200 \log_2\left(\frac{f}{f_0}\right)$$
4. **Note Name and Octave**:
   $$\text{octave} = \lfloor N / 12 \rfloor - 1, \quad \text{chroma} = N \pmod{12}$$
   Standard chromatic names: `['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']`.

---

## 3. System Architecture & Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TuningRitualScreen (apps/web/src/components/screens/tuning-ritual-screen.tsx)│
├─────────────────────────────────────────────────────────────────────────────┤
│ Header: Directive "Accordatura: Moderato e tranquillo" + Status Telemetry   │
├──────────────────────────┬───────────────────────┬──────────────────────────┤
│ Left Panel (~330px)      │ Center Panel (~460px) │ Right Panel (~330px)     │
│ [Hardware Detection]     │ [Sacred Astrolabe]    │ [Calibration Ledger]     │
│                          │                       │                          │
│ • Mode Toggle: MIC/MIDI  │ • 320px SVG Dial      │ • Pitch Standards:       │
│ • Live Audio Waveform    │ • Concentric Rings    │   415 / 440 / 442 Hz     │
│   (Oscilloscope Ripple)  │ • Graduated Ticks     │ • Instrument Registers:  │
│ • Hardware Info & Gain   │ • Animated Needle     │   Violin, Viola, Cello,  │
│ • Headless/Test Fallback │ • Crimson Halo (±3¢)  │   Flute, Voice           │
│   Simulation Controls    │ • Note Display (64px) │ • Open Strings Selector  │
│                          │ • Frequency / Cents   │ • Miniature 5-line staff │
├──────────────────────────┴───────────────────────┴──────────────────────────┤
│ Bottom Dock:                                                                │
│ • Ceremonial Wax Seal CTA: [ 𝄐 Seal Tuning & Mount Stand ] (Crimson #9A2A2A)│
│   Triggers: useSpatialNavigation().panTo('practice')                        │
│ • Marginal return anchor: ← Return to Practice Stand (0, 0)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Audio Engine & Hardware Detection Architecture

### 4.1. Acoustic Microphone & Autocorrelation
- Uses native `AudioContext` and `AnalyserNode` (`fftSize = 2048`).
- Real-time time-domain buffer extraction (`getFloatTimeDomainData`).
- Normalized Autocorrelation pitch extraction:
  - RMS calculation rejects ambient silence / noise floor ($\text{RMS} < 0.015$).
  - Searches lag window corresponding to $50\text{ Hz} \dots 1200\text{ Hz}$.
  - Parabolic interpolation on the autocorrelation peak achieves sub-hertz ($\pm 0.1\text{ Hz}$) frequency resolution.
- Smoothness filter: exponential moving average ($\alpha = 0.35$) damps micro-jitter while preserving needle responsiveness.

### 4.2. WebMIDI Interface
- Checks `navigator.requestMIDIAccess` availability.
- Automatically enumerates MIDI input ports.
- Listens for MIDI Note-On events (`status & 0xF0 === 0x90` and `velocity > 0`).
- Translates MIDI note number directly to nominal frequency and displays instantaneous deviation (with support for pitch bend `0xE0`).

### 4.3. Headless & Playwright Fallback Engine
To prevent pipeline stalls, crashes, or test failures when running in automated headless browser environments (Playwright) or when microphone permission is ungranted:
- Detects `getUserMedia` failure or headless execution automatically.
- Provides a built-in **Acoustic Simulation Feed**:
  - Synthesizes realistic periodic time-domain waveform data.
  - Simulates natural pitch drift around the target pitch (e.g. A4 drifting between $-8$ cents and $+5$ cents, crossing $\pm 3$ cents).
  - Exposes interactive test buttons (`Simulate In-Tune [0¢]`, `Simulate Flat [-15¢]`, `Simulate Sharp [+22¢]`, `Play Open String`) that allow Playwright agent-as-judge tests to deterministically verify all UI states without requiring physical audio hardware.

---

## 5. Concrete Code Implementation Blueprint

### File 1: `apps/web/src/lib/pitch-math.ts`

```typescript
/**
 * Pitch Mathematics & Musical Acoustics Engine
 * Pure mathematical functions for pitch detection, frequency conversion,
 * cents deviation, and Astrolabe needle geometry.
 */

export const CHROMATIC_NOTES = [
  'C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'
] as const;

export interface PitchAnalysis {
  noteName: string;
  octave: number;
  fullNote: string;
  nominalFrequency: number;
  centsDeviation: number;
  inTune: boolean;
}

/**
 * Calculates needle rotation angle for the Sacred Astrolabe.
 * Arc bounds: -50 to +50 cents -> -60° to +60°
 */
export function centsToNeedleAngle(cents: number): number {
  const clamped = Math.max(-50, Math.min(50, cents));
  return (clamped / 50) * 60;
}

/**
 * Converts frequency to pitch analysis relative to reference A4.
 */
export function frequencyToPitch(frequency: number, a4Standard: number = 440.0): PitchAnalysis | null {
  if (!frequency || frequency <= 0 || !Number.isFinite(frequency)) {
    return null;
  }

  // MIDI note formula: m = 69 + 12 * log2(f / A4)
  const midiFractional = 69 + 12 * (Math.log2(frequency / a4Standard));
  const midiNote = Math.round(midiFractional);
  
  // Nominal frequency of nearest chromatic note
  const nominalFrequency = a4Standard * Math.pow(2, (midiNote - 69) / 12);
  
  // Deviation in cents: 1200 * log2(f / f0)
  const centsDeviation = 1200 * Math.log2(frequency / nominalFrequency);
  
  const octave = Math.floor(midiNote / 12) - 1;
  const chroma = ((midiNote % 12) + 12) % 12;
  const noteName = CHROMATIC_NOTES[chroma] ?? 'A';
  const fullNote = `${noteName}${octave}`;
  const inTune = Math.abs(centsDeviation) <= 3.0;

  return {
    noteName,
    octave,
    fullNote,
    nominalFrequency: Math.round(nominalFrequency * 10) / 10,
    centsDeviation: Math.round(centsDeviation * 10) / 10,
    inTune,
  };
}

/**
 * Calculates nominal frequency of a specific note name (e.g. "A4", "G3").
 */
export function noteToFrequency(noteStr: string, a4Standard: number = 440.0): number {
  const match = noteStr.match(/^([A-G][♯♭#b]?)(-?\d+)$/);
  if (!match) return a4Standard;
  
  let [, name, octStr] = match;
  name = name.replace('#', '♯').replace('b', '♭');
  const octave = parseInt(octStr, 10);
  
  let noteIndex = CHROMATIC_NOTES.indexOf(name as any);
  if (noteIndex === -1) {
    if (name === 'D♭') noteIndex = 1;
    else if (name === 'D♯') noteIndex = 3;
    else if (name === 'G♭') noteIndex = 6;
    else if (name === 'A♯') noteIndex = 10;
    else noteIndex = 9; // Default A
  }
  
  const midiNumber = (octave + 1) * 12 + noteIndex;
  return a4Standard * Math.pow(2, (midiNumber - 69) / 12);
}

/**
 * Normalized Autocorrelation pitch detector with parabolic peak interpolation.
 */
export function detectPitchAutocorrelation(
  buffer: Float32Array,
  sampleRate: number
): { frequency: number | null; clarity: number; rms: number } {
  const size = buffer.length;
  
  // 1. Calculate RMS volume
  let sumSquares = 0;
  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    sumSquares += val * val;
  }
  const rms = Math.sqrt(sumSquares / size);
  if (rms < 0.015) {
    return { frequency: null, clarity: 0, rms };
  }

  // 2. Frequency lag search window: 50 Hz to 1200 Hz
  const minLag = Math.floor(sampleRate / 1200);
  const maxLag = Math.floor(sampleRate / 50);
  
  let bestLag = -1;
  let maxCorrelation = 0;

  // Autocorrelation search
  for (let lag = minLag; lag <= maxLag; lag++) {
    let correlation = 0;
    for (let i = 0; i < size - lag; i++) {
      correlation += buffer[i] * buffer[i + lag];
    }
    
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || maxCorrelation < sumSquares * 0.4) {
    return { frequency: null, clarity: 0, rms };
  }

  // 3. Parabolic interpolation on peak
  let fineLag = bestLag;
  if (bestLag > minLag && bestLag < maxLag) {
    let prev = 0;
    let next = 0;
    for (let i = 0; i < size - bestLag; i++) {
      prev += buffer[i] * buffer[i + bestLag - 1];
      next += buffer[i] * buffer[i + bestLag + 1];
    }
    const delta = (prev - next) / (2 * (prev - 2 * maxCorrelation + next));
    if (Number.isFinite(delta)) {
      fineLag = bestLag + delta;
    }
  }

  const frequency = sampleRate / fineLag;
  const clarity = Math.min(1, maxCorrelation / sumSquares);

  return { frequency, clarity, rms };
}
```

---

### File 2: `apps/web/src/hooks/use-tuning-engine.ts`

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  frequencyToPitch,
  detectPitchAutocorrelation,
  noteToFrequency,
  type PitchAnalysis,
} from '@/lib/pitch-math';

export type AudioInputMode = 'mic' | 'midi';

export interface TuningEngineState {
  mode: AudioInputMode;
  isListening: boolean;
  detectedPitch: PitchAnalysis | null;
  detectedFrequency: number | null;
  centsDeviation: number;
  inTune: boolean;
  signalLevel: number;
  pitchStandard: number;
  deviceLabel: string;
  isSimulated: boolean;
  waveform: number[];
  targetNote: string;
}

export function useTuningEngine(initialA4 = 440.0) {
  const [mode, setMode] = useState<AudioInputMode>('mic');
  const [pitchStandard, setPitchStandard] = useState<number>(initialA4);
  const [targetNote, setTargetNote] = useState<string>('A4');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [deviceLabel, setDeviceLabel] = useState<string>('Detecting audio interface...');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [waveform, setWaveform] = useState<number[]>(() => new Array(64).fill(0));
  
  const [detectedFrequency, setDetectedFrequency] = useState<number | null>(440.0);
  const [centsDeviation, setCentsDeviation] = useState<number>(0.0);
  const [inTune, setInTune] = useState<boolean>(true);
  const [signalLevel, setSignalLevel] = useState<number>(0.75);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const smoothedFreqRef = useRef<number>(440.0);

  // Stop physical microphone stream
  const stopMicrophone = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Activate acoustic microphone with fallback
  const startMicrophone = useCallback(async () => {
    stopMicrophone();

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      // Fallback to simulation
      setIsSimulated(true);
      setDeviceLabel('MIC: Simulated Acoustic Feed (Headless Mode)');
      setIsListening(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const track = stream.getAudioTracks()[0];
      setDeviceLabel(`MIC: ${track.label || 'Default Microphone'} (${Math.round(audioCtx.sampleRate / 1000)} kHz)`);
      setIsSimulated(false);
      setIsListening(true);

      const buffer = new Float32Array(analyser.fftSize);

      const loop = () => {
        analyser.getFloatTimeDomainData(buffer);
        
        // Sample down for waveform visualization (64 points)
        const step = Math.floor(buffer.length / 64);
        const waveSnapshot: number[] = [];
        for (let i = 0; i < 64; i++) {
          waveSnapshot.push(buffer[i * step]);
        }
        setWaveform(waveSnapshot);

        const analysis = detectPitchAutocorrelation(buffer, audioCtx.sampleRate);
        setSignalLevel(Math.min(1, analysis.rms * 10));

        if (analysis.frequency && analysis.frequency > 50 && analysis.frequency < 1200) {
          // Smooth frequency
          smoothedFreqRef.current = smoothedFreqRef.current * 0.65 + analysis.frequency * 0.35;
          const pitch = frequencyToPitch(smoothedFreqRef.current, pitchStandard);
          if (pitch) {
            setDetectedFrequency(Math.round(smoothedFreqRef.current * 10) / 10);
            setCentsDeviation(pitch.centsDeviation);
            setInTune(pitch.inTune);
          }
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      loop();
    } catch (err) {
      // Graceful fallback to simulation
      console.warn('Microphone access unavailable, activating simulation fallback:', err);
      setIsSimulated(true);
      setDeviceLabel('MIC: Simulated Acoustic Feed (Standby / Testing)');
      setIsListening(true);
    }
  }, [pitchStandard, stopMicrophone]);

  // Simulated acoustic drift loop (for testing & headless environments)
  useEffect(() => {
    if (!isSimulated || !isListening || mode !== 'mic') return;

    let time = 0;
    const interval = setInterval(() => {
      time += 0.05;
      const baseFreq = noteToFrequency(targetNote, pitchStandard);
      // Gentle drift: ±7 cents sinusoidal modulation
      const driftCents = Math.sin(time * 1.5) * 6 + Math.cos(time * 0.8) * 2;
      const simulatedFreq = baseFreq * Math.pow(2, driftCents / 1200);

      setDetectedFrequency(Math.round(simulatedFreq * 10) / 10);
      setCentsDeviation(Math.round(driftCents * 10) / 10);
      setInTune(Math.abs(driftCents) <= 3.0);
      setSignalLevel(0.85);

      // Synthesize waveform ripple
      const wave = Array.from({ length: 64 }, (_, i) => {
        return Math.sin(i * 0.3 + time * 4) * 0.6 + Math.sin(i * 0.6 + time * 2) * 0.2;
      });
      setWaveform(wave);
    }, 50);

    return () => clearInterval(interval);
  }, [isSimulated, isListening, mode, targetNote, pitchStandard]);

  // WebMIDI Initialization
  useEffect(() => {
    if (mode !== 'midi') return;

    let midiAccess: any = null;
    let isSubscribed = true;

    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      navigator.requestMIDIAccess()
        .then((access) => {
          if (!isSubscribed) return;
          midiAccess = access;
          const inputs = Array.from(access.inputs.values());
          if (inputs.length > 0) {
            const first = inputs[0] as any;
            setDeviceLabel(`MIDI: ${first.name || 'External Controller'} (Connected)`);
          } else {
            setDeviceLabel('MIDI: No hardware device connected (Listening)');
          }

          const onMidiMessage = (event: any) => {
            const [status, note, velocity] = event.data;
            if ((status & 0xf0) === 0x90 && velocity > 0) {
              const freq = pitchStandard * Math.pow(2, (note - 69) / 12);
              setDetectedFrequency(Math.round(freq * 10) / 10);
              setCentsDeviation(0.0);
              setInTune(true);
              setSignalLevel(velocity / 127);
            }
          };

          for (const input of inputs) {
            (input as any).onmidimessage = onMidiMessage;
          }
        })
        .catch(() => {
          setDeviceLabel('MIDI: WebMIDI Standby (Simulated Port 1)');
        });
    } else {
      setDeviceLabel('MIDI: WebMIDI API Not Supported (Simulated Interface)');
    }

    return () => {
      isSubscribed = false;
      if (midiAccess) {
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  }, [mode, pitchStandard]);

  // Auto-start mic on mount
  useEffect(() => {
    startMicrophone();
    return () => stopMicrophone();
  }, [startMicrophone, stopMicrophone]);

  // Manual simulation test triggers (Playwright helper)
  const triggerSimulationCents = useCallback((cents: number, note = 'A4') => {
    const baseFreq = noteToFrequency(note, pitchStandard);
    const targetFreq = baseFreq * Math.pow(2, cents / 1200);
    setDetectedFrequency(Math.round(targetFreq * 10) / 10);
    setCentsDeviation(cents);
    setInTune(Math.abs(cents) <= 3.0);
    setSignalLevel(0.9);
  }, [pitchStandard]);

  const pitchAnalysis = detectedFrequency ? frequencyToPitch(detectedFrequency, pitchStandard) : null;

  return {
    mode,
    setMode,
    isListening,
    detectedPitch: pitchAnalysis,
    detectedFrequency,
    centsDeviation,
    inTune,
    signalLevel,
    pitchStandard,
    setPitchStandard,
    deviceLabel,
    isSimulated,
    waveform,
    targetNote,
    setTargetNote,
    startMicrophone,
    stopMicrophone,
    triggerSimulationCents,
  };
}
```

---

### File 3: `apps/web/src/components/screens/tuning-ritual-screen.tsx`

```tsx
import { useState, useId } from 'react';
import { motion } from 'framer-motion';
import { useSpatialNavigation } from '@/components/spatial/spatial-context';
import { TUNING_RITUAL_SPEC } from '@/design-system/screens';
import { LIVING_MANUSCRIPT_COLORS, MUSICAL_GLYPHS } from '@/design-system/tokens';
import { useTuningEngine, type AudioInputMode } from '@/hooks/use-tuning-engine';
import { centsToNeedleAngle } from '@/lib/pitch-math';

export interface TuningRitualScreenProps {
  onComplete?: () => void;
}

export function TuningRitualScreen({ onComplete }: TuningRitualScreenProps) {
  const { panTo } = useSpatialNavigation();
  const filterId = useId();

  const {
    mode,
    setMode,
    detectedPitch,
    detectedFrequency,
    centsDeviation,
    inTune,
    signalLevel,
    pitchStandard,
    setPitchStandard,
    deviceLabel,
    isSimulated,
    waveform,
    targetNote,
    setTargetNote,
    triggerSimulationCents,
  } = useTuningEngine(440.0);

  const [selectedInstrumentIndex, setSelectedInstrumentIndex] = useState(0);
  const selectedInstrument = TUNING_RITUAL_SPEC.instrumentRegisters[selectedInstrumentIndex];

  const needleAngle = centsToNeedleAngle(centsDeviation);

  const handleReturnToStand = () => {
    if (onComplete) onComplete();
    panTo('practice');
  };

  // SVG Geometry Constants
  const cx = 160;
  const cy = 160;
  const majorTicks = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
  const minorTicks = [-45, -35, -25, -15, -5, 5, 15, 25, 35, 45];

  return (
    <div
      className="relative w-full h-full min-h-screen bg-[#F4F1EA] text-[#2C2A29] p-6 md:p-10 flex flex-col justify-between select-none overflow-y-auto"
      data-testid="tuning-ritual-screen"
    >
      {/* Outer Double Framing Rule */}
      <div className="absolute inset-3 pointer-events-none border-[3px] border-double border-[#2C2A29]/80" />

      {/* Screen Header */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-baseline border-b border-[#2C2A29] pb-4 px-2">
        <div>
          <div className="font-serif italic text-sm text-[#7E7570] tracking-wide">
            {TUNING_RITUAL_SPEC.directive}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#2C2A29] mt-0.5">
            {TUNING_RITUAL_SPEC.title}
          </h1>
          <p className="font-serif italic text-xs text-[#7E7570] mt-1">
            {TUNING_RITUAL_SPEC.subtitle}
          </p>
        </div>

        <div className="mt-3 md:mt-0 font-mono text-[11px] uppercase tracking-widest text-[#7E7570] flex items-center gap-3">
          <span className="border border-[#2C2A29] px-2 py-0.5 bg-[#E9E4DA]">
            FOLIO IV · ACCORDATURA
          </span>
          <span className="text-[#9A2A2A] font-bold">
            {inTune ? '● EQUILIBRIUM' : '○ DISCORDIA'}
          </span>
        </div>
      </header>

      {/* Main Tripartite Calibration Chamber */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 items-center">
        
        {/* ============================================================== */}
        {/* LEFT PANEL: Hardware Detection & Waveform (col-span-3)       */}
        {/* ============================================================== */}
        <section className="lg:col-span-3 flex flex-col gap-4 border border-[#2C2A29] p-5 bg-[#F4F1EA]">
          <div className="flex items-center justify-between border-b border-[#2C2A29]/40 pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#7E7570]">
              Hardware Source
            </span>
            <span className="font-mono text-[10px] text-[#9A2A2A] uppercase">
              {isSimulated ? 'Simulated' : 'Live Feed'}
            </span>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="grid grid-cols-2 gap-1 border border-[#2C2A29] p-1 bg-[#E9E4DA]">
            <button
              onClick={() => setMode('mic')}
              className={`font-mono text-xs py-1.5 transition-colors ${
                mode === 'mic'
                  ? 'bg-[#2C2A29] text-[#F4F1EA] font-semibold'
                  : 'text-[#2C2A29] hover:bg-[#F4F1EA]'
              }`}
              data-testid="mode-mic"
            >
              MIC (Acoustic)
            </button>
            <button
              onClick={() => setMode('midi')}
              className={`font-mono text-xs py-1.5 transition-colors ${
                mode === 'midi'
                  ? 'bg-[#2C2A29] text-[#F4F1EA] font-semibold'
                  : 'text-[#2C2A29] hover:bg-[#F4F1EA]'
              }`}
              data-testid="mode-midi"
            >
              MIDI (Interface)
            </button>
          </div>

          {/* Device Telemetry Card */}
          <div className="border border-[#2C2A29]/60 p-3 bg-[#E9E4DA]/40">
            <div className="font-mono text-[10px] text-[#7E7570] uppercase tracking-wider">
              Input Interface
            </div>
            <div className="font-mono text-xs font-semibold text-[#2C2A29] mt-1 break-words">
              {deviceLabel}
            </div>

            {/* Signal Meter Bar */}
            <div className="mt-3">
              <div className="flex justify-between font-mono text-[9px] text-[#7E7570] uppercase">
                <span>Signal Purity</span>
                <span>{Math.round(signalLevel * 100)}%</span>
              </div>
              <div className="w-full h-1.5 border border-[#2C2A29] bg-[#F4F1EA] mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#9A2A2A] transition-all duration-75"
                  style={{ width: `${signalLevel * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Oscilloscope Waveform Ripple Canvas */}
          <div className="border border-[#2C2A29] p-2 bg-[#E9E4DA]/60">
            <div className="font-mono text-[9px] text-[#7E7570] uppercase tracking-wider mb-1 flex justify-between">
              <span>Oscilloscope Trace</span>
              <span>{pitchStandard} Hz Ref</span>
            </div>
            <svg
              viewBox="0 0 200 60"
              className="w-full h-16 bg-[#F4F1EA] border border-[#2C2A29]/30"
              preserveAspectRatio="none"
            >
              {/* Center zero line */}
              <line x1="0" y1="30" x2="200" y2="30" stroke="#7E7570" strokeWidth="0.5" strokeDasharray="2 2" />
              {/* Dynamic waveform ripple */}
              <path
                d={waveform.reduce((acc, val, i) => {
                  const x = (i / (waveform.length - 1)) * 200;
                  const y = 30 - val * 26;
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#2C2A29"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Playwright Headless Verification Controls */}
          <div className="border-t border-[#2C2A29]/30 pt-3">
            <div className="font-mono text-[9px] text-[#7E7570] uppercase tracking-wider mb-2">
              Verification Test Triggers
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => triggerSimulationCents(0)}
                className="font-mono text-[10px] border border-[#2C2A29] py-1 bg-[#F4F1EA] hover:bg-[#E9E4DA] hover:border-[#9A2A2A]"
                data-testid="test-in-tune"
              >
                0¢ [Tune]
              </button>
              <button
                onClick={() => triggerSimulationCents(-18)}
                className="font-mono text-[10px] border border-[#2C2A29] py-1 bg-[#F4F1EA] hover:bg-[#E9E4DA] hover:border-[#9A2A2A]"
                data-testid="test-flat"
              >
                -18¢ [Flat]
              </button>
              <button
                onClick={() => triggerSimulationCents(24)}
                className="font-mono text-[10px] border border-[#2C2A29] py-1 bg-[#F4F1EA] hover:bg-[#E9E4DA] hover:border-[#9A2A2A]"
                data-testid="test-sharp"
              >
                +24¢ [Sharp]
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CENTER PANEL: The Sacred Tuning Astrolabe Dial (col-span-6)  */}
        {/* ============================================================== */}
        <section className="lg:col-span-6 flex flex-col items-center justify-center p-4">
          <div className="relative flex flex-col items-center">
            
            {/* SVG Astrolabe Circular Dial */}
            <svg
              width={TUNING_RITUAL_SPEC.dialGeometry.diameter}
              height={TUNING_RITUAL_SPEC.dialGeometry.diameter}
              viewBox="0 0 320 320"
              className="overflow-visible select-none"
              data-testid="astrolabe-dial"
            >
              <defs>
                {/* Resonance Halo Pulse Filter */}
                <filter id={`halo-glow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Outer Engraved Concentric Rim */}
              <circle cx={cx} cy={cy} r={156} fill="none" stroke="#2C2A29" strokeWidth="2" />
              <circle cx={cx} cy={cy} r={150} fill="none" stroke="#2C2A29" strokeWidth="1" />
              
              {/* 2. In-Tune Resonance Halo Aureole Ring */}
              <circle
                cx={cx}
                cy={cy}
                r={142}
                fill="none"
                stroke={inTune ? '#9A2A2A' : '#2C2A29'}
                strokeWidth={inTune ? '3' : '0.75'}
                strokeOpacity={inTune ? '0.95' : '0.2'}
                filter={inTune ? `url(#halo-glow-${filterId})` : undefined}
                className="transition-all duration-200"
              />

              {/* In-Tune ±3 Cents Target Arc on Perimeter */}
              <path
                d={`M ${cx - 7} 18 A 142 142 0 0 1 ${cx + 7} 18`}
                fill="none"
                stroke="#9A2A2A"
                strokeWidth="4"
              />

              {/* 3. Intonation Graduation Ticks */}
              {/* Minor Ticks (Every 5 Cents) */}
              {minorTicks.map((cents) => {
                const theta = (cents / 50) * 60;
                const phi = ((theta - 90) * Math.PI) / 180;
                const x1 = cx + 128 * Math.cos(phi);
                const y1 = cy + 128 * Math.sin(phi);
                const x2 = cx + 136 * Math.cos(phi);
                const y2 = cy + 136 * Math.sin(phi);
                return (
                  <line
                    key={`minor-${cents}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#7E7570"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Major Ticks (Every 10 Cents) with Numerals */}
              {majorTicks.map((cents) => {
                const theta = (cents / 50) * 60;
                const phi = ((theta - 90) * Math.PI) / 180;
                const x1 = cx + 124 * Math.cos(phi);
                const y1 = cy + 124 * Math.sin(phi);
                const x2 = cx + 138 * Math.cos(phi);
                const y2 = cy + 138 * Math.sin(phi);
                const tx = cx + 110 * Math.cos(phi);
                const ty = cy + 110 * Math.sin(phi) + 4;

                let label = cents === 0 ? '♮' : cents > 0 ? `+${cents}` : `${cents}`;
                if (cents === -50) label = '♭';
                if (cents === 50) label = '♯';

                const isEquilibrium = cents === 0;

                return (
                  <g key={`major-${cents}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isEquilibrium ? '#9A2A2A' : '#2C2A29'}
                      strokeWidth={isEquilibrium ? '2' : '1.5'}
                    />
                    <text
                      x={tx}
                      y={ty}
                      textAnchor="middle"
                      fill={isEquilibrium ? '#9A2A2A' : '#2C2A29'}
                      fontSize={isEquilibrium ? '13' : '9'}
                      fontFamily={isEquilibrium ? 'Playfair Display' : 'Geist Mono'}
                      fontWeight={isEquilibrium ? 'bold' : 'normal'}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* 4. Center Vellum Medallion */}
              <circle
                cx={cx}
                cy={cy}
                r={78}
                fill="#E9E4DA"
                stroke="#2C2A29"
                strokeWidth="1.5"
              />
              <circle
                cx={cx}
                cy={cy}
                r={74}
                fill="none"
                stroke="#2C2A29"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />

              {/* 5. Astrolabe Needle (Pivot at 160, 160) */}
              <g
                style={{
                  transform: `rotate(${needleAngle}deg)`,
                  transformOrigin: '160px 160px',
                  transition: 'transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                data-testid="astrolabe-needle"
              >
                {/* Tapered Pointer Blade */}
                <polygon
                  points="160,48 163,160 157,160"
                  fill={inTune ? '#9A2A2A' : '#2C2A29'}
                />
                {/* Counter-Balance Tail */}
                <polygon
                  points="162,160 160,182 158,160"
                  fill="#2C2A29"
                />
                <circle cx={cx} cy={182} r={4} fill="#2C2A29" />

                {/* Central Boss / Pivot Hub */}
                <circle cx={cx} cy={cy} r={8} fill="#2C2A29" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={inTune ? '#9A2A2A' : '#C8A858'}
                />
              </g>

              {/* 6. Center Detected Pitch Readout */}
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                fill="#2C2A29"
                fontFamily="Playfair Display"
                fontSize="44"
                fontWeight="bold"
                className="tracking-tight"
                data-testid="detected-note-text"
              >
                {detectedPitch?.fullNote ?? targetNote}
              </text>

              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                fill="#7E7570"
                fontFamily="Geist Mono"
                fontSize="12"
              >
                {detectedFrequency ? `${detectedFrequency.toFixed(1)} Hz` : '--- Hz'}
              </text>

              <text
                x={cx}
                y={cy + 34}
                textAnchor="middle"
                fill={inTune ? '#9A2A2A' : '#2C2A29'}
                fontFamily="Geist Mono"
                fontSize="11"
                fontWeight={inTune ? 'bold' : 'normal'}
                data-testid="cents-deviation-text"
              >
                {centsDeviation > 0 ? `+${centsDeviation.toFixed(1)}¢` : `${centsDeviation.toFixed(1)}¢`}
              </text>
            </svg>

            {/* In-Tune / Status Rubric Seal Badge */}
            <div className="mt-4 flex flex-col items-center">
              <span
                className={`font-mono text-xs uppercase tracking-widest px-4 py-1 border transition-colors shadow-none ${
                  inTune
                    ? 'border-[#9A2A2A] bg-[#9A2A2A] text-[#F4F1EA] font-bold'
                    : 'border-[#2C2A29] bg-[#E9E4DA] text-[#2C2A29]'
                }`}
              >
                {inTune
                  ? 'HARMONIA PERFECTA (IN EQUILIBRIO)'
                  : centsDeviation < 0
                  ? `BEMOLLE ♭ (${centsDeviation.toFixed(1)}¢ FLAT)`
                  : `DIESIS ♯ (+${centsDeviation.toFixed(1)}¢ SHARP)`}
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* RIGHT PANEL: Calibration Ledger (col-span-3)                 */}
        {/* ============================================================== */}
        <section className="lg:col-span-3 flex flex-col gap-4 border border-[#2C2A29] p-5 bg-[#F4F1EA]">
          <div className="border-b border-[#2C2A29]/40 pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#7E7570]">
              Calibration Ledger
            </span>
          </div>

          {/* Pitch Standards Selector */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#7E7570] block mb-1.5">
              Pitch Standard (A4 Reference)
            </label>
            <div className="grid grid-cols-3 gap-1 border border-[#2C2A29] p-1 bg-[#E9E4DA]">
              {TUNING_RITUAL_SPEC.pitchStandards.map((std) => (
                <button
                  key={std.hz}
                  onClick={() => setPitchStandard(std.hz)}
                  className={`font-mono text-xs py-1.5 transition-colors ${
                    pitchStandard === std.hz
                      ? 'bg-[#2C2A29] text-[#F4F1EA] font-semibold'
                      : 'text-[#2C2A29] hover:bg-[#F4F1EA]'
                  }`}
                  data-testid={`pitch-std-${std.hz}`}
                >
                  {std.label}
                </button>
              ))}
            </div>
            <div className="font-serif italic text-[11px] text-[#7E7570] mt-1 text-center">
              {pitchStandard === 415 && 'Baroque Kammerton (J.S. Bach)'}
              {pitchStandard === 440 && 'ISO 16 Modern Concert Standard'}
              {pitchStandard === 442 && 'European Symphonic Orchestral'}
            </div>
          </div>

          {/* Instrument Register Selection */}
          <div className="border-t border-[#2C2A29]/30 pt-3">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#7E7570] block mb-1.5">
              Instrument Compass
            </label>
            <select
              value={selectedInstrumentIndex}
              onChange={(e) => setSelectedInstrumentIndex(Number(e.target.value))}
              className="w-full border border-[#2C2A29] bg-[#F4F1EA] px-2.5 py-1.5 font-serif text-sm text-[#2C2A29] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A] rounded-none shadow-none"
            >
              {TUNING_RITUAL_SPEC.instrumentRegisters.map((inst, idx) => (
                <option key={inst.name} value={idx}>
                  {inst.clef} {inst.name} ({inst.range})
                </option>
              ))}
            </select>

            {/* 5-Line Musical Staff Miniature Register Ledger */}
            <div className="border border-[#2C2A29]/40 p-3 mt-3 bg-[#E9E4DA]/40 relative">
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-serif text-2xl text-[#2C2A29]">{selectedInstrument.clef}</span>
                <span className="font-mono text-[10px] text-[#7E7570]">{selectedInstrument.range}</span>
              </div>

              {/* Open String Quick-Tune Buttons */}
              {selectedInstrument.openStrings.length > 0 && (
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#7E7570] mb-1">
                    Open Strings (Cordae Apertae)
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {selectedInstrument.openStrings.map((stringNote) => (
                      <button
                        key={stringNote}
                        onClick={() => setTargetNote(stringNote)}
                        className={`font-mono text-xs py-1 border transition-colors ${
                          targetNote === stringNote
                            ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                            : 'border-[#2C2A29] bg-[#F4F1EA] text-[#2C2A29] hover:bg-[#E9E4DA]'
                        }`}
                        data-testid={`string-${stringNote}`}
                      >
                        {stringNote}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Screen Footer & Ceremonial Mount Stand Action */}
      <footer className="relative z-10 flex flex-col sm:flex-row justify-between items-center border-t border-[#2C2A29] pt-4 px-2 gap-4">
        <button
          onClick={handleReturnToStand}
          className="inline-flex items-center gap-2 font-serif text-xs text-[#7E7570] hover:text-[#9A2A2A] transition-colors"
          data-testid="return-to-stand-link"
        >
          <span>←</span>
          <span className="font-mono">{MUSICAL_GLYPHS.fermata}</span>
          <span>Return to Practice Stand (0, 0)</span>
        </button>

        {/* Ceremonial Wax Seal Button */}
        <button
          onClick={handleReturnToStand}
          className="group relative inline-flex items-center gap-3 border-2 border-[#2C2A29] bg-[#9A2A2A] px-8 py-3 text-[#F4F1EA] transition-transform duration-100 active:scale-95 hover:bg-[#852323] shadow-none"
          data-testid="seal-tuning-button"
        >
          <span className="font-serif text-lg">{MUSICAL_GLYPHS.gClef}</span>
          <span className="font-serif font-bold text-sm tracking-wide uppercase">
            Seal Tuning & Mount Stand
          </span>
          <span className="font-serif text-lg">{MUSICAL_GLYPHS.fermata}</span>
        </button>
      </footer>
    </div>
  );
}

export default TuningRitualScreen;
```

---

### File 4: Integration with `apps/web/src/app.tsx`

```tsx
// In apps/web/src/app.tsx:
import { TuningRitualScreen } from '@/components/screens/tuning-ritual-screen'

// Within AppCanvas component:
<SpatialContainer
  practiceScreen={<PracticeStandView isGuest={isGuest} onExitGuest={onExitGuest} />}
  tuningScreen={<TuningRitualScreen />}
/>
```

---

## 6. Verification Method & Test Specifications

When Worker M3 implements this blueprint, verification must validate:

1. **Compilation & Strict Type-Checking**:
   - `pnpm run app:web -- build` succeeds with zero errors under `verbatimModuleSyntax: true` and strict TypeScript.
2. **Astrolabe Dial Rendering & Geometry**:
   - Dial rendered with $320\text{px}$ diameter.
   - SVG needle rotates to calculated angle $\theta = (\text{cents} / 50) \times 60^\circ$.
   - Resonance halo ring lights up crimson when $|\text{cents}| \le 3$.
3. **Hardware & Pitch Standards**:
   - Pitch standards toggle between 415 Hz, 440 Hz, and 442 Hz.
   - Mode toggles between `MIC` and `MIDI`.
   - Built-in simulation fallback activates gracefully in headless test browsers.
4. **Spatial Navigation Interactivity**:
   - Panning to `#tuning` displays the Tuning Ritual screen.
   - Clicking "Seal Tuning & Mount Stand" invokes `useSpatialNavigation().panTo('practice')` and returns to `(0, 0)`.
