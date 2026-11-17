import { Chord, Note } from 'tonal'
import type { GuitarTabVoicing, PianoVoicing, PitchSpellingItem } from './chord-voicings'

const GUITAR_STRING_MIDI = [40, 45, 50, 55, 59, 64] // E2, A2, D3, G3, B3, E4

const NOTE_NAME_TO_PC: Record<string, number> = {
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

const PITCH_CLASS_TO_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const PITCH_CLASS_TO_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

/**
 * Domain entity representing a rich musical chord.
 * Uses @tonaljs to parse arbitrary chord symbols, calculate intervals, enharmonics,
 * piano LH/RH voicings, and dynamic CAGED guitar fretboard positions.
 */
export class MusicalChord {
  readonly symbol: string
  readonly root: string
  readonly quality: string
  readonly bass: string
  readonly notes: string[]
  readonly intervals: string[]
  readonly pitchClasses: number[]

  constructor(chordSymbol: string) {
    let raw = (chordSymbol || '').trim()
    if (!raw) {
      this.symbol = 'C'
      this.root = 'C'
      this.quality = 'Major'
      this.bass = 'C'
      this.notes = ['C', 'E', 'G']
      this.intervals = ['1P', '3M', '5P']
      this.pitchClasses = [0, 4, 7]
      return
    }

    if (raw === 'G_folk' || raw === 'Gfolk' || raw === 'G-folk' || raw === 'G3') {
      raw = 'G'
    }

    const parsed = Chord.get(raw)
    if (!parsed.empty) {
      this.symbol = raw
      this.root = parsed.tonic || parsed.root || 'C'
      this.quality = parsed.quality || parsed.type || 'Major'
      this.bass = parsed.bass || this.root
      this.notes = parsed.notes.length > 0 ? parsed.notes : ['C', 'E', 'G']
      this.intervals = parsed.intervals.length > 0 ? parsed.intervals : ['1P', '3M', '5P']
      this.pitchClasses = Array.from(
        new Set(this.notes.map((n) => Note.chroma(n) ?? (NOTE_NAME_TO_PC[n] ?? 0)))
      ).sort((a, b) => a - b)
    } else {
      // Manual fallback parser if Tonal does not recognize non-standard naming
      const match = raw.match(/^([A-Ga-g][#b]?)([^/]*)(?:\/([A-Ga-g][#b]?))?$/)
      const rootPart = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'C'
      const qualPart = match ? match[2].trim() : ''
      const bassPart = match && match[3] ? match[3].charAt(0).toUpperCase() + match[3].slice(1) : rootPart

      this.symbol = raw
      this.root = rootPart
      this.quality = qualPart || 'Major'
      this.bass = bassPart
      this.notes = [rootPart]
      this.intervals = ['1P']
      const rootPc = NOTE_NAME_TO_PC[rootPart] ?? 0
      this.pitchClasses = [rootPc]
    }
  }

  static parse(symbol: string): MusicalChord {
    return new MusicalChord(symbol)
  }

  get rootPitchClass(): number {
    return Note.chroma(this.root) ?? (NOTE_NAME_TO_PC[this.root] ?? 0)
  }

  get bassPitchClass(): number {
    return Note.chroma(this.bass) ?? (NOTE_NAME_TO_PC[this.bass] ?? this.rootPitchClass)
  }

  /**
   * Checks whether this chord has the identical pitch class set as another chord,
   * regardless of accidental spelling (e.g. F# == Gb, C#m == Dbm).
   */
  isEnharmonicallyEquivalent(other: MusicalChord | string): boolean {
    const target = typeof other === 'string' ? new MusicalChord(other) : other
    if (this.pitchClasses.length !== target.pitchClasses.length) return false
    return this.pitchClasses.every((pc, idx) => pc === target.pitchClasses[idx])
  }

  /**
   * Generates dynamic acoustic piano LH/RH voicing.
   */
  getPianoVoicing(): PianoVoicing {
    const bassPc = this.bassPitchClass
    const rootPc = this.rootPitchClass
    const isFlatKey = this.bass.includes('b') || this.bass === 'F' || this.root.includes('b') || this.root === 'F'
    const noteTable = isFlatKey ? PITCH_CLASS_TO_FLATS : PITCH_CLASS_TO_SHARPS

    // LH: Bass Root / Slash Bass strictly in low register (octave 2: C2=36 to B2=47)
    const lhBassMidi = 36 + bassPc // C2 = 36
    const lhNotes = [`${noteTable[bassPc]}2`]
    const lhPitches = [lhBassMidi]

    // RH: Chord tones in root position starting around middle C (C4-B4 register)
    const rhNotes: string[] = []
    const rhPitches: number[] = []
    const rhRootMidi = 60 + rootPc
    let prevMidi = rhRootMidi

    this.notes.forEach((noteName, idx) => {
      const pc = Note.chroma(noteName) ?? (NOTE_NAME_TO_PC[noteName] ?? 0)
      let midi = 60 + pc
      if (idx === 0) {
        midi = rhRootMidi
      } else {
        while (midi < rhRootMidi || midi <= prevMidi) {
          midi += 12
        }
      }
      prevMidi = midi
      rhPitches.push(midi)
      const octave = Math.floor(midi / 12) - 1
      rhNotes.push(`${noteTable[pc]}${octave}`)
    })

    return {
      lhNotes,
      rhNotes,
      lhPitches,
      rhPitches,
    }
  }

  /**
   * Generates dynamic CAGED guitar fret diagram without dummy open-string fallbacks.
   */
  getGuitarVoicing(): GuitarTabVoicing {
    const rPc = this.rootPitchClass
    const qLower = this.quality.toLowerCase()
    const isMinor = qLower.includes('m') && !qLower.includes('maj')
    const is7th = qLower.includes('7') && !qLower.includes('maj7') && !qLower.includes('m7')
    const isMaj7 = qLower.includes('maj7') || qLower.includes('m7')
    const isSus4 = qLower.includes('sus4') || qLower.includes('sus')

    // Root fret on 6th string (E):
    const fret6 = (rPc - 4 + 12) % 12
    // Root fret on 5th string (A):
    const fret5 = (rPc - 9 + 12) % 12

    let frets: (number | null)[]
    let barreFret: number | undefined
    let baseFret = 1
    let fingering = 'x-x-x-x-x-x'
    let fingers: (number | null | string)[] = [null, null, null, null, null, null]

    if (fret6 <= 5) {
      // 6th string barre (E-shape root)
      baseFret = Math.max(1, fret6)
      barreFret = fret6 > 0 ? fret6 : undefined
      if (isMinor) {
        frets = [fret6, fret6 + 2, fret6 + 2, fret6, fret6, fret6]
        fingers = [1, 3, 4, 1, 1, 1]
        fingering = `${fret6}-${fret6 + 2}-${fret6 + 2}-${fret6}-${fret6}-${fret6}`
      } else if (is7th) {
        frets = [fret6, fret6 + 2, fret6, fret6 + 1, fret6, fret6]
        fingers = [1, 3, 1, 2, 1, 1]
        fingering = `${fret6}-${fret6 + 2}-${fret6}-${fret6 + 1}-${fret6}-${fret6}`
      } else {
        frets = [fret6, fret6 + 2, fret6 + 2, fret6 + 1, fret6, fret6]
        fingers = [1, 3, 4, 2, 1, 1]
        fingering = `${fret6}-${fret6 + 2}-${fret6 + 2}-${fret6 + 1}-${fret6}-${fret6}`
      }
    } else {
      // 5th string barre (A-shape root)
      baseFret = Math.max(1, fret5)
      barreFret = fret5 > 0 ? fret5 : undefined
      if (isMinor) {
        frets = [null, fret5, fret5 + 2, fret5 + 2, fret5 + 1, fret5]
        fingers = [null, 1, 3, 4, 2, 1]
        fingering = `x-${fret5}-${fret5 + 2}-${fret5 + 2}-${fret5 + 1}-${fret5}`
      } else if (isMaj7) {
        frets = [null, fret5, fret5 + 2, fret5 + 1, fret5 + 2, fret5]
        fingers = [null, 1, 3, 2, 4, 1]
        fingering = `x-${fret5}-${fret5 + 2}-${fret5 + 1}-${fret5 + 2}-${fret5}`
      } else if (isSus4) {
        frets = [null, fret5, fret5 + 2, fret5 + 2, fret5 + 3, fret5]
        fingers = [null, 1, 2, 3, 4, 1]
        fingering = `x-${fret5}-${fret5 + 2}-${fret5 + 2}-${fret5 + 3}-${fret5}`
      } else {
        frets = [null, fret5, fret5 + 2, fret5 + 2, fret5 + 2, fret5]
        fingers = [null, 1, 2, 3, 4, 1]
        fingering = `x-${fret5}-${fret5 + 2}-${fret5 + 2}-${fret5 + 2}-${fret5}`
      }
    }

    // Zero out fingers on open (fret 0) or muted (null) strings
    const sanitizedFingers = fingers.map((f, i) => (frets[i] === null || frets[i] === 0 ? null : f))

    return {
      frets,
      fingering,
      fingers: sanitizedFingers,
      barreFret,
      baseFret,
      strings: 'E-A-D-G-B-e',
    }
  }

  /**
   * Returns human-readable pitch spelling roles (Root, Third, Fifth, etc.).
   */
  getPitchSpelling(): PitchSpellingItem[] {
    const isFlatKey = this.root.includes('b') || this.root === 'F'
    const noteTable = isFlatKey ? PITCH_CLASS_TO_FLATS : PITCH_CLASS_TO_SHARPS
    const roleNames = ['Root', 'Third', 'Fifth', 'Seventh', 'Ninth', 'Eleventh']

    return this.notes.map((n, idx) => {
      const pc = Note.chroma(n) ?? (NOTE_NAME_TO_PC[n] ?? 0)
      return {
        note: noteTable[pc],
        role: roleNames[idx] || 'Extension',
      }
    })
  }

  /**
   * Expected MIDI pitches played for this chord given the instrument.
   */
  getExpectedMidiPitches(instrument: 'guitar' | 'piano'): number[] {
    if (instrument === 'guitar') {
      const tab = this.getGuitarVoicing()
      const pitches: number[] = []
      tab.frets.forEach((fret, stringIdx) => {
        if (fret !== null) {
          pitches.push(GUITAR_STRING_MIDI[stringIdx] + fret)
        }
      })
      return pitches.sort((a, b) => a - b)
    }

    const piano = this.getPianoVoicing()
    return Array.from(new Set([...piano.lhPitches, ...piano.rhPitches])).sort((a, b) => a - b)
  }
}
