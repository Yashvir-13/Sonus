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
    expect(Math.abs(result!.freq - 440)).toBeLessThan(1.5)
  })

  it('detects low E2 guitar string (82.4Hz) accurately', () => {
    const tracker = new RealtimePitchTracker(44100)
    const buffer = new Float32Array(2048)
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.sin((2 * Math.PI * 82.41 * i) / 44100)
    }
    const result = tracker.detectPitch(buffer)
    expect(result).not.toBeNull()
    expect(result?.note).toBe('E2')
    expect(Math.abs(result!.freq - 82.41)).toBeLessThan(2.0)
  })

  it('evaluates chord match and timing delta against expected voicing', () => {
    const tracker = new RealtimePitchTracker(44100)
    const voicing = resolveChordVoicing('D')
    const buffer = new Float32Array(2048)
    // synthesize D4 fundamental (293.66Hz)
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = 0.5 * Math.sin((2 * Math.PI * 293.66 * i) / 44100)
    }
    const match = tracker.evaluateChordMatch(buffer, voicing, 1000, 1012)
    expect(match.detectedNote).toBe('D4')
    expect(match.matchedPitchClasses).toContain(2) // D
    expect(match.timingDeltaMs).toBe(12) // 1012 - 1000
    expect(match.voicingCompleteness).toBeGreaterThan(0)
  })

  it('reports silence gracefully when signal RMS is below threshold', () => {
    const tracker = new RealtimePitchTracker(44100)
    const buffer = new Float32Array(2048) // all zeros
    const result = tracker.detectPitch(buffer)
    expect(result).toBeNull()
  })

  it('rejects white noise and ambient hiss without false pitch detections', () => {
    const tracker = new RealtimePitchTracker(44100)
    const buffer = new Float32Array(2048)
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = (Math.random() - 0.5) * 0.1 // random noise
    }
    const result = tracker.detectPitch(buffer)
    expect(result).toBeNull()
  })
})
