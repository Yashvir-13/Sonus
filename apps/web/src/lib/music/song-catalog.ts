import type { ExerciseDto } from '@/api/sessions'
import type { GrandStaffNote, StrumEvent } from '@/components/practice/flowing-notation-stand'

export type FullSongChordItem = {
  name: string
  beat: number
  duration_beats: number
  expected_pitches?: number[]
  guitar_tabs?: {
    frets: Array<number | null>
    strings: string
    fingering?: string
  }
  piano_voicings?: {
    lh_note: string
    rh_notes: string[]
    lh_pitches: number[]
    rh_pitches: number[]
    inversion?: string
  }
  melody_notes?: GrandStaffNote[]
  strum_events?: StrumEvent[]
  section?: string
  variation?: string
}

// ==============================================================================
// 1. GUITAR FULL SONG: Knockin' Cadence (24 Measures, 96 Beats)
// ==============================================================================
function buildKnockinFullSong(): FullSongChordItem[] {
  const chords: FullSongChordItem[] = []
  const sections: Array<{ name: string; strumType: 'ballad' | 'anthem' | 'ringout' }> = [
    { name: 'Verse 1', strumType: 'ballad' },
    { name: 'Chorus', strumType: 'anthem' },
    { name: 'Verse 2 / Outro', strumType: 'ringout' },
  ]

  let beatCursor = 1.0
  for (const sec of sections) {
    const sequence = [
      { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fing: '2-1-0-0-0-3', str: 'E-A-D-G-B-e' },
      { name: 'D', dur: 4, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fing: 'x-x-0-1-3-2', str: 'x-x-D-G-B-e' },
      { name: 'Am', dur: 4, pitches: [45, 52, 57, 60, 64], frets: [null, 0, 2, 2, 1, 0], fing: 'x-0-2-3-1-0', str: 'x-A-D-G-B-e' },
      { name: 'Am', dur: 4, pitches: [45, 52, 57, 60, 64], frets: [null, 0, 2, 2, 1, 0], fing: 'x-0-2-3-1-0', str: 'x-A-D-G-B-e' },
      { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fing: '2-1-0-0-0-3', str: 'E-A-D-G-B-e' },
      { name: 'D', dur: 4, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fing: 'x-x-0-1-3-2', str: 'x-x-D-G-B-e' },
      { name: 'C', dur: 4, pitches: [48, 52, 55, 60, 64], frets: [null, 3, 2, 0, 1, 0], fing: 'x-3-2-0-1-0', str: 'x-A-D-G-B-e' },
      { name: sec.name === 'Verse 2 / Outro' ? 'G' : 'C', dur: 4, pitches: [48, 52, 55, 60, 64], frets: [null, 3, 2, 0, 1, 0], fing: 'x-3-2-0-1-0', str: 'x-A-D-G-B-e' },
    ]

    for (const item of sequence) {
      let strumEvents: StrumEvent[] = []
      if (sec.strumType === 'ballad') {
        strumEvents = [
          { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 1.0, direction: 'down', accent: false, label: 'D' },
          { beatOffset: 2.0, direction: 'down', accent: false, label: 'D' },
          { beatOffset: 2.5, direction: 'up', accent: false, label: 'U' },
          { beatOffset: 3.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 3.5, direction: 'up', accent: false, label: 'U' },
        ]
      } else if (sec.strumType === 'anthem') {
        strumEvents = [
          { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 1.0, direction: 'down', accent: false, label: 'D' },
          { beatOffset: 1.5, direction: 'up', accent: false, label: 'U' },
          { beatOffset: 2.5, direction: 'up', accent: false, label: 'U' },
          { beatOffset: 3.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 3.5, direction: 'up', accent: false, label: 'U' },
        ]
      } else {
        strumEvents = [
          { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 2.0, direction: 'down', accent: false, label: 'D' },
        ]
      }

      chords.push({
        name: item.name,
        beat: beatCursor,
        duration_beats: item.dur,
        expected_pitches: item.pitches,
        guitar_tabs: {
          frets: item.frets,
          strings: item.str,
          fingering: item.fing,
        },
        strum_events: strumEvents,
        section: sec.name,
      })
      beatCursor += item.dur
    }
  }

  return chords
}

