import { describe, it, expect } from 'vitest'
import {
  getInstrumentStrategy,
  GuitarStrategy,
  PianoStrategy,
} from '../instrument-strategy'
import { MusicalChord } from '../../music/musical-chord'

describe('InstrumentStrategy', () => {
  it('resolves GuitarStrategy for guitar with correct attributes and expected pitches', () => {
    const strategy = getInstrumentStrategy('guitar')
    expect(strategy).toBeInstanceOf(GuitarStrategy)
    expect(strategy.instrument).toBe('guitar')
    expect(strategy.defaultClef).toBe('treble')
    expect(strategy.defaultPrimaryVoicing).toBe('fretboard')
    expect(strategy.supportsWaterfall).toBe(false)
    expect(strategy.supportsTablature).toBe(true)

    const cChord = new MusicalChord('C')
    const pitches = strategy.getExpectedPitches(cChord)
    expect(pitches.length).toBeGreaterThanOrEqual(4)
    pitches.forEach((p) => {
      expect([0, 4, 7]).toContain(p % 12)
    })
  })

  it('resolves PianoStrategy for piano with correct attributes and expected pitches', () => {
    const strategy = getInstrumentStrategy('piano')
    expect(strategy).toBeInstanceOf(PianoStrategy)
    expect(strategy.instrument).toBe('piano')
    expect(strategy.defaultClef).toBe('grand')
    expect(strategy.defaultPrimaryVoicing).toBe('keyboard')
    expect(strategy.supportsWaterfall).toBe(true)
    expect(strategy.supportsTablature).toBe(false)

    const dChord = new MusicalChord('D')
    const pitches = strategy.getExpectedPitches(dChord)
    expect(pitches.length).toBeGreaterThanOrEqual(3)
    pitches.forEach((p) => {
      expect([2, 6, 9]).toContain(p % 12)
    })
  })
})
