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

  it('resolves flat chords like Eb and Bb7 with correct root normalization and voicings', () => {
    const eb = resolveChordVoicing('Eb')
    expect(eb.chordName).toBe('Eb')
    expect(eb.root).toBe('Eb')
    expect(eb.pianoVoicing.lhNotes[0]).toBe('Eb2')
    expect(eb.pitchClasses).toEqual([3, 7, 10]) // Eb, G, Bb
    expect(eb.guitarTab.frets).toEqual([null, null, 1, 3, 4, 3])

    const bb7 = resolveChordVoicing('Bb7')
    expect(bb7.chordName).toBe('Bb7')
    expect(bb7.root).toBe('Bb')
    expect(bb7.pitchClasses).toEqual([2, 5, 8, 10]) // D, F, Ab, Bb
    expect(bb7.guitarTab.frets).toEqual([null, 1, 3, 1, 3, 1])
  })

  it('resolves jazz and extended modal chords (Am7b5, Gmaj7, B7)', () => {
    const am7b5 = resolveChordVoicing('Am7b5')
    expect(am7b5.quality).toBe('m7b5')
    expect(am7b5.pitchClasses).toEqual([0, 3, 7, 9]) // C, Eb, G, A

    const gmaj7 = resolveChordVoicing('Gmaj7')
    expect(gmaj7.pitchClasses).toEqual([2, 6, 7, 11]) // D, F#, G, B
    expect(gmaj7.guitarTab.frets).toEqual([3, null, 0, 0, 0, 2])

    const b7 = resolveChordVoicing('B7')
    expect(b7.guitarTab.frets).toEqual([null, 2, 1, 2, 0, 2])
  })

  it('parses arbitrary progression sequences into chained voicings', () => {
    const prog = parseProgressionSequence(['D', 'A', 'Bm', 'G'])
    expect(prog).toHaveLength(4)
    expect(prog.map((p) => p.chordName)).toEqual(['D', 'A', 'Bm', 'G'])
  })
})
