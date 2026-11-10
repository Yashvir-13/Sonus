/**
 * Music Theory Lexicon & Comprehensive Chord/Scale Compendium
 *
 * Provides complete diatonic, pentatonic, modal, chromatic, triad, 7th,
 * and extended chord voicings for guitar and piano.
 */

import type { GuitarTabVoicing, PianoVoicing } from './chord-voicings'

export type TheoryCategory = 'triads' | 'sevenths' | 'extended' | 'scales'

export interface TheoryEntry {
  id: string
  root: string
  name: string
  symbol: string
  category: TheoryCategory
  formula: string
  intervals: string[]
  notes: string[]
  description: string
  mood: string
  pianoMidi: number[]
  guitarVoicing: GuitarTabVoicing
  pianoVoicing: PianoVoicing
}

export const THEORY_ROOTS = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const

export type TheoryRoot = (typeof THEORY_ROOTS)[number]

const SEMITONE_MAP: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

export function getNoteByInterval(root: string, semitones: number): string {
  const rootIdx = SEMITONE_MAP[root] ?? 0
  const targetIdx = (rootIdx + semitones) % 12
  return CHROMATIC_SCALE[targetIdx]!
}

export interface PatternTemplate {
  name: string
  symbol: string
  category: TheoryCategory
  formula: string
  intervals: string[]
  semitones: number[]
  description: string
  mood: string
  guitarOffsets: (number | null)[]
  guitarFingering: string
}

