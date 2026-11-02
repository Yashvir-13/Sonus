import { describe, it, expect } from 'vitest'
import {
  resolveChordVoicing,
  parseProgressionSequence,
  parseFingeringString,
  STANDARD_GUITAR_VOICINGS,
} from '../chord-voicings'

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

describe('parseFingeringString', () => {
  it('parses 4-finger rock G fingering string into structured finger numbers', () => {
    const fingers = parseFingeringString('2-1-0-0-3-4')
    expect(fingers).toEqual([2, 1, null, null, 3, 4])
  })

  it('parses open C major fingering string with muted string and open strings', () => {
    const fingers = parseFingeringString('x-3-2-0-1-0')
    expect(fingers).toEqual([null, 3, 2, null, 1, null])
  })

  it('parses barre chord fingering strings with index finger barres', () => {
    const bbFingers = parseFingeringString('x-1-2-3-4-1')
    expect(bbFingers).toEqual([null, 1, 2, 3, 4, 1])

    const fFingers = parseFingeringString('1-3-4-2-1-1')
    expect(fFingers).toEqual([1, 3, 4, 2, 1, 1])
  })

  it('parses open D and E major fingering strings', () => {
    expect(parseFingeringString('x-x-0-1-3-2')).toEqual([null, null, null, 1, 3, 2])
    expect(parseFingeringString('0-2-3-1-0-0')).toEqual([null, 2, 3, 1, null, null])
  })

  it('handles thumb "T" notation and alternative delimiters gracefully', () => {
    const thumbFingers = parseFingeringString('T-x-0-2-3-2')
    expect(thumbFingers[0]).toBe('T')
    expect(thumbFingers[1]).toBeNull()

    expect(parseFingeringString('x 3 2 0 1 0')).toEqual([null, 3, 2, null, 1, null])
    expect(parseFingeringString('x,3,2,0,1,0')).toEqual([null, 3, 2, null, 1, null])
  })

  it('handles uppercase X and edge cases without throwing', () => {
    expect(parseFingeringString('X-X-0-2-3-2')).toEqual([null, null, null, 2, 3, 2])
    expect(parseFingeringString('')).toEqual([null, null, null, null, null, null])
    expect(parseFingeringString('invalid-token')).toEqual([null, null, null, null, null, null])
  })
})

describe('Guitar Chord Voicing Accuracy & Fret-Finger Separation', () => {
  it('strictly preserves standard Rock G frets and assigns distinct finger assignments', () => {
    const rockG = resolveChordVoicing('G')
    expect(rockG.guitarTab.frets).toEqual([3, 2, 0, 0, 3, 3])
    expect(rockG.guitarTab.fingers).toEqual([2, 1, null, null, 3, 4])

    // String 6 (low E): Fret 3 is pressed by Finger 2 (Middle) -> Fret 3 !== Finger 2
    expect(rockG.guitarTab.frets[0]).toBe(3)
    expect(rockG.guitarTab.fingers?.[0]).toBe(2)

    // String 5 (A): Fret 2 is pressed by Finger 1 (Index) -> Fret 2 !== Finger 1
    expect(rockG.guitarTab.frets[1]).toBe(2)
    expect(rockG.guitarTab.fingers?.[1]).toBe(1)

    // String 2 (B): Fret 3 is pressed by Finger 3 (Ring) -> Fret 3 === Finger 3
    expect(rockG.guitarTab.frets[4]).toBe(3)
    expect(rockG.guitarTab.fingers?.[4]).toBe(3)

    // String 1 (high e): Fret 3 is pressed by Finger 4 (Pinky) -> Fret 3 !== Finger 4
    expect(rockG.guitarTab.frets[5]).toBe(3)
    expect(rockG.guitarTab.fingers?.[5]).toBe(4)
  })

  it('resolves Folk G (3-finger G) with correct fret and finger separation', () => {
    const folkG = resolveChordVoicing('G_folk')
    expect(folkG.guitarTab.frets).toEqual([3, 2, 0, 0, 0, 3])
    expect(folkG.guitarTab.fingers).toEqual([2, 1, null, null, null, 3])

    // Open B string (index 4) has no finger assigned
    expect(folkG.guitarTab.frets[4]).toBe(0)
    expect(folkG.guitarTab.fingers?.[4]).toBeNull()

    // High e string (index 5) has fret 3 pressed by finger 3 (Ring)
    expect(folkG.guitarTab.frets[5]).toBe(3)
    expect(folkG.guitarTab.fingers?.[5]).toBe(3)
  })
})

