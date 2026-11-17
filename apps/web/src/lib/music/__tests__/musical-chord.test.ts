import { describe, it, expect } from 'vitest'
import { MusicalChord } from '../musical-chord'

describe('MusicalChord Domain Class', () => {
  it('parses basic triads and sets pitch classes correctly', () => {
    const cMajor = new MusicalChord('C')
    expect(cMajor.symbol).toBe('C')
    expect(cMajor.root).toBe('C')
    expect(cMajor.notes).toEqual(['C', 'E', 'G'])
    expect(cMajor.pitchClasses).toEqual([0, 4, 7])

    const aMinor = new MusicalChord('Am')
    expect(aMinor.root).toBe('A')
    expect(aMinor.notes).toEqual(['A', 'C', 'E'])
    expect(aMinor.pitchClasses).toEqual([0, 4, 9])
  })

  it('determines enharmonic equivalence across sharp and flat notations', () => {
    const fSharp = new MusicalChord('F#')
    const gFlat = new MusicalChord('Gb')
    expect(fSharp.isEnharmonicallyEquivalent(gFlat)).toBe(true)

    const cSharpMin = new MusicalChord('C#m')
    const dFlatMin = new MusicalChord('Dbm')
    expect(cSharpMin.isEnharmonicallyEquivalent(dFlatMin)).toBe(true)

    const cMajor = new MusicalChord('C')
    expect(cMajor.isEnharmonicallyEquivalent(fSharp)).toBe(false)
  })

  it('eliminates the dummy open D string fallback and generates valid CAGED voicings', () => {
    const abMinor = new MusicalChord('Abm')
    const tab = abMinor.getGuitarVoicing()

    // Must NOT be the dummy fallback [null, null, 0, null, null, null]
    expect(tab.frets).not.toEqual([null, null, 0, null, null, null])
    expect(tab.fingering).not.toBe('x-x-0-x-x-x')

    // Frets should contain actual fretted notes
    const frettedNotes = tab.frets.filter((f): f is number => f !== null)
    expect(frettedNotes.length).toBeGreaterThanOrEqual(4)

    // All sounded pitches must belong to the chord's pitch classes
    const stringMidi = [40, 45, 50, 55, 59, 64]
    tab.frets.forEach((fret, stringIdx) => {
      if (fret !== null) {
        const pitchClass = (stringMidi[stringIdx] + fret) % 12
        expect(abMinor.pitchClasses).toContain(pitchClass)
      }
    })
  })

  it('generates acoustic piano voicings with LH bass and RH chord extensions', () => {
    const cMaj = new MusicalChord('C')
    const piano = cMaj.getPianoVoicing()

    expect(piano.lhNotes[0]).toBe('C2')
    expect(piano.lhPitches[0]).toBe(36)
    expect(piano.rhPitches.length).toBe(3)
    // RH pitches should be around middle C (>= 60)
    piano.rhPitches.forEach((pitch) => {
      expect(pitch).toBeGreaterThanOrEqual(60)
    })
  })

  it('handles slash chords properly (e.g. C/E)', () => {
    const cOverE = new MusicalChord('C/E')
    expect(cOverE.root).toBe('C')
    expect(cOverE.bass).toBe('E')
    expect(cOverE.bassPitchClass).toBe(4) // E
    expect(cOverE.pitchClasses).toEqual([0, 4, 7])

    const piano = cOverE.getPianoVoicing()
    expect(piano.lhNotes[0]).toBe('E2')
    expect(piano.lhPitches[0]).toBe(40)
  })

  it('ensures open and muted strings have null fingers in guitar voicings', () => {
    const eMaj = new MusicalChord('E')
    const tab = eMaj.getGuitarVoicing()
    // Open strings (fret 0) must have null finger
    tab.frets.forEach((fret, idx) => {
      if (fret === 0 || fret === null) {
        expect(tab.fingers?.[idx]).toBeNull()
      }
    })
  })

  it('provides human-readable pitch spelling items', () => {
    const g7 = new MusicalChord('G7')
    const spelling = g7.getPitchSpelling()
    expect(spelling.length).toBeGreaterThanOrEqual(3)
    expect(spelling[0].role).toBe('Root')
  })
})
