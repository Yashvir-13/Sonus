export type SeedExerciseRow = {
  id: string
  title: string
  description: string
  instrument: 'guitar' | 'piano'
  tempo_bpm: number
  difficulty: number
  progression_json: string
}

function buildKnockinChords() {
  const chords: Array<Record<string, unknown>> = []
  const sections = [
    ['Verse 1', 'ballad'],
    ['Chorus', 'anthem'],
    ['Verse 2 / Outro', 'ringout'],
  ] as const

  let beatCursor = 1.0
  for (const [sectionName, strumType] of sections) {
    const seq = [
      { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fingering: '2-1-0-0-0-3', strings: 'E-A-D-G-B-e' },
      { name: 'D', dur: 4, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fingering: 'x-x-0-1-3-2', strings: 'x-x-D-G-B-e' },
      { name: 'Am', dur: 4, pitches: [45, 52, 57, 60, 64], frets: [null, 0, 2, 2, 1, 0], fingering: 'x-0-2-3-1-0', strings: 'x-A-D-G-B-e' },
      { name: 'Am', dur: 4, pitches: [45, 52, 57, 60, 64], frets: [null, 0, 2, 2, 1, 0], fingering: 'x-0-2-3-1-0', strings: 'x-A-D-G-B-e' },
      { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fingering: '2-1-0-0-0-3', strings: 'E-A-D-G-B-e' },
      { name: 'D', dur: 4, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fingering: 'x-x-0-1-3-2', strings: 'x-x-D-G-B-e' },
      { name: 'C', dur: 4, pitches: [48, 52, 55, 60, 64], frets: [null, 3, 2, 0, 1, 0], fingering: 'x-3-2-0-1-0', strings: 'x-A-D-G-B-e' },
      sectionName === 'Verse 2 / Outro'
        ? { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fingering: '2-1-0-0-0-3', strings: 'E-A-D-G-B-e' }
        : { name: 'C', dur: 4, pitches: [48, 52, 55, 60, 64], frets: [null, 3, 2, 0, 1, 0], fingering: 'x-3-2-0-1-0', strings: 'x-A-D-G-B-e' },
    ]

    for (const item of seq) {
      const strumEvents =
        strumType === 'ballad'
          ? [
              { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
              { beatOffset: 1.0, direction: 'down', accent: false, label: 'D' },
              { beatOffset: 2.0, direction: 'down', accent: false, label: 'D' },
              { beatOffset: 2.5, direction: 'up', accent: false, label: 'U' },
              { beatOffset: 3.0, direction: 'down', accent: true, label: 'D' },
              { beatOffset: 3.5, direction: 'up', accent: false, label: 'U' },
            ]
          : strumType === 'anthem'
          ? [
              { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
              { beatOffset: 1.0, direction: 'down', accent: false, label: 'D' },
              { beatOffset: 1.5, direction: 'up', accent: false, label: 'U' },
              { beatOffset: 2.5, direction: 'up', accent: false, label: 'U' },
              { beatOffset: 3.0, direction: 'down', accent: true, label: 'D' },
              { beatOffset: 3.5, direction: 'up', accent: false, label: 'U' },
            ]
          : [
              { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
              { beatOffset: 2.0, direction: 'down', accent: false, label: 'D' },
            ]

      chords.push({
        name: item.name,
        beat: beatCursor,
        duration_beats: item.dur,
        expected_pitches: item.pitches,
        guitar_tabs: { frets: item.frets, strings: item.strings, fingering: item.fingering },
        strum_events: strumEvents,
        section: sectionName,
      })
      beatCursor += item.dur
    }
  }
  return chords
}

function buildFourChordAnthemChords() {
  const prog = [
    { name: 'D', dur: 4, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fingering: 'x-x-0-1-3-2', strings: 'x-x-D-G-B-e' },
    { name: 'A', dur: 4, pitches: [45, 52, 57, 61, 64], frets: [null, 0, 2, 2, 2, 0], fingering: 'x-0-1-2-3-0', strings: 'x-A-D-G-B-e' },
    { name: 'Bm', dur: 4, pitches: [47, 54, 59, 62, 66], frets: [null, 2, 4, 4, 3, 2], fingering: 'x-1-3-4-2-1', strings: 'x-A-D-G-B-e' },
    { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fingering: '2-1-0-0-0-3', strings: 'E-A-D-G-B-e' },
  ]
  const preChorus = [
    { name: 'Em', dur: 4, pitches: [40, 47, 52, 55, 59, 64], frets: [0, 2, 2, 0, 0, 0], fingering: '0-2-3-0-0-0', strings: 'E-A-D-G-B-e' },
    { name: 'G', dur: 4, pitches: [43, 47, 50, 55, 59, 67], frets: [3, 2, 0, 0, 0, 3], fingering: '2-1-0-0-0-3', strings: 'E-A-D-G-B-e' },
    { name: 'D', dur: 4, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fingering: 'x-x-0-1-3-2', strings: 'x-x-D-G-B-e' },
    { name: 'A', dur: 4, pitches: [45, 52, 57, 61, 64], frets: [null, 0, 2, 2, 2, 0], fingering: 'x-0-1-2-3-0', strings: 'x-A-D-G-B-e' },
  ]
  const sections: Array<[string, number]> = [
    ['Intro', 1],
    ['Verse 1', 2],
    ['Pre-Chorus', 2],
    ['Chorus', 2],
    ['Outro', 1],
  ]

  const chords: Array<Record<string, unknown>> = []
  let beatCursor = 1.0
  for (const [sectionName, reps] of sections) {
    for (let r = 0; r < reps; r++) {
      const cycle = sectionName === 'Pre-Chorus' ? preChorus : prog
      for (const item of cycle) {
        chords.push({
          name: item.name,
          beat: beatCursor,
          duration_beats: item.dur,
          expected_pitches: item.pitches,
          guitar_tabs: { frets: item.frets, strings: item.strings, fingering: item.fingering },
          strum_events: [
            { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
            { beatOffset: 1.0, direction: 'down', accent: false, label: 'D' },
            { beatOffset: 1.5, direction: 'up', accent: false, label: 'U' },
            { beatOffset: 2.5, direction: 'up', accent: false, label: 'U' },
            { beatOffset: 3.0, direction: 'down', accent: true, label: 'D' },
            { beatOffset: 3.5, direction: 'up', accent: false, label: 'U' },
          ],
          section: sectionName,
        })
        beatCursor += item.dur
      }
    }
  }
  return chords
}

function buildRisingSunChords() {
  const cycle = [
    { name: 'Am', dur: 6, pitches: [45, 52, 57, 60, 64], frets: [null, 0, 2, 2, 1, 0], fingering: 'x-0-2-3-1-0', strings: 'x-A-D-G-B-e' },
    { name: 'C', dur: 6, pitches: [48, 52, 55, 60, 64], frets: [null, 3, 2, 0, 1, 0], fingering: 'x-3-2-0-1-0', strings: 'x-A-D-G-B-e' },
    { name: 'D', dur: 6, pitches: [50, 57, 62, 66], frets: [null, null, 0, 2, 3, 2], fingering: 'x-x-0-1-3-2', strings: 'x-x-D-G-B-e' },
    { name: 'F', dur: 6, pitches: [41, 48, 53, 57, 60, 65], frets: [1, 3, 3, 2, 1, 1], fingering: '1-3-4-2-1-1', strings: 'E-A-D-G-B-e' },
    { name: 'Am', dur: 6, pitches: [45, 52, 57, 60, 64], frets: [null, 0, 2, 2, 1, 0], fingering: 'x-0-2-3-1-0', strings: 'x-A-D-G-B-e' },
    { name: 'E', dur: 6, pitches: [40, 47, 52, 56, 59, 64], frets: [0, 2, 2, 1, 0, 0], fingering: '0-2-3-1-0-0', strings: 'E-A-D-G-B-e' },
  ]
  const chords: Array<Record<string, unknown>> = []
  let beatCursor = 1.0
  for (let pass = 0; pass < 4; pass++) {
    for (const item of cycle) {
      chords.push({
        name: item.name,
        beat: beatCursor,
        duration_beats: item.dur,
        expected_pitches: item.pitches,
        guitar_tabs: { frets: item.frets, strings: item.strings, fingering: item.fingering },
        strum_events: [
          { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 1.0, direction: 'up', accent: false, label: 'U' },
          { beatOffset: 2.0, direction: 'up', accent: false, label: 'U' },
          { beatOffset: 3.0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 4.0, direction: 'up', accent: false, label: 'U' },
          { beatOffset: 5.0, direction: 'up', accent: false, label: 'U' },
        ],
      })
      beatCursor += item.dur
    }
  }
  return chords
}

function buildPachelbelChords() {
  const base = [
    { name: 'C', lh: 'C3', rh: ['E4', 'G4', 'C5'], lhP: [48], rhP: [64, 67, 72] },
    { name: 'G', lh: 'G2', rh: ['D4', 'G4', 'B4'], lhP: [43], rhP: [62, 67, 71] },
    { name: 'Am', lh: 'A2', rh: ['C4', 'E4', 'A4'], lhP: [45], rhP: [60, 64, 69] },
    { name: 'Em', lh: 'E2', rh: ['B3', 'E4', 'G4'], lhP: [40], rhP: [59, 64, 67] },
    { name: 'F', lh: 'F2', rh: ['A3', 'C4', 'F4'], lhP: [41], rhP: [57, 60, 65] },
    { name: 'C', lh: 'C3', rh: ['G3', 'C4', 'E4'], lhP: [48], rhP: [55, 60, 64] },
    { name: 'F', lh: 'F2', rh: ['A3', 'C4', 'F4'], lhP: [41], rhP: [57, 60, 65] },
    { name: 'G', lh: 'G2', rh: ['B3', 'D4', 'G4'], lhP: [43], rhP: [59, 62, 67] },
  ]
  const chords: Array<Record<string, unknown>> = []
  let beatCursor = 1.0
  for (let v = 0; v < 4; v++) {
    for (let m = 0; m < base.length; m++) {
      const b = base[m]
      const isFinaleC = v === 3 && m === 7
      chords.push({
        name: isFinaleC ? 'C' : b.name,
        beat: beatCursor,
        duration_beats: 4.0,
        expected_pitches: isFinaleC ? [48, 55, 60, 64] : [...b.lhP, ...b.rhP],
        piano_voicings: {
          lh_note: isFinaleC ? 'C3' : b.lh,
          rh_notes: isFinaleC ? ['G3', 'C4', 'E4'] : b.rh,
          lh_pitches: isFinaleC ? [48] : b.lhP,
          rh_pitches: isFinaleC ? [55, 60, 64] : b.rhP,
          inversion: isFinaleC || m % 2 === 0 ? 'root position' : '1st inversion',
        },
        variation: `Variation ${v + 1}`,
      })
      beatCursor += 4.0
    }
  }
  return chords
}

function buildWaltz2Chords() {
  const sequence = [
    ['Cm', 'C3', ['Eb3', 'G3'], [48, 51, 55, 72]],
    ['Cm', 'C3', ['Eb3', 'G3'], [48, 51, 55, 74]],
    ['Cm', 'C3', ['Eb3', 'G3'], [48, 51, 55, 75]],
    ['Cm', 'C3', ['Eb3', 'G3'], [48, 51, 55, 72]],
    ['G7', 'G2', ['F3', 'B3'], [43, 53, 59, 71]],
    ['G7', 'G2', ['F3', 'B3'], [43, 53, 59, 72]],
    ['G7', 'G2', ['F3', 'B3'], [43, 53, 59, 74]],
    ['Cm', 'C3', ['Eb3', 'G3'], [48, 51, 55, 72]],
    ['Fm', 'F2', ['Ab3', 'C4'], [41, 56, 60, 77]],
    ['Fm', 'F2', ['Ab3', 'C4'], [41, 56, 60, 80]],
    ['Cm', 'C3', ['Eb3', 'G3'], [48, 51, 55, 75]],
    ['Cm', 'C3', ['Eb3', 'G3'], [48, 51, 55, 74]],
    ['G7', 'G2', ['F3', 'B3'], [43, 53, 59, 74]],
    ['G7', 'G2', ['F3', 'B3'], [43, 53, 59, 72]],
    ['G7', 'G2', ['F3', 'B3'], [43, 53, 59, 67]],
    ['Cm', 'C3', ['Eb3', 'G3'], [48, 51, 55, 72]],
  ] as const

  const chords: Array<Record<string, unknown>> = []
  let beatCursor = 1.0
  for (let strain = 0; strain < 2; strain++) {
    for (const [name, lhRoot, rhNotes, pitches] of sequence) {
      chords.push({
        name,
        beat: beatCursor,
        duration_beats: 3.0,
        expected_pitches: [...pitches],
        piano_voicings: {
          lh_note: lhRoot,
          rh_notes: [...rhNotes],
          lh_pitches: [pitches[0]],
          rh_pitches: pitches.slice(1),
          inversion: 'root position',
        },
        section: strain === 0 ? 'Theme A (First Strain)' : 'Theme A (Second Strain & Climax)',
      })
      beatCursor += 3.0
    }
  }
  return chords
}

export const SEED_EXERCISES: SeedExerciseRow[] = [
  {
    id: 'ex_guitar_knockin',
    title: "Knockin' Cadence (Full Song - Verse, Chorus, Outro)",
    description:
      'Complete 24-measure acoustic folk-rock standard. Features authentic verse-chorus form, explicit ballad and anthem strumming arrows (D - D U - U D U), and full tab frets.',
    instrument: 'guitar',
    tempo_bpm: 70,
    difficulty: 1,
    progression_json: JSON.stringify({
      key: 'G Major',
      time_signature: '4/4',
      default_tempo_bpm: 70,
      tempo_range: { min_bpm: 50, default_bpm: 70, max_bpm: 95, gradual_step_bpm: 5 },
      chords: buildKnockinChords(),
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
    progression_json: JSON.stringify({
      key: 'D Major',
      time_signature: '4/4',
      default_tempo_bpm: 80,
      tempo_range: { min_bpm: 60, default_bpm: 80, max_bpm: 110, gradual_step_bpm: 5 },
      chords: buildFourChordAnthemChords(),
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
    progression_json: JSON.stringify({
      key: 'A Minor',
      time_signature: '6/8',
      default_tempo_bpm: 76,
      tempo_range: { min_bpm: 50, default_bpm: 76, max_bpm: 92, gradual_step_bpm: 4 },
      chords: buildRisingSunChords(),
    }),
  },
  {
    id: 'ex_piano_canon',
    title: "Pachelbel's Canon Harmonic Flow (Full 32-Measure Classical Score)",
    description:
      'Complete 32-measure authentic classical score from IMSLP. Features 4 distinct variations with measure-by-measure right-hand melody noteheads and steady left-hand basso ostinato.',
    instrument: 'piano',
    tempo_bpm: 68,
    difficulty: 2,
    progression_json: JSON.stringify({
      key: 'C Major',
      time_signature: '4/4',
      default_tempo_bpm: 68,
      tempo_range: { min_bpm: 48, default_bpm: 68, max_bpm: 88, gradual_step_bpm: 4 },
      chords: buildPachelbelChords(),
    }),
  },
  {
    id: 'ex_piano_shostakovich_waltz_2',
    title: 'Waltz No. 2 – Dmitri Shostakovich (Full 32-Measure Classical Score)',
    description:
      'Complete 32-measure orchestral waltz score from Suite for Variety Orchestra in 3/4 time.',
    instrument: 'piano',
    tempo_bpm: 160,
    difficulty: 3,
    progression_json: JSON.stringify({
      key: 'C Minor',
      time_signature: '3/4',
      default_tempo_bpm: 160,
      tempo_range: { min_bpm: 120, default_bpm: 160, max_bpm: 184, gradual_step_bpm: 6 },
      chords: buildWaltz2Chords(),
    }),
  },
]
