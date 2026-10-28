import { describe, it, expect, beforeEach } from 'vitest'
import {
  PracticeAudioEngine,
  parsePitchToMidi,
  midiToFreq,
} from '../practice-audio-engine'

describe('PracticeAudioEngine', () => {
  let engine: PracticeAudioEngine

  beforeEach(() => {
    engine = new PracticeAudioEngine()
  })

  it('converts pitch strings and MIDI numbers accurately', () => {
    expect(parsePitchToMidi('C4')).toBe(60)
    expect(parsePitchToMidi('A4')).toBe(69)
    expect(parsePitchToMidi('D3')).toBe(50)
    expect(parsePitchToMidi('F#3')).toBe(54)
    expect(parsePitchToMidi('Eb5')).toBe(75)
    expect(parsePitchToMidi(64)).toBe(64)
    expect(midiToFreq(69)).toBeCloseTo(440, 2)
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1)
  })

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

  it('runs all acoustic guitar and piano synthesis methods without throwing', () => {
    expect(() => engine.playClick(true)).not.toThrow()
    expect(() => engine.playClick(false)).not.toThrow()

    // Guitar synthesis
    expect(() => engine.playGuitarPluck('E2', 1.5, 0.8)).not.toThrow()
    expect(() => engine.playGuitarStrum(['G2', 'B2', 'D3', 'G3', 'B3', 'G4'], 'down', true, 2.5)).not.toThrow()
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
