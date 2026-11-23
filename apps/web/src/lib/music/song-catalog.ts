import type { ExerciseDto } from '@/api/sessions'
import type { GrandStaffNote, StrumEvent } from '@/components/practice/flowing-notation-stand'
import { parseFingeringString, resolveChordVoicing } from '@/lib/music/chord-voicings'

export type PluckedNoteEvent = {
  beatOffset: number
  string: 1 | 2 | 3 | 4 | 5 | 6
  fret: number | 'x'
  pitch: number
  duration: number
  technique?: 'pick' | 'thumb' | 'index' | 'hammer' | 'pull' | 'slide' | 'mute'
}

export type FullSongChordItem = {
  name: string
  beat: number
  duration_beats: number
  expected_pitches?: number[]
  guitar_tabs?: {
    frets: Array<number | null | 'x'>
    strings: string
    fingering?: string
    fingers?: Array<number | null | string>
    barreFret?: number
    baseFret?: number
  }
  plucked_notes?: PluckedNoteEvent[]
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
      sec.name === 'Verse 2 / Outro'
        ? { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fing: '2-1-0-0-0-3', str: 'E-A-D-G-B-e' }
        : { name: 'C', dur: 4, pitches: [48, 52, 55, 60, 64], frets: [null, 3, 2, 0, 1, 0], fing: 'x-3-2-0-1-0', str: 'x-A-D-G-B-e' },
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
          fingers: parseFingeringString(item.fing),
          baseFret: 1,
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
      const isFinaleC = varIdx === 3 && mIdx === 7
      const chordName = isFinaleC ? 'C' : base.name
      const expectedPitches = isFinaleC ? [48, 55, 60, 64] : [...base.lhPitches, ...base.rhPitches]
      const lhNote = isFinaleC ? 'C3' : base.lhNote
      const rhNotes = isFinaleC ? ['G3', 'C4', 'E4'] : base.rhNotes
      const lhPitches = isFinaleC ? [48] : base.lhPitches
      const rhPitches = isFinaleC ? [55, 60, 64] : base.rhPitches
      const inversionStr = isFinaleC || mIdx % 2 === 0 ? 'root position' : '1st inversion'

      chords.push({
        name: chordName,
        beat: beatCursor,
        duration_beats: 4.0,
        expected_pitches: expectedPitches,
        piano_voicings: {
          lh_note: lhNote,
          rh_notes: rhNotes,
          lh_pitches: lhPitches,
          rh_pitches: rhPitches,
          inversion: inversionStr,
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
            fingers: parseFingeringString(item.fing),
            barreFret: item.name === 'Bm' ? 2 : undefined,
            baseFret: 1,
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
          fingers: parseFingeringString(item.fing),
          barreFret: item.name === 'F' ? 1 : undefined,
          baseFret: 1,
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
        { pitch: 'B4', beatOffset: 2, duration: 1 },
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
        rh_notes: m.rhMelody.map((n) => n.pitch),
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
    id: "ex_guitar_rising_sun",
    title: "House of the Rising Sun (Full 24-Measure 6/8 Folk Classic)",
    artist: "The Animals",
    composer: "Traditional Folk Ballad",
    description: "Complete 24-measure traditional folk masterwork in 6/8 compound time. Features Hilton Valentine's authentic single-string rolling arpeggio plucks.",
    instrument: "guitar",
    tempo_bpm: 76,
    difficulty: 3,
    progression: {
      key: "A Minor",
      tempo_range: {"min_bpm": 50, "default_bpm": 76, "max_bpm": 95, "gradual_step_bpm": 4},
      chords: [
    {
        "name": "Am",
        "beat": 1.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "C",
        "beat": 7.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "D",
        "beat": 13.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "F",
        "beat": 19.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            41,
            48,
            53,
            57,
            60,
            65
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "Am",
        "beat": 25.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "E",
        "beat": 31.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            40,
            47,
            52,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-1-0-0",
            "fingers": [
                null,
                2,
                3,
                1,
                null,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "Am",
        "beat": 37.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "C",
        "beat": 43.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "D",
        "beat": 49.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "F",
        "beat": 55.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            41,
            48,
            53,
            57,
            60,
            65
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "Am",
        "beat": 61.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "E",
        "beat": 67.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            40,
            47,
            52,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-1-0-0",
            "fingers": [
                null,
                2,
                3,
                1,
                null,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "Am",
        "beat": 73.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "C",
        "beat": 79.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "D",
        "beat": 85.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "F",
        "beat": 91.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            41,
            48,
            53,
            57,
            60,
            65
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "Am",
        "beat": 97.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "E",
        "beat": 103.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            40,
            47,
            52,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-1-0-0",
            "fingers": [
                null,
                2,
                3,
                1,
                null,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "Am",
        "beat": 109.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "C",
        "beat": 115.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "D",
        "beat": 121.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "F",
        "beat": 127.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            41,
            48,
            53,
            57,
            60,
            65
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "Am",
        "beat": 133.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    },
    {
        "name": "E",
        "beat": 139.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            40,
            47,
            52,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-1-0-0",
            "fingers": [
                null,
                2,
                3,
                1,
                null,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 4.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 5.0,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ]
    }
],
    },
    progression_json: JSON.stringify({"key": "A Minor", "time_signature": "6/8", "strumming_pattern": "6/8 Rolling Fingerstyle Arpeggio (5-4-3-2-1-2)", "educational_focus": "Rhythmic stability across 6 beats per measure; clean F barre chord and fluid finger picking.", "tempo_range": {"min_bpm": 50, "default_bpm": 76, "max_bpm": 95, "gradual_step_bpm": 4}, "chords": [{"name": "Am", "beat": 1.0, "duration_beats": 6.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "C", "beat": 7.0, "duration_beats": 6.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "D", "beat": 13.0, "duration_beats": 6.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "F", "beat": 19.0, "duration_beats": 6.0, "expected_pitches": [41, 48, 53, 57, 60, 65], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "Am", "beat": 25.0, "duration_beats": 6.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "E", "beat": 31.0, "duration_beats": 6.0, "expected_pitches": [40, 47, 52, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-1-0-0", "fingers": [null, 2, 3, 1, null, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "Am", "beat": 37.0, "duration_beats": 6.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "C", "beat": 43.0, "duration_beats": 6.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "D", "beat": 49.0, "duration_beats": 6.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "F", "beat": 55.0, "duration_beats": 6.0, "expected_pitches": [41, 48, 53, 57, 60, 65], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "Am", "beat": 61.0, "duration_beats": 6.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "E", "beat": 67.0, "duration_beats": 6.0, "expected_pitches": [40, 47, 52, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-1-0-0", "fingers": [null, 2, 3, 1, null, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "Am", "beat": 73.0, "duration_beats": 6.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "C", "beat": 79.0, "duration_beats": 6.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "D", "beat": 85.0, "duration_beats": 6.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "F", "beat": 91.0, "duration_beats": 6.0, "expected_pitches": [41, 48, 53, 57, 60, 65], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "Am", "beat": 97.0, "duration_beats": 6.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "E", "beat": 103.0, "duration_beats": 6.0, "expected_pitches": [40, 47, 52, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-1-0-0", "fingers": [null, 2, 3, 1, null, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "Am", "beat": 109.0, "duration_beats": 6.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "C", "beat": 115.0, "duration_beats": 6.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "D", "beat": 121.0, "duration_beats": 6.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "F", "beat": 127.0, "duration_beats": 6.0, "expected_pitches": [41, 48, 53, 57, 60, 65], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "Am", "beat": 133.0, "duration_beats": 6.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}, {"name": "E", "beat": 139.0, "duration_beats": 6.0, "expected_pitches": [40, 47, 52, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-1-0-0", "fingers": [null, 2, 3, 1, null, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 4.0, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 5.0, "direction": "up", "accent": false, "label": "U"}]}]}),
  },
  {
    id: "ex_guitar_where_did_you_sleep",
    title: "Where Did You Sleep Last Night (In the Pines)",
    artist: "Nirvana (MTV Unplugged)",
    composer: "Traditional Appalachian Folk Ballad / Lead Belly",
    description: "Authentic 16-measure acoustic folk waltz in 3/4 meter made iconic by Kurt Cobain. Alternates low bass string strikes with upper string chord arpeggiation.",
    instrument: "guitar",
    tempo_bpm: 84,
    difficulty: 2,
    progression: {
      key: "E Minor",
      tempo_range: {"min_bpm": 60, "default_bpm": 84, "max_bpm": 110, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "Em",
        "beat": 1.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            55,
            59
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 1"
    },
    {
        "name": "A",
        "beat": 4.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            57
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                2,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-1-2-3-0",
            "fingers": [
                null,
                null,
                1,
                2,
                3,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 1"
    },
    {
        "name": "G",
        "beat": 7.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            50,
            55
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 1"
    },
    {
        "name": "B7",
        "beat": 10.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            47,
            51,
            57
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 1"
    },
    {
        "name": "Em",
        "beat": 13.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            55,
            59
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 2"
    },
    {
        "name": "A",
        "beat": 16.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            57
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                2,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-1-2-3-0",
            "fingers": [
                null,
                null,
                1,
                2,
                3,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 2"
    },
    {
        "name": "G",
        "beat": 19.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            50,
            55
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 2"
    },
    {
        "name": "B7",
        "beat": 22.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            47,
            51,
            57
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 2"
    },
    {
        "name": "Em",
        "beat": 25.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            55,
            59
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 3"
    },
    {
        "name": "A",
        "beat": 28.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            57
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                2,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-1-2-3-0",
            "fingers": [
                null,
                null,
                1,
                2,
                3,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 3"
    },
    {
        "name": "G",
        "beat": 31.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            50,
            55
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 3"
    },
    {
        "name": "B7",
        "beat": 34.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            47,
            51,
            57
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 3"
    },
    {
        "name": "Em",
        "beat": 37.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            55,
            59
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 4"
    },
    {
        "name": "A",
        "beat": 40.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            57
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                2,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-1-2-3-0",
            "fingers": [
                null,
                null,
                1,
                2,
                3,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 4"
    },
    {
        "name": "G",
        "beat": 43.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            50,
            55
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 4"
    },
    {
        "name": "B7",
        "beat": 46.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            47,
            51,
            57
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Verse Part 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "E Minor", "time_signature": "3/4", "strumming_pattern": "Folk Waltz Bass Pluck & Treble Arpeggio (3/4)", "educational_focus": "Steady downbeat bass pulse on strings 6 and 5; crisp B7 fingering without muting open B.", "tempo_range": {"min_bpm": 60, "default_bpm": 84, "max_bpm": 110, "gradual_step_bpm": 5}, "chords": [{"name": "Em", "beat": 1.0, "duration_beats": 3.0, "expected_pitches": [40, 55, 59], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 1"}, {"name": "A", "beat": 4.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 57], "guitar_tabs": {"frets": [null, 0, 2, 2, 2, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-1-2-3-0", "fingers": [null, null, 1, 2, 3, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 1"}, {"name": "G", "beat": 7.0, "duration_beats": 3.0, "expected_pitches": [43, 50, 55], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 1"}, {"name": "B7", "beat": 10.0, "duration_beats": 3.0, "expected_pitches": [47, 51, 57], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "x-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 1"}, {"name": "Em", "beat": 13.0, "duration_beats": 3.0, "expected_pitches": [40, 55, 59], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 2"}, {"name": "A", "beat": 16.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 57], "guitar_tabs": {"frets": [null, 0, 2, 2, 2, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-1-2-3-0", "fingers": [null, null, 1, 2, 3, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 2"}, {"name": "G", "beat": 19.0, "duration_beats": 3.0, "expected_pitches": [43, 50, 55], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 2"}, {"name": "B7", "beat": 22.0, "duration_beats": 3.0, "expected_pitches": [47, 51, 57], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "x-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 2"}, {"name": "Em", "beat": 25.0, "duration_beats": 3.0, "expected_pitches": [40, 55, 59], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 3"}, {"name": "A", "beat": 28.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 57], "guitar_tabs": {"frets": [null, 0, 2, 2, 2, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-1-2-3-0", "fingers": [null, null, 1, 2, 3, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 3"}, {"name": "G", "beat": 31.0, "duration_beats": 3.0, "expected_pitches": [43, 50, 55], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 3"}, {"name": "B7", "beat": 34.0, "duration_beats": 3.0, "expected_pitches": [47, 51, 57], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "x-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 3"}, {"name": "Em", "beat": 37.0, "duration_beats": 3.0, "expected_pitches": [40, 55, 59], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 4"}, {"name": "A", "beat": 40.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 57], "guitar_tabs": {"frets": [null, 0, 2, 2, 2, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-1-2-3-0", "fingers": [null, null, 1, 2, 3, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 4"}, {"name": "G", "beat": 43.0, "duration_beats": 3.0, "expected_pitches": [43, 50, 55], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 4"}, {"name": "B7", "beat": 46.0, "duration_beats": 3.0, "expected_pitches": [47, 51, 57], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "x-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Verse Part 4"}]}),
  },
  {
    id: "ex_guitar_spanish_romance",
    title: "Spanish Romance (Romance An\u00f3nimo)",
    artist: "Classical Guitar Standard",
    composer: "Traditional 19th-Century Spanish Masterpiece",
    description: "The quintessential fingerstyle guitar composition. Features a singing high melody on string 1 with continuous triplet bass and inner-string arpeggiation.",
    instrument: "guitar",
    tempo_bpm: 92,
    difficulty: 3,
    progression: {
      key: "E Minor",
      tempo_range: {"min_bpm": 65, "default_bpm": 92, "max_bpm": 120, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "Em",
        "beat": 1.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            55,
            59,
            71
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                7
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-1-2-0-0-4",
            "fingers": [
                null,
                1,
                2,
                null,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 7,
                "pitch": 71,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Em",
        "beat": 4.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            55,
            59,
            71
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                7
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-1-2-0-0-4",
            "fingers": [
                null,
                1,
                2,
                null,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 7,
                "pitch": 71,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Em",
        "beat": 7.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            55,
            59,
            69
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                5
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-1-2-0-0-3",
            "fingers": [
                null,
                1,
                2,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 5,
                "pitch": 69,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Em",
        "beat": 10.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-1-2-0-0-1",
            "fingers": [
                null,
                1,
                2,
                null,
                null,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 3,
                "pitch": 67,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Am",
        "beat": 13.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            57,
            60,
            69
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                5
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-3-1-4",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 5,
                "pitch": 69,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Am",
        "beat": 16.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            57,
            60,
            69
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                5
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-3-1-4",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 5,
                "pitch": 69,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Am",
        "beat": 19.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            57,
            60,
            67
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-3-1-2",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                2
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 3,
                "pitch": 67,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Am",
        "beat": 22.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            57,
            60,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-3-1-1",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "B7",
        "beat": 25.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            47,
            57,
            59,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "B7",
        "beat": 28.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            57,
            59,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "B7",
        "beat": 31.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            57,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 3,
                "pitch": 67,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "B7",
        "beat": 34.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            57,
            59,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Em",
        "beat": 37.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-1-2-0-0-0",
            "fingers": [
                null,
                1,
                2,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Em",
        "beat": 40.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-1-2-0-0-2",
            "fingers": [
                null,
                1,
                2,
                null,
                null,
                2
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 3,
                "pitch": 67,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Em",
        "beat": 43.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            55,
            59,
            71
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                7
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-1-2-0-0-4",
            "fingers": [
                null,
                1,
                2,
                null,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 7,
                "pitch": 71,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    },
    {
        "name": "Em",
        "beat": 46.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            55,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-1-2-0-0-0",
            "fingers": [
                null,
                1,
                2,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Romance Theme A"
    }
],
    },
    progression_json: JSON.stringify({"key": "E Minor", "time_signature": "3/4", "strumming_pattern": "Classical Arpeggio (p-i-m-a)", "educational_focus": "Independence between thumb bass and ring finger melodic singing line on high e string.", "tempo_range": {"min_bpm": 65, "default_bpm": 92, "max_bpm": 120, "gradual_step_bpm": 5}, "chords": [{"name": "Em", "beat": 1.0, "duration_beats": 3.0, "expected_pitches": [40, 55, 59, 71], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 7], "strings": "E-A-D-G-B-e", "fingering": "0-1-2-0-0-4", "fingers": [null, 1, 2, null, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 7, "pitch": 71, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Em", "beat": 4.0, "duration_beats": 3.0, "expected_pitches": [55, 59, 71], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 7], "strings": "E-A-D-G-B-e", "fingering": "0-1-2-0-0-4", "fingers": [null, 1, 2, null, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 7, "pitch": 71, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Em", "beat": 7.0, "duration_beats": 3.0, "expected_pitches": [55, 59, 69], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 5], "strings": "E-A-D-G-B-e", "fingering": "0-1-2-0-0-3", "fingers": [null, 1, 2, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 5, "pitch": 69, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Em", "beat": 10.0, "duration_beats": 3.0, "expected_pitches": [55, 59, 67], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "0-1-2-0-0-1", "fingers": [null, 1, 2, null, null, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 3, "pitch": 67, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Am", "beat": 13.0, "duration_beats": 3.0, "expected_pitches": [45, 57, 60, 69], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 5], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-3-1-4", "fingers": [null, null, 2, 3, 1, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 5, "pitch": 69, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Am", "beat": 16.0, "duration_beats": 3.0, "expected_pitches": [57, 60, 69], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 5], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-3-1-4", "fingers": [null, null, 2, 3, 1, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 5, "pitch": 69, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Am", "beat": 19.0, "duration_beats": 3.0, "expected_pitches": [57, 60, 67], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 3], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-3-1-2", "fingers": [null, null, 2, 3, 1, 2], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 3, "pitch": 67, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Am", "beat": 22.0, "duration_beats": 3.0, "expected_pitches": [57, 60, 66], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 2], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-3-1-1", "fingers": [null, null, 2, 3, 1, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "B7", "beat": 25.0, "duration_beats": 3.0, "expected_pitches": [47, 57, 59, 66], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "B7", "beat": 28.0, "duration_beats": 3.0, "expected_pitches": [57, 59, 66], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "B7", "beat": 31.0, "duration_beats": 3.0, "expected_pitches": [57, 59, 67], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 3, "pitch": 67, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "B7", "beat": 34.0, "duration_beats": 3.0, "expected_pitches": [57, 59, 66], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Em", "beat": 37.0, "duration_beats": 3.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-1-2-0-0-0", "fingers": [null, 1, 2, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Em", "beat": 40.0, "duration_beats": 3.0, "expected_pitches": [55, 59, 67], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "0-1-2-0-0-2", "fingers": [null, 1, 2, null, null, 2], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 3, "pitch": 67, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Em", "beat": 43.0, "duration_beats": 3.0, "expected_pitches": [55, 59, 71], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 7], "strings": "E-A-D-G-B-e", "fingering": "0-1-2-0-0-4", "fingers": [null, 1, 2, null, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 7, "pitch": 71, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}, {"name": "Em", "beat": 46.0, "duration_beats": 3.0, "expected_pitches": [40, 55, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-1-2-0-0-0", "fingers": [null, 1, 2, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}], "section": "Romance Theme A"}]}),
  },
  {
    id: "ex_guitar_scarborough_fair",
    title: "Scarborough Fair (Parsley, Sage, Rosemary & Thyme)",
    artist: "Simon & Garfunkel",
    composer: "Traditional English Folk Ballad",
    description: "Complete 16-measure traditional ballad in D Dorian modal tuning. Features Paul Simon's delicate Travis-picking arpeggio patterns.",
    instrument: "guitar",
    tempo_bpm: 108,
    difficulty: 2,
    progression: {
      key: "D Minor",
      tempo_range: {"min_bpm": 80, "default_bpm": 108, "max_bpm": 135, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "Dm",
        "beat": 1.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            57,
            62
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-x-0-2-3-1",
            "fingers": [
                null,
                null,
                null,
                2,
                3,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "Dm",
        "beat": 4.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            57,
            62,
            65
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-x-0-2-3-1",
            "fingers": [
                null,
                null,
                null,
                2,
                3,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 1,
                "pitch": 65,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "C",
        "beat": 7.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            52,
            55
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "Dm",
        "beat": 10.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            57,
            62
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-x-0-2-3-1",
            "fingers": [
                null,
                null,
                null,
                2,
                3,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "F",
        "beat": 13.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            53,
            57
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 1,
                "pitch": 41,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 3,
                "pitch": 53,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "F",
        "beat": 16.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            53,
            57,
            60
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 4,
                "fret": 3,
                "pitch": 53,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "C",
        "beat": 19.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "Dm",
        "beat": 22.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            57,
            65
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-x-0-2-3-1",
            "fingers": [
                null,
                null,
                null,
                2,
                3,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 1,
                "pitch": 65,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "Dm",
        "beat": 25.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            57,
            62
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-x-0-2-3-1",
            "fingers": [
                null,
                null,
                null,
                2,
                3,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "G",
        "beat": 28.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            50,
            55
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "Dm",
        "beat": 31.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            57,
            62
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-x-0-2-3-1",
            "fingers": [
                null,
                null,
                null,
                2,
                3,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "F",
        "beat": 34.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            57,
            60
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 1,
                "pitch": 41,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "C",
        "beat": 37.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            52,
            55
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "C",
        "beat": 40.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "Dm",
        "beat": 43.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            57,
            62
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-x-0-2-3-1",
            "fingers": [
                null,
                null,
                null,
                2,
                3,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    },
    {
        "name": "Dm",
        "beat": 46.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            62,
            65
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                1
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-x-0-2-3-1",
            "fingers": [
                null,
                null,
                null,
                2,
                3,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 1,
                "pitch": 65,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Ballad Theme"
    }
],
    },
    progression_json: JSON.stringify({"key": "D Minor", "time_signature": "3/4", "strumming_pattern": "Folk Travis-Picking Arpeggio (3/4)", "educational_focus": "Seamless modal chord transitions between Dm and C with sustained bass notes.", "tempo_range": {"min_bpm": 80, "default_bpm": 108, "max_bpm": 135, "gradual_step_bpm": 5}, "chords": [{"name": "Dm", "beat": 1.0, "duration_beats": 3.0, "expected_pitches": [50, 57, 62], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 1], "strings": "x-A-D-G-B-e", "fingering": "x-x-0-2-3-1", "fingers": [null, null, null, 2, 3, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "Dm", "beat": 4.0, "duration_beats": 3.0, "expected_pitches": [57, 62, 65], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 1], "strings": "x-A-D-G-B-e", "fingering": "x-x-0-2-3-1", "fingers": [null, null, null, 2, 3, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 1, "fret": 1, "pitch": 65, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "C", "beat": 7.0, "duration_beats": 3.0, "expected_pitches": [48, 52, 55], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "Dm", "beat": 10.0, "duration_beats": 3.0, "expected_pitches": [50, 57, 62], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 1], "strings": "x-A-D-G-B-e", "fingering": "x-x-0-2-3-1", "fingers": [null, null, null, 2, 3, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "F", "beat": 13.0, "duration_beats": 3.0, "expected_pitches": [41, 53, 57], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "x-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 1, "pitch": 41, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 3, "pitch": 53, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "F", "beat": 16.0, "duration_beats": 3.0, "expected_pitches": [53, 57, 60], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "x-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 4, "fret": 3, "pitch": 53, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "C", "beat": 19.0, "duration_beats": 3.0, "expected_pitches": [48, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "Dm", "beat": 22.0, "duration_beats": 3.0, "expected_pitches": [50, 57, 65], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 1], "strings": "x-A-D-G-B-e", "fingering": "x-x-0-2-3-1", "fingers": [null, null, null, 2, 3, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 1, "pitch": 65, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "Dm", "beat": 25.0, "duration_beats": 3.0, "expected_pitches": [50, 57, 62], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 1], "strings": "x-A-D-G-B-e", "fingering": "x-x-0-2-3-1", "fingers": [null, null, null, 2, 3, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "G", "beat": 28.0, "duration_beats": 3.0, "expected_pitches": [43, 50, 55], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "x-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "Dm", "beat": 31.0, "duration_beats": 3.0, "expected_pitches": [50, 57, 62], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 1], "strings": "x-A-D-G-B-e", "fingering": "x-x-0-2-3-1", "fingers": [null, null, null, 2, 3, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "F", "beat": 34.0, "duration_beats": 3.0, "expected_pitches": [41, 57, 60], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "x-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 1, "pitch": 41, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "C", "beat": 37.0, "duration_beats": 3.0, "expected_pitches": [48, 52, 55], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "C", "beat": 40.0, "duration_beats": 3.0, "expected_pitches": [52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "Dm", "beat": 43.0, "duration_beats": 3.0, "expected_pitches": [50, 57, 62], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 1], "strings": "x-A-D-G-B-e", "fingering": "x-x-0-2-3-1", "fingers": [null, null, null, 2, 3, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}, {"name": "Dm", "beat": 46.0, "duration_beats": 3.0, "expected_pitches": [50, 62, 65], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 1], "strings": "x-A-D-G-B-e", "fingering": "x-x-0-2-3-1", "fingers": [null, null, null, 2, 3, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 1, "pitch": 65, "duration": 1.0, "technique": "pick"}], "section": "Ballad Theme"}]}),
  },
  {
    id: "ex_guitar_greensleeves",
    title: "Greensleeves (What Child Is This)",
    artist: "Renaissance Standard",
    composer: "Traditional 16th-Century English Folk",
    description: "Timeless 16-measure Renaissance ballad in 6/8 meter. Rolling fingerstyle arpeggios evoke lute and vihuela harmonic textures.",
    instrument: "guitar",
    tempo_bpm: 104,
    difficulty: 2,
    progression: {
      key: "E Minor",
      tempo_range: {"min_bpm": 75, "default_bpm": 104, "max_bpm": 130, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "Em",
        "beat": 1.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 1"
    },
    {
        "name": "D",
        "beat": 7.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 1"
    },
    {
        "name": "C",
        "beat": 13.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            48,
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 1"
    },
    {
        "name": "B7",
        "beat": 19.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            47,
            51,
            57,
            59
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 1"
    },
    {
        "name": "Em",
        "beat": 25.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 2"
    },
    {
        "name": "D",
        "beat": 31.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 2"
    },
    {
        "name": "C",
        "beat": 37.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            48,
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 2"
    },
    {
        "name": "B7",
        "beat": 43.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            47,
            51,
            57,
            59
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 2"
    },
    {
        "name": "Em",
        "beat": 49.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 3"
    },
    {
        "name": "D",
        "beat": 55.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 3"
    },
    {
        "name": "C",
        "beat": 61.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            48,
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 3"
    },
    {
        "name": "B7",
        "beat": 67.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            47,
            51,
            57,
            59
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 3"
    },
    {
        "name": "Em",
        "beat": 73.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 4"
    },
    {
        "name": "D",
        "beat": 79.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 4,
                "fret": 0,
                "pitch": 50,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 4"
    },
    {
        "name": "C",
        "beat": 85.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            48,
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 4"
    },
    {
        "name": "B7",
        "beat": 91.0,
        "duration_beats": 6.0,
        "expected_pitches": [
            47,
            51,
            57,
            59
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 4,
                "string": 3,
                "fret": 2,
                "pitch": 57,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 5,
                "string": 4,
                "fret": 1,
                "pitch": 51,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Theme Part 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "E Minor", "time_signature": "6/8", "strumming_pattern": "Renaissance 6/8 Rolling Fingerstyle", "educational_focus": "Rhythmic flow across compound meter and clear B7 voice leading.", "tempo_range": {"min_bpm": 75, "default_bpm": 104, "max_bpm": 130, "gradual_step_bpm": 5}, "chords": [{"name": "Em", "beat": 1.0, "duration_beats": 6.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 1"}, {"name": "D", "beat": 7.0, "duration_beats": 6.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 1"}, {"name": "C", "beat": 13.0, "duration_beats": 6.0, "expected_pitches": [48, 52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 1"}, {"name": "B7", "beat": 19.0, "duration_beats": 6.0, "expected_pitches": [47, 51, 57, 59], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 1"}, {"name": "Em", "beat": 25.0, "duration_beats": 6.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 2"}, {"name": "D", "beat": 31.0, "duration_beats": 6.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 2"}, {"name": "C", "beat": 37.0, "duration_beats": 6.0, "expected_pitches": [48, 52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 2"}, {"name": "B7", "beat": 43.0, "duration_beats": 6.0, "expected_pitches": [47, 51, 57, 59], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 2"}, {"name": "Em", "beat": 49.0, "duration_beats": 6.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 3"}, {"name": "D", "beat": 55.0, "duration_beats": 6.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 3"}, {"name": "C", "beat": 61.0, "duration_beats": 6.0, "expected_pitches": [48, 52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 3"}, {"name": "B7", "beat": 67.0, "duration_beats": 6.0, "expected_pitches": [47, 51, 57, 59], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 3"}, {"name": "Em", "beat": 73.0, "duration_beats": 6.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 4"}, {"name": "D", "beat": 79.0, "duration_beats": 6.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 4, "fret": 0, "pitch": 50, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 4"}, {"name": "C", "beat": 85.0, "duration_beats": 6.0, "expected_pitches": [48, 52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 4"}, {"name": "B7", "beat": 91.0, "duration_beats": 6.0, "expected_pitches": [47, 51, 57, 59], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 4, "string": 3, "fret": 2, "pitch": 57, "duration": 1.0, "technique": "pick"}, {"beatOffset": 5, "string": 4, "fret": 1, "pitch": 51, "duration": 1.0, "technique": "pick"}], "section": "Theme Part 4"}]}),
  },
  {
    id: "ex_guitar_bourree",
    title: "Bourr\u00e9e in E minor (BWV 996)",
    artist: "J.S. Bach",
    composer: "Johann Sebastian Bach",
    description: "Iconic Baroque lute suite movement that inspired Led Zeppelin's 'Stairway to Heaven' and Jethro Tull. Features simultaneous bass and treble counterpoint.",
    instrument: "guitar",
    tempo_bpm: 80,
    difficulty: 3,
    progression: {
      key: "E Minor",
      tempo_range: {"min_bpm": 60, "default_bpm": 80, "max_bpm": 105, "gradual_step_bpm": 4},
      chords: [
    {
        "name": "Em",
        "beat": 1.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 1"
    },
    {
        "name": "Bm",
        "beat": 5.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            47,
            59,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                4,
                4,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-1-3-4-2-1",
            "fingers": [
                null,
                1,
                3,
                4,
                2,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 4,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 1"
    },
    {
        "name": "Em",
        "beat": 9.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 1"
    },
    {
        "name": "C",
        "beat": 13.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 1"
    },
    {
        "name": "Em",
        "beat": 17.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 2"
    },
    {
        "name": "Bm",
        "beat": 21.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            47,
            59,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                4,
                4,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-1-3-4-2-1",
            "fingers": [
                null,
                1,
                3,
                4,
                2,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 4,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 2"
    },
    {
        "name": "Em",
        "beat": 25.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 2"
    },
    {
        "name": "C",
        "beat": 29.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 2"
    },
    {
        "name": "Em",
        "beat": 33.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 3"
    },
    {
        "name": "Bm",
        "beat": 37.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            47,
            59,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                4,
                4,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-1-3-4-2-1",
            "fingers": [
                null,
                1,
                3,
                4,
                2,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 4,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 3"
    },
    {
        "name": "Em",
        "beat": 41.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 3"
    },
    {
        "name": "C",
        "beat": 45.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 3"
    },
    {
        "name": "Em",
        "beat": 49.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 4"
    },
    {
        "name": "Bm",
        "beat": 53.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            47,
            59,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                4,
                4,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-1-3-4-2-1",
            "fingers": [
                null,
                1,
                3,
                4,
                2,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 2,
                "pitch": 66,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 5,
                "fret": 2,
                "pitch": 47,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 4,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 3,
                "pitch": 62,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 4"
    },
    {
        "name": "Em",
        "beat": 57.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 4"
    },
    {
        "name": "C",
        "beat": 61.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 0,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 5,
                "fret": 3,
                "pitch": 48,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 4,
                "fret": 2,
                "pitch": 52,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 3,
                "string": 3,
                "fret": 0,
                "pitch": 55,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Counterpoint Section 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "E Minor", "time_signature": "4/4", "strumming_pattern": "Baroque Two-Part Counterpoint Plucking", "educational_focus": "Contrapuntal independence: thumb playing on-beat bass notes while fingers pluck melodic contours.", "tempo_range": {"min_bpm": 60, "default_bpm": 80, "max_bpm": 105, "gradual_step_bpm": 4}, "chords": [{"name": "Em", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 1"}, {"name": "Bm", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [47, 59, 62, 66], "guitar_tabs": {"frets": [null, 2, 4, 4, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-1-3-4-2-1", "fingers": [null, 1, 3, 4, 2, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 4, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 1"}, {"name": "Em", "beat": 9.0, "duration_beats": 4.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 1"}, {"name": "C", "beat": 13.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 1"}, {"name": "Em", "beat": 17.0, "duration_beats": 4.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 2"}, {"name": "Bm", "beat": 21.0, "duration_beats": 4.0, "expected_pitches": [47, 59, 62, 66], "guitar_tabs": {"frets": [null, 2, 4, 4, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-1-3-4-2-1", "fingers": [null, 1, 3, 4, 2, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 4, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 2"}, {"name": "Em", "beat": 25.0, "duration_beats": 4.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 2"}, {"name": "C", "beat": 29.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 2"}, {"name": "Em", "beat": 33.0, "duration_beats": 4.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 3"}, {"name": "Bm", "beat": 37.0, "duration_beats": 4.0, "expected_pitches": [47, 59, 62, 66], "guitar_tabs": {"frets": [null, 2, 4, 4, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-1-3-4-2-1", "fingers": [null, 1, 3, 4, 2, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 4, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 3"}, {"name": "Em", "beat": 41.0, "duration_beats": 4.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 3"}, {"name": "C", "beat": 45.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 3"}, {"name": "Em", "beat": 49.0, "duration_beats": 4.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 4"}, {"name": "Bm", "beat": 53.0, "duration_beats": 4.0, "expected_pitches": [47, 59, 62, 66], "guitar_tabs": {"frets": [null, 2, 4, 4, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-1-3-4-2-1", "fingers": [null, 1, 3, 4, 2, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 2, "pitch": 66, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 5, "fret": 2, "pitch": 47, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 4, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 3, "pitch": 62, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 4"}, {"name": "Em", "beat": 57.0, "duration_beats": 4.0, "expected_pitches": [40, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 4"}, {"name": "C", "beat": 61.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 0, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 1, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 5, "fret": 3, "pitch": 48, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 4, "fret": 2, "pitch": 52, "duration": 1.0, "technique": "pick"}, {"beatOffset": 3, "string": 3, "fret": 0, "pitch": 55, "duration": 1.0, "technique": "pick"}], "section": "Counterpoint Section 4"}]}),
  },
  {
    id: "ex_guitar_whiskey_in_the_jar",
    title: "Whiskey in the Jar (Folk-Rock Standard)",
    artist: "Thin Lizzy & Metallica",
    composer: "Traditional 17th-Century Irish Folk Song",
    description: "Electrifying 16-measure Celtic folk-rock standard. Features driving syncopated rhythm strumming and energetic chord shifts.",
    instrument: "guitar",
    tempo_bpm: 124,
    difficulty: 2,
    progression: {
      key: "G Major",
      tempo_range: {"min_bpm": 95, "default_bpm": 124, "max_bpm": 150, "gradual_step_bpm": 6},
      chords: [
    {
        "name": "G",
        "beat": 1.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 1"
    },
    {
        "name": "Em",
        "beat": 5.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            52,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 1"
    },
    {
        "name": "C",
        "beat": 9.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 1"
    },
    {
        "name": "D",
        "beat": 13.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 1"
    },
    {
        "name": "G",
        "beat": 17.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 2"
    },
    {
        "name": "Em",
        "beat": 21.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            52,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 2"
    },
    {
        "name": "C",
        "beat": 25.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 2"
    },
    {
        "name": "D",
        "beat": 29.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 2"
    },
    {
        "name": "G",
        "beat": 33.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 3"
    },
    {
        "name": "Em",
        "beat": 37.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            52,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 3"
    },
    {
        "name": "C",
        "beat": 41.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 3"
    },
    {
        "name": "D",
        "beat": 45.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 3"
    },
    {
        "name": "G",
        "beat": 49.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 4"
    },
    {
        "name": "Em",
        "beat": 53.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            52,
            55,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                0,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-0-0-0",
            "fingers": [
                null,
                2,
                3,
                null,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 4"
    },
    {
        "name": "C",
        "beat": 57.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 4"
    },
    {
        "name": "D",
        "beat": 61.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse Rep 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "G Major", "time_signature": "4/4", "strumming_pattern": "D - D U - U D U (Driving Folk-Rock Strum)", "educational_focus": "Crisp upstroke syncopation on upbeat of 2 and 4 at brisk tempo.", "tempo_range": {"min_bpm": 95, "default_bpm": 124, "max_bpm": 150, "gradual_step_bpm": 6}, "chords": [{"name": "G", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 1"}, {"name": "Em", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 52, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 1"}, {"name": "C", "beat": 9.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 1"}, {"name": "D", "beat": 13.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 1"}, {"name": "G", "beat": 17.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 2"}, {"name": "Em", "beat": 21.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 52, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 2"}, {"name": "C", "beat": 25.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 2"}, {"name": "D", "beat": 29.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 2"}, {"name": "G", "beat": 33.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 3"}, {"name": "Em", "beat": 37.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 52, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 3"}, {"name": "C", "beat": 41.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 3"}, {"name": "D", "beat": 45.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 3"}, {"name": "G", "beat": 49.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 4"}, {"name": "Em", "beat": 53.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 52, 55, 59, 64], "guitar_tabs": {"frets": [0, 2, 2, 0, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-0-0-0", "fingers": [null, 2, 3, null, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 4"}, {"name": "C", "beat": 57.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 4"}, {"name": "D", "beat": 61.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "E-A-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse Rep 4"}]}),
  },
  {
    id: "ex_guitar_malaguena",
    title: "Malague\u00f1a (Flamenco Andalusian Cadence)",
    artist: "Flamenco Masterpiece",
    composer: "Traditional Andalusian Flamenco",
    description: "Dramatic 16-measure Spanish flamenco cadence in E Phrygian (Am -> G -> F -> E). Emphasizes deep thumb strikes (pulgar) on downbeats.",
    instrument: "guitar",
    tempo_bpm: 112,
    difficulty: 3,
    progression: {
      key: "E Phrygian",
      tempo_range: {"min_bpm": 80, "default_bpm": 112, "max_bpm": 140, "gradual_step_bpm": 6},
      chords: [
    {
        "name": "Am",
        "beat": 1.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 1"
    },
    {
        "name": "G",
        "beat": 4.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 3,
                "pitch": 67,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 1"
    },
    {
        "name": "F",
        "beat": 7.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            60,
            65
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 1,
                "pitch": 41,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 1,
                "pitch": 65,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 1"
    },
    {
        "name": "E",
        "beat": 10.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            56,
            59
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-1-0-0",
            "fingers": [
                null,
                2,
                3,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 1,
                "pitch": 56,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 1"
    },
    {
        "name": "Am",
        "beat": 13.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 2"
    },
    {
        "name": "G",
        "beat": 16.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 3,
                "pitch": 67,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 2"
    },
    {
        "name": "F",
        "beat": 19.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            60,
            65
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 1,
                "pitch": 41,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 1,
                "pitch": 65,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 2"
    },
    {
        "name": "E",
        "beat": 22.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            56,
            59
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-1-0-0",
            "fingers": [
                null,
                2,
                3,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 1,
                "pitch": 56,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 2"
    },
    {
        "name": "Am",
        "beat": 25.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 3"
    },
    {
        "name": "G",
        "beat": 28.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 3,
                "pitch": 67,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 3"
    },
    {
        "name": "F",
        "beat": 31.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            60,
            65
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 1,
                "pitch": 41,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 1,
                "pitch": 65,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 3"
    },
    {
        "name": "E",
        "beat": 34.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            56,
            59
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-1-0-0",
            "fingers": [
                null,
                2,
                3,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 1,
                "pitch": 56,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 3"
    },
    {
        "name": "Am",
        "beat": 37.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 5,
                "fret": 0,
                "pitch": 45,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 0,
                "pitch": 64,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 4"
    },
    {
        "name": "G",
        "beat": 40.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 3,
                "pitch": 43,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 3,
                "pitch": 67,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 4"
    },
    {
        "name": "F",
        "beat": 43.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            60,
            65
        ],
        "guitar_tabs": {
            "frets": [
                1,
                3,
                3,
                2,
                1,
                1
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "1-3-4-2-1-1",
            "fingers": [
                1,
                3,
                4,
                2,
                1,
                1
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 1,
                "pitch": 41,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 2,
                "fret": 1,
                "pitch": 60,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 1,
                "fret": 1,
                "pitch": 65,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 4"
    },
    {
        "name": "E",
        "beat": 46.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            56,
            59
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                2,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-3-1-0-0",
            "fingers": [
                null,
                2,
                3,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "plucked_notes": [
            {
                "beatOffset": 0,
                "string": 6,
                "fret": 0,
                "pitch": 40,
                "duration": 1.0,
                "technique": "thumb"
            },
            {
                "beatOffset": 1,
                "string": 3,
                "fret": 1,
                "pitch": 56,
                "duration": 1.0,
                "technique": "pick"
            },
            {
                "beatOffset": 2,
                "string": 2,
                "fret": 0,
                "pitch": 59,
                "duration": 1.0,
                "technique": "pick"
            }
        ],
        "section": "Flamenco Falseta 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "E Phrygian", "time_signature": "3/4", "strumming_pattern": "Flamenco Pulgar & Rasgueado Arpeggio", "educational_focus": "Dynamic contrast between authoritative thumb downbeats and feather-light index/middle plucks.", "tempo_range": {"min_bpm": 80, "default_bpm": 112, "max_bpm": 140, "gradual_step_bpm": 6}, "chords": [{"name": "Am", "beat": 1.0, "duration_beats": 3.0, "expected_pitches": [45, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 1"}, {"name": "G", "beat": 4.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 3, "pitch": 67, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 1"}, {"name": "F", "beat": 7.0, "duration_beats": 3.0, "expected_pitches": [41, 60, 65], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 1, "pitch": 41, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 1, "pitch": 65, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 1"}, {"name": "E", "beat": 10.0, "duration_beats": 3.0, "expected_pitches": [40, 56, 59], "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-1-0-0", "fingers": [null, 2, 3, 1, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 3, "fret": 1, "pitch": 56, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 1"}, {"name": "Am", "beat": 13.0, "duration_beats": 3.0, "expected_pitches": [45, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 2"}, {"name": "G", "beat": 16.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 3, "pitch": 67, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 2"}, {"name": "F", "beat": 19.0, "duration_beats": 3.0, "expected_pitches": [41, 60, 65], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 1, "pitch": 41, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 1, "pitch": 65, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 2"}, {"name": "E", "beat": 22.0, "duration_beats": 3.0, "expected_pitches": [40, 56, 59], "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-1-0-0", "fingers": [null, 2, 3, 1, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 3, "fret": 1, "pitch": 56, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 2"}, {"name": "Am", "beat": 25.0, "duration_beats": 3.0, "expected_pitches": [45, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 3"}, {"name": "G", "beat": 28.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 3, "pitch": 67, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 3"}, {"name": "F", "beat": 31.0, "duration_beats": 3.0, "expected_pitches": [41, 60, 65], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 1, "pitch": 41, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 1, "pitch": 65, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 3"}, {"name": "E", "beat": 34.0, "duration_beats": 3.0, "expected_pitches": [40, 56, 59], "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-1-0-0", "fingers": [null, 2, 3, 1, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 3, "fret": 1, "pitch": 56, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 3"}, {"name": "Am", "beat": 37.0, "duration_beats": 3.0, "expected_pitches": [45, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 5, "fret": 0, "pitch": 45, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 0, "pitch": 64, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 4"}, {"name": "G", "beat": 40.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 3, "pitch": 43, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 3, "pitch": 67, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 4"}, {"name": "F", "beat": 43.0, "duration_beats": 3.0, "expected_pitches": [41, 60, 65], "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e", "fingering": "1-3-4-2-1-1", "fingers": [1, 3, 4, 2, 1, 1], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 1, "pitch": 41, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 2, "fret": 1, "pitch": 60, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 1, "fret": 1, "pitch": 65, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 4"}, {"name": "E", "beat": 46.0, "duration_beats": 3.0, "expected_pitches": [40, 56, 59], "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-3-1-0-0", "fingers": [null, 2, 3, 1, null, null], "baseFret": 1}, "plucked_notes": [{"beatOffset": 0, "string": 6, "fret": 0, "pitch": 40, "duration": 1.0, "technique": "thumb"}, {"beatOffset": 1, "string": 3, "fret": 1, "pitch": 56, "duration": 1.0, "technique": "pick"}, {"beatOffset": 2, "string": 2, "fret": 0, "pitch": 59, "duration": 1.0, "technique": "pick"}], "section": "Flamenco Falseta 4"}]}),
  },
  {
    id: "ex_guitar_knockin",
    title: "Knockin' Cadence (Full Song - Verse, Chorus, Outro)",
    artist: "Bob Dylan",
    composer: "Bob Dylan",
    description: "Complete 24-measure acoustic folk-rock standard. Features authentic verse-chorus form, explicit ballad and anthem strumming arrows, and precise string muting.",
    instrument: "guitar",
    tempo_bpm: 70,
    difficulty: 1,
    progression: {
      key: "G Major",
      tempo_range: {"min_bpm": 50, "default_bpm": 70, "max_bpm": 95, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "G",
        "beat": 1.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse 1"
    },
    {
        "name": "D",
        "beat": 5.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse 1"
    },
    {
        "name": "Am",
        "beat": 9.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse 1"
    },
    {
        "name": "Am",
        "beat": 13.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse 1"
    },
    {
        "name": "G",
        "beat": 17.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse 1"
    },
    {
        "name": "D",
        "beat": 21.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse 1"
    },
    {
        "name": "C",
        "beat": 25.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse 1"
    },
    {
        "name": "C",
        "beat": 29.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Verse 1"
    },
    {
        "name": "G",
        "beat": 33.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus"
    },
    {
        "name": "D",
        "beat": 37.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus"
    },
    {
        "name": "Am",
        "beat": 41.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus"
    },
    {
        "name": "Am",
        "beat": 45.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus"
    },
    {
        "name": "G",
        "beat": 49.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus"
    },
    {
        "name": "D",
        "beat": 53.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus"
    },
    {
        "name": "C",
        "beat": 57.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus"
    },
    {
        "name": "C",
        "beat": 61.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 3.5,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus"
    },
    {
        "name": "G",
        "beat": 65.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            }
        ],
        "section": "Verse 2 / Outro"
    },
    {
        "name": "D",
        "beat": 69.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            }
        ],
        "section": "Verse 2 / Outro"
    },
    {
        "name": "Am",
        "beat": 73.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            }
        ],
        "section": "Verse 2 / Outro"
    },
    {
        "name": "Am",
        "beat": 77.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            52,
            57,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                2,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-0-2-3-1-0",
            "fingers": [
                null,
                null,
                2,
                3,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            }
        ],
        "section": "Verse 2 / Outro"
    },
    {
        "name": "G",
        "beat": 81.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            }
        ],
        "section": "Verse 2 / Outro"
    },
    {
        "name": "D",
        "beat": 85.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            57,
            62,
            66
        ],
        "guitar_tabs": {
            "frets": [
                null,
                null,
                0,
                2,
                3,
                2
            ],
            "strings": "x-x-D-G-B-e",
            "fingering": "x-x-0-1-3-2",
            "fingers": [
                null,
                null,
                null,
                1,
                3,
                2
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            }
        ],
        "section": "Verse 2 / Outro"
    },
    {
        "name": "C",
        "beat": 89.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "guitar_tabs": {
            "frets": [
                null,
                3,
                2,
                0,
                1,
                0
            ],
            "strings": "x-A-D-G-B-e",
            "fingering": "x-3-2-0-1-0",
            "fingers": [
                null,
                3,
                2,
                null,
                1,
                null
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            }
        ],
        "section": "Verse 2 / Outro"
    },
    {
        "name": "G",
        "beat": 93.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            47,
            50,
            55,
            59,
            67
        ],
        "guitar_tabs": {
            "frets": [
                3,
                2,
                0,
                0,
                0,
                3
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "2-1-0-0-0-3",
            "fingers": [
                2,
                1,
                null,
                null,
                null,
                3
            ]
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            }
        ],
        "section": "Verse 2 / Outro"
    }
],
    },
    progression_json: JSON.stringify({"key": "G Major", "time_signature": "4/4", "strumming_pattern": "D - D - D U D U (Ballad) & D - D U - U D U (Anthem)", "educational_focus": "Eliminate pause during D -> Am transition; ensure high E rings clear on D.", "tempo_range": {"min_bpm": 50, "default_bpm": 70, "max_bpm": 95, "gradual_step_bpm": 5}, "chords": [{"name": "G", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse 1"}, {"name": "D", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse 1"}, {"name": "Am", "beat": 9.0, "duration_beats": 4.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse 1"}, {"name": "Am", "beat": 13.0, "duration_beats": 4.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse 1"}, {"name": "G", "beat": 17.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse 1"}, {"name": "D", "beat": 21.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse 1"}, {"name": "C", "beat": 25.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse 1"}, {"name": "C", "beat": 29.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Verse 1"}, {"name": "G", "beat": 33.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus"}, {"name": "D", "beat": 37.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus"}, {"name": "Am", "beat": 41.0, "duration_beats": 4.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus"}, {"name": "Am", "beat": 45.0, "duration_beats": 4.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus"}, {"name": "G", "beat": 49.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus"}, {"name": "D", "beat": 53.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus"}, {"name": "C", "beat": 57.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus"}, {"name": "C", "beat": 61.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.5, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 3.5, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus"}, {"name": "G", "beat": 65.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}], "section": "Verse 2 / Outro"}, {"name": "D", "beat": 69.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}], "section": "Verse 2 / Outro"}, {"name": "Am", "beat": 73.0, "duration_beats": 4.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}], "section": "Verse 2 / Outro"}, {"name": "Am", "beat": 77.0, "duration_beats": 4.0, "expected_pitches": [45, 52, 57, 60, 64], "guitar_tabs": {"frets": [null, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-0-2-3-1-0", "fingers": [null, null, 2, 3, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}], "section": "Verse 2 / Outro"}, {"name": "G", "beat": 81.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}], "section": "Verse 2 / Outro"}, {"name": "D", "beat": 85.0, "duration_beats": 4.0, "expected_pitches": [50, 57, 62, 66], "guitar_tabs": {"frets": [null, null, 0, 2, 3, 2], "strings": "x-x-D-G-B-e", "fingering": "x-x-0-1-3-2", "fingers": [null, null, null, 1, 3, 2]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}], "section": "Verse 2 / Outro"}, {"name": "C", "beat": 89.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "guitar_tabs": {"frets": [null, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e", "fingering": "x-3-2-0-1-0", "fingers": [null, 3, 2, null, 1, null]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}], "section": "Verse 2 / Outro"}, {"name": "G", "beat": 93.0, "duration_beats": 4.0, "expected_pitches": [43, 47, 50, 55, 59, 67], "guitar_tabs": {"frets": [3, 2, 0, 0, 0, 3], "strings": "E-A-D-G-B-e", "fingering": "2-1-0-0-0-3", "fingers": [2, 1, null, null, null, 3]}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.0, "direction": "down", "accent": false, "label": "D"}], "section": "Verse 2 / Outro"}]}),
  },
  {
    id: "ex_guitar_blues_shuffle",
    title: "12-Bar Delta Blues Shuffle in E",
    artist: "Blues Standard",
    composer: "Traditional Delta Blues / Robert Johnson",
    description: "Essential 24-measure acoustic blues progression across two complete choruses. Features authentic swing-shuffle pulse, dominant 7th chords, and classic turnaround cadence.",
    instrument: "guitar",
    tempo_bpm: 96,
    difficulty: 2,
    progression: {
      key: "E Major",
      tempo_range: {"min_bpm": 70, "default_bpm": 96, "max_bpm": 125, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "E7",
        "beat": 1.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 1"
    },
    {
        "name": "E7",
        "beat": 5.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 2"
    },
    {
        "name": "E7",
        "beat": 9.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 3"
    },
    {
        "name": "E7",
        "beat": 13.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 4"
    },
    {
        "name": "A7",
        "beat": 17.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            49,
            52,
            57,
            61
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                0,
                2,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-0-3-0",
            "fingers": [
                null,
                null,
                2,
                null,
                3,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 5"
    },
    {
        "name": "A7",
        "beat": 21.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            49,
            52,
            57,
            61
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                0,
                2,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-0-3-0",
            "fingers": [
                null,
                null,
                2,
                null,
                3,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 6"
    },
    {
        "name": "E7",
        "beat": 25.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 7"
    },
    {
        "name": "E7",
        "beat": 29.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 8"
    },
    {
        "name": "B7",
        "beat": 33.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            47,
            51,
            54,
            57,
            63
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 9"
    },
    {
        "name": "A7",
        "beat": 37.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            49,
            52,
            57,
            61
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                0,
                2,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-0-3-0",
            "fingers": [
                null,
                null,
                2,
                null,
                3,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 10"
    },
    {
        "name": "E7",
        "beat": 41.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 11"
    },
    {
        "name": "B7",
        "beat": 45.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            47,
            51,
            54,
            57,
            63
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 1 Bar 12"
    },
    {
        "name": "E7",
        "beat": 49.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 1"
    },
    {
        "name": "E7",
        "beat": 53.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 2"
    },
    {
        "name": "E7",
        "beat": 57.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 3"
    },
    {
        "name": "E7",
        "beat": 61.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 4"
    },
    {
        "name": "A7",
        "beat": 65.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            49,
            52,
            57,
            61
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                0,
                2,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-0-3-0",
            "fingers": [
                null,
                null,
                2,
                null,
                3,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 5"
    },
    {
        "name": "A7",
        "beat": 69.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            49,
            52,
            57,
            61
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                0,
                2,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-0-3-0",
            "fingers": [
                null,
                null,
                2,
                null,
                3,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 6"
    },
    {
        "name": "E7",
        "beat": 73.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 7"
    },
    {
        "name": "E7",
        "beat": 77.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 8"
    },
    {
        "name": "B7",
        "beat": 81.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            47,
            51,
            54,
            57,
            63
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 9"
    },
    {
        "name": "A7",
        "beat": 85.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            49,
            52,
            57,
            61
        ],
        "guitar_tabs": {
            "frets": [
                null,
                0,
                2,
                0,
                2,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-0-2-0-3-0",
            "fingers": [
                null,
                null,
                2,
                null,
                3,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 10"
    },
    {
        "name": "E7",
        "beat": 89.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            47,
            50,
            56,
            59,
            64
        ],
        "guitar_tabs": {
            "frets": [
                0,
                2,
                0,
                1,
                0,
                0
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "0-2-0-1-0-0",
            "fingers": [
                null,
                2,
                null,
                1,
                null,
                null
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 11"
    },
    {
        "name": "B7",
        "beat": 93.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            47,
            51,
            54,
            57,
            63
        ],
        "guitar_tabs": {
            "frets": [
                null,
                2,
                1,
                2,
                0,
                2
            ],
            "strings": "E-A-D-G-B-e",
            "fingering": "x-2-1-3-0-4",
            "fingers": [
                null,
                2,
                1,
                3,
                null,
                4
            ],
            "baseFret": 1
        },
        "strum_events": [
            {
                "beatOffset": 0.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 0.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 1.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 1.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 2.0,
                "direction": "down",
                "accent": true,
                "label": "D"
            },
            {
                "beatOffset": 2.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            },
            {
                "beatOffset": 3.0,
                "direction": "down",
                "accent": false,
                "label": "D"
            },
            {
                "beatOffset": 3.67,
                "direction": "up",
                "accent": false,
                "label": "U"
            }
        ],
        "section": "Chorus 2 Bar 12"
    }
],
    },
    progression_json: JSON.stringify({"key": "E Major", "time_signature": "4/4", "strumming_pattern": "Delta Blues Shuffle Swing (4/4)", "educational_focus": "Rhythmic swing eighth-note consistency and clean turnaround resolution from B7 to E7.", "tempo_range": {"min_bpm": 70, "default_bpm": 96, "max_bpm": 125, "gradual_step_bpm": 5}, "chords": [{"name": "E7", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 1"}, {"name": "E7", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 2"}, {"name": "E7", "beat": 9.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 3"}, {"name": "E7", "beat": 13.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 4"}, {"name": "A7", "beat": 17.0, "duration_beats": 4.0, "expected_pitches": [45, 49, 52, 57, 61], "guitar_tabs": {"frets": [null, 0, 2, 0, 2, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-0-3-0", "fingers": [null, null, 2, null, 3, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 5"}, {"name": "A7", "beat": 21.0, "duration_beats": 4.0, "expected_pitches": [45, 49, 52, 57, 61], "guitar_tabs": {"frets": [null, 0, 2, 0, 2, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-0-3-0", "fingers": [null, null, 2, null, 3, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 6"}, {"name": "E7", "beat": 25.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 7"}, {"name": "E7", "beat": 29.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 8"}, {"name": "B7", "beat": 33.0, "duration_beats": 4.0, "expected_pitches": [47, 51, 54, 57, 63], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 9"}, {"name": "A7", "beat": 37.0, "duration_beats": 4.0, "expected_pitches": [45, 49, 52, 57, 61], "guitar_tabs": {"frets": [null, 0, 2, 0, 2, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-0-3-0", "fingers": [null, null, 2, null, 3, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 10"}, {"name": "E7", "beat": 41.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 11"}, {"name": "B7", "beat": 45.0, "duration_beats": 4.0, "expected_pitches": [47, 51, 54, 57, 63], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 1 Bar 12"}, {"name": "E7", "beat": 49.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 1"}, {"name": "E7", "beat": 53.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 2"}, {"name": "E7", "beat": 57.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 3"}, {"name": "E7", "beat": 61.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 4"}, {"name": "A7", "beat": 65.0, "duration_beats": 4.0, "expected_pitches": [45, 49, 52, 57, 61], "guitar_tabs": {"frets": [null, 0, 2, 0, 2, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-0-3-0", "fingers": [null, null, 2, null, 3, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 5"}, {"name": "A7", "beat": 69.0, "duration_beats": 4.0, "expected_pitches": [45, 49, 52, 57, 61], "guitar_tabs": {"frets": [null, 0, 2, 0, 2, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-0-3-0", "fingers": [null, null, 2, null, 3, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 6"}, {"name": "E7", "beat": 73.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 7"}, {"name": "E7", "beat": 77.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 8"}, {"name": "B7", "beat": 81.0, "duration_beats": 4.0, "expected_pitches": [47, 51, 54, 57, 63], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 9"}, {"name": "A7", "beat": 85.0, "duration_beats": 4.0, "expected_pitches": [45, 49, 52, 57, 61], "guitar_tabs": {"frets": [null, 0, 2, 0, 2, 0], "strings": "E-A-D-G-B-e", "fingering": "x-0-2-0-3-0", "fingers": [null, null, 2, null, 3, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 10"}, {"name": "E7", "beat": 89.0, "duration_beats": 4.0, "expected_pitches": [40, 47, 50, 56, 59, 64], "guitar_tabs": {"frets": [0, 2, 0, 1, 0, 0], "strings": "E-A-D-G-B-e", "fingering": "0-2-0-1-0-0", "fingers": [null, 2, null, 1, null, null], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 11"}, {"name": "B7", "beat": 93.0, "duration_beats": 4.0, "expected_pitches": [47, 51, 54, 57, 63], "guitar_tabs": {"frets": [null, 2, 1, 2, 0, 2], "strings": "E-A-D-G-B-e", "fingering": "x-2-1-3-0-4", "fingers": [null, 2, 1, 3, null, 4], "baseFret": 1}, "strum_events": [{"beatOffset": 0.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 0.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 1.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 1.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 2.0, "direction": "down", "accent": true, "label": "D"}, {"beatOffset": 2.67, "direction": "up", "accent": false, "label": "U"}, {"beatOffset": 3.0, "direction": "down", "accent": false, "label": "D"}, {"beatOffset": 3.67, "direction": "up", "accent": false, "label": "U"}], "section": "Chorus 2 Bar 12"}]}),
  },
  {
    id: "ex_piano_shostakovich_waltz_2",
    title: "Waltz No. 2 \u2013 Dmitri Shostakovich (Full 32-Measure Classical Score)",
    artist: "Dmitri Shostakovich",
    composer: "Dmitri Shostakovich",
    description: "Complete 32-measure orchestral waltz score from Suite for Variety Orchestra in 3/4 time. Features the haunting C minor melodic line in Treble Clef and classical boom-chick-chick accompaniment in Bass Clef.",
    instrument: "piano",
    tempo_bpm: 160,
    difficulty: 3,
    progression: {
      key: "C Minor",
      tempo_range: {"min_bpm": 120, "default_bpm": 160, "max_bpm": 184, "gradual_step_bpm": 6},
      chords: [
    {
        "name": "Cm",
        "beat": 1.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            72,
            74,
            75
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "C5",
                "D5",
                "Eb5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                72,
                74,
                75
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Cm",
        "beat": 4.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "D5",
                "C5",
                "D5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                74,
                72,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Cm",
        "beat": 7.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            74,
            75
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "Eb5",
                "D5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                75,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Cm",
        "beat": 10.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "G7",
        "beat": 13.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B4",
                "C5",
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                71,
                72,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "G7",
        "beat": 16.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "C5",
                "B4",
                "C5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                72,
                71,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "G7",
        "beat": 19.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D5",
                "C5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                74,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Cm",
        "beat": 22.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Fm",
        "beat": 25.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            56,
            60,
            77,
            79
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "F5",
                "G5"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                77,
                79
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Fm",
        "beat": 28.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            56,
            60,
            79,
            80
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "Ab5",
                "G5"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                80,
                79
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Cm",
        "beat": 31.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            75
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "Eb5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                75
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Cm",
        "beat": 34.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "D5",
                "C5",
                "B4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                74,
                72,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "G7",
        "beat": 37.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "G7",
        "beat": 40.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            68,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "C5",
                "B4",
                "Ab4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                72,
                71,
                68
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Ab4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "G7",
        "beat": 43.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            67
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "G4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                67
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Cm",
        "beat": 46.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (First Strain)"
    },
    {
        "name": "Cm",
        "beat": 49.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            72,
            74,
            75
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "C5",
                "D5",
                "Eb5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                72,
                74,
                75
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Cm",
        "beat": 52.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "D5",
                "C5",
                "D5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                74,
                72,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Cm",
        "beat": 55.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            75,
            79
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "Eb5",
                "G5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                75,
                79
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Cm",
        "beat": 58.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "G7",
        "beat": 61.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B4",
                "C5",
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                71,
                72,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "G7",
        "beat": 64.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "C5",
                "B4",
                "C5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                72,
                71,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "G7",
        "beat": 67.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            74,
            77
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D5",
                "F5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                74,
                77
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "F5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Cm",
        "beat": 70.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            75
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "Eb5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                75
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Fm",
        "beat": 73.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            56,
            60,
            77,
            79
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "F5",
                "G5"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                77,
                79
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Fm",
        "beat": 76.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            41,
            56,
            60,
            79,
            80
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "Ab5",
                "G5"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                80,
                79
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Ab5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Cm",
        "beat": 79.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            75
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "Eb5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                75
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Cm",
        "beat": 82.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "D5",
                "C5",
                "B4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                74,
                72,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "G7",
        "beat": 85.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "G7",
        "beat": 88.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "C5",
                "B4",
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                72,
                71,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "G7",
        "beat": 91.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            53,
            59,
            71
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    },
    {
        "name": "Cm",
        "beat": 94.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            48,
            51,
            55,
            67,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "C5",
                "G4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                72,
                67
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "Eb3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "G3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            }
        ],
        "section": "Theme A (Second Strain & Climax)"
    }
],
    },
    progression_json: JSON.stringify({"key": "C Minor", "time_signature": "3/4", "strumming_pattern": "Waltz Boom-Chick-Chick (3/4)", "educational_focus": "Authentic 3/4 waltz rhythm; melodic phrasing in C minor; bass-chord leap coordination.", "tempo_range": {"min_bpm": 120, "default_bpm": 160, "max_bpm": 184, "gradual_step_bpm": 6}, "chords": [{"name": "Cm", "beat": 1.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 72, 74, 75], "piano_voicings": {"lh_note": "C3", "rh_notes": ["C5", "D5", "Eb5"], "lh_pitches": [48], "rh_pitches": [72, 74, 75], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Cm", "beat": 4.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 72, 74], "piano_voicings": {"lh_note": "C3", "rh_notes": ["D5", "C5", "D5"], "lh_pitches": [48], "rh_pitches": [74, 72, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Cm", "beat": 7.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 74, 75], "piano_voicings": {"lh_note": "C3", "rh_notes": ["Eb5", "D5"], "lh_pitches": [48], "rh_pitches": [75, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "Eb5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "D5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Cm", "beat": 10.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["C5"], "lh_pitches": [48], "rh_pitches": [72], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "G7", "beat": 13.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 71, 72, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B4", "C5", "D5"], "lh_pitches": [43], "rh_pitches": [71, 72, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "G7", "beat": 16.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 71, 72], "piano_voicings": {"lh_note": "G2", "rh_notes": ["C5", "B4", "C5"], "lh_pitches": [43], "rh_pitches": [72, 71, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "G7", "beat": 19.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 72, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D5", "C5"], "lh_pitches": [43], "rh_pitches": [74, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Cm", "beat": 22.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["C5"], "lh_pitches": [48], "rh_pitches": [72], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Fm", "beat": 25.0, "duration_beats": 3.0, "expected_pitches": [41, 56, 60, 77, 79], "piano_voicings": {"lh_note": "F2", "rh_notes": ["F5", "G5"], "lh_pitches": [41], "rh_pitches": [77, 79], "inversion": "root position"}, "melody_notes": [{"pitch": "F2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Ab3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Ab3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C4", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "F5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Fm", "beat": 28.0, "duration_beats": 3.0, "expected_pitches": [41, 56, 60, 79, 80], "piano_voicings": {"lh_note": "F2", "rh_notes": ["Ab5", "G5"], "lh_pitches": [41], "rh_pitches": [80, 79], "inversion": "root position"}, "melody_notes": [{"pitch": "F2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Ab3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Ab3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C4", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "Ab5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Cm", "beat": 31.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 75], "piano_voicings": {"lh_note": "C3", "rh_notes": ["Eb5"], "lh_pitches": [48], "rh_pitches": [75], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "Eb5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Cm", "beat": 34.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 71, 72, 74], "piano_voicings": {"lh_note": "C3", "rh_notes": ["D5", "C5", "B4"], "lh_pitches": [48], "rh_pitches": [74, 72, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "G7", "beat": 37.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D5"], "lh_pitches": [43], "rh_pitches": [74], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "G7", "beat": 40.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 68, 71, 72], "piano_voicings": {"lh_note": "G2", "rh_notes": ["C5", "B4", "Ab4"], "lh_pitches": [43], "rh_pitches": [72, 71, 68], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Ab4", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "G7", "beat": 43.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 67], "piano_voicings": {"lh_note": "G2", "rh_notes": ["G4"], "lh_pitches": [43], "rh_pitches": [67], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G4", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Cm", "beat": 46.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["C5"], "lh_pitches": [48], "rh_pitches": [72], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (First Strain)"}, {"name": "Cm", "beat": 49.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 72, 74, 75], "piano_voicings": {"lh_note": "C3", "rh_notes": ["C5", "D5", "Eb5"], "lh_pitches": [48], "rh_pitches": [72, 74, 75], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Cm", "beat": 52.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 72, 74], "piano_voicings": {"lh_note": "C3", "rh_notes": ["D5", "C5", "D5"], "lh_pitches": [48], "rh_pitches": [74, 72, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Cm", "beat": 55.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 75, 79], "piano_voicings": {"lh_note": "C3", "rh_notes": ["Eb5", "G5"], "lh_pitches": [48], "rh_pitches": [75, 79], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "Eb5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Cm", "beat": 58.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["C5"], "lh_pitches": [48], "rh_pitches": [72], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "G7", "beat": 61.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 71, 72, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B4", "C5", "D5"], "lh_pitches": [43], "rh_pitches": [71, 72, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "G7", "beat": 64.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 71, 72], "piano_voicings": {"lh_note": "G2", "rh_notes": ["C5", "B4", "C5"], "lh_pitches": [43], "rh_pitches": [72, 71, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "G7", "beat": 67.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 74, 77], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D5", "F5"], "lh_pitches": [43], "rh_pitches": [74, 77], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "F5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Cm", "beat": 70.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 75], "piano_voicings": {"lh_note": "C3", "rh_notes": ["Eb5"], "lh_pitches": [48], "rh_pitches": [75], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "Eb5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Fm", "beat": 73.0, "duration_beats": 3.0, "expected_pitches": [41, 56, 60, 77, 79], "piano_voicings": {"lh_note": "F2", "rh_notes": ["F5", "G5"], "lh_pitches": [41], "rh_pitches": [77, 79], "inversion": "root position"}, "melody_notes": [{"pitch": "F2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Ab3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Ab3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C4", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "F5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Fm", "beat": 76.0, "duration_beats": 3.0, "expected_pitches": [41, 56, 60, 79, 80], "piano_voicings": {"lh_note": "F2", "rh_notes": ["Ab5", "G5"], "lh_pitches": [41], "rh_pitches": [80, 79], "inversion": "root position"}, "melody_notes": [{"pitch": "F2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Ab3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Ab3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C4", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "Ab5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Cm", "beat": 79.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 75], "piano_voicings": {"lh_note": "C3", "rh_notes": ["Eb5"], "lh_pitches": [48], "rh_pitches": [75], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "Eb5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Cm", "beat": 82.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 71, 72, 74], "piano_voicings": {"lh_note": "C3", "rh_notes": ["D5", "C5", "B4"], "lh_pitches": [48], "rh_pitches": [74, 72, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "G7", "beat": 85.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D5"], "lh_pitches": [43], "rh_pitches": [74], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D5", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "G7", "beat": 88.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 71, 72, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["C5", "B4", "D5"], "lh_pitches": [43], "rh_pitches": [72, 71, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 2, "duration": 1, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "G7", "beat": 91.0, "duration_beats": 3.0, "expected_pitches": [43, 53, 59, 71], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B4"], "lh_pitches": [43], "rh_pitches": [71], "inversion": "root position"}, "melody_notes": [{"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "B4", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}, {"name": "Cm", "beat": 94.0, "duration_beats": 3.0, "expected_pitches": [48, 51, 55, 67, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["C5", "G4"], "lh_pitches": [48], "rh_pitches": [72, 67], "inversion": "root position"}, "melody_notes": [{"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "Eb3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "G3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G4", "beatOffset": 0, "duration": 3, "clef": "treble"}], "section": "Theme A (Second Strain & Climax)"}]}),
  },
  {
    id: "ex_piano_canon",
    title: "Pachelbel's Canon Harmonic Flow (Full 32-Measure Classical Score)",
    artist: "Johann Pachelbel",
    composer: "Johann Pachelbel",
    description: "Complete 32-measure authentic classical score from IMSLP. Features 4 distinct variations (Theme Exposition, Counterpoint, Running Polyphony, Grand Cadence) with measure-by-measure right-hand melody noteheads and steady left-hand basso ostinato.",
    instrument: "piano",
    tempo_bpm: 68,
    difficulty: 2,
    progression: {
      key: "C Major",
      tempo_range: {"min_bpm": 48, "default_bpm": 68, "max_bpm": 88, "gradual_step_bpm": 4},
      chords: [
    {
        "name": "C",
        "beat": 1.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            64,
            67,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 1"
    },
    {
        "name": "G",
        "beat": 5.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            62,
            67,
            71
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 1"
    },
    {
        "name": "Am",
        "beat": 9.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            60,
            64,
            69
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "C4",
                "E4",
                "A4"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                60,
                64,
                69
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 1"
    },
    {
        "name": "Em",
        "beat": 13.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            59,
            64,
            67
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "B3",
                "E4",
                "G4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                59,
                64,
                67
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 1"
    },
    {
        "name": "F",
        "beat": 17.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            57,
            60,
            65
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 1"
    },
    {
        "name": "C",
        "beat": 21.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                55,
                60,
                64
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 1"
    },
    {
        "name": "F",
        "beat": 25.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            57,
            60,
            65
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 1"
    },
    {
        "name": "G",
        "beat": 29.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            59,
            62,
            67
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "G4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                67
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 1"
    },
    {
        "name": "C",
        "beat": 33.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            64,
            67,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 2"
    },
    {
        "name": "G",
        "beat": 37.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            62,
            67,
            71
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 2"
    },
    {
        "name": "Am",
        "beat": 41.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            60,
            64,
            69
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "C4",
                "E4",
                "A4"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                60,
                64,
                69
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 2"
    },
    {
        "name": "Em",
        "beat": 45.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            59,
            64,
            67
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "B3",
                "E4",
                "G4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                59,
                64,
                67
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 2"
    },
    {
        "name": "F",
        "beat": 49.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            57,
            60,
            65
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 2"
    },
    {
        "name": "C",
        "beat": 53.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                55,
                60,
                64
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 2"
    },
    {
        "name": "F",
        "beat": 57.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            57,
            60,
            65
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 2"
    },
    {
        "name": "G",
        "beat": 61.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            59,
            62,
            67
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "G4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                67
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 2"
    },
    {
        "name": "C",
        "beat": 65.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            64,
            67,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 3"
    },
    {
        "name": "G",
        "beat": 69.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            62,
            67,
            71
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 3"
    },
    {
        "name": "Am",
        "beat": 73.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            60,
            64,
            69
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "C4",
                "E4",
                "A4"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                60,
                64,
                69
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 3"
    },
    {
        "name": "Em",
        "beat": 77.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            59,
            64,
            67
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "B3",
                "E4",
                "G4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                59,
                64,
                67
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 3"
    },
    {
        "name": "F",
        "beat": 81.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            57,
            60,
            65
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 3"
    },
    {
        "name": "C",
        "beat": 85.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                55,
                60,
                64
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 3"
    },
    {
        "name": "F",
        "beat": 89.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            57,
            60,
            65
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 3"
    },
    {
        "name": "G",
        "beat": 93.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            59,
            62,
            67
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "G4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                67
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 3"
    },
    {
        "name": "C",
        "beat": 97.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            64,
            67,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 4"
    },
    {
        "name": "G",
        "beat": 101.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            62,
            67,
            71
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 4"
    },
    {
        "name": "Am",
        "beat": 105.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            60,
            64,
            69
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "C4",
                "E4",
                "A4"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                60,
                64,
                69
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 4"
    },
    {
        "name": "Em",
        "beat": 109.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            40,
            59,
            64,
            67
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "B3",
                "E4",
                "G4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                59,
                64,
                67
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 4"
    },
    {
        "name": "F",
        "beat": 113.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            57,
            60,
            65
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 4"
    },
    {
        "name": "C",
        "beat": 117.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                55,
                60,
                64
            ],
            "inversion": "1st inversion"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 4"
    },
    {
        "name": "F",
        "beat": 121.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            57,
            60,
            65
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 4"
    },
    {
        "name": "C",
        "beat": 125.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "variation": "Variation 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "C Major", "time_signature": "4/4", "strumming_pattern": "Grand Staff Polyphony", "educational_focus": "Authentic Grand Staff sight reading; smooth voice leading and ledger lines.", "tempo_range": {"min_bpm": 48, "default_bpm": 68, "max_bpm": 88, "gradual_step_bpm": 4}, "chords": [{"name": "C", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [48, 64, 67, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 1"}, {"name": "G", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [43, 62, 67, 71], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 1"}, {"name": "Am", "beat": 9.0, "duration_beats": 4.0, "expected_pitches": [45, 60, 64, 69], "piano_voicings": {"lh_note": "A2", "rh_notes": ["C4", "E4", "A4"], "lh_pitches": [45], "rh_pitches": [60, 64, 69], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 1"}, {"name": "Em", "beat": 13.0, "duration_beats": 4.0, "expected_pitches": [40, 59, 64, 67], "piano_voicings": {"lh_note": "E2", "rh_notes": ["B3", "E4", "G4"], "lh_pitches": [40], "rh_pitches": [59, 64, 67], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 1"}, {"name": "F", "beat": 17.0, "duration_beats": 4.0, "expected_pitches": [41, 57, 60, 65], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 1"}, {"name": "C", "beat": 21.0, "duration_beats": 4.0, "expected_pitches": [48, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [55, 60, 64], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 1"}, {"name": "F", "beat": 25.0, "duration_beats": 4.0, "expected_pitches": [41, 57, 60, 65], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 1"}, {"name": "G", "beat": 29.0, "duration_beats": 4.0, "expected_pitches": [43, 59, 62, 67], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "G4"], "lh_pitches": [43], "rh_pitches": [59, 62, 67], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 1"}, {"name": "C", "beat": 33.0, "duration_beats": 4.0, "expected_pitches": [48, 64, 67, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 2"}, {"name": "G", "beat": 37.0, "duration_beats": 4.0, "expected_pitches": [43, 62, 67, 71], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 2"}, {"name": "Am", "beat": 41.0, "duration_beats": 4.0, "expected_pitches": [45, 60, 64, 69], "piano_voicings": {"lh_note": "A2", "rh_notes": ["C4", "E4", "A4"], "lh_pitches": [45], "rh_pitches": [60, 64, 69], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 2"}, {"name": "Em", "beat": 45.0, "duration_beats": 4.0, "expected_pitches": [40, 59, 64, 67], "piano_voicings": {"lh_note": "E2", "rh_notes": ["B3", "E4", "G4"], "lh_pitches": [40], "rh_pitches": [59, 64, 67], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 2"}, {"name": "F", "beat": 49.0, "duration_beats": 4.0, "expected_pitches": [41, 57, 60, 65], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 2"}, {"name": "C", "beat": 53.0, "duration_beats": 4.0, "expected_pitches": [48, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [55, 60, 64], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "B3", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 2"}, {"name": "F", "beat": 57.0, "duration_beats": 4.0, "expected_pitches": [41, 57, 60, 65], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 2"}, {"name": "G", "beat": 61.0, "duration_beats": 4.0, "expected_pitches": [43, 59, 62, 67], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "G4"], "lh_pitches": [43], "rh_pitches": [59, 62, 67], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 2"}, {"name": "C", "beat": 65.0, "duration_beats": 4.0, "expected_pitches": [48, 64, 67, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 3"}, {"name": "G", "beat": 69.0, "duration_beats": 4.0, "expected_pitches": [43, 62, 67, 71], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 3"}, {"name": "Am", "beat": 73.0, "duration_beats": 4.0, "expected_pitches": [45, 60, 64, 69], "piano_voicings": {"lh_note": "A2", "rh_notes": ["C4", "E4", "A4"], "lh_pitches": [45], "rh_pitches": [60, 64, 69], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 3"}, {"name": "Em", "beat": 77.0, "duration_beats": 4.0, "expected_pitches": [40, 59, 64, 67], "piano_voicings": {"lh_note": "E2", "rh_notes": ["B3", "E4", "G4"], "lh_pitches": [40], "rh_pitches": [59, 64, 67], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 3"}, {"name": "F", "beat": 81.0, "duration_beats": 4.0, "expected_pitches": [41, 57, 60, 65], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "A4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 3"}, {"name": "C", "beat": 85.0, "duration_beats": 4.0, "expected_pitches": [48, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [55, 60, 64], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 3"}, {"name": "F", "beat": 89.0, "duration_beats": 4.0, "expected_pitches": [41, 57, 60, 65], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "A4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 3"}, {"name": "G", "beat": 93.0, "duration_beats": 4.0, "expected_pitches": [43, 59, 62, 67], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "G4"], "lh_pitches": [43], "rh_pitches": [59, 62, 67], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 3"}, {"name": "C", "beat": 97.0, "duration_beats": 4.0, "expected_pitches": [48, 64, 67, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 4"}, {"name": "G", "beat": 101.0, "duration_beats": 4.0, "expected_pitches": [43, 62, 67, 71], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 4"}, {"name": "Am", "beat": 105.0, "duration_beats": 4.0, "expected_pitches": [45, 60, 64, 69], "piano_voicings": {"lh_note": "A2", "rh_notes": ["C4", "E4", "A4"], "lh_pitches": [45], "rh_pitches": [60, 64, 69], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 4"}, {"name": "Em", "beat": 109.0, "duration_beats": 4.0, "expected_pitches": [40, 59, 64, 67], "piano_voicings": {"lh_note": "E2", "rh_notes": ["B3", "E4", "G4"], "lh_pitches": [40], "rh_pitches": [59, 64, 67], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 4"}, {"name": "F", "beat": 113.0, "duration_beats": 4.0, "expected_pitches": [41, 57, 60, 65], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 4"}, {"name": "C", "beat": 117.0, "duration_beats": 4.0, "expected_pitches": [48, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [55, 60, 64], "inversion": "1st inversion"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 4"}, {"name": "F", "beat": 121.0, "duration_beats": 4.0, "expected_pitches": [41, 57, 60, 65], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 4"}, {"name": "C", "beat": 125.0, "duration_beats": 4.0, "expected_pitches": [48, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "variation": "Variation 4"}]}),
  },
  {
    id: "ex_piano_fur_elise",
    title: "F\u00fcr Elise (Bagatelle No. 25 in A minor, WoO 59)",
    artist: "Ludwig van Beethoven",
    composer: "Ludwig van Beethoven",
    description: "Beethoven's immortal 24-measure masterwork. Features the beloved chromatic motif (E5 - D#5) and delicate arpeggiated left-hand accompaniment.",
    instrument: "piano",
    tempo_bpm: 132,
    difficulty: 2,
    progression: {
      key: "A Minor",
      tempo_range: {"min_bpm": 100, "default_bpm": 132, "max_bpm": 160, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "Am",
        "beat": 1.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            71,
            75,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 4.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            69,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 1.5,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "E7",
        "beat": 7.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            60,
            64,
            69,
            71
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "D4",
                "G#4",
                "B4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                62,
                68,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 10.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            64,
            68,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 13.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            71,
            75,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 16.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            69,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 1.5,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "E7",
        "beat": 19.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            60,
            64,
            69,
            71
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "D4",
                "G#4",
                "B4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                62,
                68,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 22.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            64,
            68,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 25.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            71,
            75,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 28.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            69,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 1.5,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "E7",
        "beat": 31.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            60,
            64,
            69,
            71
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "D4",
                "G#4",
                "B4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                62,
                68,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 34.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            64,
            68,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 37.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            71,
            75,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 40.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            69,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 1.5,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "E7",
        "beat": 43.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            60,
            64,
            69,
            71
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "D4",
                "G#4",
                "B4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                62,
                68,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 46.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            64,
            68,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 49.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            71,
            75,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 52.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            69,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 1.5,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "E7",
        "beat": 55.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            60,
            64,
            69,
            71
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "D4",
                "G#4",
                "B4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                62,
                68,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 58.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            64,
            68,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 61.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            71,
            75,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 64.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            52,
            69,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 1.5,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "E7",
        "beat": 67.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            60,
            64,
            69,
            71
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "D4",
                "G#4",
                "B4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                62,
                68,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    },
    {
        "name": "Am",
        "beat": 70.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            45,
            64,
            68,
            71,
            72
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "E4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                64,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Main Theme (Poco moto)"
    }
],
    },
    progression_json: JSON.stringify({"key": "A Minor", "time_signature": "3/8", "strumming_pattern": "Poco Moto Arpeggiated Flow", "educational_focus": "Light touch on recurring semitone oscillations (E5-D#5) and smooth left-hand arpeggiation.", "tempo_range": {"min_bpm": 100, "default_bpm": 132, "max_bpm": 160, "gradual_step_bpm": 5}, "chords": [{"name": "Am", "beat": 1.0, "duration_beats": 3.0, "expected_pitches": [45, 71, 75, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 4.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 69, 72, 74], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 1.5, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1.5, "duration": 1.5, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "E7", "beat": 7.0, "duration_beats": 3.0, "expected_pitches": [40, 60, 64, 69, 71], "piano_voicings": {"lh_note": "E2", "rh_notes": ["D4", "G#4", "B4"], "lh_pitches": [40], "rh_pitches": [62, 68, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "C4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 10.0, "duration_beats": 3.0, "expected_pitches": [45, 64, 68, 71, 72], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "G#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 13.0, "duration_beats": 3.0, "expected_pitches": [45, 71, 75, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 16.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 69, 72, 74], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 1.5, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1.5, "duration": 1.5, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "E7", "beat": 19.0, "duration_beats": 3.0, "expected_pitches": [40, 60, 64, 69, 71], "piano_voicings": {"lh_note": "E2", "rh_notes": ["D4", "G#4", "B4"], "lh_pitches": [40], "rh_pitches": [62, 68, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "C4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 22.0, "duration_beats": 3.0, "expected_pitches": [45, 64, 68, 71, 72], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "G#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 25.0, "duration_beats": 3.0, "expected_pitches": [45, 71, 75, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 28.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 69, 72, 74], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 1.5, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1.5, "duration": 1.5, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "E7", "beat": 31.0, "duration_beats": 3.0, "expected_pitches": [40, 60, 64, 69, 71], "piano_voicings": {"lh_note": "E2", "rh_notes": ["D4", "G#4", "B4"], "lh_pitches": [40], "rh_pitches": [62, 68, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "C4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 34.0, "duration_beats": 3.0, "expected_pitches": [45, 64, 68, 71, 72], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "G#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 37.0, "duration_beats": 3.0, "expected_pitches": [45, 71, 75, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 40.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 69, 72, 74], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 1.5, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1.5, "duration": 1.5, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "E7", "beat": 43.0, "duration_beats": 3.0, "expected_pitches": [40, 60, 64, 69, 71], "piano_voicings": {"lh_note": "E2", "rh_notes": ["D4", "G#4", "B4"], "lh_pitches": [40], "rh_pitches": [62, 68, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "C4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 46.0, "duration_beats": 3.0, "expected_pitches": [45, 64, 68, 71, 72], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "G#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 49.0, "duration_beats": 3.0, "expected_pitches": [45, 71, 75, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 52.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 69, 72, 74], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 1.5, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1.5, "duration": 1.5, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "E7", "beat": 55.0, "duration_beats": 3.0, "expected_pitches": [40, 60, 64, 69, 71], "piano_voicings": {"lh_note": "E2", "rh_notes": ["D4", "G#4", "B4"], "lh_pitches": [40], "rh_pitches": [62, 68, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "C4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 58.0, "duration_beats": 3.0, "expected_pitches": [45, 64, 68, 71, 72], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "G#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 61.0, "duration_beats": 3.0, "expected_pitches": [45, 71, 75, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D#5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 64.0, "duration_beats": 3.0, "expected_pitches": [45, 52, 69, 72, 74], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 1.5, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1.5, "duration": 1.5, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "E7", "beat": 67.0, "duration_beats": 3.0, "expected_pitches": [40, 60, 64, 69, 71], "piano_voicings": {"lh_note": "E2", "rh_notes": ["D4", "G#4", "B4"], "lh_pitches": [40], "rh_pitches": [62, 68, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "C4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}, {"name": "Am", "beat": 70.0, "duration_beats": 3.0, "expected_pitches": [45, 64, 68, 71, 72], "piano_voicings": {"lh_note": "A2", "rh_notes": ["E4", "A4", "C5"], "lh_pitches": [45], "rh_pitches": [64, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "G#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 1.5, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Main Theme (Poco moto)"}]}),
  },
  {
    id: "ex_piano_gymnopedie_1",
    title: "Gymnop\u00e9die No. 1 (Lent et douloureux)",
    artist: "Erik Satie",
    composer: "Erik Satie",
    description: "Atmospheric 16-measure Impressionist masterwork (1888). Features floating major 7th harmonies (Gmaj7 - Dmaj7) and gentle bass leaps.",
    instrument: "piano",
    tempo_bpm: 72,
    difficulty: 2,
    progression: {
      key: "D Major",
      tempo_range: {"min_bpm": 55, "default_bpm": 72, "max_bpm": 90, "gradual_step_bpm": 4},
      chords: [
    {
        "name": "Gmaj7",
        "beat": 1.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            66,
            78
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "F#4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                66
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F#5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 1"
    },
    {
        "name": "Dmaj7",
        "beat": 4.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            38,
            57,
            61,
            76
        ],
        "piano_voicings": {
            "lh_note": "D2",
            "rh_notes": [
                "F#3",
                "A3",
                "C#4"
            ],
            "lh_pitches": [
                38
            ],
            "rh_pitches": [
                54,
                57,
                61
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "A3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "A3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 1"
    },
    {
        "name": "Gmaj7",
        "beat": 7.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            62,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "F#4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                66
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 1"
    },
    {
        "name": "Dmaj7",
        "beat": 10.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            38,
            54,
            61,
            73
        ],
        "piano_voicings": {
            "lh_note": "D2",
            "rh_notes": [
                "F#3",
                "A3",
                "C#4"
            ],
            "lh_pitches": [
                38
            ],
            "rh_pitches": [
                54,
                57,
                61
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C#5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 1"
    },
    {
        "name": "Gmaj7",
        "beat": 13.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            66,
            78
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "F#4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                66
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F#5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 2"
    },
    {
        "name": "Dmaj7",
        "beat": 16.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            38,
            57,
            61,
            76
        ],
        "piano_voicings": {
            "lh_note": "D2",
            "rh_notes": [
                "F#3",
                "A3",
                "C#4"
            ],
            "lh_pitches": [
                38
            ],
            "rh_pitches": [
                54,
                57,
                61
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "A3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "A3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 2"
    },
    {
        "name": "Gmaj7",
        "beat": 19.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            62,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "F#4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                66
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 2"
    },
    {
        "name": "Dmaj7",
        "beat": 22.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            38,
            54,
            61,
            73
        ],
        "piano_voicings": {
            "lh_note": "D2",
            "rh_notes": [
                "F#3",
                "A3",
                "C#4"
            ],
            "lh_pitches": [
                38
            ],
            "rh_pitches": [
                54,
                57,
                61
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C#5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 2"
    },
    {
        "name": "Gmaj7",
        "beat": 25.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            66,
            78
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "F#4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                66
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F#5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 3"
    },
    {
        "name": "Dmaj7",
        "beat": 28.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            38,
            57,
            61,
            76
        ],
        "piano_voicings": {
            "lh_note": "D2",
            "rh_notes": [
                "F#3",
                "A3",
                "C#4"
            ],
            "lh_pitches": [
                38
            ],
            "rh_pitches": [
                54,
                57,
                61
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "A3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "A3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 3"
    },
    {
        "name": "Gmaj7",
        "beat": 31.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            62,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "F#4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                66
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 3"
    },
    {
        "name": "Dmaj7",
        "beat": 34.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            38,
            54,
            61,
            73
        ],
        "piano_voicings": {
            "lh_note": "D2",
            "rh_notes": [
                "F#3",
                "A3",
                "C#4"
            ],
            "lh_pitches": [
                38
            ],
            "rh_pitches": [
                54,
                57,
                61
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C#5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 3"
    },
    {
        "name": "Gmaj7",
        "beat": 37.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            66,
            78
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "F#4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                66
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F#5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 4"
    },
    {
        "name": "Dmaj7",
        "beat": 40.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            38,
            57,
            61,
            76
        ],
        "piano_voicings": {
            "lh_note": "D2",
            "rh_notes": [
                "F#3",
                "A3",
                "C#4"
            ],
            "lh_pitches": [
                38
            ],
            "rh_pitches": [
                54,
                57,
                61
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "A3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "A3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 4"
    },
    {
        "name": "Gmaj7",
        "beat": 43.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            59,
            62,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "F#4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                66
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "B3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 4"
    },
    {
        "name": "Dmaj7",
        "beat": 46.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            38,
            54,
            61,
            73
        ],
        "piano_voicings": {
            "lh_note": "D2",
            "rh_notes": [
                "F#3",
                "A3",
                "C#4"
            ],
            "lh_pitches": [
                38
            ],
            "rh_pitches": [
                54,
                57,
                61
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C#5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F#3",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "C#4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Lento Movement Part 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "D Major", "time_signature": "3/4", "strumming_pattern": "Lento Floating Chords (3/4)", "educational_focus": "Sustained legato touch, gentle bass leap coordination, and meditative phrasing.", "tempo_range": {"min_bpm": 55, "default_bpm": 72, "max_bpm": 90, "gradual_step_bpm": 4}, "chords": [{"name": "Gmaj7", "beat": 1.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 66, 78], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "F#4"], "lh_pitches": [43], "rh_pitches": [59, 62, 66], "inversion": "root position"}, "melody_notes": [{"pitch": "F#5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "F#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 1"}, {"name": "Dmaj7", "beat": 4.0, "duration_beats": 3.0, "expected_pitches": [38, 57, 61, 76], "piano_voicings": {"lh_note": "D2", "rh_notes": ["F#3", "A3", "C#4"], "lh_pitches": [38], "rh_pitches": [54, 57, 61], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "A3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "A3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 1"}, {"name": "Gmaj7", "beat": 7.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 62, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "F#4"], "lh_pitches": [43], "rh_pitches": [59, 62, 66], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "D4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 1"}, {"name": "Dmaj7", "beat": 10.0, "duration_beats": 3.0, "expected_pitches": [38, 54, 61, 73], "piano_voicings": {"lh_note": "D2", "rh_notes": ["F#3", "A3", "C#4"], "lh_pitches": [38], "rh_pitches": [54, 57, 61], "inversion": "root position"}, "melody_notes": [{"pitch": "C#5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F#3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F#3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 1"}, {"name": "Gmaj7", "beat": 13.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 66, 78], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "F#4"], "lh_pitches": [43], "rh_pitches": [59, 62, 66], "inversion": "root position"}, "melody_notes": [{"pitch": "F#5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "F#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 2"}, {"name": "Dmaj7", "beat": 16.0, "duration_beats": 3.0, "expected_pitches": [38, 57, 61, 76], "piano_voicings": {"lh_note": "D2", "rh_notes": ["F#3", "A3", "C#4"], "lh_pitches": [38], "rh_pitches": [54, 57, 61], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "A3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "A3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 2"}, {"name": "Gmaj7", "beat": 19.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 62, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "F#4"], "lh_pitches": [43], "rh_pitches": [59, 62, 66], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "D4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 2"}, {"name": "Dmaj7", "beat": 22.0, "duration_beats": 3.0, "expected_pitches": [38, 54, 61, 73], "piano_voicings": {"lh_note": "D2", "rh_notes": ["F#3", "A3", "C#4"], "lh_pitches": [38], "rh_pitches": [54, 57, 61], "inversion": "root position"}, "melody_notes": [{"pitch": "C#5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F#3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F#3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 2"}, {"name": "Gmaj7", "beat": 25.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 66, 78], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "F#4"], "lh_pitches": [43], "rh_pitches": [59, 62, 66], "inversion": "root position"}, "melody_notes": [{"pitch": "F#5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "F#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 3"}, {"name": "Dmaj7", "beat": 28.0, "duration_beats": 3.0, "expected_pitches": [38, 57, 61, 76], "piano_voicings": {"lh_note": "D2", "rh_notes": ["F#3", "A3", "C#4"], "lh_pitches": [38], "rh_pitches": [54, 57, 61], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "A3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "A3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 3"}, {"name": "Gmaj7", "beat": 31.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 62, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "F#4"], "lh_pitches": [43], "rh_pitches": [59, 62, 66], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "D4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 3"}, {"name": "Dmaj7", "beat": 34.0, "duration_beats": 3.0, "expected_pitches": [38, 54, 61, 73], "piano_voicings": {"lh_note": "D2", "rh_notes": ["F#3", "A3", "C#4"], "lh_pitches": [38], "rh_pitches": [54, 57, 61], "inversion": "root position"}, "melody_notes": [{"pitch": "C#5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F#3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F#3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 3"}, {"name": "Gmaj7", "beat": 37.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 66, 78], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "F#4"], "lh_pitches": [43], "rh_pitches": [59, 62, 66], "inversion": "root position"}, "melody_notes": [{"pitch": "F#5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "F#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 4"}, {"name": "Dmaj7", "beat": 40.0, "duration_beats": 3.0, "expected_pitches": [38, 57, 61, 76], "piano_voicings": {"lh_note": "D2", "rh_notes": ["F#3", "A3", "C#4"], "lh_pitches": [38], "rh_pitches": [54, 57, 61], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "A3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "A3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 4"}, {"name": "Gmaj7", "beat": 43.0, "duration_beats": 3.0, "expected_pitches": [43, 59, 62, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "F#4"], "lh_pitches": [43], "rh_pitches": [59, 62, 66], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "D4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "B3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "D4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 4"}, {"name": "Dmaj7", "beat": 46.0, "duration_beats": 3.0, "expected_pitches": [38, 54, 61, 73], "piano_voicings": {"lh_note": "D2", "rh_notes": ["F#3", "A3", "C#4"], "lh_pitches": [38], "rh_pitches": [54, 57, 61], "inversion": "root position"}, "melody_notes": [{"pitch": "C#5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F#3", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 1, "duration": 1, "clef": "bass"}, {"pitch": "F#3", "beatOffset": 2, "duration": 1, "clef": "bass"}, {"pitch": "C#4", "beatOffset": 2, "duration": 1, "clef": "bass"}], "section": "Lento Movement Part 4"}]}),
  },
  {
    id: "ex_piano_moonlight_sonata",
    title: "Moonlight Sonata (Piano Sonata No. 14, Op. 27 No. 2)",
    artist: "Ludwig van Beethoven",
    composer: "Ludwig van Beethoven",
    description: "Beethoven's hypnotic 16-measure Adagio Sostenuto. Features rolling triplet arpeggios beneath a singing sustained melody and deep bass pedal points.",
    instrument: "piano",
    tempo_bpm: 54,
    difficulty: 3,
    progression: {
      key: "C Minor",
      tempo_range: {"min_bpm": 42, "default_bpm": 54, "max_bpm": 70, "gradual_step_bpm": 3},
      chords: [
    {
        "name": "Cm",
        "beat": 1.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            36,
            55,
            60,
            63,
            67
        ],
        "piano_voicings": {
            "lh_note": "C2",
            "rh_notes": [
                "G3",
                "C4",
                "Eb4"
            ],
            "lh_pitches": [
                36
            ],
            "rh_pitches": [
                55,
                60,
                63
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 1"
    },
    {
        "name": "Fm",
        "beat": 5.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            56,
            60,
            65,
            68
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "Ab3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                56,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "Ab4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 1"
    },
    {
        "name": "G7",
        "beat": 9.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            53,
            59,
            62,
            65
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 1"
    },
    {
        "name": "Cm",
        "beat": 13.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            36,
            55,
            60,
            63
        ],
        "piano_voicings": {
            "lh_note": "C2",
            "rh_notes": [
                "G3",
                "C4",
                "Eb4"
            ],
            "lh_pitches": [
                36
            ],
            "rh_pitches": [
                55,
                60,
                63
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "Eb4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 1"
    },
    {
        "name": "Cm",
        "beat": 17.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            36,
            55,
            60,
            63,
            67
        ],
        "piano_voicings": {
            "lh_note": "C2",
            "rh_notes": [
                "G3",
                "C4",
                "Eb4"
            ],
            "lh_pitches": [
                36
            ],
            "rh_pitches": [
                55,
                60,
                63
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 2"
    },
    {
        "name": "Fm",
        "beat": 21.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            56,
            60,
            65,
            68
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "Ab3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                56,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "Ab4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 2"
    },
    {
        "name": "G7",
        "beat": 25.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            53,
            59,
            62,
            65
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 2"
    },
    {
        "name": "Cm",
        "beat": 29.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            36,
            55,
            60,
            63
        ],
        "piano_voicings": {
            "lh_note": "C2",
            "rh_notes": [
                "G3",
                "C4",
                "Eb4"
            ],
            "lh_pitches": [
                36
            ],
            "rh_pitches": [
                55,
                60,
                63
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "Eb4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 2"
    },
    {
        "name": "Cm",
        "beat": 33.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            36,
            55,
            60,
            63,
            67
        ],
        "piano_voicings": {
            "lh_note": "C2",
            "rh_notes": [
                "G3",
                "C4",
                "Eb4"
            ],
            "lh_pitches": [
                36
            ],
            "rh_pitches": [
                55,
                60,
                63
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 3"
    },
    {
        "name": "Fm",
        "beat": 37.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            56,
            60,
            65,
            68
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "Ab3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                56,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "Ab4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 3"
    },
    {
        "name": "G7",
        "beat": 41.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            53,
            59,
            62,
            65
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 3"
    },
    {
        "name": "Cm",
        "beat": 45.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            36,
            55,
            60,
            63
        ],
        "piano_voicings": {
            "lh_note": "C2",
            "rh_notes": [
                "G3",
                "C4",
                "Eb4"
            ],
            "lh_pitches": [
                36
            ],
            "rh_pitches": [
                55,
                60,
                63
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "Eb4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 3"
    },
    {
        "name": "Cm",
        "beat": 49.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            36,
            55,
            60,
            63,
            67
        ],
        "piano_voicings": {
            "lh_note": "C2",
            "rh_notes": [
                "G3",
                "C4",
                "Eb4"
            ],
            "lh_pitches": [
                36
            ],
            "rh_pitches": [
                55,
                60,
                63
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 4"
    },
    {
        "name": "Fm",
        "beat": 53.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            41,
            56,
            60,
            65,
            68
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "Ab3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                56,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "Ab4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "Ab3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 4"
    },
    {
        "name": "G7",
        "beat": 57.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            53,
            59,
            62,
            65
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "B3",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 4"
    },
    {
        "name": "Cm",
        "beat": 61.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            36,
            55,
            60,
            63
        ],
        "piano_voicings": {
            "lh_note": "C2",
            "rh_notes": [
                "G3",
                "C4",
                "Eb4"
            ],
            "lh_pitches": [
                36
            ],
            "rh_pitches": [
                55,
                60,
                63
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "Eb4",
                "beatOffset": 0,
                "duration": 4,
                "clef": "treble"
            },
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "Eb4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 3,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Adagio Sostenuto Part 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "C Minor", "time_signature": "4/4", "strumming_pattern": "Adagio Sostenuto Triplet Figurations", "educational_focus": "Quiet, delicate ostinato triplets with clear projection of the upper melodic line.", "tempo_range": {"min_bpm": 42, "default_bpm": 54, "max_bpm": 70, "gradual_step_bpm": 3}, "chords": [{"name": "Cm", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [36, 55, 60, 63, 67], "piano_voicings": {"lh_note": "C2", "rh_notes": ["G3", "C4", "Eb4"], "lh_pitches": [36], "rh_pitches": [55, 60, 63], "inversion": "root position"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "C2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 1"}, {"name": "Fm", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [41, 56, 60, 65, 68], "piano_voicings": {"lh_note": "F2", "rh_notes": ["Ab3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [56, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "Ab4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "Ab3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 1"}, {"name": "G7", "beat": 9.0, "duration_beats": 4.0, "expected_pitches": [43, 53, 59, 62, 65], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "B3", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 1"}, {"name": "Cm", "beat": 13.0, "duration_beats": 4.0, "expected_pitches": [36, 55, 60, 63], "piano_voicings": {"lh_note": "C2", "rh_notes": ["G3", "C4", "Eb4"], "lh_pitches": [36], "rh_pitches": [55, 60, 63], "inversion": "root position"}, "melody_notes": [{"pitch": "Eb4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "C2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 1"}, {"name": "Cm", "beat": 17.0, "duration_beats": 4.0, "expected_pitches": [36, 55, 60, 63, 67], "piano_voicings": {"lh_note": "C2", "rh_notes": ["G3", "C4", "Eb4"], "lh_pitches": [36], "rh_pitches": [55, 60, 63], "inversion": "root position"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "C2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 2"}, {"name": "Fm", "beat": 21.0, "duration_beats": 4.0, "expected_pitches": [41, 56, 60, 65, 68], "piano_voicings": {"lh_note": "F2", "rh_notes": ["Ab3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [56, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "Ab4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "Ab3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 2"}, {"name": "G7", "beat": 25.0, "duration_beats": 4.0, "expected_pitches": [43, 53, 59, 62, 65], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "B3", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 2"}, {"name": "Cm", "beat": 29.0, "duration_beats": 4.0, "expected_pitches": [36, 55, 60, 63], "piano_voicings": {"lh_note": "C2", "rh_notes": ["G3", "C4", "Eb4"], "lh_pitches": [36], "rh_pitches": [55, 60, 63], "inversion": "root position"}, "melody_notes": [{"pitch": "Eb4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "C2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 2"}, {"name": "Cm", "beat": 33.0, "duration_beats": 4.0, "expected_pitches": [36, 55, 60, 63, 67], "piano_voicings": {"lh_note": "C2", "rh_notes": ["G3", "C4", "Eb4"], "lh_pitches": [36], "rh_pitches": [55, 60, 63], "inversion": "root position"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "C2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 3"}, {"name": "Fm", "beat": 37.0, "duration_beats": 4.0, "expected_pitches": [41, 56, 60, 65, 68], "piano_voicings": {"lh_note": "F2", "rh_notes": ["Ab3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [56, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "Ab4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "Ab3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 3"}, {"name": "G7", "beat": 41.0, "duration_beats": 4.0, "expected_pitches": [43, 53, 59, 62, 65], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "B3", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 3"}, {"name": "Cm", "beat": 45.0, "duration_beats": 4.0, "expected_pitches": [36, 55, 60, 63], "piano_voicings": {"lh_note": "C2", "rh_notes": ["G3", "C4", "Eb4"], "lh_pitches": [36], "rh_pitches": [55, 60, 63], "inversion": "root position"}, "melody_notes": [{"pitch": "Eb4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "C2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 3"}, {"name": "Cm", "beat": 49.0, "duration_beats": 4.0, "expected_pitches": [36, 55, 60, 63, 67], "piano_voicings": {"lh_note": "C2", "rh_notes": ["G3", "C4", "Eb4"], "lh_pitches": [36], "rh_pitches": [55, 60, 63], "inversion": "root position"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "C2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 4"}, {"name": "Fm", "beat": 53.0, "duration_beats": 4.0, "expected_pitches": [41, 56, 60, 65, 68], "piano_voicings": {"lh_note": "F2", "rh_notes": ["Ab3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [56, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "Ab4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "Ab3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 4"}, {"name": "G7", "beat": 57.0, "duration_beats": 4.0, "expected_pitches": [43, 53, 59, 62, 65], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B3", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "B3", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 4"}, {"name": "Cm", "beat": 61.0, "duration_beats": 4.0, "expected_pitches": [36, 55, 60, 63], "piano_voicings": {"lh_note": "C2", "rh_notes": ["G3", "C4", "Eb4"], "lh_pitches": [36], "rh_pitches": [55, 60, 63], "inversion": "root position"}, "melody_notes": [{"pitch": "Eb4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "Eb4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 3, "duration": 1, "clef": "treble"}, {"pitch": "C2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Adagio Sostenuto Part 4"}]}),
  },
  {
    id: "ex_piano_bach_minuet_g",
    title: "Minuet in G major (BWV Anh. 114)",
    artist: "J.S. Bach / Christian Petzold",
    composer: "Christian Petzold / Notebook for Anna Magdalena Bach",
    description: "Foundational 16-measure Baroque keyboard minuet. Teaches essential two-part contrapuntal coordination between Treble melody and Bass foundation.",
    instrument: "piano",
    tempo_bpm: 116,
    difficulty: 2,
    progression: {
      key: "G Major",
      tempo_range: {"min_bpm": 85, "default_bpm": 116, "max_bpm": 140, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "G",
        "beat": 1.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            67,
            69,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 1"
    },
    {
        "name": "D",
        "beat": 4.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            67,
            74
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F#3",
                "A3",
                "D4"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                54,
                57,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 1"
    },
    {
        "name": "Em",
        "beat": 7.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            72,
            74,
            76,
            78
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "G3",
                "B3",
                "E4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                55,
                59,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "F#5",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 1"
    },
    {
        "name": "G",
        "beat": 10.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            67,
            79
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 1"
    },
    {
        "name": "G",
        "beat": 13.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            67,
            69,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 2"
    },
    {
        "name": "D",
        "beat": 16.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            67,
            74
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F#3",
                "A3",
                "D4"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                54,
                57,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 2"
    },
    {
        "name": "Em",
        "beat": 19.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            72,
            74,
            76,
            78
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "G3",
                "B3",
                "E4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                55,
                59,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "F#5",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 2"
    },
    {
        "name": "G",
        "beat": 22.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            67,
            79
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 2"
    },
    {
        "name": "G",
        "beat": 25.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            67,
            69,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 3"
    },
    {
        "name": "D",
        "beat": 28.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            67,
            74
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F#3",
                "A3",
                "D4"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                54,
                57,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 3"
    },
    {
        "name": "Em",
        "beat": 31.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            72,
            74,
            76,
            78
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "G3",
                "B3",
                "E4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                55,
                59,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "F#5",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 3"
    },
    {
        "name": "G",
        "beat": 34.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            67,
            79
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 3"
    },
    {
        "name": "G",
        "beat": 37.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            67,
            69,
            71,
            72,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 4"
    },
    {
        "name": "D",
        "beat": 40.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            50,
            67,
            74
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F#3",
                "A3",
                "D4"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                54,
                57,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 4"
    },
    {
        "name": "Em",
        "beat": 43.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            40,
            72,
            74,
            76,
            78
        ],
        "piano_voicings": {
            "lh_note": "E2",
            "rh_notes": [
                "G3",
                "B3",
                "E4"
            ],
            "lh_pitches": [
                40
            ],
            "rh_pitches": [
                55,
                59,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E5",
                "beatOffset": 2,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "F#5",
                "beatOffset": 2.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 4"
    },
    {
        "name": "G",
        "beat": 46.0,
        "duration_beats": 3.0,
        "expected_pitches": [
            43,
            67,
            79
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "D4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                62,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G5",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 3,
                "clef": "bass"
            }
        ],
        "section": "Minuet Strain 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "G Major", "time_signature": "3/4", "strumming_pattern": "Baroque Minuet Counterpoint", "educational_focus": "Crisp staccato vs. legato articulation in two-part polyphony.", "tempo_range": {"min_bpm": 85, "default_bpm": 116, "max_bpm": 140, "gradual_step_bpm": 5}, "chords": [{"name": "G", "beat": 1.0, "duration_beats": 3.0, "expected_pitches": [43, 67, 69, 71, 72, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 1"}, {"name": "D", "beat": 4.0, "duration_beats": 3.0, "expected_pitches": [50, 67, 74], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F#3", "A3", "D4"], "lh_pitches": [50], "rh_pitches": [54, 57, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 1"}, {"name": "Em", "beat": 7.0, "duration_beats": 3.0, "expected_pitches": [40, 72, 74, 76, 78], "piano_voicings": {"lh_note": "E2", "rh_notes": ["G3", "B3", "E4"], "lh_pitches": [40], "rh_pitches": [55, 59, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "F#5", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 1"}, {"name": "G", "beat": 10.0, "duration_beats": 3.0, "expected_pitches": [43, 67, 79], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "G5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 1"}, {"name": "G", "beat": 13.0, "duration_beats": 3.0, "expected_pitches": [43, 67, 69, 71, 72, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 2"}, {"name": "D", "beat": 16.0, "duration_beats": 3.0, "expected_pitches": [50, 67, 74], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F#3", "A3", "D4"], "lh_pitches": [50], "rh_pitches": [54, 57, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 2"}, {"name": "Em", "beat": 19.0, "duration_beats": 3.0, "expected_pitches": [40, 72, 74, 76, 78], "piano_voicings": {"lh_note": "E2", "rh_notes": ["G3", "B3", "E4"], "lh_pitches": [40], "rh_pitches": [55, 59, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "F#5", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 2"}, {"name": "G", "beat": 22.0, "duration_beats": 3.0, "expected_pitches": [43, 67, 79], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "G5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 2"}, {"name": "G", "beat": 25.0, "duration_beats": 3.0, "expected_pitches": [43, 67, 69, 71, 72, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 3"}, {"name": "D", "beat": 28.0, "duration_beats": 3.0, "expected_pitches": [50, 67, 74], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F#3", "A3", "D4"], "lh_pitches": [50], "rh_pitches": [54, 57, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 3"}, {"name": "Em", "beat": 31.0, "duration_beats": 3.0, "expected_pitches": [40, 72, 74, 76, 78], "piano_voicings": {"lh_note": "E2", "rh_notes": ["G3", "B3", "E4"], "lh_pitches": [40], "rh_pitches": [55, 59, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "F#5", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 3"}, {"name": "G", "beat": 34.0, "duration_beats": 3.0, "expected_pitches": [43, 67, 79], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "G5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 3"}, {"name": "G", "beat": 37.0, "duration_beats": 3.0, "expected_pitches": [43, 67, 69, 71, 72, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 4"}, {"name": "D", "beat": 40.0, "duration_beats": 3.0, "expected_pitches": [50, 67, 74], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F#3", "A3", "D4"], "lh_pitches": [50], "rh_pitches": [54, 57, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "D5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 4"}, {"name": "Em", "beat": 43.0, "duration_beats": 3.0, "expected_pitches": [40, 72, 74, 76, 78], "piano_voicings": {"lh_note": "E2", "rh_notes": ["G3", "B3", "E4"], "lh_pitches": [40], "rh_pitches": [55, 59, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 0.5, "clef": "treble"}, {"pitch": "F#5", "beatOffset": 2.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 4"}, {"name": "G", "beat": 46.0, "duration_beats": 3.0, "expected_pitches": [43, 67, 79], "piano_voicings": {"lh_note": "G2", "rh_notes": ["D4", "G4", "B4"], "lh_pitches": [43], "rh_pitches": [62, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "G5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 1, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 3, "clef": "bass"}], "section": "Minuet Strain 4"}]}),
  },
  {
    id: "ex_piano_prelude_c",
    title: "Prelude in C major (BWV 846, Well-Tempered Clavier)",
    artist: "J.S. Bach",
    composer: "Johann Sebastian Bach",
    description: "Bach's seminal 16-measure keyboard prelude. Continuous broken-chord figurations establish the foundation of harmonic voice leading.",
    instrument: "piano",
    tempo_bpm: 72,
    difficulty: 2,
    progression: {
      key: "C Major",
      tempo_range: {"min_bpm": 50, "default_bpm": 72, "max_bpm": 95, "gradual_step_bpm": 4},
      chords: [
    {
        "name": "C",
        "beat": 1.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E3",
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                52,
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 1"
    },
    {
        "name": "Dm7",
        "beat": 5.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            53,
            57,
            60,
            62
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F3",
                "A3",
                "C4",
                "D4"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                53,
                57,
                60,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "D3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 1"
    },
    {
        "name": "G7",
        "beat": 9.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            53,
            59,
            62,
            65
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "G3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                55,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "B3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "G2",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 1"
    },
    {
        "name": "C",
        "beat": 13.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E3",
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                52,
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 1"
    },
    {
        "name": "C",
        "beat": 17.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E3",
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                52,
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 2"
    },
    {
        "name": "Dm7",
        "beat": 21.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            53,
            57,
            60,
            62
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F3",
                "A3",
                "C4",
                "D4"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                53,
                57,
                60,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "D3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 2"
    },
    {
        "name": "G7",
        "beat": 25.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            53,
            59,
            62,
            65
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "G3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                55,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "B3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "G2",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 2"
    },
    {
        "name": "C",
        "beat": 29.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E3",
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                52,
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 2"
    },
    {
        "name": "C",
        "beat": 33.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E3",
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                52,
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 3"
    },
    {
        "name": "Dm7",
        "beat": 37.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            53,
            57,
            60,
            62
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F3",
                "A3",
                "C4",
                "D4"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                53,
                57,
                60,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "D3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 3"
    },
    {
        "name": "G7",
        "beat": 41.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            53,
            59,
            62,
            65
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "G3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                55,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "B3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "G2",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 3"
    },
    {
        "name": "C",
        "beat": 45.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E3",
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                52,
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 3"
    },
    {
        "name": "C",
        "beat": 49.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E3",
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                52,
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 4"
    },
    {
        "name": "Dm7",
        "beat": 53.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            53,
            57,
            60,
            62
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F3",
                "A3",
                "C4",
                "D4"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                53,
                57,
                60,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "D3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 4"
    },
    {
        "name": "G7",
        "beat": 57.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            53,
            59,
            62,
            65
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "G3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                55,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "B3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "D4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "F4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "G2",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 4"
    },
    {
        "name": "C",
        "beat": 61.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            52,
            55,
            60,
            64
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E3",
                "G3",
                "C4",
                "E4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                52,
                55,
                60,
                64
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "C4",
                "beatOffset": 1,
                "duration": 1,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 0,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "C3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 2,
                "duration": 2,
                "clef": "bass"
            }
        ],
        "section": "Arpeggiated Prelude Part 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "C Major", "time_signature": "4/4", "strumming_pattern": "Continuous 16th-Note Broken Chord Arpeggiation", "educational_focus": "Rhythmic precision and even finger velocity across continuous broken chords.", "tempo_range": {"min_bpm": 50, "default_bpm": 72, "max_bpm": 95, "gradual_step_bpm": 4}, "chords": [{"name": "C", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E3", "G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [52, 55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 1"}, {"name": "Dm7", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [50, 53, 57, 60, 62], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F3", "A3", "C4", "D4"], "lh_pitches": [50], "rh_pitches": [53, 57, 60, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "A3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "D3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 1"}, {"name": "G7", "beat": 9.0, "duration_beats": 4.0, "expected_pitches": [43, 53, 59, 62, 65], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "G3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 55, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "B3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "G2", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 1"}, {"name": "C", "beat": 13.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E3", "G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [52, 55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 1"}, {"name": "C", "beat": 17.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E3", "G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [52, 55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 2"}, {"name": "Dm7", "beat": 21.0, "duration_beats": 4.0, "expected_pitches": [50, 53, 57, 60, 62], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F3", "A3", "C4", "D4"], "lh_pitches": [50], "rh_pitches": [53, 57, 60, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "A3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "D3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 2"}, {"name": "G7", "beat": 25.0, "duration_beats": 4.0, "expected_pitches": [43, 53, 59, 62, 65], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "G3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 55, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "B3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "G2", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 2"}, {"name": "C", "beat": 29.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E3", "G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [52, 55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 2"}, {"name": "C", "beat": 33.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E3", "G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [52, 55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 3"}, {"name": "Dm7", "beat": 37.0, "duration_beats": 4.0, "expected_pitches": [50, 53, 57, 60, 62], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F3", "A3", "C4", "D4"], "lh_pitches": [50], "rh_pitches": [53, 57, 60, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "A3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "D3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 3"}, {"name": "G7", "beat": 41.0, "duration_beats": 4.0, "expected_pitches": [43, 53, 59, 62, 65], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "G3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 55, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "B3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "G2", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 3"}, {"name": "C", "beat": 45.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E3", "G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [52, 55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 3"}, {"name": "C", "beat": 49.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E3", "G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [52, 55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 4"}, {"name": "Dm7", "beat": 53.0, "duration_beats": 4.0, "expected_pitches": [50, 53, 57, 60, 62], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F3", "A3", "C4", "D4"], "lh_pitches": [50], "rh_pitches": [53, 57, 60, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "A3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "D3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 4"}, {"name": "G7", "beat": 57.0, "duration_beats": 4.0, "expected_pitches": [43, 53, 59, 62, 65], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "G3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 55, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "B3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "D4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "G2", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "F3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 4"}, {"name": "C", "beat": 61.0, "duration_beats": 4.0, "expected_pitches": [48, 52, 55, 60, 64], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E3", "G3", "C4", "E4"], "lh_pitches": [48], "rh_pitches": [52, 55, 60, 64], "inversion": "root position"}, "melody_notes": [{"pitch": "G3", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 0, "duration": 2, "clef": "bass"}, {"pitch": "C3", "beatOffset": 2, "duration": 2, "clef": "bass"}, {"pitch": "E3", "beatOffset": 2, "duration": 2, "clef": "bass"}], "section": "Arpeggiated Prelude Part 4"}]}),
  },
  {
    id: "ex_piano_clair_de_lune",
    title: "Clair de Lune (Suite Bergamasque, 3rd Mvt)",
    artist: "Claude Debussy",
    composer: "Claude Debussy",
    description: "Debussy's luminous Impressionist masterpiece in 9/8 compound time. Features gentle descending harmonic thirds and singing cantabile motifs.",
    instrument: "piano",
    tempo_bpm: 48,
    difficulty: 3,
    progression: {
      key: "C Major",
      tempo_range: {"min_bpm": 36, "default_bpm": 48, "max_bpm": 64, "gradual_step_bpm": 3},
      chords: [
    {
        "name": "C",
        "beat": 1.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            48,
            72,
            74,
            76
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 1"
    },
    {
        "name": "F",
        "beat": 10.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            41,
            69,
            72,
            77
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "F5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 1"
    },
    {
        "name": "G",
        "beat": 19.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            43,
            71,
            74,
            79
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "G4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                67
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 1"
    },
    {
        "name": "C",
        "beat": 28.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            48,
            72,
            76
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 4.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 4.5,
                "duration": 4.5,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 1"
    },
    {
        "name": "C",
        "beat": 37.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            48,
            72,
            74,
            76
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 2"
    },
    {
        "name": "F",
        "beat": 46.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            41,
            69,
            72,
            77
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "F5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 2"
    },
    {
        "name": "G",
        "beat": 55.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            43,
            71,
            74,
            79
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "G4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                67
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 2"
    },
    {
        "name": "C",
        "beat": 64.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            48,
            72,
            76
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 4.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 4.5,
                "duration": 4.5,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 2"
    },
    {
        "name": "C",
        "beat": 73.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            48,
            72,
            74,
            76
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 3"
    },
    {
        "name": "F",
        "beat": 82.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            41,
            69,
            72,
            77
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "F5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 3"
    },
    {
        "name": "G",
        "beat": 91.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            43,
            71,
            74,
            79
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "G4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                67
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 3"
    },
    {
        "name": "C",
        "beat": 100.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            48,
            72,
            76
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 4.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 4.5,
                "duration": 4.5,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 3"
    },
    {
        "name": "C",
        "beat": 109.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            48,
            72,
            74,
            76
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 4"
    },
    {
        "name": "F",
        "beat": 118.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            41,
            69,
            72,
            77
        ],
        "piano_voicings": {
            "lh_note": "F2",
            "rh_notes": [
                "A3",
                "C4",
                "F4"
            ],
            "lh_pitches": [
                41
            ],
            "rh_pitches": [
                57,
                60,
                65
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "A4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "F5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "F2",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 4"
    },
    {
        "name": "G",
        "beat": 127.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            43,
            71,
            74,
            79
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "B3",
                "D4",
                "G4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                59,
                62,
                67
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "B4",
                "beatOffset": 0,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 3,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G5",
                "beatOffset": 6,
                "duration": 3,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 4"
    },
    {
        "name": "C",
        "beat": 136.0,
        "duration_beats": 9.0,
        "expected_pitches": [
            48,
            72,
            76
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E5",
                "beatOffset": 0,
                "duration": 4.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 4.5,
                "duration": 4.5,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 9,
                "clef": "bass"
            }
        ],
        "section": "Andante Tr\u00e8s Expressif Part 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "C Major", "time_signature": "9/8", "strumming_pattern": "Impressionist 9/8 Floating Harmonies", "educational_focus": "Expressive rubato, subtle dynamics, and flowing 9/8 compound triple meter.", "tempo_range": {"min_bpm": 36, "default_bpm": 48, "max_bpm": 64, "gradual_step_bpm": 3}, "chords": [{"name": "C", "beat": 1.0, "duration_beats": 9.0, "expected_pitches": [48, 72, 74, 76], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "C5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 1"}, {"name": "F", "beat": 10.0, "duration_beats": 9.0, "expected_pitches": [41, 69, 72, 77], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "C5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "F5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 1"}, {"name": "G", "beat": 19.0, "duration_beats": 9.0, "expected_pitches": [43, 71, 74, 79], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "G4"], "lh_pitches": [43], "rh_pitches": [59, 62, 67], "inversion": "root position"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "G5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 1"}, {"name": "C", "beat": 28.0, "duration_beats": 9.0, "expected_pitches": [48, 72, 76], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 4.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 4.5, "duration": 4.5, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 1"}, {"name": "C", "beat": 37.0, "duration_beats": 9.0, "expected_pitches": [48, 72, 74, 76], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "C5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 2"}, {"name": "F", "beat": 46.0, "duration_beats": 9.0, "expected_pitches": [41, 69, 72, 77], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "C5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "F5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 2"}, {"name": "G", "beat": 55.0, "duration_beats": 9.0, "expected_pitches": [43, 71, 74, 79], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "G4"], "lh_pitches": [43], "rh_pitches": [59, 62, 67], "inversion": "root position"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "G5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 2"}, {"name": "C", "beat": 64.0, "duration_beats": 9.0, "expected_pitches": [48, 72, 76], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 4.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 4.5, "duration": 4.5, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 2"}, {"name": "C", "beat": 73.0, "duration_beats": 9.0, "expected_pitches": [48, 72, 74, 76], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "C5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 3"}, {"name": "F", "beat": 82.0, "duration_beats": 9.0, "expected_pitches": [41, 69, 72, 77], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "C5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "F5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 3"}, {"name": "G", "beat": 91.0, "duration_beats": 9.0, "expected_pitches": [43, 71, 74, 79], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "G4"], "lh_pitches": [43], "rh_pitches": [59, 62, 67], "inversion": "root position"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "G5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 3"}, {"name": "C", "beat": 100.0, "duration_beats": 9.0, "expected_pitches": [48, 72, 76], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 4.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 4.5, "duration": 4.5, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 3"}, {"name": "C", "beat": 109.0, "duration_beats": 9.0, "expected_pitches": [48, 72, 74, 76], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "C5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 4"}, {"name": "F", "beat": 118.0, "duration_beats": 9.0, "expected_pitches": [41, 69, 72, 77], "piano_voicings": {"lh_note": "F2", "rh_notes": ["A3", "C4", "F4"], "lh_pitches": [41], "rh_pitches": [57, 60, 65], "inversion": "root position"}, "melody_notes": [{"pitch": "A4", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "C5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "F5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 4"}, {"name": "G", "beat": 127.0, "duration_beats": 9.0, "expected_pitches": [43, 71, 74, 79], "piano_voicings": {"lh_note": "G2", "rh_notes": ["B3", "D4", "G4"], "lh_pitches": [43], "rh_pitches": [59, 62, 67], "inversion": "root position"}, "melody_notes": [{"pitch": "B4", "beatOffset": 0, "duration": 3, "clef": "treble"}, {"pitch": "D5", "beatOffset": 3, "duration": 3, "clef": "treble"}, {"pitch": "G5", "beatOffset": 6, "duration": 3, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 4"}, {"name": "C", "beat": 136.0, "duration_beats": 9.0, "expected_pitches": [48, 72, 76], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E5", "beatOffset": 0, "duration": 4.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 4.5, "duration": 4.5, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 9, "clef": "bass"}], "section": "Andante Tr\u00e8s Expressif Part 4"}]}),
  },
  {
    id: "ex_piano_the_entertainer",
    title: "The Entertainer (A Ragtime Two-Step)",
    artist: "Scott Joplin",
    composer: "Scott Joplin",
    description: "Joplin's legendary 16-measure ragtime standard (1902). Features syncopated treble melodies over a steady 'oom-pah' stride piano bassline.",
    instrument: "piano",
    tempo_bpm: 76,
    difficulty: 2,
    progression: {
      key: "C Major",
      tempo_range: {"min_bpm": 55, "default_bpm": 76, "max_bpm": 96, "gradual_step_bpm": 4},
      chords: [
    {
        "name": "C",
        "beat": 1.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            48,
            52,
            62,
            63,
            64,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 1"
    },
    {
        "name": "C",
        "beat": 3.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            43,
            52,
            64,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 1"
    },
    {
        "name": "G7",
        "beat": 5.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            43,
            53,
            62,
            63,
            64,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 1"
    },
    {
        "name": "C",
        "beat": 7.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            48,
            52,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 1"
    },
    {
        "name": "C",
        "beat": 9.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            48,
            52,
            62,
            63,
            64,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 2"
    },
    {
        "name": "C",
        "beat": 11.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            43,
            52,
            64,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 2"
    },
    {
        "name": "G7",
        "beat": 13.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            43,
            53,
            62,
            63,
            64,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 2"
    },
    {
        "name": "C",
        "beat": 15.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            48,
            52,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 2"
    },
    {
        "name": "C",
        "beat": 17.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            48,
            52,
            62,
            63,
            64,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 3"
    },
    {
        "name": "C",
        "beat": 19.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            43,
            52,
            64,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 3"
    },
    {
        "name": "G7",
        "beat": 21.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            43,
            53,
            62,
            63,
            64,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 3"
    },
    {
        "name": "C",
        "beat": 23.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            48,
            52,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 3"
    },
    {
        "name": "C",
        "beat": 25.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            48,
            52,
            62,
            63,
            64,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 4"
    },
    {
        "name": "C",
        "beat": 27.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            43,
            52,
            64,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "C5",
                "beatOffset": 0.5,
                "duration": 1.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 4"
    },
    {
        "name": "G7",
        "beat": 29.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            43,
            53,
            62,
            63,
            64,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F3",
                "B3",
                "D4"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                53,
                59,
                62
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "D4",
                "beatOffset": 0,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D#4",
                "beatOffset": 0.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "E4",
                "beatOffset": 1,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "D5",
                "beatOffset": 1.5,
                "duration": 0.5,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "F3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 4"
    },
    {
        "name": "C",
        "beat": 31.0,
        "duration_beats": 2.0,
        "expected_pitches": [
            48,
            52,
            72
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "C5"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "C5",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 1,
                "clef": "bass"
            },
            {
                "pitch": "E3",
                "beatOffset": 1,
                "duration": 1,
                "clef": "bass"
            }
        ],
        "section": "Ragtime Strain 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "C Major", "time_signature": "2/4", "strumming_pattern": "Ragtime Stride Bass & Syncopation", "educational_focus": "Crisp ragtime syncopation in right hand over steady, unyielding left-hand stride meter.", "tempo_range": {"min_bpm": 55, "default_bpm": 76, "max_bpm": 96, "gradual_step_bpm": 4}, "chords": [{"name": "C", "beat": 1.0, "duration_beats": 2.0, "expected_pitches": [48, 52, 62, 63, 64, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 1"}, {"name": "C", "beat": 3.0, "duration_beats": 2.0, "expected_pitches": [43, 52, 64, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 1.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 1"}, {"name": "G7", "beat": 5.0, "duration_beats": 2.0, "expected_pitches": [43, 53, 62, 63, 64, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "D4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 1"}, {"name": "C", "beat": 7.0, "duration_beats": 2.0, "expected_pitches": [48, 52, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 1"}, {"name": "C", "beat": 9.0, "duration_beats": 2.0, "expected_pitches": [48, 52, 62, 63, 64, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 2"}, {"name": "C", "beat": 11.0, "duration_beats": 2.0, "expected_pitches": [43, 52, 64, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 1.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 2"}, {"name": "G7", "beat": 13.0, "duration_beats": 2.0, "expected_pitches": [43, 53, 62, 63, 64, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "D4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 2"}, {"name": "C", "beat": 15.0, "duration_beats": 2.0, "expected_pitches": [48, 52, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 2"}, {"name": "C", "beat": 17.0, "duration_beats": 2.0, "expected_pitches": [48, 52, 62, 63, 64, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 3"}, {"name": "C", "beat": 19.0, "duration_beats": 2.0, "expected_pitches": [43, 52, 64, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 1.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 3"}, {"name": "G7", "beat": 21.0, "duration_beats": 2.0, "expected_pitches": [43, 53, 62, 63, 64, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "D4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 3"}, {"name": "C", "beat": 23.0, "duration_beats": 2.0, "expected_pitches": [48, 52, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 3"}, {"name": "C", "beat": 25.0, "duration_beats": 2.0, "expected_pitches": [48, 52, 62, 63, 64, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "D4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 4"}, {"name": "C", "beat": 27.0, "duration_beats": 2.0, "expected_pitches": [43, 52, 64, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "C5", "beatOffset": 0.5, "duration": 1.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 4"}, {"name": "G7", "beat": 29.0, "duration_beats": 2.0, "expected_pitches": [43, 53, 62, 63, 64, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F3", "B3", "D4"], "lh_pitches": [43], "rh_pitches": [53, 59, 62], "inversion": "root position"}, "melody_notes": [{"pitch": "D4", "beatOffset": 0, "duration": 0.5, "clef": "treble"}, {"pitch": "D#4", "beatOffset": 0.5, "duration": 0.5, "clef": "treble"}, {"pitch": "E4", "beatOffset": 1, "duration": 0.5, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1.5, "duration": 0.5, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "F3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 4"}, {"name": "C", "beat": 31.0, "duration_beats": 2.0, "expected_pitches": [48, 52, 72], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "C5"], "lh_pitches": [48], "rh_pitches": [64, 67, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "C5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 1, "clef": "bass"}, {"pitch": "E3", "beatOffset": 1, "duration": 1, "clef": "bass"}], "section": "Ragtime Strain 4"}]}),
  },
  {
    id: "ex_piano_autumn_turnaround",
    title: "Autumn Jazz Turnaround (Dm7 \u2013 G7 \u2013 Cmaj7 \u2013 A7)",
    artist: "Jazz Standard",
    composer: "Standard Turnaround Cadence",
    description: "Essential 16-measure jazz turnaround (ii7\u2013V7\u2013Imaj7\u2013VI7). Features rich 7th chord voicings, chromatic bass movement, and smooth voice leading.",
    instrument: "piano",
    tempo_bpm: 84,
    difficulty: 2,
    progression: {
      key: "C Major",
      tempo_range: {"min_bpm": 60, "default_bpm": 84, "max_bpm": 115, "gradual_step_bpm": 5},
      chords: [
    {
        "name": "Dm7",
        "beat": 1.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            65,
            69,
            72
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                65,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 1"
    },
    {
        "name": "G7",
        "beat": 5.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            65,
            71,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F4",
                "B4",
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                65,
                71,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 1"
    },
    {
        "name": "Cmaj7",
        "beat": 9.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            64,
            67,
            71
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 1"
    },
    {
        "name": "A7",
        "beat": 13.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            67,
            73,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "G4",
                "C#5",
                "E5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                67,
                73,
                76
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C#5",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 1"
    },
    {
        "name": "Dm7",
        "beat": 17.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            65,
            69,
            72
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                65,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 2"
    },
    {
        "name": "G7",
        "beat": 21.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            65,
            71,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F4",
                "B4",
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                65,
                71,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 2"
    },
    {
        "name": "Cmaj7",
        "beat": 25.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            64,
            67,
            71
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 2"
    },
    {
        "name": "A7",
        "beat": 29.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            67,
            73,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "G4",
                "C#5",
                "E5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                67,
                73,
                76
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C#5",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 2"
    },
    {
        "name": "Dm7",
        "beat": 33.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            65,
            69,
            72
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                65,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 3"
    },
    {
        "name": "G7",
        "beat": 37.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            65,
            71,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F4",
                "B4",
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                65,
                71,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 3"
    },
    {
        "name": "Cmaj7",
        "beat": 41.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            64,
            67,
            71
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 3"
    },
    {
        "name": "A7",
        "beat": 45.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            67,
            73,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "G4",
                "C#5",
                "E5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                67,
                73,
                76
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C#5",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 3"
    },
    {
        "name": "Dm7",
        "beat": 49.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            50,
            65,
            69,
            72
        ],
        "piano_voicings": {
            "lh_note": "D3",
            "rh_notes": [
                "F4",
                "A4",
                "C5"
            ],
            "lh_pitches": [
                50
            ],
            "rh_pitches": [
                65,
                69,
                72
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "D3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 4"
    },
    {
        "name": "G7",
        "beat": 53.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            43,
            65,
            71,
            74
        ],
        "piano_voicings": {
            "lh_note": "G2",
            "rh_notes": [
                "F4",
                "B4",
                "D5"
            ],
            "lh_pitches": [
                43
            ],
            "rh_pitches": [
                65,
                71,
                74
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "F4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "B4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 4"
    },
    {
        "name": "Cmaj7",
        "beat": 57.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            48,
            64,
            67,
            71
        ],
        "piano_voicings": {
            "lh_note": "C3",
            "rh_notes": [
                "E4",
                "G4",
                "B4"
            ],
            "lh_pitches": [
                48
            ],
            "rh_pitches": [
                64,
                67,
                71
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "E4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "G4",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C3",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 4"
    },
    {
        "name": "A7",
        "beat": 61.0,
        "duration_beats": 4.0,
        "expected_pitches": [
            45,
            67,
            73,
            76
        ],
        "piano_voicings": {
            "lh_note": "A2",
            "rh_notes": [
                "G4",
                "C#5",
                "E5"
            ],
            "lh_pitches": [
                45
            ],
            "rh_pitches": [
                67,
                73,
                76
            ],
            "inversion": "root position"
        },
        "melody_notes": [
            {
                "pitch": "G4",
                "beatOffset": 0,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "C#5",
                "beatOffset": 2,
                "duration": 2,
                "clef": "treble"
            },
            {
                "pitch": "A2",
                "beatOffset": 0,
                "duration": 4,
                "clef": "bass"
            }
        ],
        "section": "Turnaround Cycle 4"
    }
],
    },
    progression_json: JSON.stringify({"key": "C Major", "time_signature": "4/4", "strumming_pattern": "Jazz Swing / Ballad Pulses", "educational_focus": "Smooth voice leading between 7th chord inversions without jumping octaves.", "tempo_range": {"min_bpm": 60, "default_bpm": 84, "max_bpm": 115, "gradual_step_bpm": 5}, "chords": [{"name": "Dm7", "beat": 1.0, "duration_beats": 4.0, "expected_pitches": [50, 65, 69, 72], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F4", "A4", "C5"], "lh_pitches": [50], "rh_pitches": [65, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "A4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 1"}, {"name": "G7", "beat": 5.0, "duration_beats": 4.0, "expected_pitches": [43, 65, 71, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F4", "B4", "D5"], "lh_pitches": [43], "rh_pitches": [65, 71, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 1"}, {"name": "Cmaj7", "beat": 9.0, "duration_beats": 4.0, "expected_pitches": [48, 64, 67, 71], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "B4"], "lh_pitches": [48], "rh_pitches": [64, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 1"}, {"name": "A7", "beat": 13.0, "duration_beats": 4.0, "expected_pitches": [45, 67, 73, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["G4", "C#5", "E5"], "lh_pitches": [45], "rh_pitches": [67, 73, 76], "inversion": "root position"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C#5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 1"}, {"name": "Dm7", "beat": 17.0, "duration_beats": 4.0, "expected_pitches": [50, 65, 69, 72], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F4", "A4", "C5"], "lh_pitches": [50], "rh_pitches": [65, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "A4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 2"}, {"name": "G7", "beat": 21.0, "duration_beats": 4.0, "expected_pitches": [43, 65, 71, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F4", "B4", "D5"], "lh_pitches": [43], "rh_pitches": [65, 71, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 2"}, {"name": "Cmaj7", "beat": 25.0, "duration_beats": 4.0, "expected_pitches": [48, 64, 67, 71], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "B4"], "lh_pitches": [48], "rh_pitches": [64, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 2"}, {"name": "A7", "beat": 29.0, "duration_beats": 4.0, "expected_pitches": [45, 67, 73, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["G4", "C#5", "E5"], "lh_pitches": [45], "rh_pitches": [67, 73, 76], "inversion": "root position"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C#5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 2"}, {"name": "Dm7", "beat": 33.0, "duration_beats": 4.0, "expected_pitches": [50, 65, 69, 72], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F4", "A4", "C5"], "lh_pitches": [50], "rh_pitches": [65, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "A4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 3"}, {"name": "G7", "beat": 37.0, "duration_beats": 4.0, "expected_pitches": [43, 65, 71, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F4", "B4", "D5"], "lh_pitches": [43], "rh_pitches": [65, 71, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 3"}, {"name": "Cmaj7", "beat": 41.0, "duration_beats": 4.0, "expected_pitches": [48, 64, 67, 71], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "B4"], "lh_pitches": [48], "rh_pitches": [64, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 3"}, {"name": "A7", "beat": 45.0, "duration_beats": 4.0, "expected_pitches": [45, 67, 73, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["G4", "C#5", "E5"], "lh_pitches": [45], "rh_pitches": [67, 73, 76], "inversion": "root position"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C#5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 3"}, {"name": "Dm7", "beat": 49.0, "duration_beats": 4.0, "expected_pitches": [50, 65, 69, 72], "piano_voicings": {"lh_note": "D3", "rh_notes": ["F4", "A4", "C5"], "lh_pitches": [50], "rh_pitches": [65, 69, 72], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "A4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "D3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 4"}, {"name": "G7", "beat": 53.0, "duration_beats": 4.0, "expected_pitches": [43, 65, 71, 74], "piano_voicings": {"lh_note": "G2", "rh_notes": ["F4", "B4", "D5"], "lh_pitches": [43], "rh_pitches": [65, 71, 74], "inversion": "root position"}, "melody_notes": [{"pitch": "F4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 4"}, {"name": "Cmaj7", "beat": 57.0, "duration_beats": 4.0, "expected_pitches": [48, 64, 67, 71], "piano_voicings": {"lh_note": "C3", "rh_notes": ["E4", "G4", "B4"], "lh_pitches": [48], "rh_pitches": [64, 67, 71], "inversion": "root position"}, "melody_notes": [{"pitch": "E4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 4"}, {"name": "A7", "beat": 61.0, "duration_beats": 4.0, "expected_pitches": [45, 67, 73, 76], "piano_voicings": {"lh_note": "A2", "rh_notes": ["G4", "C#5", "E5"], "lh_pitches": [45], "rh_pitches": [67, 73, 76], "inversion": "root position"}, "melody_notes": [{"pitch": "G4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C#5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}], "section": "Turnaround Cycle 4"}]}),
  },
]

export const BUILTIN_ADDITIONAL_EXERCISES: ExerciseDto[] = [
  {
    id: 'ex_piano_autumn_turnaround',
    title: 'Autumn Jazz Turnaround (Dm7 – G7 – Cmaj7 – A7)',
    artist: 'Jazz Standard',
    composer: 'Standard Turnaround Cadence',
    description:
      'Classic 4-measure jazz turnaround progression (ii7–V7–Imaj7–VI7). Features rich 7th chord voicings, chromatic bass movement, and essential voice leading.',
    instrument: 'piano',
    tempo_bpm: 84,
    difficulty: 2,
    progression: {
      key: 'C Major',
      tempo_range: { min_bpm: 60, default_bpm: 84, max_bpm: 115, gradual_step_bpm: 5 },
      chords: [
        {
          name: 'Dm7',
          beat: 1.0,
          duration_beats: 4.0,
          expected_pitches: [50, 65, 69, 72],
          piano_voicings: {
            lh_note: 'D3',
            rh_notes: ['F4', 'A4', 'C5'],
            lh_pitches: [50],
            rh_pitches: [65, 69, 72],
          },
          section: 'Turnaround A',
        },
        {
          name: 'G7',
          beat: 5.0,
          duration_beats: 4.0,
          expected_pitches: [43, 65, 71, 74],
          piano_voicings: {
            lh_note: 'G2',
            rh_notes: ['F4', 'B4', 'D5'],
            lh_pitches: [43],
            rh_pitches: [65, 71, 74],
          },
          section: 'Turnaround A',
        },
        {
          name: 'Cmaj7',
          beat: 9.0,
          duration_beats: 4.0,
          expected_pitches: [48, 64, 67, 71],
          piano_voicings: {
            lh_note: 'C3',
            rh_notes: ['E4', 'G4', 'B4'],
            lh_pitches: [48],
            rh_pitches: [64, 67, 71],
          },
          section: 'Turnaround A',
        },
        {
          name: 'A7',
          beat: 13.0,
          duration_beats: 4.0,
          expected_pitches: [45, 67, 73, 76],
          piano_voicings: {
            lh_note: 'A2',
            rh_notes: ['G4', 'C#5', 'E5'],
            lh_pitches: [45],
            rh_pitches: [67, 73, 76],
          },
          section: 'Turnaround A',
        },
      ],
    },
    progression_json: JSON.stringify({
      key: 'C Major',
      time_signature: '4/4',
      default_tempo_bpm: 84,
      strumming_pattern: 'Jazz Swing / Ballad Pulses',
      chords: [
        {
          name: 'Dm7',
          beat: 1.0,
          duration_beats: 4.0,
          expected_pitches: [50, 65, 69, 72],
          piano_voicings: {
            lh_note: 'D3',
            rh_notes: ['F4', 'A4', 'C5'],
            lh_pitches: [50],
            rh_pitches: [65, 69, 72],
          },
        },
        {
          name: 'G7',
          beat: 5.0,
          duration_beats: 4.0,
          expected_pitches: [43, 65, 71, 74],
          piano_voicings: {
            lh_note: 'G2',
            rh_notes: ['F4', 'B4', 'D5'],
            lh_pitches: [43],
            rh_pitches: [65, 71, 74],
          },
        },
        {
          name: 'Cmaj7',
          beat: 9.0,
          duration_beats: 4.0,
          expected_pitches: [48, 64, 67, 71],
          piano_voicings: {
            lh_note: 'C3',
            rh_notes: ['E4', 'G4', 'B4'],
            lh_pitches: [48],
            rh_pitches: [64, 67, 71],
          },
        },
        {
          name: 'A7',
          beat: 13.0,
          duration_beats: 4.0,
          expected_pitches: [45, 67, 73, 76],
          piano_voicings: {
            lh_note: 'A2',
            rh_notes: ['G4', 'C#5', 'E5'],
            lh_pitches: [45],
            rh_pitches: [67, 73, 76],
          },
        },
      ],
    }),
  },
  {
    id: 'ex_piano_pop_ballad',
    title: 'Pop Ballad Cadence (C – G – Am – F)',
    artist: 'Pop Standard',
    composer: 'Standard I–V–vi–IV Cadence',
    description:
      'Universal 4-measure pop piano progression. Features smooth left-hand bass octaves and balanced right-hand triad inversions.',
    instrument: 'piano',
    tempo_bpm: 76,
    difficulty: 1,
    progression: {
      key: 'C Major',
      tempo_range: { min_bpm: 55, default_bpm: 76, max_bpm: 105, gradual_step_bpm: 5 },
      chords: [
        {
          name: 'C',
          beat: 1.0,
          duration_beats: 4.0,
          expected_pitches: [48, 60, 64, 67],
          piano_voicings: {
            lh_note: 'C3',
            rh_notes: ['C4', 'E4', 'G4'],
            lh_pitches: [48],
            rh_pitches: [60, 64, 67],
          },
          section: 'Verse',
        },
        {
          name: 'G',
          beat: 5.0,
          duration_beats: 4.0,
          expected_pitches: [43, 59, 62, 67],
          piano_voicings: {
            lh_note: 'G2',
            rh_notes: ['B3', 'D4', 'G4'],
            lh_pitches: [43],
            rh_pitches: [59, 62, 67],
          },
          section: 'Verse',
        },
        {
          name: 'Am',
          beat: 9.0,
          duration_beats: 4.0,
          expected_pitches: [45, 60, 64, 69],
          piano_voicings: {
            lh_note: 'A2',
            rh_notes: ['C4', 'E4', 'A4'],
            lh_pitches: [45],
            rh_pitches: [60, 64, 69],
          },
          section: 'Verse',
        },
        {
          name: 'F',
          beat: 13.0,
          duration_beats: 4.0,
          expected_pitches: [41, 60, 65, 69],
          piano_voicings: {
            lh_note: 'F2',
            rh_notes: ['C4', 'F4', 'A4'],
            lh_pitches: [41],
            rh_pitches: [60, 65, 69],
          },
          section: 'Verse',
        },
      ],
    },
    progression_json: JSON.stringify({
      key: 'C Major',
      time_signature: '4/4',
      default_tempo_bpm: 76,
      strumming_pattern: 'Ballad Pulses (4/4)',
      chords: [
        {
          name: 'C',
          beat: 1.0,
          duration_beats: 4.0,
          expected_pitches: [48, 60, 64, 67],
          piano_voicings: {
            lh_note: 'C3',
            rh_notes: ['C4', 'E4', 'G4'],
            lh_pitches: [48],
            rh_pitches: [60, 64, 67],
          },
        },
        {
          name: 'G',
          beat: 5.0,
          duration_beats: 4.0,
          expected_pitches: [43, 59, 62, 67],
          piano_voicings: {
            lh_note: 'G2',
            rh_notes: ['B3', 'D4', 'G4'],
            lh_pitches: [43],
            rh_pitches: [59, 62, 67],
          },
        },
        {
          name: 'Am',
          beat: 9.0,
          duration_beats: 4.0,
          expected_pitches: [45, 60, 64, 69],
          piano_voicings: {
            lh_note: 'A2',
            rh_notes: ['C4', 'E4', 'A4'],
            lh_pitches: [45],
            rh_pitches: [60, 64, 69],
          },
        },
        {
          name: 'F',
          beat: 13.0,
          duration_beats: 4.0,
          expected_pitches: [41, 60, 65, 69],
          piano_voicings: {
            lh_note: 'F2',
            rh_notes: ['C4', 'F4', 'A4'],
            lh_pitches: [41],
            rh_pitches: [60, 65, 69],
          },
        },
      ],
    }),
  },
]

export const ALL_BUILTIN_EXERCISES: ExerciseDto[] = [
  ...BUILTIN_FULL_SONGS,
  ...BUILTIN_ADDITIONAL_EXERCISES,
]

/**
 * Generates an isolated 4-measure chord drill exercise for a specific chord symbol.
 */
export function createChordDrillExercise(
  chordSymbol: string,
  instrument: 'piano' | 'guitar' = 'guitar'
): ExerciseDto {
  const normalized = chordSymbol.trim().replace(/\s+Major$/i, '').replace(/\s+Minor$/i, 'm')
  const slugChord = normalized.toLowerCase().replace(/#/g, 'sharp').replace(/[^a-z0-9_]/g, '_')
  const id = `drill_chord_${slugChord}`
  const voicing = resolveChordVoicing(normalized)

  const chords: FullSongChordItem[] = [1, 2, 3, 4].map((bar) => ({
    name: normalized,
    beat: (bar - 1) * 4 + 1,
    duration_beats: 4,
    expected_pitches: voicing.expectedPitches,
    guitar_tabs: {
      frets: voicing.guitarTab.frets,
      strings: voicing.guitarTab.strings,
      fingering: voicing.guitarTab.fingering,
      fingers: voicing.guitarTab.fingers,
      baseFret: voicing.guitarTab.baseFret ?? 1,
      barreFret: voicing.guitarTab.barreFret,
    },
    piano_voicings: {
      lh_note: voicing.pianoVoicing.lhNotes[0] || `${normalized}2`,
      rh_notes: voicing.pianoVoicing.rhNotes,
      lh_pitches: voicing.pianoVoicing.lhPitches,
      rh_pitches: voicing.pianoVoicing.rhPitches,
    },
    section: `Measure ${bar}`,
  }))

  return {
    id,
    title: `Chord Drill: ${chordSymbol}`,
    artist: 'Sonus Chord Compendium',
    composer: 'Harmonic Practice Drill',
    description: `Focused chord voicing, hand placement, and rhythmic sustain drill for ${chordSymbol}.`,
    instrument,
    tempo_bpm: 76,
    difficulty: 1,
    progression: {
      key: chordSymbol,
      tempo_range: { min_bpm: 50, default_bpm: 76, max_bpm: 110, gradual_step_bpm: 5 },
      chords,
    },
    progression_json: JSON.stringify({
      key: chordSymbol,
      time_signature: '4/4',
      strumming_pattern: 'Whole Note Sustain (4 Beats)',
      chords,
    }),
  }
}