describe('Repertoire Chords Expansion (Milestone 1)', () => {
  it('resolves all 8 missing repertoire chords with non-dummy guitar voicings', () => {
    const chords = ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'Bm7', 'Dmaj9', 'A7sus4']

    for (const c of chords) {
      const v = resolveChordVoicing(c)
      expect(v.chordName).toBe(c)
      expect(v.guitarTab.frets).toHaveLength(6)
      const played = v.guitarTab.frets.filter((f) => f !== null)
      expect(played.length).toBeGreaterThanOrEqual(4)
      expect(v.guitarTab.fingers).toHaveLength(6)
    }
  })

  it('verifies specific voicing structures for jazz and neo-soul chords', () => {
    // Cm7: 5th-string root barre at fret 3
    const cm7 = resolveChordVoicing('Cm7')
    expect(cm7.guitarTab.frets).toEqual([null, 3, 5, 3, 4, 3])
    expect(cm7.guitarTab.fingers).toEqual([null, 1, 3, 1, 2, 1])
    expect(cm7.guitarTab.barreFret).toBe(3)
    expect(cm7.guitarTab.baseFret).toBe(3)

    // F7: 6th-string root barre at fret 1
    const f7 = resolveChordVoicing('F7')
    expect(f7.guitarTab.frets).toEqual([1, 3, 1, 2, 1, 1])
    expect(f7.guitarTab.fingers).toEqual([1, 3, 1, 2, 1, 1])
    expect(f7.guitarTab.barreFret).toBe(1)

    // Bbmaj7: 5th-string root barre at fret 1
    const bbmaj7 = resolveChordVoicing('Bbmaj7')
    expect(bbmaj7.guitarTab.frets).toEqual([null, 1, 3, 2, 3, 1])
    expect(bbmaj7.guitarTab.fingers).toEqual([null, 1, 3, 2, 4, 1])
    expect(bbmaj7.guitarTab.barreFret).toBe(1)

    // Ebmaj7: upper cluster
    const ebmaj7 = resolveChordVoicing('Ebmaj7')
    expect(ebmaj7.guitarTab.frets).toEqual([null, null, 1, 3, 3, 3])
    expect(ebmaj7.guitarTab.fingers).toEqual([null, null, 1, 2, 3, 4])

    // Am7b5: jazz shell voicing
    const am7b5 = resolveChordVoicing('Am7b5')
    expect(am7b5.guitarTab.frets).toEqual([null, 0, 1, 0, 1, null])
    expect(am7b5.guitarTab.fingers).toEqual([null, null, 1, null, 2, null])

    // Bm7: 5th-string root barre at fret 2
    const bm7 = resolveChordVoicing('Bm7')
    expect(bm7.guitarTab.frets).toEqual([null, 2, 4, 2, 3, 2])
    expect(bm7.guitarTab.fingers).toEqual([null, 1, 3, 1, 2, 1])
    expect(bm7.guitarTab.barreFret).toBe(2)
    expect(bm7.guitarTab.baseFret).toBe(2)

    // Dmaj9: open neo-soul voicing
    const dmaj9 = resolveChordVoicing('Dmaj9')
    expect(dmaj9.guitarTab.frets).toEqual([null, null, 0, 2, 2, 0])
    expect(dmaj9.guitarTab.fingers).toEqual([null, null, null, 1, 2, null])

    // A7sus4: cowboy sus4
    const a7sus4 = resolveChordVoicing('A7sus4')
    expect(a7sus4.guitarTab.frets).toEqual([null, 0, 2, 0, 3, 0])
    expect(a7sus4.guitarTab.fingers).toEqual([null, null, 2, null, 3, null])
  })

  it('verifies that all dictionary entries in STANDARD_GUITAR_VOICINGS have 6 frets and 6 fingers', () => {
    for (const [key, tab] of Object.entries(STANDARD_GUITAR_VOICINGS)) {
      expect(tab.frets, `Voicing ${key} must have 6 frets`).toHaveLength(6)
      const resolvedFingers = tab.fingers ?? parseFingeringString(tab.fingering)
      expect(resolvedFingers, `Voicing ${key} must resolve to 6 fingers`).toHaveLength(6)

      // Each fretted note (> 0) must have a non-null finger assignment
      tab.frets.forEach((f, idx) => {
        if (f !== null && f > 0) {
          expect(resolvedFingers[idx], `Voicing ${key} string ${idx} at fret ${f} must have finger`).not.toBeNull()
        }
      })
    }
  })
})

describe('Piano Chord Voicing Octave Calculation Accuracy', () => {
  it('correctly computes true octaves for upper triad extensions crossing into octave 5', () => {
    const g = resolveChordVoicing('G')
    // G major: G4 (67), B4 (71), D5 (74)
    expect(g.pianoVoicing.rhNotes).toEqual(['G4', 'B4', 'D5'])
    expect(g.pianoVoicing.rhPitches).toEqual([67, 71, 74])

    const a = resolveChordVoicing('A')
    // A major: A4 (69), C#5 (73), E5 (76)
    expect(a.pianoVoicing.rhNotes).toEqual(['A4', 'C#5', 'E5'])
    expect(a.pianoVoicing.rhPitches).toEqual([69, 73, 76])

    const bm = resolveChordVoicing('Bm')
    // B minor: B4 (71), D5 (74), F#5 (78)
    expect(bm.pianoVoicing.rhNotes).toEqual(['B4', 'D5', 'F#5'])
    expect(bm.pianoVoicing.rhPitches).toEqual([71, 74, 78])

    const dmaj9 = resolveChordVoicing('Dmaj9')
    // Dmaj9 root D4 (62), 9th is E5 (76)
    expect(dmaj9.pianoVoicing.rhNotes[4]).toBe('E5')
  })
})

