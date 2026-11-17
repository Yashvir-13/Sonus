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

  it('filters pitch estimates through a rolling median window to suppress outliers', () => {
    const tracker = new RealtimePitchTracker(44100)
    tracker.clearPitchHistory()
    // Stable 440 Hz
    expect(tracker.getSmoothedPitch(440)).toBe(440)
    expect(tracker.getSmoothedPitch(441)).toBe(440.5)
    expect(tracker.getSmoothedPitch(439)).toBe(440)
    // Momentary outlier / octave glitch (880 Hz)
    const smoothedWithGlitch = tracker.getSmoothedPitch(880)
    // Median of [440, 441, 439, 880] sorted is [439, 440, 441, 880] -> 440.5
    expect(smoothedWithGlitch).toBeLessThan(450)
  })

  it('accurately tracks 440Hz at 48000Hz hardware sample rate when sampleRate is synchronized', () => {
    const tracker = new RealtimePitchTracker(48000)
    const buffer = new Float32Array(2048)
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.sin((2 * Math.PI * 440 * i) / 48000)
    }
    const result = tracker.detectPitch(buffer)
    expect(result).not.toBeNull()
    expect(result?.note).toBe('A4')
    expect(Math.abs(result!.freq - 440)).toBeLessThan(1.5)
  })

  it('correctly identifies low fundamental E2 (82.4Hz) even when 2nd harmonic (164.8Hz) is prominent', () => {
    const tracker = new RealtimePitchTracker(44100)
    const buffer = new Float32Array(2048)
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] =
        0.55 * Math.sin((2 * Math.PI * 82.41 * i) / 44100) +
        0.45 * Math.sin((2 * Math.PI * 164.82 * i) / 44100)
    }
    const result = tracker.detectPitch(buffer)
    expect(result).not.toBeNull()
    expect(result?.note).toBe('E2')
    expect(Math.abs(result!.freq - 82.41)).toBeLessThan(2.0)
  })
})
