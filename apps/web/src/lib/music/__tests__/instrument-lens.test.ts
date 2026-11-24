import { describe, it, expect } from 'vitest'
import {
  noteToMidi,
  midiToNote,
  projectToPiano,
  projectToGuitar,
  projectSongToInstrument,
  type FullSongChordItem,
} from '../instrument-lens'
import type { ExerciseDto } from '@/api/sessions'

describe('Instrument Lens Projection Engine', () => {
  describe('Pitch Conversion Helpers', () => {
    it('accurately translates scientific pitch strings to MIDI and vice versa', () => {
      expect(noteToMidi('C4')).toBe(60)
      expect(noteToMidi('A4')).toBe(69)
      expect(noteToMidi('E2')).toBe(40)
      expect(noteToMidi('F#3')).toBe(54)
      expect(noteToMidi('Bb3')).toBe(58)
      expect(noteToMidi(60)).toBe(60)

      expect(midiToNote(60)).toBe('C4')
      expect(midiToNote(69)).toBe('A4')
      expect(midiToNote(40)).toBe('E2')
    })
  })

  describe('projectToPiano (Piano Lens)', () => {
    it('partitions canonical notes into treble and bass clefs around Middle C (C4 / MIDI 60)', () => {
      const measure: FullSongChordItem = {
        name: 'Am',
        beat: 1.0,
        duration_beats: 4.0,
        expected_pitches: [45, 60, 64],
        notes: [
          { pitch: 'A2', beatOffset: 0, duration: 2, voice: 'bass' },
          { pitch: 'C4', beatOffset: 0, duration: 1, voice: 'melody' },
          { pitch: 'E4', beatOffset: 1, duration: 1, voice: 'melody' },
          { pitch: 'A4', beatOffset: 2, duration: 2, voice: 'melody' },
        ],
      }

      const pianoFlowing = projectToPiano(measure)
      expect(pianoFlowing.melodyNotes).toBeDefined()
      expect(pianoFlowing.melodyNotes).toHaveLength(4)

      const bassNotes = pianoFlowing.melodyNotes?.filter((n) => n.clef === 'bass')
      const trebleNotes = pianoFlowing.melodyNotes?.filter((n) => n.clef === 'treble')

      expect(bassNotes).toHaveLength(1)
      expect(bassNotes?.[0].pitch).toBe('A2')

      expect(trebleNotes).toHaveLength(3)
      expect(trebleNotes?.map((n) => n.pitch)).toEqual(['C4', 'E4', 'A4'])

      // Fully populated pianoVoicing for accompaniment and cockpit widgets
      expect(pianoFlowing.pianoVoicing).toBeDefined()
      expect(pianoFlowing.pianoVoicing.lhPitches).toEqual([45])
      expect(pianoFlowing.pianoVoicing.rhPitches).toEqual([60, 64, 69])
      expect(pianoFlowing.pianoVoicing.lhNotes).toEqual(['A2'])
      expect(pianoFlowing.pianoVoicing.rhNotes).toEqual(['C4', 'E4', 'A4'])
      expect(pianoFlowing.pianoVoicing.lhNote).toBe('A2')
    })

    it('derives piano grand staff from guitar plucked_notes when canonical notes are absent', () => {
      const guitarMeasure: FullSongChordItem = {
        name: 'Am',
        beat: 1.0,
        duration_beats: 6.0,
        plucked_notes: [
          { beatOffset: 0, string: 5, fret: 0, pitch: 45, duration: 1 }, // A2
          { beatOffset: 1, string: 4, fret: 2, pitch: 52, duration: 1 }, // E3
          { beatOffset: 2, string: 3, fret: 2, pitch: 57, duration: 1 }, // A3
          { beatOffset: 3, string: 2, fret: 1, pitch: 60, duration: 1 }, // C4
          { beatOffset: 4, string: 1, fret: 0, pitch: 64, duration: 1 }, // E4
          { beatOffset: 5, string: 2, fret: 1, pitch: 60, duration: 1 }, // C4
        ],
      }

      const pianoFlowing = projectToPiano(guitarMeasure)
      expect(pianoFlowing.melodyNotes).toHaveLength(6)

      // Strings 5, 4, 3 (pitches 45, 52, 57 < 60) are Bass clef
      const bassNotes = pianoFlowing.melodyNotes?.filter((n) => n.clef === 'bass')
      expect(bassNotes).toHaveLength(3)

      // Strings 2, 1, 2 (pitches 60, 64, 60 >= 60) are Treble clef
      const trebleNotes = pianoFlowing.melodyNotes?.filter((n) => n.clef === 'treble')
      expect(trebleNotes).toHaveLength(3)
    })
  })

  describe('projectToGuitar (Guitar Lens via Dynamic Programming)', () => {
    it('optimizes string and fret positions for melody notes using dynamic programming', () => {
      const measure: FullSongChordItem = {
        name: 'C',
        beat: 1.0,
        duration_beats: 4.0,
        notes: [
          { pitch: 'C4', beatOffset: 0, duration: 1 }, // MIDI 60 (B string fret 1 or G string fret 5)
          { pitch: 'D4', beatOffset: 1, duration: 1 }, // MIDI 62 (B string fret 3 or G string fret 7)
          { pitch: 'E4', beatOffset: 2, duration: 1 }, // MIDI 64 (high E open fret 0 or B string fret 5)
        ],
      }

      const guitarFlowing = projectToGuitar(measure)
      expect(guitarFlowing.plucked_notes).toBeDefined()
      expect(guitarFlowing.plucked_notes).toHaveLength(3)

      // Verify all frets are within physical playable guitar range (0..17)
      for (const pluck of guitarFlowing.plucked_notes!) {
        expect(pluck.string).toBeGreaterThanOrEqual(1)
        expect(pluck.string).toBeLessThanOrEqual(6)
        expect(pluck.fret).toBeGreaterThanOrEqual(0)
        expect(pluck.fret).toBeLessThanOrEqual(17)
      }

      // Span between fretted notes must not exceed 4 frets
      const frets = guitarFlowing.plucked_notes!.map((p) => Number(p.fret)).filter((f) => f > 0)
      if (frets.length >= 2) {
        const span = Math.max(...frets) - Math.min(...frets)
        expect(span).toBeLessThanOrEqual(4)
      }
    })

    it('snaps to open chord box shapes when chord name is provided', () => {
      const measure: FullSongChordItem = {
        name: 'Am',
        beat: 1.0,
        duration_beats: 4.0,
        notes: [
          { pitch: 45, beatOffset: 0, duration: 1 }, // A2 -> string 5 fret 0
          { pitch: 52, beatOffset: 1, duration: 1 }, // E3 -> string 4 fret 2
          { pitch: 60, beatOffset: 2, duration: 1 }, // C4 -> string 2 fret 1
        ],
      }

      const guitarFlowing = projectToGuitar(measure)
      const plucks = guitarFlowing.plucked_notes!
      expect(plucks).toHaveLength(3)

      expect(plucks[0].string).toBe(5)
      expect(plucks[0].fret).toBe(0)

      expect(plucks[1].string).toBe(4)
      expect(plucks[1].fret).toBe(2)

      expect(plucks[2].string).toBe(2)
      expect(plucks[2].fret).toBe(1)
    })

    it('derives position-accurate guitarTab with baseFret for high-register notes', () => {
      const highMeasure: FullSongChordItem = {
        name: 'D',
        beat: 1.0,
        duration_beats: 4.0,
        notes: [
          { pitch: 'D5', beatOffset: 0, duration: 2 }, // MIDI 74 -> high E string fret 10
          { pitch: 'F#5', beatOffset: 2, duration: 2 }, // MIDI 78 -> high E string fret 14
        ],
      }

      const guitarFlowing = projectToGuitar(highMeasure)
      expect(guitarFlowing.guitarTab).toBeDefined()
      expect(guitarFlowing.guitarTab.baseFret).toBeGreaterThanOrEqual(10)
      expect(guitarFlowing.guitarTab.frets).toBeDefined()
      expect(Array.isArray(guitarFlowing.guitarTab.frets)).toBe(true)
    })
  })

  describe('Cross-Instrument Equivalence & Parity', () => {
    it('maintains 100% identical pitch sequence across both Piano and Guitar projections', () => {
      const testSong: ExerciseDto = {
        id: 'test_cross_inst',
        title: 'Cross Instrument Test',
        instrument: 'guitar',
        tempo_bpm: 100,
        difficulty: 2,
        progression: {
          key: 'A Minor',
          time_signature: '4/4',
          chords: [
            {
              name: 'Am',
              beat: 1.0,
              duration_beats: 4.0,
              notes: [
                { pitch: 'A2', beatOffset: 0, duration: 1 },
                { pitch: 'E3', beatOffset: 1, duration: 1 },
                { pitch: 'C4', beatOffset: 2, duration: 1 },
                { pitch: 'E4', beatOffset: 3, duration: 1 },
              ],
            },
          ],
        },
      }

      const pianoProg = projectSongToInstrument(testSong, 'piano')
      const guitarProg = projectSongToInstrument(testSong, 'guitar')

      const pianoPitches = pianoProg[0].melodyNotes?.map((n) => noteToMidi(n.pitch))
      const guitarPitches = guitarProg[0].plucked_notes?.map((p) => p.pitch)

      expect(pianoPitches).toEqual([45, 52, 60, 64])
      expect(guitarPitches).toEqual([45, 52, 60, 64])
      expect(pianoPitches).toEqual(guitarPitches)
    })
  })
})
