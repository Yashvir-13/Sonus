import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startMetronome, playWoodenClick } from '../metronome'

describe('Metronome & Wooden Click Audio Synthesis', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('startMetronome Timer Engine', () => {
    it('dispatches initial beat 0 immediately and schedules beats at exact tempo intervals', () => {
      const onBeat = vi.fn()
      // 120 BPM => 500ms per beat
      const stop = startMetronome(120, onBeat)

      expect(onBeat).toHaveBeenCalledTimes(1)
      expect(onBeat).toHaveBeenLastCalledWith(0)

      vi.advanceTimersByTime(500)
      expect(onBeat).toHaveBeenCalledTimes(2)
      expect(onBeat).toHaveBeenLastCalledWith(1)

      vi.advanceTimersByTime(500)
      expect(onBeat).toHaveBeenCalledTimes(3)
      expect(onBeat).toHaveBeenLastCalledWith(2)

      vi.advanceTimersByTime(500)
      expect(onBeat).toHaveBeenCalledTimes(4)
      expect(onBeat).toHaveBeenLastCalledWith(3)

      vi.advanceTimersByTime(500)
      expect(onBeat).toHaveBeenCalledTimes(5)
      expect(onBeat).toHaveBeenLastCalledWith(4) // Beat 4 = Downbeat of measure 2

      stop()
    })

    it('clamps BPM to safe range [30, 300]', () => {
      const onBeatLow = vi.fn()
      // Clamped to 30 BPM => 2000ms per beat
      const stopLow = startMetronome(10, onBeatLow)
      expect(onBeatLow).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(1000)
      expect(onBeatLow).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(1000)
      expect(onBeatLow).toHaveBeenCalledTimes(2)
      stopLow()

      const onBeatHigh = vi.fn()
      // Clamped to 300 BPM => 200ms per beat
      const stopHigh = startMetronome(500, onBeatHigh)
      expect(onBeatHigh).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(200)
      expect(onBeatHigh).toHaveBeenCalledTimes(2)
      stopHigh()
    })

    it('halts interval execution immediately when stop cleanup function is invoked', () => {
      const onBeat = vi.fn()
      const stop = startMetronome(60, onBeat) // 1000ms per beat

      expect(onBeat).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1000)
      expect(onBeat).toHaveBeenCalledTimes(2)

      stop()

      vi.advanceTimersByTime(5000)
      expect(onBeat).toHaveBeenCalledTimes(2) // No additional calls after stop
    })

    it('runs smoothly in silent mode when AudioContext is omitted', () => {
      const onBeat = vi.fn()
      expect(() => {
        const stop = startMetronome(100, onBeat)
        vi.advanceTimersByTime(1200)
        stop()
      }).not.toThrow()
      expect(onBeat).toHaveBeenCalled()
    })
  })

  describe('playWoodenClick Physical Synthesis & Acoustics', () => {
    let mockCtx: any
    let oscillators: any[]
    let filters: any[]
    let gains: any[]

    beforeEach(() => {
      oscillators = []
      filters = []
      gains = []

      mockCtx = {
        currentTime: 1.0,
        destination: { name: 'destination' },
        createOscillator: vi.fn(() => {
          const osc = {
            type: 'sine',
            frequency: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          }
          oscillators.push(osc)
          return osc
        }),
        createBiquadFilter: vi.fn(() => {
          const filter = {
            type: 'lowpass',
            frequency: { setValueAtTime: vi.fn() },
            Q: { setValueAtTime: vi.fn() },
            connect: vi.fn(),
          }
          filters.push(filter)
          return filter
        }),
        createGain: vi.fn(() => {
          const g = {
            gain: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
          }
          gains.push(g)
          return g
        }),
      }
    })

    it('synthesizes authentic downbeat wooden "tok" at ~1150Hz with 18% transient glide and Q=12', () => {
      playWoodenClick(mockCtx, true, 1.0)

      expect(oscillators).toHaveLength(2) // Cavity oscillator + Knock oscillator
      expect(filters).toHaveLength(1)    // Bandpass filter
      expect(gains).toHaveLength(2)      // Cavity gain + Knock gain

      const cavityOsc = oscillators[0]
      const cavityFilter = filters[0]
      const cavityGain = gains[0]

      // Cavity Oscillator: Triangle wave with 18% pitch drop (1150 * 1.18 = 1357Hz -> 1150Hz in 4ms)
      expect(cavityOsc.type).toBe('triangle')
      expect(cavityOsc.frequency.setValueAtTime).toHaveBeenCalledWith(1150 * 1.18, 1.0)
      expect(cavityOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1150, 1.004)

      // High-Q bandpass resonance at 1150Hz with Q = 12
      expect(cavityFilter.type).toBe('bandpass')
      expect(cavityFilter.frequency.setValueAtTime).toHaveBeenCalledWith(1150, 1.0)
      expect(cavityFilter.Q.setValueAtTime).toHaveBeenCalledWith(12, 1.0)

      // Cavity Gain: Peak volume 0.65 with 28ms exponential decay
      expect(cavityGain.gain.setValueAtTime).toHaveBeenCalledWith(0.65, 1.0)
      expect(cavityGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 1.028)

      // Secondary knock transient at ~300Hz (340 -> 280Hz in 4ms, 18ms decay)
      const knockOsc = oscillators[1]
      const knockGain = gains[1]
      expect(knockOsc.type).toBe('sine')
      expect(knockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(340, 1.0)
      expect(knockOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(280, 1.004)
      expect(knockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.20, 1.0)
      expect(knockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 1.018)

      // Nodes stop at t0 + 35ms to allow garbage collection
      expect(cavityOsc.stop).toHaveBeenCalledWith(1.035)
      expect(knockOsc.stop).toHaveBeenCalledWith(1.035)
    })

    it('synthesizes authentic upbeat wooden "tek" at ~850Hz with 18% transient glide and Q=12', () => {
      playWoodenClick(mockCtx, false, 2.5)

      const cavityOsc = oscillators[0]
      const cavityFilter = filters[0]
      const cavityGain = gains[0]

      // Upbeat Cavity: Triangle wave with 18% drop (850 * 1.18 = 1003Hz -> 850Hz in 4ms)
      expect(cavityOsc.frequency.setValueAtTime).toHaveBeenCalledWith(850 * 1.18, 2.5)
      expect(cavityOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(850, 2.504)

      // Bandpass centered at 850Hz with Q = 12
      expect(cavityFilter.frequency.setValueAtTime).toHaveBeenCalledWith(850, 2.5)
      expect(cavityFilter.Q.setValueAtTime).toHaveBeenCalledWith(12, 2.5)

      // Upbeat Peak volume 0.40 decaying in 28ms
      expect(cavityGain.gain.setValueAtTime).toHaveBeenCalledWith(0.40, 2.5)
      expect(cavityGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 2.528)

      // Secondary knock transient volume scaled down to 0.12
      const knockGain = gains[1]
      expect(knockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.12, 2.5)
    })

    it('guarantees audio headroom with total combined peak strictly beneath 0.90', () => {
      playWoodenClick(mockCtx, true, 0)
      const downbeatCavity = gains[0].gain.setValueAtTime.mock.calls[0][0]
      const downbeatKnock = gains[1].gain.setValueAtTime.mock.calls[0][0]
      expect(downbeatCavity + downbeatKnock).toBeLessThanOrEqual(0.90)

      playWoodenClick(mockCtx, false, 0)
      const upbeatCavity = gains[2].gain.setValueAtTime.mock.calls[0][0]
      const upbeatKnock = gains[3].gain.setValueAtTime.mock.calls[0][0]
      expect(upbeatCavity + upbeatKnock).toBeLessThanOrEqual(0.60)
    })

    it('supports WoodenClickOptions configuration object with gain scaling', () => {
      playWoodenClick(mockCtx, { isDownbeat: true, gainScale: 0.5, time: 3.0 })
      // Cavity volume scaled by 0.5: 0.65 * 0.5 = 0.325
      expect(gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0.325, 3.0)
      // Knock volume scaled by 0.5: 0.20 * 0.5 = 0.10
      expect(gains[1].gain.setValueAtTime).toHaveBeenCalledWith(0.10, 3.0)
    })

    it('safely catches errors and suppresses crashes when AudioContext throws', () => {
      const faultyCtx = {
        currentTime: 0,
        createOscillator: vi.fn(() => {
          throw new Error('AudioContext is closed')
        }),
      } as unknown as AudioContext

      expect(() => playWoodenClick(faultyCtx, true)).not.toThrow()
    })
  })
})