export const PATTERN_TEMPLATES: PatternTemplate[] = [
  // ─── TRIADS ─────────────────────────────────────────────────────────────
  {
    name: 'Major',
    symbol: '',
    category: 'triads',
    formula: '1 - 3 - 5',
    intervals: ['Root', 'Major 3rd', 'Perfect 5th'],
    semitones: [0, 4, 7],
    description: 'Bright, stable, foundational harmony across classical, folk, and rock.',
    mood: 'Triumphant · Resolute · Open',
    guitarOffsets: [null, 3, 2, 0, 1, 0],
    guitarFingering: 'x 3 2 0 1 0',
  },
  {
    name: 'Minor',
    symbol: 'm',
    category: 'triads',
    formula: '1 - b3 - 5',
    intervals: ['Root', 'Minor 3rd', 'Perfect 5th'],
    semitones: [0, 3, 7],
    description: 'Emotional, introspective, melancholic foundation of modal music.',
    mood: 'Introspective · Somber · Poignant',
    guitarOffsets: [null, 0, 2, 2, 1, 0],
    guitarFingering: 'x 0 2 2 1 0',
  },
  {
    name: 'Diminished',
    symbol: 'dim',
    category: 'triads',
    formula: '1 - b3 - b5',
    intervals: ['Root', 'Minor 3rd', 'Diminished 5th'],
    semitones: [0, 3, 6],
    description: 'Tense, unstable leading chord resolving to the tonic.',
    mood: 'Tense · Suspenseful · Unsettled',
    guitarOffsets: [null, null, 1, 2, 1, null],
    guitarFingering: 'x x 1 2 1 x',
  },
  {
    name: 'Augmented',
    symbol: 'aug',
    category: 'triads',
    formula: '1 - 3 - #5',
    intervals: ['Root', 'Major 3rd', 'Augmented 5th'],
    semitones: [0, 4, 8],
    description: 'Dreamy, symmetrical whole-tone quality creating suspension and wonder.',
    mood: 'Mysterious · Dreamy · Floating',
    guitarOffsets: [null, 3, 2, 1, 1, null],
    guitarFingering: 'x 3 2 1 1 x',
  },
  {
    name: 'Suspended 2nd',
    symbol: 'sus2',
    category: 'triads',
    formula: '1 - 2 - 5',
    intervals: ['Root', 'Major 2nd', 'Perfect 5th'],
    semitones: [0, 2, 7],
    description: 'Spacious and ambiguous; lacks the defining 3rd.',
    mood: 'Airy · Ethereal · Modern',
    guitarOffsets: [null, 3, 0, 0, 1, 3],
    guitarFingering: 'x 3 0 0 1 4',
  },
  {
    name: 'Suspended 4th',
    symbol: 'sus4',
    category: 'triads',
    formula: '1 - 4 - 5',
    intervals: ['Root', 'Perfect 4th', 'Perfect 5th'],
    semitones: [0, 5, 7],
    description: 'Anticipation and urgency, yearning to resolve down to the major 3rd.',
    mood: 'Urgent · Yearning · Anticipatory',
    guitarOffsets: [null, 3, 3, 0, 1, 1],
    guitarFingering: 'x 3 4 0 1 1',
  },

  // ─── 7TH CHORDS ─────────────────────────────────────────────────────────
  {
    name: 'Major 7th',
    symbol: 'maj7',
    category: 'sevenths',
    formula: '1 - 3 - 5 - 7',
    intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Major 7th'],
    semitones: [0, 4, 7, 11],
    description: 'Lush, warm jazz harmony with rich acoustic color and peaceful dissonance.',
    mood: 'Lush · Warm · Sophisticated',
    guitarOffsets: [null, 3, 2, 0, 0, 0],
    guitarFingering: 'x 3 2 0 0 0',
  },
  {
    name: 'Minor 7th',
    symbol: 'm7',
    category: 'sevenths',
    formula: '1 - b3 - 5 - b7',
    intervals: ['Root', 'Minor 3rd', 'Perfect 5th', 'Minor 7th'],
    semitones: [0, 3, 7, 10],
    description: 'Silky, mellow groove harmony essential to neo-soul, R&B, and jazz.',
    mood: 'Smooth · Soulful · Relaxed',
    guitarOffsets: [null, 0, 2, 0, 1, 0],
    guitarFingering: 'x 0 2 0 1 0',
  },
  {
    name: 'Dominant 7th',
    symbol: '7',
    category: 'sevenths',
    formula: '1 - 3 - 5 - b7',
    intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Minor 7th'],
    semitones: [0, 4, 7, 10],
    description: 'Bluesy, driving harmonic engine propelling progressions to resolution.',
    mood: 'Gritty · Driving · Bluesy',
    guitarOffsets: [null, 3, 2, 3, 1, 0],
    guitarFingering: 'x 3 2 4 1 0',
  },
  {
    name: 'Diminished 7th',
    symbol: 'dim7',
    category: 'sevenths',
    formula: '1 - b3 - b5 - bb7',
    intervals: ['Root', 'Minor 3rd', 'Diminished 5th', 'Diminished 7th'],
    semitones: [0, 3, 6, 9],
    description: 'Fully symmetrical minor-third stack with dramatic, haunting chromatic tension.',
    mood: 'Dramatic · Haunting · Noir',
    guitarOffsets: [null, null, 1, 2, 1, 2],
    guitarFingering: 'x x 1 3 2 4',
  },
  {
    name: 'Half-Diminished',
    symbol: 'm7b5',
    category: 'sevenths',
    formula: '1 - b3 - b5 - b7',
    intervals: ['Root', 'Minor 3rd', 'Diminished 5th', 'Minor 7th'],
    semitones: [0, 3, 6, 10],
    description: 'The definitive minor ii-V-I pivot chord in jazz and romantic classical.',
    mood: 'Poignant · Cinematic · Bittersweet',
    guitarOffsets: [null, null, 1, 2, 1, 1],
    guitarFingering: 'x x 1 3 2 2',
  },
  {
    name: 'Minor-Major 7th',
    symbol: 'mMaj7',
    category: 'sevenths',
    formula: '1 - b3 - 5 - 7',
    intervals: ['Root', 'Minor 3rd', 'Perfect 5th', 'Major 7th'],
    semitones: [0, 3, 7, 11],
    description: 'The iconic James Bond spy chord; eerie, mysterious, and tense.',
    mood: 'Eerie · Spy-Noir · Complex',
    guitarOffsets: [null, 3, 1, 0, 0, null],
    guitarFingering: 'x 3 1 0 0 x',
  },

  // ─── EXTENDED & ALTERED ─────────────────────────────────────────────────
  {
    name: 'Dominant 9th',
    symbol: '9',
    category: 'extended',
    formula: '1 - 3 - 5 - b7 - 9',
    intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Minor 7th', 'Major 9th'],
    semitones: [0, 4, 7, 10, 14],
    description: 'Funky, buoyant extension adding color without muddiness.',
    mood: 'Funky · Upbeat · Bright',
    guitarOffsets: [null, 3, 2, 3, 3, null],
    guitarFingering: 'x 2 1 3 3 x',
  },
  {
    name: 'Major 9th',
    symbol: 'maj9',
    category: 'extended',
    formula: '1 - 3 - 5 - 7 - 9',
    intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Major 7th', 'Major 9th'],
    semitones: [0, 4, 7, 11, 14],
    description: 'Modern ambient harmony, sprawling, shimmering, and cinematic.',
    mood: 'Shimmering · Cinematic · Expansive',
    guitarOffsets: [null, 3, 2, 4, 3, null],
    guitarFingering: 'x 2 1 4 3 x',
  },
  {
    name: 'Minor 9th',
    symbol: 'm9',
    category: 'extended',
    formula: '1 - b3 - 5 - b7 - 9',
    intervals: ['Root', 'Minor 3rd', 'Perfect 5th', 'Minor 7th', 'Major 9th'],
    semitones: [0, 3, 7, 10, 14],
    description: 'Silky smooth jazz chord with delicate warmth and deep introspection.',
    mood: 'Deep · Mellow · Reflective',
    guitarOffsets: [null, 3, 1, 3, 3, null],
    guitarFingering: 'x 2 1 3 4 x',
  },
  {
    name: 'Add9',
    symbol: 'add9',
    category: 'extended',
    formula: '1 - 3 - 5 - 9',
    intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Major 9th'],
    semitones: [0, 4, 7, 14],
    description: 'Signature acoustic singer-songwriter chime; major feel with sparkling 9th.',
    mood: 'Acoustic · Chime · Pastoral',
    guitarOffsets: [null, 3, 2, 0, 3, 0],
    guitarFingering: 'x 2 1 0 3 0',
  },
  {
    name: 'Hendrix 7#9',
    symbol: '7#9',
    category: 'extended',
    formula: '1 - 3 - 5 - b7 - #9',
    intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Minor 7th', 'Augmented 9th'],
    semitones: [0, 4, 7, 10, 15],
    description: 'The psychedelic rock staple; clashes major 3rd and minor 3rd for raw power.',
    mood: 'Electrifying · Aggressive · Psychedelic',
    guitarOffsets: [null, 3, 2, 3, 4, null],
    guitarFingering: 'x 2 1 3 4 x',
  },
  {
    name: 'Dominant 7b9',
    symbol: '7b9',
    category: 'extended',
    formula: '1 - 3 - 5 - b7 - b9',
    intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Minor 7th', 'Minor 9th'],
    semitones: [0, 4, 7, 10, 13],
    description: 'Spanish flamenco and bebop dominant creating strong pull to minor tonic.',
    mood: 'Flamenco · Bebop · Passionate',
    guitarOffsets: [null, 3, 2, 3, 2, null],
    guitarFingering: 'x 2 1 3 1 x',
  },

  // ─── SCALES & MODES ─────────────────────────────────────────────────────
  {
    name: 'Major (Ionian)',
    symbol: 'Major Scale',
    category: 'scales',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    intervals: ['Root', 'Maj 2nd', 'Maj 3rd', 'Perf 4th', 'Perf 5th', 'Maj 6th', 'Maj 7th'],
    semitones: [0, 2, 4, 5, 7, 9, 11],
    description: 'Standard diatonic major scale; bright, balanced, and consonant.',
    mood: 'Pure · Heroic · Bright',
    guitarOffsets: [null, 3, 2, 0, 1, 0],
    guitarFingering: 'x 3 2 0 1 0',
  },
  {
    name: 'Dorian',
    symbol: 'Dorian Mode',
    category: 'scales',
    formula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    intervals: ['Root', 'Maj 2nd', 'Min 3rd', 'Perf 4th', 'Perf 5th', 'Maj 6th', 'Min 7th'],
    semitones: [0, 2, 3, 5, 7, 9, 10],
    description: 'Minor mode with a bright natural 6th. The sound of Carlos Santana and Miles Davis.',
    mood: 'Jazzy · Hopeful Minor · Celtic',
    guitarOffsets: [null, 0, 2, 0, 1, 2],
    guitarFingering: 'x 0 2 0 1 3',
  },
  {
    name: 'Phrygian',
    symbol: 'Phrygian Mode',
    category: 'scales',
    formula: '1 - b2 - b3 - 4 - 5 - b6 - b7',
    intervals: ['Root', 'Min 2nd', 'Min 3rd', 'Perf 4th', 'Perf 5th', 'Min 6th', 'Min 7th'],
    semitones: [0, 1, 3, 5, 7, 8, 10],
    description: 'Dark, exotic Spanish flavor defined by the half-step minor second.',
    mood: 'Exotic · Spanish · Intense',
    guitarOffsets: [0, 2, 2, 0, 0, 0],
    guitarFingering: '0 2 3 0 0 0',
  },
  {
    name: 'Lydian',
    symbol: 'Lydian Mode',
    category: 'scales',
    formula: '1 - 2 - 3 - #4 - 5 - 6 - 7',
    intervals: ['Root', 'Maj 2nd', 'Maj 3rd', 'Aug 4th', 'Perf 5th', 'Maj 6th', 'Maj 7th'],
    semitones: [0, 2, 4, 6, 7, 9, 11],
    description: 'Ethereal, mystical major mode with raised 4th. Used heavily in film scores.',
    mood: 'Mystical · Wonder · Space',
    guitarOffsets: [null, 3, 4, 4, 3, null],
    guitarFingering: 'x 1 3 3 2 x',
  },
  {
    name: 'Mixolydian',
    symbol: 'Mixolydian Mode',
    category: 'scales',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    intervals: ['Root', 'Maj 2nd', 'Maj 3rd', 'Perf 4th', 'Perf 5th', 'Maj 6th', 'Min 7th'],
    semitones: [0, 2, 4, 5, 7, 9, 10],
    description: 'Classic rock and blues mode; major feel with a relaxed flattened 7th.',
    mood: 'Bluesy · Classic Rock · Groovy',
    guitarOffsets: [3, 2, 0, 0, 0, 1],
    guitarFingering: '3 2 0 0 0 1',
  },
  {
    name: 'Natural Minor (Aeolian)',
    symbol: 'Minor Scale',
    category: 'scales',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    intervals: ['Root', 'Maj 2nd', 'Min 3rd', 'Perf 4th', 'Perf 5th', 'Min 6th', 'Min 7th'],
    semitones: [0, 2, 3, 5, 7, 8, 10],
    description: 'The foundation of minor key harmony, brooding, melancholy, and expressive.',
    mood: 'Brooding · Melancholy · Expressive',
    guitarOffsets: [null, 0, 2, 2, 1, 0],
    guitarFingering: 'x 0 2 2 1 0',
  },
  {
    name: 'Minor Pentatonic',
    symbol: 'm Pentatonic',
    category: 'scales',
    formula: '1 - b3 - 4 - 5 - b7',
    intervals: ['Root', 'Min 3rd', 'Perf 4th', 'Perf 5th', 'Min 7th'],
    semitones: [0, 3, 5, 7, 10],
    description: 'The five-note cornerstone of electric guitar solos, blues, and hard rock.',
    mood: 'Electrifying · Universal · Gritty',
    guitarOffsets: [null, 0, 2, 2, 1, 0],
    guitarFingering: 'x 0 2 2 1 0',
  },
  {
    name: 'Major Pentatonic',
    symbol: 'Maj Pentatonic',
    category: 'scales',
    formula: '1 - 2 - 3 - 5 - 6',
    intervals: ['Root', 'Maj 2nd', 'Maj 3rd', 'Perf 5th', 'Maj 6th'],
    semitones: [0, 2, 4, 7, 9],
    description: 'Sweet, soulful five-note scale with zero dissonant half-steps.',
    mood: 'Sweet · Soulful · Carefree',
    guitarOffsets: [null, 3, 2, 0, 1, 0],
    guitarFingering: 'x 3 2 0 1 0',
  },
  {
    name: 'Blues Scale',
    symbol: 'Blues',
    category: 'scales',
    formula: '1 - b3 - 4 - b5 - 5 - b7',
    intervals: ['Root', 'Min 3rd', 'Perf 4th', 'Dim 5th (Blue Note)', 'Perf 5th', 'Min 7th'],
    semitones: [0, 3, 5, 6, 7, 10],
    description: 'Minor pentatonic amplified by the raw tension of the tritone "blue note".',
    mood: 'Raw · Stinging · Authentic Blues',
    guitarOffsets: [null, 0, 1, 2, 1, 0],
    guitarFingering: 'x 0 1 2 1 0',
  },
  {
    name: 'Harmonic Minor',
    symbol: 'Harmonic Min',
    category: 'scales',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
    intervals: ['Root', 'Maj 2nd', 'Min 3rd', 'Perf 4th', 'Perf 5th', 'Min 6th', 'Maj 7th'],
    semitones: [0, 2, 3, 5, 7, 8, 11],
    description: 'Classical neoclassical scale with dramatic augmented 2nd interval.',
    mood: 'Neoclassical · Dramatic · Middle-Eastern',
    guitarOffsets: [null, 0, 2, 2, 1, 4],
    guitarFingering: 'x 0 2 2 1 4',
  },
  {
    name: 'Whole Tone',
    symbol: 'Whole Tone',
    category: 'scales',
    formula: '1 - 2 - 3 - #4 - #5 - b7',
    intervals: ['Root', 'Maj 2nd', 'Maj 3rd', 'Aug 4th', 'Aug 5th', 'Min 7th'],
    semitones: [0, 2, 4, 6, 8, 10],
    description: 'Symmetrical dream scale of Debussy and impressionism; creates weightlessness.',
    mood: 'Dreamlike · Weightless · Impressionist',
    guitarOffsets: [null, 3, 2, 1, 2, null],
    guitarFingering: 'x 3 2 1 2 x',
  },
  {
    name: 'Chromatic',
    symbol: 'Chromatic',
    category: 'scales',
    formula: 'All 12 Semitones',
    intervals: ['All 12 Pitches'],
    semitones: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    description: 'Complete 12-tone total spectrum used for transitions and virtuoso runs.',
    mood: 'Infinite · Virtuosic · Fluid',
    guitarOffsets: [0, 1, 2, 3, 4, 5],
    guitarFingering: '1 2 3 4 1 2',
  },
]

