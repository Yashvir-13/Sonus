/**
 * Dynamic Programming Instrument Lens Projection Engine
 * Transforms canonical musical note events into instrument-specific notation and audio events.
 * Reference: Sayegh's Optimum Path Paradigm & Bontempi et al. (arXiv:2407.09052)
 */

import type { ExerciseDto } from '@/api/sessions'
import type {
  CanonicalNoteEvent,
  FullSongChordItem,
  MusicalVoiceRole,
  PluckedNoteEvent,
} from './song-catalog'
import type {
  FlowingChordItem,
  GrandStaffNote,
  StrumEvent,
} from '@/lib/notation/vexflow-score-builder'
import { resolveChordVoicing } from './chord-voicings'

export type { FullSongChordItem, CanonicalNoteEvent, MusicalVoiceRole, PluckedNoteEvent }

// ─────────────────────────────────────────────────────────────────────────────
// 1. PITCH UTILITIES & CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const NOTE_NAME_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  'E#': 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
}

/** Converts a scientific pitch string (e.g. 'C4', 'A2', 'F#3', 'Bb4') or MIDI number to MIDI integer */
export function noteToMidi(pitch: string | number): number {
  if (typeof pitch === 'number') {
    return Math.round(pitch)
  }

  const match = pitch.trim().match(/^([A-Ga-g][#b]?)(-?\d+)$/)
  if (!match) {
    return 60 // fallback to Middle C
  }

  const notePart = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
  const octave = parseInt(match[2], 10)
  const semitone = NOTE_NAME_TO_SEMITONE[notePart] ?? 0
  return (octave + 1) * 12 + semitone
}

/** Converts MIDI integer to standard scientific pitch string (e.g. 60 -> 'C4', 69 -> 'A4') */
export function midiToNote(midi: number): string {
  const rounded = Math.round(midi)
  const semitone = ((rounded % 12) + 12) % 12
  const octave = Math.floor(rounded / 12) - 1
  return `${NOTE_NAMES[semitone]}${octave}`
}

/** Converts pitch to VexFlow key format (e.g. 'C4' -> 'c/4', 'F#3' -> 'f#/3') */
export function pitchToVexKey(pitch: string | number): string {
  const noteStr = typeof pitch === 'string' ? pitch : midiToNote(pitch)
  const match = noteStr.trim().match(/^([A-Ga-g][#b]?)(-?\d+)$/)
  if (!match) return 'c/4'
  const note = match[1].toLowerCase()
  const octave = match[2]
  return `${note}/${octave}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GUITAR PHYSICAL TUNING & CHORD FINGERINGS
// ─────────────────────────────────────────────────────────────────────────────

/** Standard 6-string guitar tuning: string 1 (high e) to string 6 (low E) */
export const GUITAR_STRING_TUNINGS: Record<number, number> = {
  1: 64, // E4 (high e)
  2: 59, // B3
  3: 55, // G3
  4: 50, // D3
  5: 45, // A2
  6: 40, // E2 (low E)
}

/** Open/Standard Chord Box Fingerings for rewarding ergonomic chord positions */
const CHORD_FRET_BIAS: Record<string, Record<number, number>> = {
  Am: { 5: 0, 4: 2, 3: 2, 2: 1, 1: 0 },
  A: { 5: 0, 4: 2, 3: 2, 2: 2, 1: 0 },
  A7: { 5: 0, 4: 2, 3: 0, 2: 2, 1: 0 },
  C: { 5: 3, 4: 2, 3: 0, 2: 1, 1: 0 },
  Cmaj7: { 5: 3, 4: 2, 3: 0, 2: 0, 1: 0 },
  D: { 4: 0, 3: 2, 2: 3, 1: 2 },
  Dm: { 4: 0, 3: 2, 2: 3, 1: 1 },
  Dm7: { 4: 0, 3: 2, 2: 1, 1: 1 },
  D7: { 4: 0, 3: 2, 2: 1, 1: 2 },
  Em: { 6: 0, 5: 2, 4: 2, 3: 0, 2: 0, 1: 0 },
  E: { 6: 0, 5: 2, 4: 2, 3: 1, 2: 0, 1: 0 },
  E7: { 6: 0, 5: 2, 4: 0, 3: 1, 2: 0, 1: 0 },
  F: { 6: 1, 5: 3, 4: 3, 3: 2, 2: 1, 1: 1 },
  G: { 6: 3, 5: 2, 4: 0, 3: 0, 2: 0, 1: 3 },
  G7: { 6: 3, 5: 2, 4: 0, 3: 0, 2: 0, 1: 1 },
  Bm: { 5: 2, 4: 4, 3: 4, 2: 3, 1: 2 },
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CANONICAL NOTES EXTRACTION & NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/** Extracts or normalizes canonical notes from any chord item */
export function extractCanonicalNotes(measure: FullSongChordItem): CanonicalNoteEvent[] {
  if (measure.notes && measure.notes.length > 0) {
    return measure.notes.map((n) => ({
      pitch: typeof n.pitch === 'number' ? n.pitch : noteToMidi(n.pitch),
      beatOffset: n.beatOffset ?? 0,
      duration: n.duration ?? 1.0,
      voice: n.voice,
      guitarOverride: n.guitarOverride,
    }))
  }

  // Fallback 1: Derive from guitar plucked_notes
  if (measure.plucked_notes && measure.plucked_notes.length > 0) {
    return measure.plucked_notes.map((p) => {
      const midi = p.pitch || (GUITAR_STRING_TUNINGS[p.string] ?? 40) + (typeof p.fret === 'number' ? p.fret : 0)
      return {
        pitch: midi,
        beatOffset: p.beatOffset ?? 0,
        duration: p.duration ?? 1.0,
        voice: midi < 60 ? 'bass' : 'melody',
        guitarOverride: {
          string: (p.string >= 1 && p.string <= 6 ? p.string : 1) as 1 | 2 | 3 | 4 | 5 | 6,
          fret: typeof p.fret === 'number' ? p.fret : 0,
        },
      }
    })
  }

  // Fallback 2: Derive from piano melody_notes
  if (measure.melody_notes && measure.melody_notes.length > 0) {
    return measure.melody_notes.map((n) => {
      const midi = noteToMidi(n.pitch)
      return {
        pitch: midi,
        beatOffset: n.beatOffset ?? 0,
        duration: n.duration ?? 1.0,
        voice: n.clef === 'bass' ? 'bass' : 'melody',
      }
    })
  }

  // Fallback 3: Derive from expected_pitches or chord voicing
  const resolved = resolveChordVoicing(measure.name)
  const pitches = measure.expected_pitches && measure.expected_pitches.length > 0
    ? measure.expected_pitches
    : resolved.expected_pitches ?? [60, 64, 67]

  return pitches.map((pitch, idx) => ({
    pitch,
    beatOffset: 0,
    duration: measure.duration_beats ?? 4.0,
    voice: pitch < 60 ? 'bass' : 'melody',
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PIANO LENS PROJECTION
// ─────────────────────────────────────────────────────────────────────────────

/** Projects a measure into Piano Grand Staff notation, voicings, and falling keys */
export function projectToPiano(measure: FullSongChordItem): FlowingChordItem {
  const resolved = resolveChordVoicing(measure.name)
  const notes = extractCanonicalNotes(measure)

  const melodyNotes: GrandStaffNote[] = notes.map((n) => {
    const midi = typeof n.pitch === 'number' ? n.pitch : noteToMidi(n.pitch)
    const pitchStr = midiToNote(midi)
    const clef: 'treble' | 'bass' = n.voice === 'melody'
      ? 'treble'
      : n.voice === 'bass'
        ? 'bass'
        : midi >= 60
          ? 'treble'
          : 'bass'

    return {
      pitch: pitchStr,
      beatOffset: n.beatOffset,
      duration: n.duration,
      clef,
    }
  })

  // Ensure both bass and treble voice representations exist for smooth piano play
  const bassNotes = melodyNotes.filter((n) => n.clef === 'bass')
  const trebleNotes = melodyNotes.filter((n) => n.clef === 'treble')

  const lhPitches = bassNotes.map((n) => noteToMidi(n.pitch))
  const rhPitches = trebleNotes.map((n) => noteToMidi(n.pitch))

  const finalLhPitches = lhPitches.length > 0 ? lhPitches : (resolved.pianoVoicing?.lhPitches ?? [48])
  const finalRhPitches = rhPitches.length > 0 ? rhPitches : (resolved.pianoVoicing?.rhPitches ?? [60, 64, 67])

  const lhNotes = bassNotes.length > 0
    ? bassNotes.map((n) => n.pitch)
    : (resolved.pianoVoicing?.lhNotes ?? [midiToNote(finalLhPitches[0])])
  const rhNotes = trebleNotes.length > 0
    ? trebleNotes.map((n) => n.pitch)
    : (resolved.pianoVoicing?.rhNotes ?? finalRhPitches.map(midiToNote))

  const lhNote = lhNotes[0] ?? resolved.pianoVoicing?.lhNotes?.[0] ?? midiToNote(finalLhPitches[0])

  return {
    ...resolved,
    duration_beats: measure.duration_beats ?? 4.0,
    melodyNotes,
    pianoVoicing: {
      lhNote,
      lhNotes,
      rhNotes,
      lhPitches: finalLhPitches,
      rhPitches: finalRhPitches,
    },
    notes,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GUITAR LENS PROJECTION (DYNAMIC PROGRAMMING)
// ─────────────────────────────────────────────────────────────────────────────

type CandidatePosition = {
  string: 1 | 2 | 3 | 4 | 5 | 6
  fret: number
}

/** Generates candidate (string, fret) positions for a MIDI pitch on standard guitar */
function getGuitarCandidates(midi: number, override?: { string: number; fret: number }): CandidatePosition[] {
  if (override && override.string >= 1 && override.string <= 6) {
    return [{ string: override.string as 1 | 2 | 3 | 4 | 5 | 6, fret: override.fret }]
  }

  const candidates: CandidatePosition[] = []
  for (let s = 1; s <= 6; s++) {
    const openPitch = GUITAR_STRING_TUNINGS[s]
    const fret = midi - openPitch
    if (fret >= 0 && fret <= 17) {
      candidates.push({ string: s as 1 | 2 | 3 | 4 | 5 | 6, fret })
    }
  }

  if (candidates.length === 0) {
    // Pitch out of normal 1st-position guitar range: clamp to closest string
    candidates.push({ string: midi >= 64 ? 1 : 6, fret: Math.max(0, Math.min(17, midi - (midi >= 64 ? 64 : 40))) })
  }

  return candidates
}

/** Computes transition cost between consecutive guitar note fingerings */
function computeTransitionCost(
  prev: CandidatePosition | null,
  curr: CandidatePosition,
  chordBias: Record<number, number> | undefined,
  isSimultaneous: boolean
): number {
  let cost = 0

  // 1. Reward positions matching open chord box
  if (chordBias && chordBias[curr.string] === curr.fret) {
    cost -= 15
  }

  // 2. Open string bias in standard playing
  if (curr.fret === 0) {
    cost -= 6
  }

  if (!prev) {
    // Initial note: prefer lower frets (positions 0..5)
    return cost + curr.fret * 1.5
  }

  // 3. Fret distance / neck shift cost
  const fretDist = Math.abs(curr.fret - prev.fret)
  cost += fretDist * 2.0

  // 4. Physical hand span penalty: span > 4 frets is physically difficult
  if (curr.fret > 0 && prev.fret > 0 && fretDist > 4) {
    cost += 50 + (fretDist - 4) * 20
  }

  // 5. String collision penalty: cannot play two notes on the same string at the same time
  if (isSimultaneous && curr.string === prev.string) {
    cost += 200
  }

  return cost
}

/** Projects a measure into Guitar Tablature, arpeggio plucks, and strumming events */
export function projectToGuitar(measure: FullSongChordItem): FlowingChordItem {
  const resolved = resolveChordVoicing(measure.name)

  let customGuitarTab = resolved.guitarTab
  if (measure.guitar_tabs) {
    customGuitarTab = {
      frets: measure.guitar_tabs.frets.map((f) => (f === 'x' ? null : f)),
      strings: measure.guitar_tabs.strings || 'E-A-D-G-B-e',
      fingering: measure.guitar_tabs.fingering || '',
      fingers: measure.guitar_tabs.fingers,
      baseFret: measure.guitar_tabs.baseFret,
      barreFret: measure.guitar_tabs.barreFret,
    }
  }

  // If already authored with high-fidelity plucked_notes, preserve them
  if (measure.plucked_notes && measure.plucked_notes.length > 0) {
    return {
      ...resolved,
      guitarTab: customGuitarTab,
      duration_beats: measure.duration_beats ?? 4.0,
      plucked_notes: measure.plucked_notes,
      pluckedNotes: measure.plucked_notes,
      strumEvents: measure.strum_events,
      notes: extractCanonicalNotes(measure),
    }
  }

  // If authored with rhythmic strum events (strumming pattern song like Whiskey in the Jar),
  // preserve strumEvents and do NOT generate simultaneous beat-0 plucked_notes that hijack the audio engine
  if (measure.strum_events && measure.strum_events.length > 0) {
    return {
      ...resolved,
      guitarTab: customGuitarTab,
      duration_beats: measure.duration_beats ?? 4.0,
      strumEvents: measure.strum_events,
      plucked_notes: undefined,
      pluckedNotes: undefined,
      notes: extractCanonicalNotes(measure),
    }
  }

  const notes = extractCanonicalNotes(measure)
  const sortedNotes = [...notes].sort((a, b) => a.beatOffset - b.beatOffset)
  const chordBias = CHORD_FRET_BIAS[measure.name]

  // Dynamic Programming Viterbi Search
  type DPStep = {
    pos: CandidatePosition
    totalCost: number
    prevIdx: number
  }

  let dpLayers: DPStep[][] = []

  for (let i = 0; i < sortedNotes.length; i++) {
    const note = sortedNotes[i]
    const midi = typeof note.pitch === 'number' ? note.pitch : noteToMidi(note.pitch)
    const candidates = getGuitarCandidates(midi, note.guitarOverride)
    const isSimultaneous = i > 0 && Math.abs(sortedNotes[i].beatOffset - sortedNotes[i - 1].beatOffset) < 0.05

    const currentLayer: DPStep[] = []

    for (const cand of candidates) {
      if (i === 0) {
        const cost = computeTransitionCost(null, cand, chordBias, false)
        currentLayer.push({ pos: cand, totalCost: cost, prevIdx: -1 })
      } else {
        let bestCost = Infinity
        let bestPrev = 0

        for (let p = 0; p < dpLayers[i - 1].length; p++) {
          const prevStep = dpLayers[i - 1][p]
          const stepCost = computeTransitionCost(prevStep.pos, cand, chordBias, isSimultaneous)
          const total = prevStep.totalCost + stepCost
          if (total < bestCost) {
            bestCost = total
            bestPrev = p
          }
        }

        currentLayer.push({ pos: cand, totalCost: bestCost, prevIdx: bestPrev })
      }
    }

    dpLayers.push(currentLayer)
  }

  // Backtrack optimal path
  const optimalPositions: CandidatePosition[] = []
  if (dpLayers.length > 0) {
    const lastLayer = dpLayers[dpLayers.length - 1]
    let bestIdx = 0
    let minCost = Infinity
    for (let j = 0; j < lastLayer.length; j++) {
      if (lastLayer[j].totalCost < minCost) {
        minCost = lastLayer[j].totalCost
        bestIdx = j
      }
    }

    let currIdx = bestIdx
    for (let layerIdx = dpLayers.length - 1; layerIdx >= 0; layerIdx--) {
      optimalPositions.unshift(dpLayers[layerIdx][currIdx].pos)
      currIdx = dpLayers[layerIdx][currIdx].prevIdx
    }
  }

  // Build plucked_notes
  const plucked_notes: PluckedNoteEvent[] = sortedNotes.map((n, idx) => {
    const pos = optimalPositions[idx] ?? { string: 1, fret: 0 }
    const midi = typeof n.pitch === 'number' ? n.pitch : noteToMidi(n.pitch)
    return {
      beatOffset: n.beatOffset,
      string: pos.string,
      fret: pos.fret,
      pitch: midi,
      duration: n.duration,
      technique: 'pick',
    }
  })

  // Detect whether this is an arpeggio or a simultaneous chord strum
  const hasMultipleOffsets = sortedNotes.some((n) => n.beatOffset > 0)

  // If all notes are simultaneous at beat 0, synthesize standard strum events and do not pluck
  if (!hasMultipleOffsets) {
    const durBeats = measure.duration_beats ?? 4.0
    const defaultStrums: StrumEvent[] = durBeats === 3 ? [
      { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
      { beatOffset: 1.0, direction: 'down', accent: false, label: 'D' },
      { beatOffset: 2.0, direction: 'down', accent: false, label: 'D' },
    ] : [
      { beatOffset: 0.0, direction: 'down', accent: true, label: 'D' },
      { beatOffset: 1.0, direction: 'down', accent: false, label: 'D' },
      { beatOffset: 2.0, direction: 'down', accent: true, label: 'D' },
      { beatOffset: 3.0, direction: 'up', accent: false, label: 'U' },
    ]

    return {
      ...resolved,
      guitarTab: customGuitarTab,
      duration_beats: durBeats,
      strumEvents: defaultStrums,
      plucked_notes: undefined,
      pluckedNotes: undefined,
      notes,
    }
  }

  // Synthesize dynamic guitarTab if not explicitly authored or if high-fret plucks exist
  let guitarTab = customGuitarTab
  if (!measure.guitar_tabs && plucked_notes.length > 0) {
    const nonZeroFrets = plucked_notes
      .map((p) => (typeof p.fret === 'number' ? p.fret : 0))
      .filter((f) => f > 0)
    const minFret = nonZeroFrets.length > 0 ? Math.min(...nonZeroFrets) : 0
    const maxFret = nonZeroFrets.length > 0 ? Math.max(...nonZeroFrets) : 0

    // If plucks are outside open position (frets > 3 or minFret > 3), build position-accurate tab
    if (maxFret > 3 || minFret > 3) {
      const dynamicFrets: (number | null)[] = [null, null, null, null, null, null]
      for (const pn of plucked_notes) {
        if (typeof pn.fret === 'number') {
          const sIdx = 6 - pn.string
          if (dynamicFrets[sIdx] === null) {
            dynamicFrets[sIdx] = pn.fret
          }
        }
      }
      const baseFret = minFret > 1 ? minFret : 1
      const fingers: (number | null)[] = dynamicFrets.map((f) => {
        if (f === null || f === 0) return null
        const rel = f - baseFret
        return Math.min(4, Math.max(1, rel + 1))
      })
      const fingering = dynamicFrets.map((f) => (f === null ? 'x' : String(f))).join('-')
      guitarTab = {
        frets: dynamicFrets,
        strings: 'E-A-D-G-B-e',
        fingering,
        fingers,
        baseFret,
      }
    }
  }

  return {
    ...resolved,
    guitarTab,
    duration_beats: measure.duration_beats ?? 4.0,
    plucked_notes,
    pluckedNotes: plucked_notes,
    strumEvents: undefined,
    notes,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MULTI-MEASURE SONG PROJECTION
// ─────────────────────────────────────────────────────────────────────────────

/** Projects an entire song's progression into the target instrument's visual and audio format */
export function projectSongToInstrument(
  song: ExerciseDto,
  instrument: 'guitar' | 'piano'
): FlowingChordItem[] {
  const chords = (song.progression?.chords || []) as FullSongChordItem[]
  if (chords.length === 0) {
    const defaultMeasure: FullSongChordItem = {
      name: 'C',
      beat: 1.0,
      duration_beats: 4.0,
      expected_pitches: [48, 52, 55, 60, 64],
    }
    return instrument === 'piano' ? [projectToPiano(defaultMeasure)] : [projectToGuitar(defaultMeasure)]
  }

  return chords.map((chord) => {
    return instrument === 'piano' ? projectToPiano(chord) : projectToGuitar(chord)
  })
}
