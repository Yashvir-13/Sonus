import {
  Accidental,
  BarlineType,
  Beam,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  TabNote,
  TabStave,
  Voice,
  type SVGContext,
  type StemmableNote,
  type TabNotePosition,
} from 'vexflow/bravura'
import type { VoicingDefinition } from '@/lib/music/chord-voicings'

export type GrandStaffNote = {
  pitch: string
  beatOffset: number
  duration: number
  clef?: 'treble' | 'bass'
}

export type StrumEvent = {
  beatOffset: number
  direction: 'down' | 'up' | 'rest' | 'mute'
  accent?: boolean
  label?: string
}

export type PluckedNoteEvent = {
  beatOffset: number
  string: 1 | 2 | 3 | 4 | 5 | 6
  fret: number | 'x'
  pitch: number
  duration: number
  technique?: 'pick' | 'thumb' | 'index' | 'hammer' | 'pull' | 'slide' | 'mute'
}

export type FlowingChordItem = VoicingDefinition & {
  duration_beats?: number
  melodyNotes?: GrandStaffNote[]
  strumEvents?: StrumEvent[]
  pluckedNotes?: PluckedNoteEvent[]
  plucked_notes?: PluckedNoteEvent[]
}

export type BeatAnchor = {
  beat: number
  x: number
}

export type MeasureGeometry = {
  measureIndex: number
  startBeat: number
  endBeat: number
  x: number
  width: number
  noteStartX: number
  chordName: string
  barreFret?: number
}

export type StrumMarkerGeometry = {
  measureIndex: number
  beat: number
  x: number
  direction: 'down' | 'up' | 'rest' | 'mute'
  accent: boolean
  label: string
}

export type EngravedScoreMetrics = {
  totalWidth: number
  totalHeight: number
  totalBeats: number
  keySignature: string
  timeSignature: string
  anchors: BeatAnchor[]
  measures: MeasureGeometry[]
  strumMarkers: StrumMarkerGeometry[]
  noteCount: number
  /** Exact Y pixel of the first (top) staff line, measured directly from VexFlow. */
  firstLineY: number
  /** Exact Y pixel spacing between adjacent staff/string lines. */
  lineSpacing: number
  /** Exact Y pixel of the bass staff top line (piano mode only). */
  bassFirstLineY?: number
}

export type RenderVexFlowScoreOptions = {
  instrument: 'guitar' | 'piano'
  progression: FlowingChordItem[]
  beatsPerMeasure: number
  timeSignature: string
  keySignature?: string
  isDark?: boolean
}

const VALID_VEX_KEYS = new Set([
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
  'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb',
  'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m',
  'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm',
])

const FLAT_KEY_SIGNATURES = new Set([
  'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb',
  'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm',
])

const NOTE_SEMITONE_ORDER: Record<string, number> = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
}

const SHARP_PITCH_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
const FLAT_PITCH_NAMES = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b']

/**
 * Normalizes a human-readable key string (e.g. "C Minor", "G Major", "Dm7")
 * into a canonical VexFlow key signature specification (e.g. "Cm", "G", "Dm").
 */
