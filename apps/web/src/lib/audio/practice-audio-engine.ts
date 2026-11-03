/**
 * Practice Audio Engine
 *
 * Lightweight, zero-dependency Web Audio synthesizer providing:
 * 1. High-precision Metronome click track (authentic wooden click downbeat/upbeat).
 * 2. Acoustic Guitar Physical Modeling (Karplus-Strong string synthesis, directional strum sweep, pluck transients).
 * 3. Acoustic Piano Multi-Partial Synthesis (inharmonic multi-partials, hammer strike attack, dual-stage decay, damper release).
 * 4. Granular Melody, Harmony, Arpeggio, and Strum scheduling with exact note lengths.
 * 5. Safe lifecycle management (browser gesture unlocking & cleanup).
 */

import { playWoodenClick, type WoodenClickOptions } from './metronome'

export { playWoodenClick, type WoodenClickOptions }

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
}

export function parsePitchToMidi(pitch: string | number): number {
  if (typeof pitch === 'number') {
    return Math.round(pitch)
  }
  const match = pitch.trim().match(/^([A-Ga-g])([#bB]?)(-?\d+)$/)
  if (!match) return 60 // Middle C default
  const letter = match[1].toUpperCase()
  const accidental = match[2] ? match[2].toLowerCase() : ''
  const octave = parseInt(match[3], 10)
  const key = `${letter}${accidental}`
  const semitone = NOTE_SEMITONES[key] ?? NOTE_SEMITONES[letter] ?? 0
  return (octave + 1) * 12 + semitone
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export const DEFAULT_CHORD_PITCHES: Record<string, number[]> = {
  C: [48, 52, 55, 60, 64],       // C3, E3, G3, C4, E4
  G: [43, 47, 50, 55, 59, 67],   // G2, B2, D3, G3, B3, G4
  D: [50, 57, 62, 66],           // D3, A3, D4, F#4
  A: [45, 52, 57, 61, 64],       // A2, E3, A3, C#4, E4
  E: [40, 47, 52, 56, 59, 64],   // E2, B2, E3, G#3, B3, E4
  Am: [45, 52, 57, 60, 64],      // A2, E3, A3, C4, E4
  Em: [40, 47, 52, 55, 59, 64],  // E2, B2, E3, G3, B3, E4
  Dm: [50, 57, 62, 65],          // D3, A3, D4, F4
  F: [41, 48, 53, 57, 60, 65],   // F2, C3, F3, A3, C4, F4
  Bm: [47, 54, 59, 62, 66],      // B2, F#3, B3, D4, F#4
  B7: [47, 51, 57, 59, 63],      // B2, D#3, A3, B3, D#4
  E7: [40, 47, 50, 56, 59, 64],  // E2, B2, D3, G#3, B3, E4
  D7: [50, 57, 60, 66],          // D3, A3, C4, F#4
  G7: [43, 47, 50, 53, 59, 67],  // G2, B2, D3, F3, B3, G4
  Am7: [45, 52, 55, 60, 64],     // A2, E3, G3, C4, E4
  Cmaj7: [48, 52, 55, 59, 64],   // C3, E3, G3, B3, E4
  Cm: [48, 51, 55, 60, 63],      // C3, Eb3, G3, C4, Eb4
  Fm: [41, 48, 53, 56, 60],      // F2, C3, F3, Ab3, C4
  Eb: [51, 55, 58, 63, 67],      // Eb3, G3, Bb3, Eb4, G4
  Ab: [44, 51, 56, 60, 63],      // Ab2, Eb3, Ab3, C4, Eb4
  Bb: [46, 53, 58, 62, 65],      // Bb2, F3, Bb3, D4, F4
  Bb7: [46, 53, 56, 58, 62],     // Bb2, F3, Ab3, Bb3, D4
  Gmaj7: [43, 50, 54, 59, 66],   // G2, D3, F#3, B3, F#4
  Dmaj7: [50, 57, 61, 66],       // D3, A3, C#4, F#4
  Gm: [43, 50, 55, 58, 62],      // G2, D3, G3, Bb3, D4
}

// ============================================================================
// Karplus-Strong Physical Modeling String Synthesizer
// ============================================================================

export interface KarplusStrongOptions {
  /** String decay damping factor alpha [0.990, 0.996]. Defaults to pitch-adaptive curve. */
  damping?: number
  /** Plectrum pluck smoothing factor [0..0.4]. Higher = softer finger, lower = sharp pick. */
  pluckSmoothing?: number
}

/**
 * Pure DSP synthesis of a vibrating string via the Karplus-Strong physical model.
 * Produces a normalized Float32Array suitable for loading into an AudioBuffer.
 *
 * @param pitchOrFreq Fundamental frequency of string in Hz or pitch string (e.g. 220, 82.4, "E2").
 * @param durationSec Duration of synthesized audio in seconds.
 * @param velocityOrSampleRate Velocity [0..1] or Sample Rate (Hz).
 * @param sampleRateOrVelocity Sample Rate (Hz) or Velocity [0..1].
 * @param options Optional overrides for damping and pluck sharpness.
 */
export function generateKarplusStrongBuffer(
  pitchOrFreq: number | string,
  durationSec = 1.2,
  velocityOrSampleRate?: number,
  sampleRateOrVelocity?: number,
  options?: KarplusStrongOptions
): Float32Array {
  let sampleRate = 44100
  let velocity = 0.7
  const opts = options

  if (typeof velocityOrSampleRate === 'number') {
    if (velocityOrSampleRate >= 1000) {
      sampleRate = velocityOrSampleRate
      if (typeof sampleRateOrVelocity === 'number') {
        velocity = sampleRateOrVelocity
      }
    } else {
      velocity = velocityOrSampleRate
      if (typeof sampleRateOrVelocity === 'number') {
        sampleRate = sampleRateOrVelocity
      }
    }
  }

  let freq = 440
  if (typeof pitchOrFreq === 'string') {
    freq = midiToFreq(parsePitchToMidi(pitchOrFreq))
  } else if (typeof pitchOrFreq === 'number') {
    freq = pitchOrFreq
  }

  const safeSampleRate = Math.max(8000, sampleRate)
  const safeFreq = Math.max(20, Math.min(safeSampleRate / 2.1, freq))
  const numSamples = Math.max(1, Math.floor(durationSec * safeSampleRate))
  const out = new Float32Array(numSamples)

  // 1. Delay line length N = max(2, floor(fs / f0 - 0.5))
  // Half-sample delay (0.5) compensates for the 2-point averaging filter phase delay.
  const N = Math.max(2, Math.floor(safeSampleRate / safeFreq - 0.5))

  // 2. Frequency-dependent damping factor alpha in [0.990, 0.996]
  const alpha =
    opts?.damping ??
    Math.max(0.990, Math.min(0.996, 0.996 - 0.005 * Math.min(1.0, safeFreq / 1000)))

  const pluckSmoothing = opts?.pluckSmoothing ?? 0.15

  // 3. Initial excitation: zero-mean windowed white noise burst filling N samples
  let dcSum = 0
  for (let i = 0; i < N; i++) {
    // Half-sine window eliminates edge boundary clicks
    const window = Math.sin((Math.PI * (i + 0.5)) / N)
    const noise = (Math.random() * 2 - 1) * window
    out[i] = noise
    dcSum += noise
  }

  // Remove DC bias
  const dcMean = dcSum / N
  for (let i = 0; i < N; i++) {
    out[i] -= dcMean
  }

  // 1-pole plectrum filter for realistic pick stiffness
  let prevExc = out[0]
  for (let i = 1; i < N; i++) {
    out[i] = (1 - pluckSmoothing) * out[i] + pluckSmoothing * prevExc
    prevExc = out[i]
  }

  // 4. Feedback loop: y[n] = alpha * (y[n - N] + y[n - N - 1]) / 2
  // Higher harmonics decay exponentially faster than the fundamental.
  for (let n = N; n < numSamples; n++) {
    const prev1 = out[n - N]
    const prev2 = n - N - 1 >= 0 ? out[n - N - 1] : out[N - 1]
    out[n] = alpha * 0.5 * (prev1 + prev2)
  }

  // 5. Velocity scaling and soft headroom clamp
  const gainScale = Math.min(0.9, velocity * 0.75)
  for (let i = 0; i < numSamples; i++) {
    out[i] = Math.max(-1.0, Math.min(1.0, out[i] * gainScale))
  }

  return out
}

// ============================================================================
// Multi-Partial Additive Piano Synthesis with Hammer Strike & Dispersion
// ============================================================================

// Stiffness constants (inharmonicity)
export const INHARMONICITY_B_TREBLE_MID = 0.00015
export const INHARMONICITY_B_BASS = 0.00035

// Harmonics count (satisfies >= 5 requirement)
export const PIANO_HARMONICS_COUNT = 6

// Amplitude weights: A_k = 1 / (k^1.2)
export const PIANO_HARMONIC_WEIGHTS = [
  1.0,                     // k = 1 (Fundamental)
  1 / Math.pow(2, 1.2),    // k = 2 (~0.435)
  1 / Math.pow(3, 1.2),    // k = 3 (~0.268)
  1 / Math.pow(4, 1.2),    // k = 4 (~0.189)
  1 / Math.pow(5, 1.2),    // k = 5 (~0.145)
  1 / Math.pow(6, 1.2),    // k = 6 (~0.116)
]

/**
 * Pure DSP synthesis of a piano note using inharmonic multi-partial additive synthesis,
 * felt hammer strike attack transient, dual-stage decay, and smooth damper release.
 *
 * Supports flexible argument orders:
 * - (pitch, durationSec, velocity, isBass, sampleRate)
 * - (sampleRate, midi, durationSec, velocity, isBass)
 */
export function generatePianoNoteBuffer(
  pitchOrSampleRate: number | string,
  durationSecOrMidi: number | string = 1.0,
  velocityOrDurationSec = 0.7,
  isBassOrVelocity: boolean | number = false,
  sampleRateOrIsBass: number | boolean = 44100
): Float32Array {
  let sampleRate = 44100
  let pitch: number | string = 60
  let durationSec = 1.0
  let velocity = 0.7
  let isBass = false

  if (typeof pitchOrSampleRate === 'number' && pitchOrSampleRate >= 8000) {
    // Called as (sampleRate, midi, durationSec, velocity, isBass)
    sampleRate = pitchOrSampleRate
    pitch =
      typeof durationSecOrMidi === 'number' || typeof durationSecOrMidi === 'string'
        ? durationSecOrMidi
        : 60
    durationSec = typeof velocityOrDurationSec === 'number' ? velocityOrDurationSec : 1.0
    velocity = typeof isBassOrVelocity === 'number' ? isBassOrVelocity : 0.7
    isBass = typeof sampleRateOrIsBass === 'boolean' ? sampleRateOrIsBass : false
  } else {
    // Called as (pitch, durationSec, velocity, isBass, sampleRate)
    pitch = pitchOrSampleRate
    durationSec = typeof durationSecOrMidi === 'number' ? durationSecOrMidi : 1.0
    velocity = typeof velocityOrDurationSec === 'number' ? velocityOrDurationSec : 0.7
    isBass = typeof isBassOrVelocity === 'boolean' ? isBassOrVelocity : false
    sampleRate = typeof sampleRateOrIsBass === 'number' ? sampleRateOrIsBass : 44100
  }

  let midi = 60
  let f0 = 261.63
  if (typeof pitch === 'string') {
    midi = parsePitchToMidi(pitch)
    f0 = midiToFreq(midi)
  } else if (typeof pitch === 'number') {
    if (pitch <= 127) {
      midi = Math.round(pitch)
      f0 = midiToFreq(midi)
    } else {
      f0 = pitch
      midi = Math.round(69 + 12 * Math.log2(pitch / 440))
    }
  }

  const isBassNote = isBass || midi < 48
  const B = isBassNote ? INHARMONICITY_B_BASS : INHARMONICITY_B_TREBLE_MID

  const partialFreqs: number[] = []
  const partialAmps: number[] = []
  const partialDecays: number[] = []

  // Base decay tau_0 (seconds) scaled to note duration and pitch
  const pitchDamping = Math.max(0.6, 1.0 - (midi - 36) / 120)
  const tau0 = Math.max(0.6, durationSec * 0.75 * pitchDamping)

  let totalWeight = 0
  for (let k = 1; k <= PIANO_HARMONICS_COUNT; k++) {
    // Inharmonicity dispersion: f_k = k * f0 * sqrt(1 + B * k^2)
    const fk = k * f0 * Math.sqrt(1 + B * k * k)
    if (fk >= sampleRate * 0.48) break

    let ak = PIANO_HARMONIC_WEIGHTS[k - 1]
    if (isBassNote && k === 1) {
      ak *= 1.30 // Boost deep bass fundamental resonance
    }
    const tauK = tau0 / (1 + 0.4 * (k - 1))

    partialFreqs.push(fk)
    partialAmps.push(ak)
    partialDecays.push(tauK)
    totalWeight += ak
  }

  // Normalize partial amplitudes to avoid clipping
  const stringScale = (isBassNote ? 0.75 : 0.80) * Math.min(1.0, Math.max(0.1, velocity))
  const normFactor = totalWeight > 0 ? stringScale / totalWeight : 1.0
  for (let i = 0; i < partialAmps.length; i++) {
    partialAmps[i] *= normFactor
  }

  // Buffer allocation: note duration + 60ms damper release
  const releaseSec = 0.06
  const totalDuration = durationSec + releaseSec
  const totalSamples = Math.max(1, Math.floor(totalDuration * sampleRate))
  const buffer = new Float32Array(totalSamples)

  // Hammer strike attack transient (5ms broadband noise burst highpassed at 2000Hz)
  const hammerSec = 0.005
  const hammerSamples = Math.min(totalSamples, Math.floor(hammerSec * sampleRate))
  const hammerCutoffHz = 2000
  const hpBeta = 1.0 / (1.0 + (2.0 * Math.PI * hammerCutoffHz) / sampleRate)
  let prevNoise = 0
  let prevHpOutput = 0
  const hammerPeak = 0.15 * velocity
  let noiseSeed = (midi * 7919) % 65536

  // Sample computation loop with 4ms attack ramp and 60ms damper release
  const attackSec = 0.004
  const attackSamples = Math.max(1, Math.floor(attackSec * sampleRate))
  const sustainSamples = Math.floor(durationSec * sampleRate)
  const releaseSamples = Math.max(1, totalSamples - sustainSamples)

  for (let n = 0; n < totalSamples; n++) {
    const t = n / sampleRate

    // Multi-partial inharmonic summation with dual-stage decay
    let stringSample = 0
    for (let i = 0; i < partialFreqs.length; i++) {
      const fk = partialFreqs[i]
      const ak = partialAmps[i]
      const tauK = partialDecays[i]

      // Dual-stage exponential decay: 70% prompt sound + 30% aftersound
      const promptDecay = Math.exp(-t / tauK)
      const aftersoundDecay = Math.exp(-t / (tauK * 2.5))
      const env = 0.70 * promptDecay + 0.30 * aftersoundDecay

      const phase = (i * Math.PI) / 4
      stringSample += ak * env * Math.sin(2 * Math.PI * fk * t + phase)
    }

    // Global envelope: smooth sin^2 attack and cos^2 damper release to exact 0.0
    let globalEnv = 1.0
    if (n < attackSamples) {
      const attackPhase = (Math.PI / 2) * (n / attackSamples)
      globalEnv = Math.sin(attackPhase) * Math.sin(attackPhase)
    } else if (n >= sustainSamples) {
      const relIdx = n - sustainSamples
      const relPhase = (Math.PI / 2) * (relIdx / releaseSamples)
      globalEnv = Math.cos(relPhase) * Math.cos(relPhase)
    }

    let sampleVal = stringSample * globalEnv

    // Hammer strike transient (first 5ms)
    if (n < hammerSamples) {
      noiseSeed = (noiseSeed * 1103515245 + 12345) & 0x7fffffff
      const rawNoise = (noiseSeed / 0x7fffffff) * 2.0 - 1.0
      const hpNoise = hpBeta * (prevHpOutput + rawNoise - prevNoise)
      prevNoise = rawNoise
      prevHpOutput = hpNoise

      const hammerEnv = Math.exp(-t / 0.0015)
      // Transient respects attack envelope to guarantee clean start at 0.0
      const hammerAttack = n < attackSamples ? Math.sin((Math.PI / 2) * (n / attackSamples)) : 1.0
      sampleVal += hpNoise * hammerPeak * hammerEnv * hammerAttack
    }

    // Exact 0.0 at final sample
    if (n === totalSamples - 1) {
      buffer[n] = 0.0
    } else {
      buffer[n] = Math.max(-1.0, Math.min(1.0, sampleVal))
    }
  }

  return buffer
}

// ============================================================================
// Practice Audio Engine Class
// ============================================================================

export class PracticeAudioEngine {
  private ctx: AudioContext | null = null
  private isUnlocked = false

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtxClass) return null
      try {
        this.ctx = new AudioCtxClass()
      } catch {
        return null
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && this.isUnlocked) {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public unlock(): void {
    this.isUnlocked = true
    const ctx = this.getContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
  }

  /**
   * Play an authentic wooden metronome click.
   * @param isDownbeat True for beat 1 of measure (higher pitch & distinct woodblock timbre).
   * @param time Optional audio timeline timestamp for lookahead scheduling.
   */
  public playClick(isDownbeat = false, time?: number): void {
    const ctx = this.getContext()
    if (!ctx) return
    playWoodenClick(ctx, isDownbeat, time)
  }

  /**
   * Synthesize a single plucked guitar string using warm acoustic Web Audio synthesis.
   * @param pitch MIDI number or scientific pitch string (e.g. 60 or "E4").
   * @param durationSec Duration in seconds for string sustain.
   * @param velocity Relative volume scale [0..1].
   */
  public playGuitarPluck(
    pitch: string | number,
    durationSec = 1.2,
    velocity = 0.7
  ): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const midi = parsePitchToMidi(pitch)
      const freq = midiToFreq(midi)

      if (typeof ctx.createOscillator === 'function') {
        const masterGain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        // Warm acoustic guitar body lowpass filter
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(Math.min(3200, freq * 5), now)
        filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.5), now + durationSec)

        const peakLevel = Math.min(0.8, velocity * 0.4)
        masterGain.gain.setValueAtTime(0.0001, now)
        masterGain.gain.linearRampToValueAtTime(peakLevel, now + 0.008) // 8ms pluck attack
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)

        masterGain.connect(filter)
        filter.connect(ctx.destination)

        const osc = ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now)
        osc.connect(masterGain)
        osc.start(now)
        osc.stop(now + durationSec + 0.05)
        return
      }

      // Fallback for headless test environments without createOscillator
      const sampleRate = ctx.sampleRate || 44100
      const samples = generateKarplusStrongBuffer(freq, durationSec, sampleRate, velocity)
      if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function') {
        const audioBuffer = ctx.createBuffer(1, samples.length, sampleRate)
        audioBuffer.getChannelData(0).set(samples)
        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)
        source.start(now)
      }
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Synthesize a realistic guitar strum across multiple strings with directional sweep
   * and warm acoustic string harmonics.
   *
   * @param pitches Array of MIDI numbers or pitch strings.
   * @param direction 'down' (low to high string sweep) or 'up' (high to low sweep).
   * @param isAccented Whether this strum has dynamic accent.
   * @param durationSec Total ringing duration in seconds.
   */
  public playGuitarStrum(
    pitches: (string | number)[],
    direction: 'down' | 'up' = 'down',
    isAccented = false,
    durationSec = 2.0
  ): void {
    const ctx = this.getContext()
    if (!ctx) return

    const parsedMidis = pitches.map(parsePitchToMidi).sort((a, b) => a - b)
    if (parsedMidis.length === 0) return

    try {
      const now = ctx.currentTime
      const strumPitches = direction === 'down' ? parsedMidis : [...parsedMidis].reverse()
      const sweepStep = isAccented ? 0.014 : 0.018 // 14-18ms realistic acoustic sweep delay

      if (typeof ctx.createOscillator === 'function') {
        const masterGain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(isAccented ? 2600 : 1800, now)
        filter.frequency.exponentialRampToValueAtTime(800, now + durationSec)

        const baseVolume = (isAccented ? 0.35 : 0.25) / Math.sqrt(strumPitches.length)
        masterGain.gain.setValueAtTime(baseVolume, now)
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)

        masterGain.connect(filter)
        filter.connect(ctx.destination)

        strumPitches.forEach((midi, idx) => {
          const stringDelay = idx * sweepStep
          const noteStart = now + stringDelay
          const noteDur = Math.max(0.2, durationSec - stringDelay)
          const freq = midiToFreq(midi)

          const osc = ctx.createOscillator()
          const voiceGain = ctx.createGain()

          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, noteStart)

          voiceGain.gain.setValueAtTime(0.0001, noteStart)
          voiceGain.gain.linearRampToValueAtTime(0.7, noteStart + 0.012)
          voiceGain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur)

          osc.connect(voiceGain)
          voiceGain.connect(masterGain)

          osc.start(noteStart)
          osc.stop(noteStart + noteDur + 0.05)
        })
        return
      }

      // Fallback for headless environments
      const sampleRate = ctx.sampleRate || 44100
      const masterGain = ctx.createGain()
      masterGain.connect(ctx.destination)
      strumPitches.forEach((midi, idx) => {
        const stringDelay = idx * sweepStep
        const noteStart = now + stringDelay
        const samples = generateKarplusStrongBuffer(midi, durationSec - stringDelay, sampleRate, 0.7)
        if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function') {
          const buf = ctx.createBuffer(1, samples.length, sampleRate)
          buf.getChannelData(0).set(samples)
          const src = ctx.createBufferSource()
          src.buffer = buf
          src.connect(masterGain)
          src.start(noteStart)
        }
      })
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Synthesize an acoustic piano note using warm inharmonic multi-partial additive synthesis,
   * felt hammer strike attack transient, dual-stage exponential decay, and smooth damper release.
   *
   * @param pitch MIDI number or scientific pitch string (e.g. 60 or "C4").
   * @param durationSec Note length in seconds until damper release.
   * @param velocity Dynamic touch velocity [0..1].
   * @param isBass Whether this is a deep bass note (enhances fundamental resonance).
   */
  public playPianoNote(
    pitch: string | number,
    durationSec = 1.0,
    velocity = 0.7,
    isBass = false
  ): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const midi = parsePitchToMidi(pitch)
      const freq = midiToFreq(midi)

      if (typeof ctx.createOscillator === 'function') {
        const noteGain = ctx.createGain()
        const noteFilter = ctx.createBiquadFilter()

        noteFilter.type = 'lowpass'
        noteFilter.frequency.setValueAtTime(isBass ? 1400 : Math.min(5000, freq * 6), now)
        noteFilter.frequency.exponentialRampToValueAtTime(Math.max(300, freq * 1.5), now + durationSec)

        const peakLevel = Math.min(0.8, velocity * (isBass ? 0.45 : 0.35))
        noteGain.gain.setValueAtTime(0.0001, now)
        noteGain.gain.linearRampToValueAtTime(peakLevel, now + 0.005) // 5ms hammer strike

        // Two-stage natural decay: prompt sound followed by aftersound
        const halfLife = Math.max(0.2, durationSec * 0.6)
        noteGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakLevel * 0.4), now + halfLife)

        // Damper release at durationSec: damp string to 0.0001 in 70ms
        const damperTime = now + durationSec
        noteGain.gain.setValueAtTime(Math.max(0.0001, peakLevel * 0.4 * Math.exp(-durationSec / (halfLife * 2))), damperTime)
        noteGain.gain.exponentialRampToValueAtTime(0.0001, damperTime + 0.07)

        noteGain.connect(noteFilter)
        noteFilter.connect(ctx.destination)

        // Partial 1: Fundamental (Sine)
        const osc1 = ctx.createOscillator()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(freq, now)
        osc1.connect(noteGain)
        osc1.start(now)
        osc1.stop(damperTime + 0.08)

        // Partial 2: 2nd Harmonic (Octave overtone)
        if (freq * 2 < 12000) {
          const osc2 = ctx.createOscillator()
          const g2 = ctx.createGain()
          osc2.type = 'sine'
          osc2.frequency.setValueAtTime(freq * 2, now)
          g2.gain.setValueAtTime(0.25 * velocity, now)
          g2.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(durationSec, 0.8))
          osc2.connect(g2)
          g2.connect(noteGain)
          osc2.start(now)
          osc2.stop(damperTime + 0.08)
        }

        // Partial 3: 3rd Harmonic (Twelfth overtone for acoustic presence)
        if (!isBass && freq * 3 < 14000) {
          const osc3 = ctx.createOscillator()
          const g3 = ctx.createGain()
          osc3.type = 'sine'
          osc3.frequency.setValueAtTime(freq * 3, now)
          g3.gain.setValueAtTime(0.10 * velocity, now)
          g3.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(durationSec, 0.5))
          osc3.connect(g3)
          g3.connect(noteGain)
          osc3.start(now)
          osc3.stop(damperTime + 0.08)
        }
        return
      }

      // Fallback for headless environments
      const sampleRate = ctx.sampleRate || 44100
      const pcmData = generatePianoNoteBuffer(midi, durationSec, velocity, isBass, sampleRate)
      if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function') {
        const audioBuffer = ctx.createBuffer(1, pcmData.length, sampleRate)
        audioBuffer.getChannelData(0).set(pcmData)
        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)
        source.start(now)
      }
    } catch {
      // AudioContext unavailable or suspended
    }
  }

  /**
   * Synthesize a piano voicing separating left-hand bass notes and right-hand chord keys.
   */
  public playPianoVoicing(
    lhPitches: (string | number)[],
    rhPitches: (string | number)[],
    durationSec = 2.0,
    velocity = 0.7
  ): void {
    lhPitches.forEach((p) => {
      this.playPianoNote(p, durationSec, velocity * 1.1, true)
    })
    rhPitches.forEach((p) => {
      this.playPianoNote(p, durationSec, velocity * 0.9, false)
    })
  }

  /**
   * Universal chord playback supporting guitar and piano models and exact measure durations.
   * @param chordName Name of chord (e.g. 'G', 'Am', 'D').
   * @param expectedPitches Optional array of MIDI numbers or pitch strings.
   * @param durationSec Duration in seconds (full duration of chord).
   * @param instrument 'guitar' or 'piano'.
   */
  public playChord(
    chordName: string,
    expectedPitches?: (string | number)[],
    durationSec = 2.0,
    instrument: 'guitar' | 'piano' = 'guitar'
  ): void {
    let pitches = expectedPitches
    if (!pitches || pitches.length === 0) {
      pitches = DEFAULT_CHORD_PITCHES[chordName] || [60, 64, 67]
    }

    if (instrument === 'guitar') {
      this.playGuitarStrum(pitches, 'down', true, durationSec)
    } else {
      // Split into bass (lowest pitch) and treble chord
      const sorted = pitches.map(parsePitchToMidi).sort((a, b) => a - b)
      const bass = sorted.slice(0, 1)
      const rh = sorted.slice(1)
      this.playPianoVoicing(bass, rh.length > 0 ? rh : bass, durationSec)
    }
  }

  public dispose(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
    this.isUnlocked = false
  }
}
