export type GuitarTabVoicing = {
  frets: (number | null)[] // [E2, A2, D3, G3, B3, E4]
  fingering: string
  fingers?: (number | null | string)[]
  barreFret?: number
  baseFret?: number
  strings: string
}

/**
 * Parses a guitar fingering string (e.g. '2-1-0-0-3-4', 'x-3-2-0-1-0', 'x 3 2 0 1 0', 'T-x-0-1-3-2')
 * into a structured 6-element array of finger assignments (1-4, 'T') or null for open/muted strings.
 */
export function parseFingeringString(fingering: string): (number | string | null)[] {
  if (!fingering || typeof fingering !== 'string') {
    return [null, null, null, null, null, null]
  }

  const trimmed = fingering.trim()
  let tokens: string[]

  if (/[-/\s,]/.test(trimmed)) {
    tokens = trimmed.split(/[-/\s,]+/).filter((t) => t.length > 0)
  } else {
    tokens = trimmed.split('')
  }

  const result: (number | string | null)[] = []
  for (let i = 0; i < 6; i++) {
    const rawToken = tokens[i]?.trim()
    const token = rawToken?.toLowerCase()
    if (!token || token === 'x' || token === '0' || token === '-' || token === '.') {
      result.push(null)
    } else if (token === 't') {
      result.push('T')
    } else {
      const num = parseInt(token, 10)
      if (!isNaN(num) && num >= 1 && num <= 4) {
        result.push(num)
      } else {
        result.push(null)
      }
    }
  }

  return result
}

export type PianoVoicing = {
  lhNotes: string[]
  rhNotes: string[]
  lhPitches: number[]
  rhPitches: number[]
}

export type PitchSpellingItem = {
  note: string
  role: string
}

export type VoicingDefinition = {
  chordName: string
  root: string
  quality: string
  expectedPitches: number[]
  pitchClasses: number[]
  guitarTab: GuitarTabVoicing
  pianoVoicing: PianoVoicing
  pitchSpelling: PitchSpellingItem[]
}

const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  DB: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  EB: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  GB: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  AB: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  BB: 10,
  B: 11,
}

const PITCH_CLASS_TO_NOTE_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const PITCH_CLASS_TO_NOTE_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  maj: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  min7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  '7sus4': [0, 5, 7, 10],
  maj9: [0, 4, 7, 11, 14],
  '9': [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
}

// Standard guitar string MIDI numbers: E2(40), A2(45), D3(50), G3(55), B3(59), E4(64)
const GUITAR_STRING_MIDI = [40, 45, 50, 55, 59, 64]

/**
 * Standard chord fret dictionary for common guitar voicings.
 */