// ==============================================================================
// 2. PIANO FULL SONG: Pachelbel's Canon Harmonic Flow (32 Measures, 128 Beats)
// ==============================================================================
function buildPachelbelCanonFullSong(): FullSongChordItem[] {
  const progBase = [
    { name: 'C', lhNote: 'C3', rhNotes: ['E4', 'G4', 'C5'], lhPitches: [48], rhPitches: [64, 67, 72] },
    { name: 'G', lhNote: 'G2', rhNotes: ['D4', 'G4', 'B4'], lhPitches: [43], rhPitches: [62, 67, 71] },
    { name: 'Am', lhNote: 'A2', rhNotes: ['C4', 'E4', 'A4'], lhPitches: [45], rhPitches: [60, 64, 69] },
    { name: 'Em', lhNote: 'E2', rhNotes: ['B3', 'E4', 'G4'], lhPitches: [40], rhPitches: [59, 64, 67] },
    { name: 'F', lhNote: 'F2', rhNotes: ['A3', 'C4', 'F4'], lhPitches: [41], rhPitches: [57, 60, 65] },
    { name: 'C', lhNote: 'C3', rhNotes: ['G3', 'C4', 'E4'], lhPitches: [48], rhPitches: [55, 60, 64] },
    { name: 'F', lhNote: 'F2', rhNotes: ['A3', 'C4', 'F4'], lhPitches: [41], rhPitches: [57, 60, 65] },
    { name: 'G', lhNote: 'G2', rhNotes: ['B3', 'D4', 'G4'], lhPitches: [43], rhPitches: [59, 62, 67] },
  ]

  const melodyVariations: GrandStaffNote[][][] = [
    // Variation 1: Theme Exposition
    [
      [{ pitch: 'E5', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'D5', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'G2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'C5', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'A2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'B4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'E2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'A4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'F2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'G4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'A4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'F2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'B4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'G2', beatOffset: 0, duration: 4, clef: 'bass' }],
    ],
    // Variation 2: Quarter-Note Voice Leading
    [
      [{ pitch: 'E5', beatOffset: 0, duration: 2, clef: 'treble' }, { pitch: 'G4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'D5', beatOffset: 0, duration: 2, clef: 'treble' }, { pitch: 'F4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'G2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'C5', beatOffset: 0, duration: 2, clef: 'treble' }, { pitch: 'E4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'A2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'B4', beatOffset: 0, duration: 2, clef: 'treble' }, { pitch: 'D4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'E2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'A4', beatOffset: 0, duration: 2, clef: 'treble' }, { pitch: 'C4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'F2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'G4', beatOffset: 0, duration: 2, clef: 'treble' }, { pitch: 'B3', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'A4', beatOffset: 0, duration: 2, clef: 'treble' }, { pitch: 'C4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'F2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'B4', beatOffset: 0, duration: 2, clef: 'treble' }, { pitch: 'D4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'G2', beatOffset: 0, duration: 4, clef: 'bass' }],
    ],
    // Variation 3: Running Figurations
    [
      [{ pitch: 'C5', beatOffset: 0, duration: 1, clef: 'treble' }, { pitch: 'D5', beatOffset: 1, duration: 1, clef: 'treble' }, { pitch: 'E5', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'B4', beatOffset: 0, duration: 1, clef: 'treble' }, { pitch: 'C5', beatOffset: 1, duration: 1, clef: 'treble' }, { pitch: 'D5', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'G2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'A4', beatOffset: 0, duration: 1, clef: 'treble' }, { pitch: 'B4', beatOffset: 1, duration: 1, clef: 'treble' }, { pitch: 'C5', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'A2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'G4', beatOffset: 0, duration: 1, clef: 'treble' }, { pitch: 'A4', beatOffset: 1, duration: 1, clef: 'treble' }, { pitch: 'B4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'E2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'F4', beatOffset: 0, duration: 1, clef: 'treble' }, { pitch: 'G4', beatOffset: 1, duration: 1, clef: 'treble' }, { pitch: 'A4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'F2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'E4', beatOffset: 0, duration: 1, clef: 'treble' }, { pitch: 'F4', beatOffset: 1, duration: 1, clef: 'treble' }, { pitch: 'G4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'F4', beatOffset: 0, duration: 1, clef: 'treble' }, { pitch: 'G4', beatOffset: 1, duration: 1, clef: 'treble' }, { pitch: 'A4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'F2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'G4', beatOffset: 0, duration: 1, clef: 'treble' }, { pitch: 'A4', beatOffset: 1, duration: 1, clef: 'treble' }, { pitch: 'B4', beatOffset: 2, duration: 2, clef: 'treble' }, { pitch: 'G2', beatOffset: 0, duration: 4, clef: 'bass' }],
    ],
    // Variation 4: Grand Finale & Cadence
    [
      [{ pitch: 'E5', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'G4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'D5', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'G4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'G2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'C5', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'E4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'A2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'B4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'E4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'E2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'A4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'C4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'F2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'G4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'C4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'A4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'F4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'F2', beatOffset: 0, duration: 4, clef: 'bass' }],
      [{ pitch: 'C5', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'G4', beatOffset: 0, duration: 4, clef: 'treble' }, { pitch: 'C3', beatOffset: 0, duration: 4, clef: 'bass' }],
    ],
  ]

  const chords: FullSongChordItem[] = []
  let beatCursor = 1.0

  for (let varIdx = 0; varIdx < melodyVariations.length; varIdx++) {
    const variationMeasures = melodyVariations[varIdx]
    for (let mIdx = 0; mIdx < progBase.length; mIdx++) {
      const base = progBase[mIdx]
      const notes = variationMeasures[mIdx]
      chords.push({
        name: varIdx === 3 && mIdx === 7 ? 'C' : base.name,
        beat: beatCursor,
        duration_beats: 4.0,
        expected_pitches: [...base.lhPitches, ...base.rhPitches],
        piano_voicings: {
          lh_note: base.lhNote,
          rh_notes: base.rhNotes,
          lh_pitches: base.lhPitches,
          rh_pitches: base.rhPitches,
          inversion: mIdx % 2 === 0 ? 'root position' : '1st inversion',
        },
        melody_notes: notes,
        variation: `Variation ${varIdx + 1}`,
      })
      beatCursor += 4.0
    }
  }

  return chords
}

// ==============================================================================
// 3. GUITAR FULL SONG: Four-Chord Anthem in D (32 Measures, 128 Beats)
// ==============================================================================
function buildFourChordAnthemFullSong(): FullSongChordItem[] {
  const prog = [
    { name: 'D', dur: 4, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fing: 'x-x-0-1-3-2', str: 'x-x-D-G-B-e' },
    { name: 'A', dur: 4, pitches: [45, 52, 57, 61, 64], frets: [null, 0, 2, 2, 2, 0], fing: 'x-0-1-2-3-0', str: 'x-A-D-G-B-e' },
    { name: 'Bm', dur: 4, pitches: [47, 54, 59, 62, 66], frets: [null, 2, 4, 4, 3, 2], fing: 'x-1-3-4-2-1', str: 'x-A-D-G-B-e' },
    { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fing: '2-1-0-0-0-3', str: 'E-A-D-G-B-e' },
  ]

  const sections: Array<{ name: string; reps: number }> = [
    { name: 'Intro', reps: 1 },
    { name: 'Verse 1', reps: 2 },
    { name: 'Pre-Chorus', reps: 2 },
    { name: 'Chorus', reps: 2 },
    { name: 'Outro', reps: 1 },
  ]

  const chords: FullSongChordItem[] = []
  let beatCursor = 1.0

  for (const sec of sections) {
    for (let r = 0; r < sec.reps; r++) {
      let cycle = prog
      if (sec.name === 'Pre-Chorus') {
        cycle = [
          { name: 'Em', dur: 4, pitches: [40, 47, 52, 55, 59, 64], frets: [0, 2, 2, 0, 0, 0], fing: '0-2-3-0-0-0', str: 'E-A-D-G-B-e' },
          { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fing: '2-1-0-0-0-3', str: 'E-A-D-G-B-e' },
          { name: 'D', dur: 4, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fing: 'x-x-0-1-3-2', str: 'x-x-D-G-B-e' },
          { name: 'A', dur: 4, pitches: [45, 52, 57, 61, 64], frets: [null, 0, 2, 2, 2, 0], fing: 'x-0-1-2-3-0', str: 'x-A-D-G-B-e' },
        ]
      }

      for (const item of cycle) {
        const strumEvents: StrumEvent[] = [
          { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 1.0, direction: 'down', accent: false, label: 'D' },
          { beatOffset: 1.5, direction: 'up', accent: false, label: 'U' },
          { beatOffset: 2.5, direction: 'up', accent: false, label: 'U' },
          { beatOffset: 3.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 3.5, direction: 'up', accent: false, label: 'U' },
        ]
        chords.push({
          name: item.name,
          beat: beatCursor,
          duration_beats: item.dur,
          expected_pitches: item.pitches,
          guitar_tabs: {
            frets: item.frets,
            strings: item.str,
            fingering: item.fing,
          },
          strum_events: strumEvents,
          section: sec.name,
        })
        beatCursor += item.dur
      }
    }
  }

  return chords
}

// ==============================================================================
// 4. GUITAR FULL SONG: House of the Rising Sun (24 Measures in 6/8, 144 Beats)
// ==============================================================================
function buildRisingSunFullSong(): FullSongChordItem[] {
  const cycle = [
    { name: 'Am', dur: 6, pitches: [45, 52, 57, 60, 64], frets: [null, 0, 2, 2, 1, 0], fing: 'x-0-2-3-1-0', str: 'x-A-D-G-B-e' },
    { name: 'C', dur: 6, pitches: [48, 52, 55, 60, 64], frets: [null, 3, 2, 0, 1, 0], fing: 'x-3-2-0-1-0', str: 'x-A-D-G-B-e' },
    { name: 'D', dur: 6, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fing: 'x-x-0-1-3-2', str: 'x-x-D-G-B-e' },
    { name: 'F', dur: 6, pitches: [41, 48, 53, 57, 60, 65], frets: [1, 3, 3, 2, 1, 1], fing: '1-3-4-2-1-1', str: 'E-A-D-G-B-e' },
    { name: 'Am', dur: 6, pitches: [45, 52, 57, 60, 64], frets: [null, 0, 2, 2, 1, 0], fing: 'x-0-2-3-1-0', str: 'x-A-D-G-B-e' },
    { name: 'E', dur: 6, pitches: [40, 47, 52, 56, 59, 64], frets: [0, 2, 2, 1, 0, 0], fing: '0-2-3-1-0-0', str: 'E-A-D-G-B-e' },
  ]

  const chords: FullSongChordItem[] = []
  let beatCursor = 1.0

  for (let p = 0; p < 4; p++) {
    for (const item of cycle) {
      const strumEvents: StrumEvent[] = [
        { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
        { beatOffset: 1.0, direction: 'up', accent: false, label: 'U' },
        { beatOffset: 2.0, direction: 'up', accent: false, label: 'U' },
        { beatOffset: 3.0, direction: 'down', accent: true, label: 'D' },
        { beatOffset: 4.0, direction: 'up', accent: false, label: 'U' },
        { beatOffset: 5.0, direction: 'up', accent: false, label: 'U' },
      ]
      chords.push({
        name: item.name,
        beat: beatCursor,
        duration_beats: item.dur,
        expected_pitches: item.pitches,
        guitar_tabs: {
          frets: item.frets,
          strings: item.str,
          fingering: item.fing,
        },
        strum_events: strumEvents,
      })
      beatCursor += item.dur
    }
  }

  return chords
}

// ==============================================================================
// 5. PIANO FULL SONG: Waltz No. 2 – Dmitri Shostakovich (32 Measures, 96 Beats)
// ==============================================================================
function buildShostakovichWaltz2(): FullSongChordItem[] {
  type WaltzMeasureDef = {
    chord: 'Cm' | 'G7' | 'Fm'
    lhRoot: string
    lhChord: string[]
    lhPitches: number[]
    rhMelody: Array<{ pitch: string; beatOffset: number; duration: number }>
    section: string
  }

  const rawMeasures: WaltzMeasureDef[] = [
    // --- Strain 1: Iconic Main Theme (Measures 1 - 16) ---
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'C5', beatOffset: 0, duration: 1 },
        { pitch: 'D5', beatOffset: 1, duration: 1 },
        { pitch: 'Eb5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'D5', beatOffset: 0, duration: 1 },
        { pitch: 'C5', beatOffset: 1, duration: 1 },
        { pitch: 'D5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'Eb5', beatOffset: 0, duration: 2 },
        { pitch: 'D5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [{ pitch: 'C5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [
        { pitch: 'B4', beatOffset: 0, duration: 1 },
        { pitch: 'C5', beatOffset: 1, duration: 1 },
        { pitch: 'D5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [
        { pitch: 'C5', beatOffset: 0, duration: 1 },
        { pitch: 'B4', beatOffset: 1, duration: 1 },
        { pitch: 'C5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [
        { pitch: 'D5', beatOffset: 0, duration: 2 },
        { pitch: 'C5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [{ pitch: 'C5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Fm',
      lhRoot: 'F2',
      lhChord: ['Ab3', 'C4'],
      lhPitches: [41, 56, 60],
      rhMelody: [
        { pitch: 'F5', beatOffset: 0, duration: 2 },
        { pitch: 'G5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Fm',
      lhRoot: 'F2',
      lhChord: ['Ab3', 'C4'],
      lhPitches: [41, 56, 60],
      rhMelody: [
        { pitch: 'Ab5', beatOffset: 0, duration: 2 },
        { pitch: 'G5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [{ pitch: 'Eb5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'D5', beatOffset: 0, duration: 1 },
        { pitch: 'C5', beatOffset: 1, duration: 1 },
        { pitch: 'B4', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [{ pitch: 'D5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [
        { pitch: 'C5', beatOffset: 0, duration: 1 },
        { pitch: 'B4', beatOffset: 1, duration: 1 },
        { pitch: 'Ab4', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [{ pitch: 'G4', beatOffset: 0, duration: 3 }],
      section: 'Theme A (First Strain)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [{ pitch: 'C5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (First Strain)',
    },

    // --- Strain 2: Varied Exposition & Grand Peak (Measures 17 - 32) ---
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'C5', beatOffset: 0, duration: 1 },
        { pitch: 'D5', beatOffset: 1, duration: 1 },
        { pitch: 'Eb5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'D5', beatOffset: 0, duration: 1 },
        { pitch: 'C5', beatOffset: 1, duration: 1 },
        { pitch: 'D5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'Eb5', beatOffset: 0, duration: 2 },
        { pitch: 'G5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [{ pitch: 'C5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [
        { pitch: 'B4', beatOffset: 0, duration: 1 },
        { pitch: 'C5', beatOffset: 1, duration: 1 },
        { pitch: 'D5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [
        { pitch: 'C5', beatOffset: 0, duration: 1 },
        { pitch: 'B4', beatOffset: 1, duration: 1 },
        { pitch: 'C5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [
        { pitch: 'D5', beatOffset: 0, duration: 2 },
        { pitch: 'F5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [{ pitch: 'Eb5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Fm',
      lhRoot: 'F2',
      lhChord: ['Ab3', 'C4'],
      lhPitches: [41, 56, 60],
      rhMelody: [
        { pitch: 'F5', beatOffset: 0, duration: 2 },
        { pitch: 'G5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Fm',
      lhRoot: 'F2',
      lhChord: ['Ab3', 'C4'],
      lhPitches: [41, 56, 60],
      rhMelody: [
        { pitch: 'Ab5', beatOffset: 0, duration: 2 },
        { pitch: 'G5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [{ pitch: 'Eb5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'D5', beatOffset: 0, duration: 1 },
        { pitch: 'C5', beatOffset: 1, duration: 1 },
        { pitch: 'B4', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [{ pitch: 'D5', beatOffset: 0, duration: 3 }],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [
        { pitch: 'C5', beatOffset: 0, duration: 1 },
        { pitch: 'B4', beatOffset: 1, duration: 1 },
        { pitch: 'D5', beatOffset: 2, duration: 1 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'G7',
      lhRoot: 'G2',
      lhChord: ['F3', 'B3'],
      lhPitches: [43, 53, 59],
      rhMelody: [{ pitch: 'B4', beatOffset: 0, duration: 3 }],
      section: 'Theme A (Second Strain & Climax)',
    },
    {
      chord: 'Cm',
      lhRoot: 'C3',
      lhChord: ['Eb3', 'G3'],
      lhPitches: [48, 51, 55],
      rhMelody: [
        { pitch: 'C5', beatOffset: 0, duration: 3 },
        { pitch: 'G4', beatOffset: 0, duration: 3 },
      ],
      section: 'Theme A (Second Strain & Climax)',
    },
  ]

  const chords: FullSongChordItem[] = []
  let beatCursor = 1.0

  for (let idx = 0; idx < rawMeasures.length; idx++) {
    const m = rawMeasures[idx]
    const lhMelodyNotes: GrandStaffNote[] = [
      { pitch: m.lhRoot, beatOffset: 0, duration: 1, clef: 'bass' },
      { pitch: m.lhChord[0], beatOffset: 1, duration: 1, clef: 'bass' },
      { pitch: m.lhChord[1], beatOffset: 1, duration: 1, clef: 'bass' },
      {
        pitch: idx === 15 || idx === 31 ? m.lhRoot : m.lhChord[0],
        beatOffset: 2,
        duration: 1,
        clef: 'bass',
      },
      ...(idx === 15 || idx === 31
        ? []
        : [{ pitch: m.lhChord[1], beatOffset: 2, duration: 1, clef: 'bass' as const }]),
    ]

    const rhMelodyNotes: GrandStaffNote[] = m.rhMelody.map((n) => ({
      pitch: n.pitch,
      beatOffset: n.beatOffset,
      duration: n.duration,
      clef: 'treble' as const,
    }))

    const rhPitches = m.rhMelody.map((n) => {
      const match = n.pitch.match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
      if (!match) return 60
      const letter = match[1].toUpperCase()
      const acc = match[2]
      const oct = parseInt(match[3], 10)
      const baseMidi: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
      let midi = (oct + 1) * 12 + (baseMidi[letter] ?? 0)
      if (acc === '#') midi += 1
      if (acc === 'b') midi -= 1
      return midi
    })

    const expectedPitches = Array.from(new Set([...m.lhPitches, ...rhPitches]))

    chords.push({
      name: m.chord,
      beat: beatCursor,
      duration_beats: 3.0,
      expected_pitches: expectedPitches,
      piano_voicings: {
        lh_note: m.lhRoot,
        rh_notes: [m.rhMelody[0].pitch],
        lh_pitches: [m.lhPitches[0]],
        rh_pitches: rhPitches,
        inversion: 'root position',
      },
      melody_notes: [...lhMelodyNotes, ...rhMelodyNotes],
      section: m.section,
    })

    beatCursor += 3.0
  }

  return chords
}

export const BUILTIN_FULL_SONGS: ExerciseDto[] = [
  {
    id: 'ex_guitar_knockin',
    title: "Knockin' Cadence (Full Song - Verse, Chorus, Outro)",
    description:
      'Complete 24-measure acoustic folk-rock standard. Features authentic verse-chorus form, explicit ballad and anthem strumming arrows (D - D U - U D U), and full tab frets.',
    instrument: 'guitar',
    tempo_bpm: 70,
    difficulty: 1,
    progression: {
      key: 'G Major',
      tempo_range: { min_bpm: 50, default_bpm: 70, max_bpm: 95, gradual_step_bpm: 5 },
      chords: buildKnockinFullSong(),
    },
    progression_json: JSON.stringify({
      key: 'G Major',
      time_signature: '4/4',
      strumming_pattern: 'D - D - D U D U (Ballad) & D - D U - U D U (Anthem)',
      chords: buildKnockinFullSong(),
    }),
  },
  {
    id: 'ex_piano_shostakovich_waltz_2',
    title: 'Waltz No. 2 – Dmitri Shostakovich (Full 32-Measure Classical Score)',
    description:
      'Complete 32-measure orchestral waltz score from Suite for Variety Orchestra in 3/4 time. Features the haunting C minor melodic line (C5, D5, Eb5, F5, G5, Ab5) in Treble Clef and classical waltz boom-chick-chick accompaniment (bass root on beat 1, harmony chords on beats 2 & 3) in Bass Clef.',
    instrument: 'piano',
    tempo_bpm: 160,
    difficulty: 3,
    progression: {
      key: 'C Minor',
      tempo_range: { min_bpm: 120, default_bpm: 160, max_bpm: 184, gradual_step_bpm: 6 },
      chords: buildShostakovichWaltz2(),
    },
    progression_json: JSON.stringify({
      key: 'C Minor',
      time_signature: '3/4',
      strumming_pattern: 'Waltz Boom-Chick-Chick (3/4)',
      chords: buildShostakovichWaltz2(),
    }),
  },
  {
    id: 'ex_piano_canon',
    title: "Pachelbel's Canon Harmonic Flow (Full 32-Measure Classical Score)",
    description:
      'Complete 32-measure authentic classical score from IMSLP. Features 4 distinct variations (Theme Exposition, Counterpoint, Running Polyphony, Grand Cadence) with measure-by-measure right-hand melody noteheads and steady left-hand basso ostinato.',
    instrument: 'piano',
    tempo_bpm: 68,
    difficulty: 2,
    progression: {
      key: 'C Major',
      tempo_range: { min_bpm: 48, default_bpm: 68, max_bpm: 88, gradual_step_bpm: 4 },
      chords: buildPachelbelCanonFullSong(),
    },
    progression_json: JSON.stringify({
      key: 'C Major',
      time_signature: '4/4',
      strumming_pattern: 'Grand Staff Polyphony',
      chords: buildPachelbelCanonFullSong(),
    }),
  },
  {
    id: 'ex_guitar_four_chord',
    title: 'Four-Chord Anthem in D (Full 32-Measure Pop Score)',
    description:
      'Complete 32-measure universal pop/rock anthem (I–V–vi–IV) covering Intro, Verse, Pre-Chorus, Chorus, and Grand Outro with complete strumming directionality.',
    instrument: 'guitar',
    tempo_bpm: 80,
    difficulty: 2,
    progression: {
      key: 'D Major',
      tempo_range: { min_bpm: 60, default_bpm: 80, max_bpm: 110, gradual_step_bpm: 5 },
      chords: buildFourChordAnthemFullSong(),
    },
    progression_json: JSON.stringify({
      key: 'D Major',
      time_signature: '4/4',
      strumming_pattern: 'D - D U - U D U (Driving Pop Strum)',
      chords: buildFourChordAnthemFullSong(),
    }),
  },
  {
    id: 'ex_guitar_rising_sun',
    title: 'House of the Rising Sun (Full 24-Measure 6/8 Folk Classic)',
    description:
      'Complete 24-measure traditional folk masterwork in 6/8 compound time. Features authentic rolling arpeggio strumming vectors and chord fingerings.',
    instrument: 'guitar',
    tempo_bpm: 76,
    difficulty: 3,
    progression: {
      key: 'A Minor',
      tempo_range: { min_bpm: 50, default_bpm: 76, max_bpm: 92, gradual_step_bpm: 4 },
      chords: buildRisingSunFullSong(),
    },
    progression_json: JSON.stringify({
      key: 'A Minor',
      time_signature: '6/8',
      strumming_pattern: 'D - U - U - D - U - U (6/8 rolling arpeggio)',
      chords: buildRisingSunFullSong(),
    }),
  },
]
