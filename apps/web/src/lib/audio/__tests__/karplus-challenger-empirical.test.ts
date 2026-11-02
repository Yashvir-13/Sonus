import { describe, it, expect } from 'vitest'
import {
  generateKarplusStrongBuffer,
  midiToFreq,
  parsePitchToMidi,
} from '../practice-audio-engine'

describe('Challenger 1 Empirical Stress Tests: Karplus-Strong Synthesis', () => {
  const sampleRate = 44100
  const testPitches: { label: string; midi: number; expectedFreq: number }[] = [
    { label: 'E2', midi: 40, expectedFreq: 82.4069 },
    { label: 'A2', midi: 45, expectedFreq: 110.0 },
    { label: 'D3', midi: 50, expectedFreq: 146.8324 },
    { label: 'G3', midi: 55, expectedFreq: 195.9977 },
    { label: 'B3', midi: 59, expectedFreq: 246.9417 },
    { label: 'E4', midi: 64, expectedFreq: 329.6276 },
    { label: 'E5', midi: 76, expectedFreq: 659.2551 },
    { label: 'E6', midi: 88, expectedFreq: 1318.5102 },
  ]

  function calculateRMS(samples: Float32Array, startIdx: number, endIdx: number): number {
    const start = Math.max(0, startIdx)
    const end = Math.min(samples.length, endIdx)
    const count = end - start
    if (count <= 0) return 0
    let sumSq = 0
    for (let i = start; i < end; i++) {
      sumSq += samples[i] * samples[i]
    }
    return Math.sqrt(sumSq / count)
  }

  function calculateDC(samples: Float32Array): number {
    if (samples.length === 0) return 0
    let sum = 0
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i]
    }
    return sum / samples.length
  }

  function calculatePeak(samples: Float32Array): number {
    let max = 0
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i])
      if (abs > max) max = abs
    }
    return max
  }

  describe('Numeric Stability & Extreme Pitch Coverage (E2 to E6)', () => {
    testPitches.forEach((p) => {
      it(`synthesizes ${p.label} (~${p.expectedFreq.toFixed(1)}Hz) without NaN, Inf, or DC offset`, () => {
        const durationSec = 1.2
        const buf = generateKarplusStrongBuffer(p.label, durationSec, sampleRate, 0.8)

        expect(buf.length).toBe(Math.floor(durationSec * sampleRate))

        let nanCount = 0
        let infCount = 0
        for (let i = 0; i < buf.length; i++) {
          if (Number.isNaN(buf[i])) nanCount++
          if (!Number.isFinite(buf[i])) infCount++
        }
        expect(nanCount).toBe(0)
        expect(infCount).toBe(0)

        const dc = calculateDC(buf)
        expect(Math.abs(dc)).toBeLessThan(0.01)

        const peak = calculatePeak(buf)
        expect(peak).toBeLessThanOrEqual(1.0)
        expect(peak).toBeGreaterThan(0.05)
      })
    })
  })

  describe('Extreme Boundaries & Durations', () => {
    it('handles extreme sub-bass (20Hz) and treble limits (4000Hz) gracefully', () => {
      const lowBuf = generateKarplusStrongBuffer(20, 1.0, sampleRate, 0.9)
      expect(Number.isNaN(lowBuf[0])).toBe(false)
      expect(calculatePeak(lowBuf)).toBeLessThanOrEqual(1.0)

      const highBuf = generateKarplusStrongBuffer(4000, 0.5, sampleRate, 0.7)
      expect(Number.isNaN(highBuf[0])).toBe(false)
      expect(calculatePeak(highBuf)).toBeLessThanOrEqual(1.0)
    })

    it('handles short micro-plucks (0.02s) and long sustains (4.0s) without distortion', () => {
      const microBuf = generateKarplusStrongBuffer('E4', 0.02, sampleRate, 0.7)
      expect(calculatePeak(microBuf)).toBeLessThanOrEqual(1.0)
      expect(Math.abs(calculateDC(microBuf))).toBeLessThan(0.01)

      const longBuf = generateKarplusStrongBuffer('E2', 4.0, sampleRate, 0.7)
      expect(calculatePeak(longBuf)).toBeLessThanOrEqual(1.0)
      expect(Math.abs(calculateDC(longBuf))).toBeLessThan(0.01)
    })
  })

  describe('Energy Decay: First 100ms vs Last 100ms', () => {
    testPitches.forEach((p) => {
      it(`verifies RMS of first 100ms is at least 3x higher than last 100ms for ${p.label}`, () => {
        const durationSec = 1.2
        const buf = generateKarplusStrongBuffer(p.label, durationSec, sampleRate, 0.75)
        const first100msSamples = Math.floor(0.1 * sampleRate)
        const last100msStart = buf.length - first100msSamples

        const rmsFirst = calculateRMS(buf, 0, first100msSamples)
        const rmsLast = calculateRMS(buf, last100msStart, buf.length)

        expect(rmsFirst).toBeGreaterThanOrEqual(rmsLast * 3.0)
      })
    })
  })

  describe('Pitch-Dependent Damping', () => {
    it('verifies low note E2 sustains significantly longer than high note E5 in the tail window', () => {
      const durationSec = 1.5
      const e2Buf = generateKarplusStrongBuffer('E2', durationSec, sampleRate, 0.8)
      const e5Buf = generateKarplusStrongBuffer('E5', durationSec, sampleRate, 0.8)

      const tailStart = Math.floor(0.8 * sampleRate)
      const tailEnd = Math.floor(1.2 * sampleRate)

      const e2TailRms = calculateRMS(e2Buf, tailStart, tailEnd)
      const e5TailRms = calculateRMS(e5Buf, tailStart, tailEnd)

      // E2 tail RMS must be at least 3x higher than E5 tail RMS
      expect(e2TailRms).toBeGreaterThanOrEqual(e5TailRms * 3.0)
    })
  })

  describe('Polyphonic 6-String Directional Strumming Headroom', () => {
    const chords = [
      { name: 'Open E Major', pitches: [40, 47, 52, 56, 59, 64] },
      { name: 'Standard Folk G Major', pitches: [43, 47, 50, 55, 59, 67] },
      { name: 'F Major Barre', pitches: [41, 48, 53, 57, 60, 65] },
      { name: 'Rock G Major', pitches: [43, 47, 50, 55, 62, 67] },
    ]

    chords.forEach((chord) => {
      ;(['down', 'up'] as const).forEach((direction) => {
        ;[true, false].forEach((isAccented) => {
          it(`guarantees polyphonic sum <= 1.0 FS for ${chord.name} (${direction}, accented: ${isAccented})`, () => {
            const durationSec = 2.0
            const parsedMidis = chord.pitches.map(parsePitchToMidi).sort((a, b) => a - b)
            const strumPitches = direction === 'down' ? parsedMidis : [...parsedMidis].reverse()
            const sweepStep = isAccented ? 0.004 : 0.006
            const velocity = isAccented ? 0.85 : 0.65
            const masterGain = 0.85 / Math.sqrt(strumPitches.length)

            const totalSamples = Math.floor(durationSec * sampleRate)
            const polyBuffer = new Float32Array(totalSamples)

            strumPitches.forEach((midi, idx) => {
              const stringDelaySec = idx * sweepStep
              const stringOffsetSamples = Math.floor(stringDelaySec * sampleRate)
              const ringDuration = Math.max(0.2, durationSec - stringDelaySec)
              const freq = midiToFreq(midi)

              const stringSamples = generateKarplusStrongBuffer(freq, ringDuration, sampleRate, velocity)

              for (let n = 0; n < stringSamples.length; n++) {
                const outIdx = stringOffsetSamples + n
                if (outIdx < totalSamples) {
                  polyBuffer[outIdx] += stringSamples[n] * masterGain
                }
              }
            })

            const peak = calculatePeak(polyBuffer)
            expect(peak).toBeLessThanOrEqual(1.0)
            expect(peak).toBeGreaterThan(0.1)
          })
        })
      })
    })
  })
})
