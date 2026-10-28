import { describe, it, expect } from 'vitest'
import { resolveChordVoicing, parseProgressionSequence } from '../chord-voicings'

describe('resolveChordVoicing', () => {
  it('resolves Bm barre chord accurately with 6-string frets and pitches', () => {
    const voicing = resolveChordVoicing('Bm')
    expect(voicing.chordName).toBe('Bm')
    expect(voicing.guitarTab.frets).toEqual([null, 2, 4, 4, 3, 2])
    expect(voicing.guitarTab.barreFret).toBe(2)
    expect(voicing.pitchClasses).toContain(11) // B
    expect(voicing.pitchClasses).toContain(2)  // D
    expect(voicing.pitchClasses).toContain(6)  // F#
    expect(voicing.pitchSpelling.length).toBeGreaterThanOrEqual(3)
  })

  it('resolves open G major chord accurately', () => {
    const voicing = resolveChordVoicing('G')
    expect(voicing.guitarTab.frets).toEqual([3, 2, 0, 0, 3, 3])
    expect(voicing.pitchClasses).toEqual([2, 7, 11]) // D, G, B
  })

  it('resolves D major, A major, and C major chords', () => {
    const dVoicing = resolveChordVoicing('D')
    expect(dVoicing.guitarTab.frets).toEqual([null, null, 0, 2, 3, 2])
    expect(dVoicing.pitchClasses).toContain(2) // D
    expect(dVoicing.pitchClasses).toContain(6) // F#
    expect(dVoicing.pitchClasses).toContain(9) // A

    const aVoicing = resolveChordVoicing('A')
    expect(aVoicing.guitarTab.frets).toEqual([null, 0, 2, 2, 2, 0])

    const cVoicing = resolveChordVoicing('C')
    expect(cVoicing.guitarTab.frets).toEqual([null, 3, 2, 0, 1, 0])
  })

  it('parses arbitrary progression sequences into chained voicings', () => {
    const prog = parseProgressionSequence(['D', 'A', 'Bm', 'G'])
    expect(prog).toHaveLength(4)
    expect(prog.map((p) => p.chordName)).toEqual(['D', 'A', 'Bm', 'G'])
  })
})
