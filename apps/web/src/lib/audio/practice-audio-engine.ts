/**
 * Practice Audio Engine
 *
 * Lightweight, zero-dependency Web Audio synthesizer providing:
 * 1. High-precision Metronome click track (downbeat/upbeat).
 * 2. Acoustic Guitar Physical Modeling (directional strum sweep, pluck transients, string resonance).
 * 3. Acoustic Piano Multi-Partial Synthesis (hammer strike attack, dual-stage decay, damper release).
 * 4. Granular Melody, Harmony, Arpeggio, and Strum scheduling with exact note lengths.
 * 5. Safe lifecycle management (browser gesture unlocking & cleanup).
 */

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
  const match = pitch.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
  if (!match) return 60 // Middle C default
  const letter = match[1].toUpperCase()
  const accidental = match[2]
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
}

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
   * Play an acoustic metronome click.
   * @param isDownbeat True for beat 1 of measure (higher pitch & distinct woodblock timbre).
   */
  public playClick(isDownbeat = false): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = isDownbeat ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(isDownbeat ? 880 : 440, now)
      // Slight pitch drop for woodblock snap
      osc.frequency.exponentialRampToValueAtTime(isDownbeat ? 440 : 220, now + (isDownbeat ? 0.04 : 0.03))

      const peakVolume = isDownbeat ? 0.6 : 0.35
      gain.gain.setValueAtTime(peakVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (isDownbeat ? 0.05 : 0.035))

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.06)
    } catch {
      // Audio context might be restricted before gesture
    }
  }

  /**
   * Synthesize a single plucked guitar string note or arpeggio step.
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

      const osc = ctx.createOscillator()
      const pluckFilter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      // Guitar string timbre: triangle wave with brightness filter
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now)

      // Acoustic body & string brightness filter: starts bright (2400Hz) and decays into string body
      pluckFilter.type = 'lowpass'
      pluckFilter.frequency.setValueAtTime(Math.min(3200, freq * 6), now)
      pluckFilter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.5), now + Math.min(0.4, durationSec * 0.4))

      const peakGain = Math.min(0.8, velocity * 0.45)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.006) // 6ms sharp pluck attack
      // Natural string decay
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)

      osc.connect(pluckFilter)
      pluckFilter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + durationSec + 0.05)
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Synthesize a realistic guitar strum across multiple strings with directional sweep.
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
      // Order strings based on strum direction
      const strumPitches = direction === 'down' ? parsedMidis : [...parsedMidis].reverse()
      const sweepStep = isAccented ? 0.004 : 0.006 // 4ms or 6ms per string
      const velocity = isAccented ? 0.85 : 0.65

      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.8 / Math.sqrt(strumPitches.length), now)

      const bodyFilter = ctx.createBiquadFilter()
      bodyFilter.type = 'lowpass'
      bodyFilter.frequency.setValueAtTime(isAccented ? 2800 : 2000, now)
      bodyFilter.frequency.exponentialRampToValueAtTime(700, now + durationSec)

      masterGain.connect(bodyFilter)
      bodyFilter.connect(ctx.destination)

      strumPitches.forEach((midi, idx) => {
        const stringDelay = idx * sweepStep
        const noteStart = now + stringDelay
        const ringDuration = Math.max(0.1, durationSec - stringDelay)
        const freq = midiToFreq(midi)

        const osc = ctx.createOscillator()
        const voiceGain = ctx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, noteStart)

        voiceGain.gain.setValueAtTime(0, noteStart)
        voiceGain.gain.linearRampToValueAtTime(velocity, noteStart + 0.008)
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + ringDuration)

        osc.connect(voiceGain)
        voiceGain.connect(masterGain)

        osc.start(noteStart)
        osc.stop(noteStart + ringDuration + 0.05)
      })
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Synthesize a piano note with hammer strike impulse, multi-partials, and damper release.
   * @param pitch MIDI number or pitch string (e.g. 60 or "C4").
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

      // Master note gain node
      const noteGain = ctx.createGain()
      const noteFilter = ctx.createBiquadFilter()

      noteFilter.type = 'lowpass'
      noteFilter.frequency.setValueAtTime(isBass ? 1200 : Math.min(4500, freq * 7), now)
      noteFilter.frequency.exponentialRampToValueAtTime(Math.max(300, freq * 1.8), now + durationSec)

      const peakLevel = Math.min(0.8, velocity * (isBass ? 0.45 : 0.35))
      noteGain.gain.setValueAtTime(0, now)
      noteGain.gain.linearRampToValueAtTime(peakLevel, now + 0.005) // 5ms hammer strike

      // Two-stage decay: prompt sound followed by aftersound
      const halfLife = Math.max(0.2, durationSec * 0.6)
      noteGain.gain.exponentialRampToValueAtTime(peakLevel * 0.4, now + halfLife)

      // Damper release: upon reaching durationSec, damp strings to 0 in 70ms
      const damperTime = now + durationSec
      noteGain.gain.setValueAtTime(peakLevel * 0.4 * Math.exp(-durationSec / (halfLife * 2)), damperTime)
      noteGain.gain.exponentialRampToValueAtTime(0.0001, damperTime + 0.07)

      noteGain.connect(noteFilter)
      noteFilter.connect(ctx.destination)

      // Harmonic Partial 1: Fundamental
      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(freq, now)
      osc1.connect(noteGain)
      osc1.start(now)
      osc1.stop(damperTime + 0.08)

      // Harmonic Partial 2: 2nd Harmonic (Octave overtone)
      if (freq * 2 < 12000) {
        const osc2 = ctx.createOscillator()
        const g2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(freq * 2, now)
        g2.gain.setValueAtTime(0.35 * velocity, now)
        g2.gain.exponentialRampToValueAtTime(0.001, now + Math.min(durationSec, 0.8))
        osc2.connect(g2)
        g2.connect(noteGain)
        osc2.start(now)
        osc2.stop(damperTime + 0.08)
      }

      // Harmonic Partial 3: 3rd Harmonic (Twelfth overtone for acoustic richness)
      if (!isBass && freq * 3 < 14000) {
        const osc3 = ctx.createOscillator()
        const g3 = ctx.createGain()
        osc3.type = 'sine'
        osc3.frequency.setValueAtTime(freq * 3, now)
        g3.gain.setValueAtTime(0.12 * velocity, now)
        g3.gain.exponentialRampToValueAtTime(0.0005, now + Math.min(durationSec, 0.5))
        osc3.connect(g3)
        g3.connect(noteGain)
        osc3.start(now)
        osc3.stop(damperTime + 0.08)
      }
    } catch {
      // AudioContext unavailable
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