/**
 * Builds a concrete TheoryEntry for a given Root and PatternTemplate.
 */
export function buildTheoryEntry(root: TheoryRoot, tmpl: PatternTemplate): TheoryEntry {
  const rootMidi = 60 + (SEMITONE_MAP[root] ?? 0) // Middle C base
  const bassMidi = rootMidi - 12

  const notes = tmpl.semitones.map((st) => getNoteByInterval(root, st))
  const pianoMidi = tmpl.semitones.map((st) => rootMidi + st)

  // Split into left hand bass and right hand cluster
  const lhPitches = [bassMidi]
  const rhPitches = pianoMidi.map((m) => (m < 58 ? m + 12 : m))

  // Calculate guitar fret coordinates adjusted for root transpose
  const rootShift = (SEMITONE_MAP[root] ?? 0) - (SEMITONE_MAP['C'] ?? 0)
  const frets = tmpl.guitarOffsets.map((f) => {
    if (f === null) return null
    if (f === 0) return (f + (rootShift > 0 ? rootShift : 0)) % 12
    const shifted = f + rootShift
    return shifted >= 0 ? shifted : shifted + 12
  })

  const minPositiveFret = frets.reduce<number>((min, f) => {
    if (f !== null && f > 0) return Math.min(min, f)
    return min
  }, 99)
  const baseFret = minPositiveFret <= 3 || minPositiveFret === 99 ? 1 : minPositiveFret

  const symbol = tmpl.symbol ? `${root}${tmpl.symbol}` : `${root} ${tmpl.name}`

  return {
    id: `${root.toLowerCase()}_${tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    root,
    name: `${root} ${tmpl.name}`,
    symbol,
    category: tmpl.category,
    formula: tmpl.formula,
    intervals: tmpl.intervals,
    notes,
    description: tmpl.description,
    mood: tmpl.mood,
    pianoMidi: [bassMidi, ...rhPitches],
    guitarVoicing: {
      frets,
      fingering: tmpl.guitarFingering,
      strings: 'E A D G B E',
      baseFret,
    },
    pianoVoicing: {
      lhNotes: [getNoteByInterval(root, 0)],
      rhNotes: notes,
      lhPitches,
      rhPitches,
    },
  }
}

/**
 * Returns all generated entries for a given root.
 */
export function getTheoryEntriesByRoot(root: TheoryRoot): TheoryEntry[] {
  return PATTERN_TEMPLATES.map((tmpl) => buildTheoryEntry(root, tmpl))
}

/**
 * Returns all generated entries matching a given category.
 */
export function getTheoryEntriesByCategory(category: TheoryCategory, root?: TheoryRoot): TheoryEntry[] {
  const rootsToScan = root ? [root] : THEORY_ROOTS
  const results: TheoryEntry[] = []
  for (const r of rootsToScan) {
    for (const tmpl of PATTERN_TEMPLATES) {
      if (tmpl.category === category) {
        results.push(buildTheoryEntry(r, tmpl))
      }
    }
  }
  return results
}