export const STANDARD_GUITAR_VOICINGS: Record<string, GuitarTabVoicing> = {
  C: {
    frets: [null, 3, 2, 0, 1, 0],
    fingering: 'x-3-2-0-1-0',
    fingers: [null, 3, 2, null, 1, null],
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  D: {
    frets: [null, null, 0, 2, 3, 2],
    fingering: 'x-x-0-1-3-2',
    fingers: [null, null, null, 1, 3, 2],
    baseFret: 1,
    strings: 'x-x-D-G-B-e',
  },
  E: {
    frets: [0, 2, 2, 1, 0, 0],
    fingering: '0-2-3-1-0-0',
    fingers: [null, 2, 3, 1, null, null],
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  Em: {
    frets: [0, 2, 2, 0, 0, 0],
    fingering: '0-2-3-0-0-0',
    fingers: [null, 2, 3, null, null, null],
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  F: {
    frets: [1, 3, 3, 2, 1, 1],
    fingering: '1-3-4-2-1-1',
    fingers: [1, 3, 4, 2, 1, 1],
    barreFret: 1,
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  G: {
    frets: [3, 2, 0, 0, 3, 3],
    fingering: '2-1-0-0-3-4',
    fingers: [2, 1, null, null, 3, 4],
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  G_folk: {
    frets: [3, 2, 0, 0, 0, 3],
    fingering: '2-1-0-0-0-3',
    fingers: [2, 1, null, null, null, 3],
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  Gfolk: {
    frets: [3, 2, 0, 0, 0, 3],
    fingering: '2-1-0-0-0-3',
    fingers: [2, 1, null, null, null, 3],
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  G3: {
    frets: [3, 2, 0, 0, 0, 3],
    fingering: '2-1-0-0-0-3',
    fingers: [2, 1, null, null, null, 3],
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  A: {
    frets: [null, 0, 2, 2, 2, 0],
    fingering: 'x-0-1-2-3-0',
    fingers: [null, null, 1, 2, 3, null],
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  Am: {
    frets: [null, 0, 2, 2, 1, 0],
    fingering: 'x-0-2-3-1-0',
    fingers: [null, null, 2, 3, 1, null],
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  B: {
    frets: [null, 2, 4, 4, 4, 2],
    fingering: 'x-1-2-3-4-1',
    fingers: [null, 1, 2, 3, 4, 1],
    barreFret: 2,
    baseFret: 2,
    strings: 'x-A-D-G-B-e',
  },
  Bm: {
    frets: [null, 2, 4, 4, 3, 2],
    fingering: 'x-1-3-4-2-1',
    fingers: [null, 1, 3, 4, 2, 1],
    barreFret: 2,
    baseFret: 2,
    strings: 'x-A-D-G-B-e',
  },
  Dm: {
    frets: [null, null, 0, 2, 3, 1],
    fingering: 'x-x-0-2-3-1',
    fingers: [null, null, null, 2, 3, 1],
    baseFret: 1,
    strings: 'x-x-D-G-B-e',
  },
  Cmaj7: {
    frets: [null, 3, 2, 0, 0, 0],
    fingering: 'x-3-2-0-0-0',
    fingers: [null, 3, 2, null, null, null],
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  Cm: {
    frets: [null, 3, 5, 5, 4, 3],
    fingering: 'x-1-3-4-2-1',
    fingers: [null, 1, 3, 4, 2, 1],
    barreFret: 3,
    baseFret: 3,
    strings: 'x-A-D-G-B-e',
  },
  Fm: {
    frets: [1, 3, 3, 1, 1, 1],
    fingering: '1-3-4-1-1-1',
    fingers: [1, 3, 4, 1, 1, 1],
    barreFret: 1,
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  G7: {
    frets: [3, 2, 0, 0, 0, 1],
    fingering: '3-2-0-0-0-1',
    fingers: [3, 2, null, null, null, 1],
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  A7: {
    frets: [null, 0, 2, 0, 2, 0],
    fingering: 'x-0-2-0-3-0',
    fingers: [null, null, 2, null, 3, null],
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  Dm7: {
    frets: [null, null, 0, 2, 1, 1],
    fingering: 'x-x-0-2-1-1',
    fingers: [null, null, null, 2, 1, 1],
    barreFret: 1,
    baseFret: 1,
    strings: 'x-x-D-G-B-e',
  },
  B7: {
    frets: [null, 2, 1, 2, 0, 2],
    fingering: 'x-2-1-3-0-4',
    fingers: [null, 2, 1, 3, null, 4],
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  Eb: {
    frets: [null, null, 1, 3, 4, 3],
    fingering: 'x-x-1-3-4-2',
    fingers: [null, null, 1, 3, 4, 2],
    baseFret: 1,
    strings: 'x-x-D-G-B-e',
  },
  Ab: {
    frets: [4, 6, 6, 5, 4, 4],
    fingering: '1-3-4-2-1-1',
    fingers: [1, 3, 4, 2, 1, 1],
    barreFret: 4,
    baseFret: 4,
    strings: 'E-A-D-G-B-e',
  },
  Bb: {
    frets: [null, 1, 3, 3, 3, 1],
    fingering: 'x-1-2-3-4-1',
    fingers: [null, 1, 2, 3, 4, 1],
    barreFret: 1,
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  Bb7: {
    frets: [null, 1, 3, 1, 3, 1],
    fingering: 'x-1-3-1-4-1',
    fingers: [null, 1, 3, 1, 4, 1],
    barreFret: 1,
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  Gmaj7: {
    frets: [3, null, 0, 0, 0, 2],
    fingering: '2-x-0-0-0-1',
    fingers: [2, null, null, null, null, 1],
    baseFret: 1,
    strings: 'E-x-D-G-B-e',
  },
  Dmaj7: {
    frets: [null, null, 0, 2, 2, 2],
    fingering: 'x-x-0-1-1-1',
    fingers: [null, null, null, 1, 1, 1],
    barreFret: 2,
    baseFret: 1,
    strings: 'x-x-D-G-B-e',
  },
  Gm: {
    frets: [3, 5, 5, 3, 3, 3],
    fingering: '1-3-4-1-1-1',
    fingers: [1, 3, 4, 1, 1, 1],
    barreFret: 3,
    baseFret: 3,
    strings: 'E-A-D-G-B-e',
  },
  E7: {
    frets: [0, 2, 0, 1, 0, 0],
    fingering: '0-2-0-1-0-0',
    fingers: [null, 2, null, 1, null, null],
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  D7: {
    frets: [null, null, 0, 2, 1, 2],
    fingering: 'x-x-0-2-1-3',
    fingers: [null, null, null, 2, 1, 3],
    baseFret: 1,
    strings: 'x-x-D-G-B-e',
  },
  C7: {
    frets: [null, 3, 2, 3, 1, 0],
    fingering: 'x-3-2-4-1-0',
    fingers: [null, 3, 2, 4, 1, null],
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  Cm7: {
    frets: [null, 3, 5, 3, 4, 3],
    fingering: 'x-1-3-1-2-1',
    fingers: [null, 1, 3, 1, 2, 1],
    barreFret: 3,
    baseFret: 3,
    strings: 'x-A-D-G-B-e',
  },
  F7: {
    frets: [1, 3, 1, 2, 1, 1],
    fingering: '1-3-1-2-1-1',
    fingers: [1, 3, 1, 2, 1, 1],
    barreFret: 1,
    baseFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  Bbmaj7: {
    frets: [null, 1, 3, 2, 3, 1],
    fingering: 'x-1-3-2-4-1',
    fingers: [null, 1, 3, 2, 4, 1],
    barreFret: 1,
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
  Ebmaj7: {
    frets: [null, null, 1, 3, 3, 3],
    fingering: 'x-x-1-2-3-4',
    fingers: [null, null, 1, 2, 3, 4],
    baseFret: 1,
    strings: 'x-x-D-G-B-e',
  },
  Am7b5: {
    frets: [null, 0, 1, 0, 1, null],
    fingering: 'x-0-1-0-2-x',
    fingers: [null, null, 1, null, 2, null],
    baseFret: 1,
    strings: 'x-A-D-G-B-x',
  },
  Bm7: {
    frets: [null, 2, 4, 2, 3, 2],
    fingering: 'x-1-3-1-2-1',
    fingers: [null, 1, 3, 1, 2, 1],
    barreFret: 2,
    baseFret: 2,
    strings: 'x-A-D-G-B-e',
  },
  Dmaj9: {
    frets: [null, null, 0, 2, 2, 0],
    fingering: 'x-x-0-1-2-0',
    fingers: [null, null, null, 1, 2, null],
    baseFret: 1,
    strings: 'x-x-D-G-B-e',
  },
  A7sus4: {
    frets: [null, 0, 2, 0, 3, 0],
    fingering: 'x-0-2-0-3-0',
    fingers: [null, null, 2, null, 3, null],
    baseFret: 1,
    strings: 'x-A-D-G-B-e',
  },
}

function parseRootAndQuality(chordName: string): { root: string; quality: string } {
  const match = chordName.match(/^([A-Ga-g][#b]?)(.*)$/)
  if (!match) {
    return { root: 'C', quality: '' }
  }
  const letter = match[1][0].toUpperCase()
  const accidental = match[1].slice(1).toLowerCase()
  const root = `${letter}${accidental}`
  const quality = match[2] || ''
  return { root, quality }
}

/**
 * Resolves complete chord voicing information including guitar tabs, piano voicings,
 * expected MIDI pitches, and pitch spellings.
 */
export function resolveChordVoicing(chordName: string): VoicingDefinition {
  const { root, quality } = parseRootAndQuality(chordName)
  const rootPc = NOTE_TO_PITCH_CLASS[root] ?? 0
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS['']

  // Pitch classes from root + intervals
  const pitchClasses = intervals.map((i) => (rootPc + i) % 12).sort((a, b) => a - b)

  // Guitar Tab lookup or dynamic approximation
  let rawGuitarTab = STANDARD_GUITAR_VOICINGS[chordName]
  if (!rawGuitarTab && (chordName === 'G_folk' || chordName === 'Gfolk' || chordName === 'G-folk' || chordName === 'G3')) {
    rawGuitarTab = STANDARD_GUITAR_VOICINGS['G_folk']
  }

  let guitarTab: GuitarTabVoicing
  if (rawGuitarTab) {
    guitarTab = {
      ...rawGuitarTab,
      fingers: rawGuitarTab.fingers ?? parseFingeringString(rawGuitarTab.fingering),
      baseFret: rawGuitarTab.baseFret ?? 1,
    }
  } else {
    guitarTab = {
      frets: [null, null, 0, null, null, null],
      fingering: 'x-x-0-x-x-x',
      fingers: [null, null, null, null, null, null],
      strings: 'x-x-D-G-B-e',
      baseFret: 1,
    }
    if (quality.includes('m') || quality.includes('min')) {
      guitarTab.barreFret = rootPc
    }
  }

  // Guitar expected MIDI pitches
  const expectedPitches: number[] = []
  guitarTab.frets.forEach((fret, stringIdx) => {
    if (fret !== null) {
      expectedPitches.push(GUITAR_STRING_MIDI[stringIdx] + fret)
    }
  })

  // Piano Voicing: LH root octave (C2-B2) + RH triad (C4-B4)
  const lhRootMidi = 36 + rootPc
  const lhNotes = [`${root}2`]
  const lhPitches = [lhRootMidi]

  const rhNotes: string[] = []
  const rhPitches: number[] = []
  intervals.forEach((semitones) => {
    const midi = 60 + rootPc + semitones
    const pc = midi % 12
    const noteTable = (root.includes('b') || root === 'F') ? PITCH_CLASS_TO_NOTE_FLATS : PITCH_CLASS_TO_NOTE_SHARPS
    const octave = Math.floor(midi / 12) - 1
    rhNotes.push(`${noteTable[pc]}${octave}`)
    rhPitches.push(midi)
  })

  // Pitch spelling table
  const roleNames = ['Root', 'Third', 'Fifth', 'Seventh', 'Ninth']
  const pitchSpelling: PitchSpellingItem[] = intervals.map((_, idx) => {
    const pc = (rootPc + intervals[idx]) % 12
    return {
      note: ((root.includes('b') || root === 'F') ? PITCH_CLASS_TO_NOTE_FLATS : PITCH_CLASS_TO_NOTE_SHARPS)[pc],
      role: roleNames[idx] || 'Extension',
    }
  })

  return {
    chordName,
    root,
    quality,
    expectedPitches: expectedPitches.length > 0 ? expectedPitches : rhPitches,
    pitchClasses,
    guitarTab,
    pianoVoicing: {
      lhNotes,
      rhNotes,
      lhPitches,
      rhPitches,
    },
    pitchSpelling,
  }
}

/**
 * Parses a sequence of chord symbols (e.g. ['D', 'A', 'Bm', 'G']) into full voicing models.
 */
export function parseProgressionSequence(sequence: string[]): VoicingDefinition[] {
  return sequence
    .map((c) => resolveChordVoicing(c.trim()))
    .filter((v) => v.chordName.length > 0)
}