export function normalizeKeySignature(key?: string): string {
  if (!key) return 'C'
  const trimmed = key.trim()
  const match = trimmed.match(/^([A-Ga-g])([#b]?)\s*(minor|min|m(?![a-z])|major|maj)?/i)
  if (!match) return 'C'

  const root = match[1].toUpperCase()
  const accidental = match[2] ?? ''
  const qualityRaw = (match[3] ?? '').toLowerCase()
  const isMinor = qualityRaw === 'm' || qualityRaw === 'min' || qualityRaw === 'minor'

  const candidate = `${root}${accidental}${isMinor ? 'm' : ''}`
  if (VALID_VEX_KEYS.has(candidate)) {
    return candidate
  }

  // Enharmonic fallbacks for uncommon keys
  const enharmonics: Record<string, string> = {
    'G#': 'Ab',
    'D#': 'Eb',
    'A#': 'Bb',
    'Dbm': 'C#m',
    'Gbm': 'F#m',
    'Cbm': 'Bm',
  }
  if (enharmonics[candidate] && VALID_VEX_KEYS.has(enharmonics[candidate])) {
    return enharmonics[candidate]
  }

  return 'C'
}

/**
 * Converts scientific pitch notation ("Eb5", "F#4", "C3") into VexFlow key notation ("eb/5", "f#/4", "c/3").
 */
export function pitchToVexKey(pitch: string): string {
  const cleaned = pitch.trim().replace(/♭/g, 'b').replace(/♯/g, '#')
  const match = cleaned.match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
  if (!match) return 'c/4'
  const letter = match[1].toLowerCase()
  const accidental = match[2] ?? ''
  const octave = match[3]
  return `${letter}${accidental}/${octave}`
}

/**
 * Converts a MIDI note number to VexFlow key notation.
 */
export function midiToVexKey(midi: number, preferFlats = false): string {
  const clamped = Math.max(21, Math.min(108, Math.round(midi)))
  const pc = ((clamped % 12) + 12) % 12
  const octave = Math.floor(clamped / 12) - 1
  const names = preferFlats ? FLAT_PITCH_NAMES : SHARP_PITCH_NAMES
  return `${names[pc]}/${octave}`
}

function vexKeyToMidi(vexKey: string): number {
  const match = vexKey.match(/^([a-g])([#b]?)\/(-?\d+)$/i)
  if (!match) return 60
  const base = NOTE_SEMITONE_ORDER[match[1].toLowerCase()] ?? 0
  const acc = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0
  const octave = parseInt(match[3], 10)
  return (octave + 1) * 12 + base + acc
}

function sortAndDedupeVexKeys(keys: string[]): string[] {
  const unique = Array.from(new Set(keys))
  return unique.sort((a, b) => vexKeyToMidi(a) - vexKeyToMidi(b))
}

/**
 * Maps a musical beat duration (where 1.0 = quarter note) to a VexFlow duration string and dot count.
 */
export function beatsToVexDuration(beats: number): { duration: string; dots: number } {
  if (beats >= 3.75) return { duration: 'w', dots: 0 }
  if (beats >= 2.75) return { duration: 'h', dots: 1 }
  if (beats >= 1.75) return { duration: 'h', dots: 0 }
  if (beats >= 1.35) return { duration: 'q', dots: 1 }
  if (beats >= 0.85) return { duration: 'q', dots: 0 }
  if (beats >= 0.65) return { duration: '8', dots: 1 }
  if (beats >= 0.35) return { duration: '8', dots: 0 }
  return { duration: '16', dots: 0 }
}

/**
 * Decomposes an arbitrary beat gap into a sequence of valid VexFlow rest durations.
 */
export function decomposeRestBeats(beats: number): Array<{ duration: string; dots: number }> {
  const rests: Array<{ duration: string; dots: number }> = []
  let remaining = Math.round(beats * 4) / 4
  const steps: Array<{ value: number; duration: string; dots: number }> = [
    { value: 4, duration: 'w', dots: 0 },
    { value: 3, duration: 'h', dots: 1 },
    { value: 2, duration: 'h', dots: 0 },
    { value: 1.5, duration: 'q', dots: 1 },
    { value: 1, duration: 'q', dots: 0 },
    { value: 0.5, duration: '8', dots: 0 },
    { value: 0.25, duration: '16', dots: 0 },
  ]

  let guard = 0
  while (remaining >= 0.24 && guard < 16) {
    guard += 1
    const match = steps.find((s) => remaining >= s.value - 0.01)
    if (!match) break
    rests.push({ duration: match.duration, dots: match.dots })
    remaining = Math.round((remaining - match.value) * 4) / 4
  }
  return rests
}

/**
 * Piecewise linear interpolation mapping any continuous playback beat to its exact
 * engraved X pixel coordinate in the VexFlow SVG score.
 */
export function interpolateBeatToX(beat: number, anchors: BeatAnchor[]): number {
  if (anchors.length === 0) return 0
  if (anchors.length === 1 || beat <= anchors[0].beat) return anchors[0].x
  const last = anchors[anchors.length - 1]
  if (beat >= last.beat) return last.x

  // Binary search for bracketing anchors [lo, hi]
  let lo = 0
  let hi = anchors.length - 1
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1
    if (anchors[mid].beat <= beat) {
      lo = mid
    } else {
      hi = mid
    }
  }

  const a = anchors[lo]
  const b = anchors[hi]
  const span = b.beat - a.beat
  if (span <= 0.0001) return a.x
  const t = (beat - a.beat) / span
  return a.x + t * (b.x - a.x)
}

/**
 * Inverse lookup: given an X coordinate clicked inside the engraved SVG score,
 * returns the start beat of the clicked measure.
 */
export function findMeasureBeatAtX(x: number, measures: MeasureGeometry[]): number | null {
  if (measures.length === 0) return null
  for (const m of measures) {
    if (x >= m.x && x <= m.x + m.width) {
      return m.startBeat
    }
  }
  if (x < measures[0].x) return measures[0].startBeat
  return measures[measures.length - 1].startBeat
}

type ThemePalette = {
  surfaceBg: string
  staffLine: string
  ink: string
  rhNotehead: string
  lhNotehead: string
  chordLabel: string
  measureNum: string
}

function getThemePalette(isDark: boolean): ThemePalette {
  if (isDark) {
    return {
      surfaceBg: '#121215',
      staffLine: '#52525B',
      ink: '#F4F4F5',
      rhNotehead: '#34D399',
      lhNotehead: '#FBBF24',
      chordLabel: '#F4F4F5',
      measureNum: '#71717A',
    }
  }
  return {
    surfaceBg: '#FFFFFF',
    staffLine: '#A1A1AA',
    ink: '#18181B',
    rhNotehead: '#047857',
    lhNotehead: '#B45309',
    chordLabel: '#18181B',
    measureNum: '#71717A',
  }
}

function parseTimeSignature(timeSignature: string, fallbackBeats: number): {
  numBeats: number
  beatValue: number
  display: string
} {
  const match = timeSignature.trim().match(/^(\d+)\s*\/\s*(\d+)$/)
  if (match) {
    return {
      numBeats: parseInt(match[1], 10),
      beatValue: parseInt(match[2], 10),
      display: `${match[1]}/${match[2]}`,
    }
  }
  return {
    numBeats: Math.max(1, Math.round(fallbackBeats)),
    beatValue: 4,
    display: `${Math.max(1, Math.round(fallbackBeats))}/4`,
  }
}

type TimedStaveNote = {
  note: StaveNote
  beatOffset: number
  isRest: boolean
}

function buildPianoVoiceNotes(
  clef: 'treble' | 'bass',
  rawNotes: Array<{ vexKey: string; beatOffset: number; duration: number }>,
  measureBeats: number,
  palette: ThemePalette
): TimedStaveNote[] {
  const restKey = clef === 'treble' ? 'b/4' : 'd/3'
  const noteheadColor = clef === 'treble' ? palette.rhNotehead : palette.lhNotehead

  // Group simultaneous notes by quantized beatOffset (nearest 1/8th beat)
  const grouped = new Map<number, { keys: string[]; duration: number }>()
  for (const n of rawNotes) {
    const quantizedOffset = Math.max(0, Math.min(measureBeats - 0.25, Math.round(n.beatOffset * 4) / 4))
    const existing = grouped.get(quantizedOffset)
    if (existing) {
      existing.keys.push(n.vexKey)
      existing.duration = Math.min(existing.duration, n.duration)
    } else {
      grouped.set(quantizedOffset, { keys: [n.vexKey], duration: n.duration })
    }
  }

  const sortedOffsets = Array.from(grouped.keys()).sort((a, b) => a - b)
  const result: TimedStaveNote[] = []
  let cursor = 0

  for (let i = 0; i < sortedOffsets.length; i++) {
    const offset = sortedOffsets[i]
    const entry = grouped.get(offset)!

    // Insert authentic rests for any gap before this note
    if (offset > cursor + 0.05) {
      const gapRests = decomposeRestBeats(offset - cursor)
      let restCursor = cursor
      for (const r of gapRests) {
        const restNote = new StaveNote({
          keys: [restKey],
          duration: `${r.duration}r`,
          clef,
        })
        if (r.dots > 0) {
          Dot.buildAndAttach([restNote], { all: true })
        }
        restNote.addClass('sonus-rest')
        restNote.setStyle({ fillStyle: palette.ink, strokeStyle: palette.ink })
        result.push({ note: restNote, beatOffset: restCursor, isRest: true })
        restCursor += r.duration === 'w' ? 4 : r.duration === 'h' ? (r.dots ? 3 : 2) : r.duration === 'q' ? (r.dots ? 1.5 : 1) : r.duration === '8' ? 0.5 : 0.25
      }
      cursor = offset
    }

    const nextOffset = i + 1 < sortedOffsets.length ? sortedOffsets[i + 1] : measureBeats
    const maxAvail = Math.max(0.25, nextOffset - offset)
    const effectiveBeats = Math.min(entry.duration, maxAvail)
    const durSpec = beatsToVexDuration(effectiveBeats)
    const sortedKeys = sortAndDedupeVexKeys(entry.keys)

    const staveNote = new StaveNote({
      keys: sortedKeys,
      duration: durSpec.duration,
      clef,
      autoStem: true,
    })

    if (durSpec.dots > 0) {
      Dot.buildAndAttach([staveNote], { all: true })
    }

    // Keep stems, flags, and accidentals in crisp archival ink; subtly tint noteheads for LH/RH clarity
    staveNote.setStyle({ fillStyle: palette.ink, strokeStyle: palette.ink })
    staveNote.setStemStyle({ strokeStyle: palette.ink, fillStyle: palette.ink })
    staveNote.setFlagStyle({ strokeStyle: palette.ink, fillStyle: palette.ink })
    for (let k = 0; k < sortedKeys.length; k++) {
      staveNote.setKeyStyle(k, { fillStyle: noteheadColor, strokeStyle: noteheadColor })
    }

    result.push({ note: staveNote, beatOffset: offset, isRest: false })
    cursor = Math.min(measureBeats, offset + effectiveBeats)
  }

  // Fill any trailing beats (or completely empty measure) with rests
  if (result.length === 0 || cursor < measureBeats - 0.05) {
    const remaining = result.length === 0 ? measureBeats : measureBeats - cursor
    const trailingRests = decomposeRestBeats(remaining)
    let restCursor = cursor
    for (const r of trailingRests) {
      const restNote = new StaveNote({
        keys: [restKey],
        duration: `${r.duration}r`,
        clef,
      })
      if (r.dots > 0) {
        Dot.buildAndAttach([restNote], { all: true })
      }
      restNote.addClass('sonus-rest')
      restNote.setStyle({ fillStyle: palette.ink, strokeStyle: palette.ink })
      result.push({ note: restNote, beatOffset: restCursor, isRest: true })
      restCursor += r.duration === 'w' ? 4 : r.duration === 'h' ? (r.dots ? 3 : 2) : r.duration === 'q' ? (r.dots ? 1.5 : 1) : r.duration === '8' ? 0.5 : 0.25
    }
  }

  return result
}

function generateSafeBeams(notes: StemmableNote[], color: string, isTab = false): Beam[] {
  try {
    const beams = Beam.generateBeams(notes, {
      maintainStemDirections: isTab,
      flatBeams: isTab,
      stemDirection: isTab ? -1 : undefined,
    })
    for (const beam of beams) {
      beam.setStyle({ fillStyle: color, strokeStyle: color })
    }
    return beams
  } catch {
    return []
  }
}

function finalizeAnchors(rawAnchors: BeatAnchor[]): BeatAnchor[] {
  const sorted = [...rawAnchors].sort((a, b) => a.beat - b.beat || a.x - b.x)
  const deduped: BeatAnchor[] = []

  for (const anchor of sorted) {
    if (deduped.length === 0) {
      deduped.push(anchor)
      continue
    }
    const prev = deduped[deduped.length - 1]
    if (Math.abs(anchor.beat - prev.beat) < 0.005) {
      // Average closely aligned treble/bass anchors on the same beat
      prev.x = (prev.x + anchor.x) / 2
    } else if (anchor.x >= prev.x) {
      deduped.push(anchor)
    }
  }

  return deduped
}

function renderPianoGrandStaff(
  container: HTMLElement,
  options: RenderVexFlowScoreOptions,
  palette: ThemePalette
): EngravedScoreMetrics {
  const { progression, beatsPerMeasure } = options
  const vexKey = normalizeKeySignature(options.keySignature)
  const preferFlats = FLAT_KEY_SIGNATURES.has(vexKey)
  const ts = parseTimeSignature(options.timeSignature, beatsPerMeasure)

  const leftOriginX = 20
  const trebleY = 48
  const bassY = 152
  const totalHeight = 278

  // Estimate per-measure widths based on rhythmic density so notes always breathe cleanly
  const keyAccCount = vexKey === 'C' || vexKey === 'Am' ? 0 : 3
  const firstMeasureExtra = 82 + keyAccCount * 10

  const measureWidths = progression.map((chord, idx) => {
    const durBeats = chord.duration_beats ?? beatsPerMeasure
    const melodyCount = chord.melodyNotes?.length ?? 2
    const densityWidth = Math.max(250, durBeats * 72, melodyCount * 30 + 70)
    return idx === 0 ? densityWidth + firstMeasureExtra : densityWidth
  })

  const totalWidth = Math.max(
    420,
    leftOriginX + measureWidths.reduce((sum, w) => sum + w, 0) + 40
  )

  container.innerHTML = ''
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(totalWidth, totalHeight)
  const ctx = renderer.getContext() as SVGContext
  ctx.backgroundFillStyle = palette.surfaceBg
  ctx.setFillStyle(palette.ink)
  ctx.setStrokeStyle(palette.ink)

  const measures: MeasureGeometry[] = []
  const rawAnchors: BeatAnchor[] = []
  let noteCount = 0
  let xCursor = leftOriginX
  let beatCursor = 0
  let firstLineY = trebleY + 40
  let lineSpacing = 10
  let bassFirstLineY = bassY + 40

  for (let mIdx = 0; mIdx < progression.length; mIdx++) {
    const chord = progression[mIdx]
    const measureBeats = chord.duration_beats ?? beatsPerMeasure
    const width = measureWidths[mIdx]
    const isFirst = mIdx === 0
    const isLast = mIdx === progression.length - 1

    const staveTreble = new Stave(xCursor, trebleY, width)
    const staveBass = new Stave(xCursor, bassY, width)

    staveTreble.setStyle({ strokeStyle: palette.staffLine, fillStyle: palette.ink })
    staveBass.setStyle({ strokeStyle: palette.staffLine, fillStyle: palette.ink })

    if (isFirst) {
      staveTreble.addClef('treble')
      staveBass.addClef('bass')
      if (vexKey !== 'C' && vexKey !== 'Am') {
        staveTreble.addKeySignature(vexKey)
        staveBass.addKeySignature(vexKey)
      }
      staveTreble.addTimeSignature(ts.display)
      staveBass.addTimeSignature(ts.display)
    } else {
      staveTreble.setBegBarType(BarlineType.NONE)
      staveBass.setBegBarType(BarlineType.NONE)
    }

    if (isLast) {
      staveTreble.setEndBarType(BarlineType.END)
      staveBass.setEndBarType(BarlineType.END)
    }

    staveTreble.setContext(ctx).draw()
    staveBass.setContext(ctx).draw()

    // Connect Treble & Bass with authentic Grand Staff brace & system barlines
    if (isFirst) {
      const brace = new StaveConnector(staveTreble, staveBass).setType('brace')
      brace.setStyle({ fillStyle: palette.ink, strokeStyle: palette.ink })
      brace.setContext(ctx).draw()

      const leftLine = new StaveConnector(staveTreble, staveBass).setType('singleLeft')
      leftLine.setStyle({ fillStyle: palette.staffLine, strokeStyle: palette.staffLine })
      leftLine.setContext(ctx).draw()
    }

    const rightConnector = new StaveConnector(staveTreble, staveBass).setType(
      isLast ? 'boldDoubleRight' : 'singleRight'
    )
    rightConnector.setStyle({ fillStyle: palette.staffLine, strokeStyle: palette.staffLine })
    rightConnector.setContext(ctx).draw()

    // Extract treble and bass note events
    const trebleRaw: Array<{ vexKey: string; beatOffset: number; duration: number }> = []
    const bassRaw: Array<{ vexKey: string; beatOffset: number; duration: number }> = []

    if (chord.melodyNotes && chord.melodyNotes.length > 0) {
      for (const n of chord.melodyNotes) {
        const vk = pitchToVexKey(n.pitch)
        const targetClef = n.clef ?? (vexKeyToMidi(vk) >= 60 ? 'treble' : 'bass')
        const item = { vexKey: vk, beatOffset: n.beatOffset, duration: n.duration }
        if (targetClef === 'treble') {
          trebleRaw.push(item)
        } else {
          bassRaw.push(item)
        }
      }
    } else {
      // Derive authentic grand staff voicing from chord.pianoVoicing
      const rhNotes =
        chord.pianoVoicing?.rhNotes && chord.pianoVoicing.rhNotes.length > 0
          ? chord.pianoVoicing.rhNotes.map(pitchToVexKey)
          : (chord.pianoVoicing?.rhPitches ?? [60, 64, 67]).map((m) => midiToVexKey(m, preferFlats))
      const lhNotes =
        chord.pianoVoicing?.lhNotes && chord.pianoVoicing.lhNotes.length > 0
          ? chord.pianoVoicing.lhNotes.map(pitchToVexKey)
          : (chord.pianoVoicing?.lhPitches ?? [48]).map((m) => midiToVexKey(m, preferFlats))

      for (const vk of rhNotes) {
        trebleRaw.push({ vexKey: vk, beatOffset: 0, duration: measureBeats })
      }
      for (const vk of lhNotes) {
        bassRaw.push({ vexKey: vk, beatOffset: 0, duration: measureBeats })
      }
    }

    const timedTreble = buildPianoVoiceNotes('treble', trebleRaw, measureBeats, palette)
    const timedBass = buildPianoVoiceNotes('bass', bassRaw, measureBeats, palette)

    const trebleStaveNotes = timedTreble.map((t) => t.note)
    const bassStaveNotes = timedBass.map((t) => t.note)

    const voiceTreble = new Voice({ numBeats: ts.numBeats, beatValue: ts.beatValue }).setMode(
      Voice.Mode.SOFT
    )
    const voiceBass = new Voice({ numBeats: ts.numBeats, beatValue: ts.beatValue }).setMode(
      Voice.Mode.SOFT
    )

    voiceTreble.addTickables(trebleStaveNotes)
    voiceBass.addTickables(bassStaveNotes)

    // Authentic music-theory accidental calculation based on active key signature
    try {
      Accidental.applyAccidentals([voiceTreble], vexKey)
    } catch {
      // Fallback safely if uncommon pitch spelling
    }
    try {
      Accidental.applyAccidentals([voiceBass], vexKey)
    } catch {
      // Fallback safely
    }

    const noteStartX = Math.max(staveTreble.getNoteStartX(), staveBass.getNoteStartX()) + (isFirst ? 4 : 18)
    staveTreble.setNoteStartX(noteStartX)
    staveBass.setNoteStartX(noteStartX)

    if (isFirst) {
      firstLineY = staveTreble.getYForLine(0)
      lineSpacing = Math.max(8, staveTreble.getYForLine(1) - staveTreble.getYForLine(0))
      bassFirstLineY = staveBass.getYForLine(0)
    }

    const formatWidth = Math.max(80, xCursor + width - noteStartX - 24)

    // Automatic beams for eighth/sixteenth melodic runs (must be created before drawing voices)
    const trebleBeams = generateSafeBeams(trebleStaveNotes, palette.ink)
    const bassBeams = generateSafeBeams(bassStaveNotes, palette.ink)

    new Formatter()
      .joinVoices([voiceTreble])
      .joinVoices([voiceBass])
      .format([voiceTreble, voiceBass], formatWidth)

    voiceTreble.draw(ctx, staveTreble)
    voiceBass.draw(ctx, staveBass)

    for (const beam of trebleBeams) {
      beam.setContext(ctx).draw()
    }
    for (const beam of bassBeams) {
      beam.setContext(ctx).draw()
    }

    // Record exact engraved beat-to-X anchors for sub-millisecond audio playhead sync
    const measureRightX = xCursor + width
    let hasBeatZeroAnchor = false

    for (const item of [...timedTreble, ...timedBass]) {
      const absX = item.note.getAbsoluteX()
      if (!Number.isNaN(absX) && Number.isFinite(absX)) {
        // StaveNote.getAbsoluteX() returns the left edge of the notehead (~10px wide);
        // offset by +5px to align the playhead caliper cleanly through the notehead center.
        rawAnchors.push({ beat: beatCursor + item.beatOffset, x: absX + 5 })
        if (item.beatOffset < 0.01) hasBeatZeroAnchor = true
      }
      if (!item.isRest) {
        noteCount += item.note.getKeys().length
      }
    }

    if (!hasBeatZeroAnchor) {
      rawAnchors.push({ beat: beatCursor, x: noteStartX })
    }

    // Smooth measure boundary anchor: place measure end slightly before next measure's beat 0
    // (only for the very last measure; intermediate measures transition smoothly to next bar's beat 0)
    if (isLast) {
      rawAnchors.push({ beat: beatCursor + measureBeats, x: measureRightX - 10 })
    }

    measures.push({
      measureIndex: mIdx,
      startBeat: beatCursor,
      endBeat: beatCursor + measureBeats,
      x: xCursor,
      width,
      noteStartX,
      chordName: chord.chordName,
      barreFret: chord.guitarTab?.barreFret,
    })

    xCursor += width
    beatCursor += measureBeats
  }

  // Tag rendered VexFlow pitched notehead groups (excluding rests) for accessibility & verification
  const svgEl = container.querySelector('svg')
  if (svgEl) {
    svgEl.setAttribute('data-testid', 'vexflow-grand-staff-svg')
    svgEl.querySelectorAll('.vf-notehead').forEach((el) => {
      if (!el.closest('.vf-sonus-rest') && !el.closest('.sonus-rest')) {
        el.setAttribute('data-testid', 'grand-staff-notehead')
      }
    })
  }

  return {
    totalWidth,
    totalHeight,
    totalBeats: beatCursor,
    keySignature: vexKey,
    timeSignature: ts.display,
    anchors: finalizeAnchors(rawAnchors),
    measures,
    strumMarkers: [],
    noteCount,
    firstLineY,
    lineSpacing,
    bassFirstLineY,
  }
}

function buildGuitarPositionsFromChord(
  chord: FlowingChordItem,
  isMutedStrum: boolean
): TabNotePosition[] {
  if (isMutedStrum) {
    return [
      { str: 2, fret: 'X' },
      { str: 3, fret: 'X' },
      { str: 4, fret: 'X' },
    ]
  }

  const frets = chord.guitarTab?.frets ?? [null, 3, 2, 0, 1, 0]
  const positions: TabNotePosition[] = []
  // chord.guitarTab.frets is ordered [lowE(6), A(5), D(4), G(3), B(2), highE(1)]
  // VexFlow TabNote uses str: 1 (high e) .. 6 (low E)
  for (let idx = 0; idx < 6; idx++) {
    const fretVal = frets[idx]
    if (fretVal !== null && fretVal !== undefined) {
      positions.push({ str: 6 - idx, fret: fretVal })
    }
  }

  if (positions.length === 0) {
    positions.push({ str: 3, fret: 0 })
  }

  return positions
}

function renderGuitarTablature(
  container: HTMLElement,
  options: RenderVexFlowScoreOptions,
  palette: ThemePalette
): EngravedScoreMetrics {
  const { progression, beatsPerMeasure } = options
  const vexKey = normalizeKeySignature(options.keySignature)
  const ts = parseTimeSignature(options.timeSignature, beatsPerMeasure)

  const leftOriginX = 20
  const tabY = 34
  const totalHeight = 236
  const firstMeasureExtra = 76

  const measureWidths = progression.map((chord, idx) => {
    const durBeats = chord.duration_beats ?? beatsPerMeasure
    const plucksCount = (chord.plucked_notes ?? chord.pluckedNotes)?.length ?? 0
    const strumCount = plucksCount > 0 ? plucksCount : (chord.strumEvents?.length ?? 1)
    const base = Math.max(250, durBeats * 70, strumCount * 52 + 64)
    return idx === 0 ? base + firstMeasureExtra : base
  })

  const totalWidth = Math.max(
    420,
    leftOriginX + measureWidths.reduce((sum, w) => sum + w, 0) + 40
  )

  container.innerHTML = ''
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(totalWidth, totalHeight)
  const ctx = renderer.getContext() as SVGContext
  ctx.backgroundFillStyle = palette.surfaceBg
  ctx.setFillStyle(palette.ink)
  ctx.setStrokeStyle(palette.ink)

  const measures: MeasureGeometry[] = []
  const rawAnchors: BeatAnchor[] = []
  const strumMarkers: StrumMarkerGeometry[] = []
  let noteCount = 0
  let xCursor = leftOriginX
  let beatCursor = 0
  let firstLineY = tabY + 56
  let lineSpacing = 14

  for (let mIdx = 0; mIdx < progression.length; mIdx++) {
    const chord = progression[mIdx]
    const measureBeats = chord.duration_beats ?? beatsPerMeasure
    const width = measureWidths[mIdx]
    const isFirst = mIdx === 0
    const isLast = mIdx === progression.length - 1

    const tabStave = new TabStave(xCursor, tabY, width, {
      numLines: 6,
      spacingBetweenLinesPx: 14,
    })
    tabStave.setStyle({ strokeStyle: palette.staffLine, fillStyle: palette.ink })

    if (isFirst) {
      tabStave.addClef('tab')
      tabStave.addTimeSignature(ts.display)
    } else {
      tabStave.setBegBarType(BarlineType.NONE)
    }

    if (isLast) {
      tabStave.setEndBarType(BarlineType.END)
    }

    tabStave.setContext(ctx).draw()

    const plucks = chord.plucked_notes ?? chord.pluckedNotes
    const timedTabNotes: Array<{
      note: TabNote
      event: StrumEvent
      beatOffset: number
    }> = []

    if (plucks && plucks.length > 0) {
      // --- MODE A: Plucked Arpeggio / Single-Note Sequence ---
      const sortedPlucks = [...plucks].sort((a, b) => a.beatOffset - b.beatOffset)
      for (let pIdx = 0; pIdx < sortedPlucks.length; pIdx++) {
        const p = sortedPlucks[pIdx]
        const nextBeat = pIdx + 1 < sortedPlucks.length ? sortedPlucks[pIdx + 1].beatOffset : measureBeats
        const durBeats = Math.max(0.25, (p.duration && p.duration > 0) ? p.duration : (nextBeat - p.beatOffset))
        const durSpec = beatsToVexDuration(durBeats)
        const isMute = p.fret === 'x' || p.technique === 'mute'
        const fretVal: string | number = isMute ? 'X' : p.fret
        // VexFlow TabNote positions: str 1 (high e) .. 6 (low E)
        const positions: TabNotePosition[] = [{ str: p.string, fret: fretVal }]

        const tabNote = new TabNote(
          {
            positions,
            duration: durSpec.duration,
          },
          durSpec.duration !== 'w'
        )
        tabNote.setStemDirection(-1)
        tabNote.setFontSize(12)

        if (durSpec.dots > 0) {
          Dot.buildAndAttach([tabNote], { all: true })
        }

        const isBass = p.string >= 4
        const fretColor = isBass ? palette.lhNotehead : palette.ink
        tabNote.setStyle({ fillStyle: fretColor, strokeStyle: palette.ink })
        const stem = tabNote.getStem()
        if (stem) {
          stem.setStyle({ strokeStyle: palette.ink, fillStyle: palette.ink })
        }

        const direction = p.string >= 4 ? 'down' : (p.beatOffset % 2 === 0 ? 'down' : 'up')
        const evt: StrumEvent = {
          beatOffset: p.beatOffset,
          direction,
          accent: isBass,
          label: isBass ? 'P' : (direction === 'up' ? 'U' : 'D'),
        }

        timedTabNotes.push({ note: tabNote, event: evt, beatOffset: p.beatOffset })
      }
    } else {
      // --- MODE B: Rhythmic Strumming Blocks ---
      const events: StrumEvent[] =
        chord.strumEvents && chord.strumEvents.length > 0
          ? chord.strumEvents
          : [{ beatOffset: 0, direction: 'down', accent: true, label: 'D' }]

      const sortedEvents = [...events]
        .filter((e) => e.direction !== 'rest')
        .sort((a, b) => a.beatOffset - b.beatOffset)

      for (let eIdx = 0; eIdx < sortedEvents.length; eIdx++) {
        const evt = sortedEvents[eIdx]
        const nextBeat =
          eIdx + 1 < sortedEvents.length ? sortedEvents[eIdx + 1].beatOffset : measureBeats
        const durBeats = Math.max(0.25, nextBeat - evt.beatOffset)
        const durSpec = beatsToVexDuration(durBeats)
        const positions = buildGuitarPositionsFromChord(chord, evt.direction === 'mute')

        const tabNote = new TabNote(
          {
            positions,
            duration: durSpec.duration,
          },
          durSpec.duration !== 'w' // Whole notes don't have stems; half/quarter/eighth/16th draw rhythmic stems
        )
        tabNote.setStemDirection(-1) // Stems neatly downward beneath 6th string
        tabNote.setFontSize(12)

        if (durSpec.dots > 0) {
          Dot.buildAndAttach([tabNote], { all: true })
        }

        const fretColor = evt.accent ? palette.lhNotehead : palette.ink
        tabNote.setStyle({ fillStyle: fretColor, strokeStyle: palette.ink })
        const stem = tabNote.getStem()
        if (stem) {
          stem.setStyle({ strokeStyle: palette.ink, fillStyle: palette.ink })
        }

        timedTabNotes.push({ note: tabNote, event: evt, beatOffset: evt.beatOffset })
      }
    }

    const tabNoteList = timedTabNotes.map((t) => t.note)
    const voice = new Voice({ numBeats: ts.numBeats, beatValue: ts.beatValue }).setMode(
      Voice.Mode.SOFT
    )
    voice.addTickables(tabNoteList)

    const noteStartX = tabStave.getNoteStartX() + (isFirst ? 8 : 20)
    tabStave.setNoteStartX(noteStartX)
    const formatWidth = Math.max(80, xCursor + width - noteStartX - 24)

    if (isFirst) {
      firstLineY = tabStave.getYForLine(0)
      lineSpacing = Math.max(10, tabStave.getYForLine(1) - tabStave.getYForLine(0))
    }

    const beams = generateSafeBeams(tabNoteList, palette.ink, true)

    new Formatter().joinVoices([voice]).format([voice], formatWidth)

    voice.draw(ctx, tabStave)
    for (const beam of beams) {
      beam.setContext(ctx).draw()
    }

    // Record exact engraved beat-to-X anchors & aligned strum direction markers
    let hasBeatZeroAnchor = false
    for (const item of timedTabNotes) {
      const absX = item.note.getAbsoluteX()
      if (!Number.isNaN(absX) && Number.isFinite(absX)) {
        rawAnchors.push({ beat: beatCursor + item.beatOffset, x: absX })
        if (item.beatOffset < 0.01) hasBeatZeroAnchor = true
        strumMarkers.push({
          measureIndex: mIdx,
          beat: beatCursor + item.beatOffset,
          x: absX,
          direction: item.event.direction,
          accent: Boolean(item.event.accent),
          label: item.event.label ?? (item.event.direction === 'up' ? 'U' : 'D'),
        })
      }
      noteCount += item.note.getPositions().length
    }

    if (!hasBeatZeroAnchor) {
      rawAnchors.push({ beat: beatCursor, x: noteStartX })
    }

    if (isLast) {
      rawAnchors.push({ beat: beatCursor + measureBeats, x: xCursor + width - 10 })
    }

    measures.push({
      measureIndex: mIdx,
      startBeat: beatCursor,
      endBeat: beatCursor + measureBeats,
      x: xCursor,
      width,
      noteStartX,
      chordName: chord.chordName,
      barreFret: chord.guitarTab?.barreFret,
    })

    xCursor += width
    beatCursor += measureBeats
  }

  const svgEl = container.querySelector('svg')
  if (svgEl) {
    svgEl.setAttribute('data-testid', 'vexflow-guitar-tab-svg')
  }

  return {
    totalWidth,
    totalHeight,
    totalBeats: beatCursor,
    keySignature: vexKey,
    timeSignature: ts.display,
    anchors: finalizeAnchors(rawAnchors),
    measures,
    strumMarkers,
    noteCount,
    firstLineY,
    lineSpacing,
  }
}

/**
 * Renders a publication-grade VexFlow v5 (Bravura SMuFL) horizontal score
 * for either Piano Grand Staff or Guitar Tablature into the provided container element,
 * returning exact engraved measure bounds and beat-to-X anchors for 60fps audio playhead sync.
 */
export function renderVexFlowScore(
  container: HTMLElement,
  options: RenderVexFlowScoreOptions
): EngravedScoreMetrics {
  const palette = getThemePalette(Boolean(options.isDark))
  if (options.instrument === 'piano') {
    return renderPianoGrandStaff(container, options, palette)
  }
  return renderGuitarTablature(container, options, palette)
}
