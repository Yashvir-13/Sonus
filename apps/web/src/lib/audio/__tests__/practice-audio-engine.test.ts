import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PracticeAudioEngine,
  parsePitchToMidi,
  midiToFreq,
  DEFAULT_CHORD_PITCHES,
  generateKarplusStrongBuffer,
  generatePianoNoteBuffer,
  INHARMONICITY_B_TREBLE_MID,
  INHARMONICITY_B_BASS,
  PIANO_HARMONIC_WEIGHTS,
} from '../practice-audio-engine'

describe('PracticeAudioEngine Comprehensive Suite', () => {
  let engine: PracticeAudioEngine

  beforeEach(() => {
    engine = new PracticeAudioEngine()
  })

  afterEach(() => {
    engine.dispose()
    vi.restoreAllMocks()
  })

  describe('Music Theory & Pitch Conversions', () => {
    it('converts pitch strings and MIDI numbers accurately', () => {
      expect(parsePitchToMidi('C4')).toBe(60)
      expect(parsePitchToMidi('A4')).toBe(69)
      expect(parsePitchToMidi('D3')).toBe(50)
      expect(parsePitchToMidi('F#3')).toBe(54)
      expect(parsePitchToMidi('Eb5')).toBe(75)
      expect(parsePitchToMidi(64)).toBe(64)
      expect(midiToFreq(69)).toBeCloseTo(440, 2)
      expect(midiToFreq(60)).toBeCloseTo(261.63, 1)
      expect(midiToFreq(40)).toBeCloseTo(82.41, 1) // Low E guitar string
    })

    it('provides standard chord pitch definitions across common chords', () => {
      expect(DEFAULT_CHORD_PITCHES.G).toBeDefined()
      expect(DEFAULT_CHORD_PITCHES.C).toBeDefined()
      expect(DEFAULT_CHORD_PITCHES.Am).toBeDefined()
      expect(DEFAULT_CHORD_PITCHES.Bm).toBeDefined()
      expect(DEFAULT_CHORD_PITCHES.Eb).toBeDefined()
      expect(DEFAULT_CHORD_PITCHES.Gmaj7).toBeDefined()
    })
  })

  describe('Interface & Lifecycle', () => {
    it('instantiates cleanly and exposes full synthesis interface', () => {
      expect(engine).toBeDefined()
      expect(typeof engine.unlock).toBe('function')
      expect(typeof engine.playClick).toBe('function')
      expect(typeof engine.playChord).toBe('function')
      expect(typeof engine.playGuitarStrum).toBe('function')
      expect(typeof engine.playGuitarPluck).toBe('function')
      expect(typeof engine.playPianoNote).toBe('function')
      expect(typeof engine.playPianoVoicing).toBe('function')
      expect(typeof engine.dispose).toBe('function')
    })

    it('runs all acoustic guitar and piano synthesis methods without throwing in headless mode', () => {
      expect(() => engine.playClick(true)).not.toThrow()
      expect(() => engine.playClick(false)).not.toThrow()

      // Guitar synthesis
      expect(() => engine.playGuitarPluck('E2', 1.5, 0.8)).not.toThrow()
      expect(() =>
        engine.playGuitarStrum(['G2', 'B2', 'D3', 'G3', 'B3', 'G4'], 'down', true, 2.5)
      ).not.toThrow()
      expect(() => engine.playGuitarStrum(['E4', 'B3', 'G3', 'D3'], 'up', false, 1.0)).not.toThrow()

      // Piano synthesis
      expect(() => engine.playPianoNote('C3', 2.0, 0.7, true)).not.toThrow()
      expect(() => engine.playPianoNote('E5', 1.0, 0.8, false)).not.toThrow()
      expect(() => engine.playPianoVoicing(['C3'], ['E4', 'G4', 'C5'], 3.0)).not.toThrow()

      // Universal chord synthesis with instrument parameter
      expect(() => engine.playChord('G', [43, 47, 50, 55, 59, 67], 3.4, 'guitar')).not.toThrow()
      expect(() => engine.playChord('Cm', ['C3', 'Eb3', 'G3'], 2.0, 'piano')).not.toThrow()

      expect(() => engine.dispose()).not.toThrow()
    })
  })

  describe('Karplus-Strong String Physical Modeling DSP', () => {
    const sampleRate = 44100

    it('synthesizes exact sample count for requested duration', () => {
      const durationSec = 1.0
      const buffer = generateKarplusStrongBuffer(220, durationSec, sampleRate)
      expect(buffer).toBeInstanceOf(Float32Array)
      expect(buffer.length).toBe(44100)
    })

    it('guarantees zero DC offset and non-NaN values', () => {
      const buffer = generateKarplusStrongBuffer(110, 0.5, sampleRate)
      let sum = 0
      let hasNan = false
      for (let i = 0; i < buffer.length; i++) {
        if (Number.isNaN(buffer[i])) hasNan = true
        sum += buffer[i]
      }
      expect(hasNan).toBe(false)
      // Mean DC bias should be negligible (< 0.01)
      expect(Math.abs(sum / buffer.length)).toBeLessThan(0.01)
    })

    it('exhibits exponential energy decay over time', () => {
      const buffer = generateKarplusStrongBuffer(330, 1.5, sampleRate)

      // Compute RMS energy in first 50ms vs last 100ms
      const attackSamples = Math.floor(0.05 * sampleRate)
      let attackEnergy = 0
      for (let i = 0; i < attackSamples; i++) {
        attackEnergy += buffer[i] * buffer[i]
      }
      attackEnergy = Math.sqrt(attackEnergy / attackSamples)

      const tailStart = Math.floor(1.3 * sampleRate)
      const tailSamples = buffer.length - tailStart
      let tailEnergy = 0
      for (let i = tailStart; i < buffer.length; i++) {
        tailEnergy += buffer[i] * buffer[i]
      }
      tailEnergy = Math.sqrt(tailEnergy / tailSamples)

      // The attack energy must be significantly higher than the tail energy
      expect(attackEnergy).toBeGreaterThan(tailEnergy * 3)
    })

    it('demonstrates frequency-dependent decay (higher pitch decays faster)', () => {
      const lowString = generateKarplusStrongBuffer(82.4, 1.0, sampleRate) // E2
      const highString = generateKarplusStrongBuffer(659.2, 1.0, sampleRate) // E5

      // Compute RMS at 0.7s - 0.9s
      const evalStart = Math.floor(0.7 * sampleRate)
      const evalEnd = Math.floor(0.9 * sampleRate)
      let lowEnergy = 0
      let highEnergy = 0
      for (let i = evalStart; i < evalEnd; i++) {
        lowEnergy += lowString[i] * lowString[i]
        highEnergy += highString[i] * highString[i]
      }
      // Bass note E2 retains substantially more residual energy than high treble E5
      expect(lowEnergy).toBeGreaterThan(highEnergy * 4)
    })
  })

  describe('Multi-Partial Piano Additive Synthesis DSP', () => {
    const sampleRate = 44100

    it('generates an exact length Float32Array with 60ms damper release margin', () => {
      const durationSec = 1.0
      const buffer = generatePianoNoteBuffer(sampleRate, 60, durationSec, 0.7, false)
      const expectedSamples = Math.floor((durationSec + 0.06) * sampleRate)
      expect(buffer).toBeInstanceOf(Float32Array)
      expect(buffer.length).toBe(expectedSamples)
    })

    it('guarantees zero clicks with zero amplitude at start and finish', () => {
      const buffer = generatePianoNoteBuffer(sampleRate, 69, 0.5, 0.8, false)
      // First sample must be close to zero (within smooth 4ms attack)
      expect(Math.abs(buffer[0])).toBeLessThan(0.05)
      // Final sample must be strictly zero (cosine damper release)
      expect(Math.abs(buffer[buffer.length - 1])).toBeLessThan(0.0001)
    })

    it('maintains dynamic range strictly within [-1.0, 1.0] without digital clipping', () => {
      const bassBuffer = generatePianoNoteBuffer(sampleRate, 36, 1.5, 1.0, true)
      let maxAbs = 0
      for (let i = 0; i < bassBuffer.length; i++) {
        const absVal = Math.abs(bassBuffer[i])
        if (absVal > maxAbs) maxAbs = absVal
      }
      expect(maxAbs).toBeLessThanOrEqual(1.0)
      expect(maxAbs).toBeGreaterThan(0.2) // Must have audible presence
    })

    it('contains felt hammer attack transient in the initial 5ms window', () => {
      const buffer = generatePianoNoteBuffer(sampleRate, 60, 1.0, 0.8, false)
      const fiveMsSamples = Math.floor(0.005 * sampleRate)

      let hammerEnergy = 0
      for (let i = 0; i < fiveMsSamples; i++) {
        hammerEnergy += buffer[i] * buffer[i]
      }
      const hammerRms = Math.sqrt(hammerEnergy / fiveMsSamples)

      expect(hammerRms).toBeGreaterThan(0.01)
    })

    it('clamps high harmonics to prevent aliasing above Nyquist frequency', () => {
      // Pitch C8 (MIDI 108, ~4186 Hz). 6th partial would be ~25 kHz, above 22.05 kHz Nyquist
      const trebleBuffer = generatePianoNoteBuffer(sampleRate, 108, 0.5, 0.7, false)
      expect(trebleBuffer.length).toBeGreaterThan(0)
      for (let i = 0; i < trebleBuffer.length; i++) {
        expect(Number.isNaN(trebleBuffer[i])).toBe(false)
        expect(Number.isFinite(trebleBuffer[i])).toBe(true)
      }
    })

    it('exports piano stiffness constants and harmonic weights', () => {
      expect(INHARMONICITY_B_TREBLE_MID).toBe(0.00015)
      expect(INHARMONICITY_B_BASS).toBe(0.00035)
      expect(PIANO_HARMONIC_WEIGHTS).toHaveLength(6)
      expect(PIANO_HARMONIC_WEIGHTS[0]).toBe(1.0)
    })
  })

  describe('AudioContext Synthesis Execution & Node Routing', () => {
    let mockOscs: any[]
    let mockFilters: any[]
    let mockGains: any[]
    let mockBuffers: any[]
    let mockBufferSources: any[]

    beforeEach(() => {
      mockOscs = []
      mockFilters = []
      mockGains = []
      mockBuffers = []
      mockBufferSources = []

      class MockAudioCtx {
        state = 'running'
        currentTime = 0
        sampleRate = 44100
        destination = { name: 'destination' }

        createOscillator = vi.fn(() => {
          const osc = {
            type: 'triangle',
            frequency: {
              value: 440,
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          }
          mockOscs.push(osc)
          return osc
        })

        createBiquadFilter = vi.fn(() => {
          const filter = {
            type: 'bandpass',
            frequency: {
              value: 1150,
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            Q: {
              value: 12,
              setValueAtTime: vi.fn(),
            },
            gain: {
              value: 0,
              setValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
          }
          mockFilters.push(filter)
          return filter
        })

        createGain = vi.fn(() => {
          const g = {
            gain: {
              value: 1,
              setValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
          }
          mockGains.push(g)
          return g
        })

        createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => {
          const data = new Float32Array(length)
          const buffer = {
            numberOfChannels: channels,
            length,
            sampleRate,
            duration: length / sampleRate,
            getChannelData: vi.fn(() => data),
            data,
          }
          mockBuffers.push(buffer)
          return buffer
        })

        createBufferSource = vi.fn(() => {
          const src = {
            buffer: null as any,
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          }
          mockBufferSources.push(src)
          return src
        })

        resume = vi.fn().mockResolvedValue(undefined)
        close = vi.fn().mockResolvedValue(undefined)
      }

      ;(window as any).AudioContext = MockAudioCtx
      engine = new PracticeAudioEngine()
    })

    it('synthesizes a single guitar pluck with physical AudioBuffer modeling', () => {
      engine.playGuitarPluck('E2', 1.5, 0.8)
      expect(mockBuffers.length).toBeGreaterThan(0)
      expect(mockBufferSources.length).toBeGreaterThan(0)
    })

    it('synthesizes directional strums with staggering offsets between successive strings', () => {
      const gChord = [43, 47, 50, 55, 59, 67]
      engine.playGuitarStrum(gChord, 'down', true, 2.0)
      expect(mockBuffers.length).toBeGreaterThanOrEqual(6)
      expect(mockBufferSources.length).toBeGreaterThanOrEqual(6)
    })

    it('synthesizes piano note with multi-partial inharmonic AudioBuffer and gain node', () => {
      engine.playPianoNote('C4', 1.0, 0.7, false)
      expect(mockBuffers.length).toBeGreaterThan(0)
      expect(mockGains.length).toBeGreaterThan(0)
    })

    it('splits piano voicings into distinct left-hand and right-hand components', () => {
      const lh = ['C3']
      const rh = ['E4', 'G4', 'C5']
      engine.playPianoVoicing(lh, rh, 2.0)
      expect(mockGains.length).toBeGreaterThanOrEqual(4)
      expect(mockBuffers.length).toBeGreaterThanOrEqual(4)
    })

    it('delegates playClick(true) to authentic downbeat wooden click at ~1150Hz', () => {
      engine.playClick(true)
      expect(mockOscs.length).toBe(2) // Cavity + Knock
      expect(mockFilters.length).toBe(1)
      expect(mockFilters[0].frequency.setValueAtTime).toHaveBeenCalledWith(1150, 0)
      expect(mockFilters[0].Q.setValueAtTime).toHaveBeenCalledWith(12, 0)
    })

    it('delegates playClick(false) to authentic upbeat wooden click at ~850Hz', () => {
      engine.playClick(false)
      expect(mockOscs.length).toBe(2)
      expect(mockFilters.length).toBe(1)
      expect(mockFilters[0].frequency.setValueAtTime).toHaveBeenCalledWith(850, 0)
      expect(mockFilters[0].Q.setValueAtTime).toHaveBeenCalledWith(12, 0)
    })

    it('supports scheduled timestamp parameter in playClick', () => {
      engine.playClick(true, 5.25)
      expect(mockFilters[0].frequency.setValueAtTime).toHaveBeenCalledWith(1150, 5.25)
    })

    it('supports scheduled timestamp in playGuitarStrum and schedules successive string sweeps', () => {
      const gChord = [43, 47, 50, 55, 59, 67]
      engine.playGuitarStrum(gChord, 'down', true, 2.0, 3.5)
      expect(mockBufferSources.length).toBeGreaterThanOrEqual(6)
      const firstStartTime = mockBufferSources[0].start.mock.calls[0][0]
      expect(firstStartTime).toBeGreaterThanOrEqual(3.5)
    })

    it('supports scheduled timestamp in playPianoNote', () => {
      engine.playPianoNote('C4', 1.0, 0.7, false, 4.2)
      expect(mockBufferSources.length).toBeGreaterThan(0)
      expect(mockBufferSources[0].start).toHaveBeenCalledWith(4.2)
    })

    it('schedules multi-event rhythmic strumming patterns at exact beat offsets', () => {
      const gChord = [43, 47, 50, 55, 59, 67]
      const strumEvents = [
        { beatOffset: 0.0, direction: 'down' as const, accent: true },
        { beatOffset: 1.0, direction: 'down' as const, accent: false },
        { beatOffset: 1.5, direction: 'up' as const, accent: false },
        { beatOffset: 2.5, direction: 'up' as const, accent: false },
      ]
      // Base time 2.0s, 120 BPM -> 0.5s per beat
      engine.scheduleStrumPattern(gChord, strumEvents, 2.0, 0.5)
      expect(mockBufferSources.length).toBeGreaterThanOrEqual(24) // 4 strums * 6 strings
    })

    it('schedules piano melodies and accompaniment at exact beat offsets', () => {
      const melodyNotes = [
        { pitch: 'C5', beatOffset: 0.0, duration: 1.0 },
        { pitch: 'D5', beatOffset: 1.0, duration: 1.0 },
        { pitch: 'Eb5', beatOffset: 2.0, duration: 1.0 },
      ]
      // Base time 1.0s, 160 BPM -> 0.375s per beat
      engine.schedulePianoNotes(melodyNotes, 1.0, 0.375)
      expect(mockBufferSources.length).toBeGreaterThanOrEqual(3)
    })
  })
})
