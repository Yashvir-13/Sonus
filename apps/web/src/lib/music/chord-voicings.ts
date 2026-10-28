export type GuitarTabVoicing = {
  frets: (number | null)[] // [E2, A2, D3, G3, B3, E4]
  fingering: string
  barreFret?: number
  strings: string
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
  DB: 1,
  D: 2,
  'D#': 3,
  EB: 3,
  E: 4,
  F: 5,
  'F#': 6,
  GB: 6,
  G: 7,
  'G#': 8,
  AB: 8,
  A: 9,
  'A#': 10,
  BB: 10,
  B: 11,
}

const PITCH_CLASS_TO_NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  maj: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  min7: [0, 3, 7, 10],
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
const STANDARD_GUITAR_VOICINGS: Record<string, GuitarTabVoicing> = {
  C: {
    frets: [null, 3, 2, 0, 1, 0],
    fingering: 'x-3-2-0-1-0',
    strings: 'x-A-D-G-B-e',
  },
  D: {
    frets: [null, null, 0, 2, 3, 2],
    fingering: 'x-x-0-1-3-2',
    strings: 'x-x-D-G-B-e',
  },
  E: {
    frets: [0, 2, 2, 1, 0, 0],
    fingering: '0-2-3-1-0-0',
    strings: 'E-A-D-G-B-e',
  },
  Em: {
    frets: [0, 2, 2, 0, 0, 0],
    fingering: '0-2-3-0-0-0',
    strings: 'E-A-D-G-B-e',
  },
  F: {
    frets: [1, 3, 3, 2, 1, 1],
    fingering: '1-3-4-2-1-1',
    barreFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  G: {
    frets: [3, 2, 0, 0, 3, 3],
    fingering: '2-1-0-0-3-4',
    strings: 'E-A-D-G-B-e',
  },
  A: {
    frets: [null, 0, 2, 2, 2, 0],
    fingering: 'x-0-1-2-3-0',
    strings: 'x-A-D-G-B-e',
  },
  Am: {
    frets: [null, 0, 2, 2, 1, 0],
    fingering: 'x-0-2-3-1-0',
    strings: 'x-A-D-G-B-e',
  },
  B: {
    frets: [null, 2, 4, 4, 4, 2],
    fingering: 'x-1-2-3-4-1',
    barreFret: 2,
    strings: 'x-A-D-G-B-e',
  },
  Bm: {
    frets: [null, 2, 4, 4, 3, 2],
    fingering: 'x-1-3-4-2-1',
    barreFret: 2,
    strings: 'x-A-D-G-B-e',
  },
  Dm: {
    frets: [null, null, 0, 2, 3, 1],
    fingering: 'x-x-0-2-3-1',
    strings: 'x-x-D-G-B-e',
  },
  Cmaj7: {
    frets: [null, 3, 2, 0, 0, 0],
    fingering: 'x-3-2-0-0-0',
    strings: 'x-A-D-G-B-e',
  },
  Cm: {
    frets: [null, 3, 5, 5, 4, 3],
    fingering: 'x-1-3-4-2-1',
    barreFret: 3,
    strings: 'x-A-D-G-B-e',
  },
  Fm: {
    frets: [1, 3, 3, 1, 1, 1],
    fingering: '1-3-4-1-1-1',
    barreFret: 1,
    strings: 'E-A-D-G-B-e',
  },
  G7: {
    frets: [3, 2, 0, 0, 0, 1],
    fingering: '3-2-0-0-0-1',
    strings: 'E-A-D-G-B-e',
  },
  A7: {
    frets: [null, 0, 2, 0, 2, 0],
    fingering: 'x-0-2-0-3-0',
    strings: 'x-A-D-G-B-e',
  },
  Dm7: {
    frets: [null, null, 0, 2, 1, 1],
    fingering: 'x-x-0-2-1-1',
    barreFret: 1,
    strings: 'x-x-D-G-B-e',
  },
}

function parseRootAndQuality(chordName: string): { root: string; quality: string } {
  const match = chordName.match(/^([A-Ga-g][#b]?)(.*)$/)
  if (!match) {
    return { root: 'C', quality: '' }
  }
  const root = match[1].toUpperCase()
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
  let guitarTab = STANDARD_GUITAR_VOICINGS[chordName]
  if (!guitarTab) {
    guitarTab = {
      frets: [null, null, 0, null, null, null],
      fingering: 'x-x-0-x-x-x',
      strings: 'x-x-D-G-B-e',
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
    rhNotes.push(`${PITCH_CLASS_TO_NOTE[pc]}4`)
    rhPitches.push(midi)
  })

  // Pitch spelling table
  const roleNames = ['Root', 'Third', 'Fifth', 'Seventh', 'Ninth']
  const pitchSpelling: PitchSpellingItem[] = intervals.map((_, idx) => {
    const pc = (rootPc + intervals[idx]) % 12
    return {
      note: PITCH_CLASS_TO_NOTE[pc],
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
