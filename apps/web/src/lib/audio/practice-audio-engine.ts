/**
 * Practice Audio Engine
 *
 * Lightweight, zero-dependency Web Audio synthesizer providing:
 * 1. High-precision Metronome click track (downbeat/upbeat).
 * 2. Harmonic chord sound synthesis for play-along reference.
 * 3. Safe lifecycle management (handles browser gesture unlocking & cleanup).
 */

const DEFAULT_CHORD_PITCHES: Record<string, number[]> = {
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
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export class PracticeAudioEngine {
  private ctx: AudioContext | null = null
  private isUnlocked = false

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtxClass) return null
      this.ctx = new AudioCtxClass()
    }
    if (this.ctx.state === 'suspended' && this.isUnlocked) {
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
   * @param isDownbeat True for beat 1 of measure (higher pitch & distinct timbre).
   */
  public playClick(isDownbeat = false): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const now = ctx.currentTime

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
   * Synthesize an acoustic polyphonic chord strum/pad.
   * @param chordName Name of chord (e.g. 'G', 'Am', 'D').
   * @param expectedPitches Optional explicit array of MIDI numbers.
   * @param durationSec Duration in seconds (default: 1.2s).
   */
  public playChord(chordName: string, expectedPitches?: number[], durationSec = 1.2): void {
    const ctx = this.getContext()
    if (!ctx) return

    let pitches = expectedPitches
    if (!pitches || pitches.length === 0) {
      pitches = DEFAULT_CHORD_PITCHES[chordName] || [60, 64, 67] // Fallback to Middle C triad
    }

    try {
      const now = ctx.currentTime
      const masterGain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      // Warm acoustic low-pass filter
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1800, now)
      filter.frequency.exponentialRampToValueAtTime(800, now + durationSec)

      masterGain.gain.setValueAtTime(0.25 / Math.sqrt(pitches.length), now)
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)

      masterGain.connect(filter)
      filter.connect(ctx.destination)

      // Strum delay simulation (15ms between strings for acoustic feel)
      pitches.forEach((midi, i) => {
        const osc = ctx.createOscillator()
        const voiceGain = ctx.createGain()
        const strumOffset = i * 0.015
        const noteStart = now + strumOffset

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(midiToFreq(midi), noteStart)

        voiceGain.gain.setValueAtTime(0, noteStart)
        voiceGain.gain.linearRampToValueAtTime(0.7, noteStart + 0.02)
        voiceGain.gain.exponentialRampToValueAtTime(0.001, noteStart + durationSec - strumOffset)

        osc.connect(voiceGain)
        voiceGain.connect(masterGain)

        osc.start(noteStart)
        osc.stop(noteStart + durationSec)
      })
    } catch {
      // Context not yet allowed
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
