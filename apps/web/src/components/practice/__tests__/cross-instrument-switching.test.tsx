import { describe, it, expect } from 'vitest'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'
import {
  projectSongToInstrument,
  noteToMidi,
  type FlowingChordItem,
} from '@/lib/music/instrument-lens'

describe('Cross-Instrument Song Switching & Projection', () => {
  it('projects guitar song (House of the Rising Sun) into piano grand staff without losing notes', () => {
    const guitarSong = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_guitar_rising_sun')
    expect(guitarSong).toBeDefined()
    if (!guitarSong) return

    const pianoProgression = projectSongToInstrument(guitarSong, 'piano')
    expect(pianoProgression.length).toBeGreaterThan(0)

    // Every measure should have melodyNotes populated for the Grand Staff
    for (const measure of pianoProgression) {
      expect(measure.melodyNotes).toBeDefined()
      expect(measure.melodyNotes!.length).toBeGreaterThan(0)
    }

    // Compare pitches between guitar projection and piano projection
    const guitarProgression = projectSongToInstrument(guitarSong, 'guitar')
    for (let i = 0; i < Math.min(guitarProgression.length, pianoProgression.length); i++) {
      const gMeasure = guitarProgression[i]
      const pMeasure = pianoProgression[i]

      const gPitches = (gMeasure.plucked_notes || []).map((p) => p.pitch).sort((a, b) => a - b)
      const pPitches = (pMeasure.melodyNotes || [])
        .map((m) => (typeof m.pitch === 'number' ? m.pitch : noteToMidi(m.pitch)))
        .sort((a, b) => a - b)

      expect(pPitches).toEqual(gPitches)
    }
  })

  it('projects piano song (Pachelbel Canon) into guitar fretboard tablature without losing notes', () => {
    const pianoSong = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_piano_canon')
    expect(pianoSong).toBeDefined()
    if (!pianoSong) return

    const guitarProgression = projectSongToInstrument(pianoSong, 'guitar')
    expect(guitarProgression.length).toBeGreaterThan(0)

    // Every measure should have plucked_notes populated for guitar tab/fretboard
    for (const measure of guitarProgression) {
      expect(measure.plucked_notes).toBeDefined()
      expect(measure.plucked_notes!.length).toBeGreaterThan(0)
      for (const pluck of measure.plucked_notes!) {
        expect(pluck.string).toBeGreaterThanOrEqual(1)
        expect(pluck.string).toBeLessThanOrEqual(6)
        expect(typeof pluck.fret).toBe('number')
      }
    }

    // Compare pitches between piano projection and guitar projection
    const pianoProgression = projectSongToInstrument(pianoSong, 'piano')
    for (let i = 0; i < Math.min(guitarProgression.length, pianoProgression.length); i++) {
      const gMeasure = guitarProgression[i]
      const pMeasure = pianoProgression[i]

      const gPitches = (gMeasure.plucked_notes || []).map((p) => p.pitch).sort((a, b) => a - b)
      const pPitches = (pMeasure.melodyNotes || [])
        .map((m) => (typeof m.pitch === 'number' ? m.pitch : noteToMidi(m.pitch)))
        .sort((a, b) => a - b)

      expect(gPitches).toEqual(pPitches)
    }
  })

  it('preserves measure durations and time signatures across projection', () => {
    for (const song of BUILTIN_FULL_SONGS) {
      const gProj = projectSongToInstrument(song, 'guitar')
      const pProj = projectSongToInstrument(song, 'piano')

      expect(gProj.length).toBe(pProj.length)
      for (let i = 0; i < gProj.length; i++) {
        expect(gProj[i].duration_beats).toBe(pProj[i].duration_beats)
      }
    }
  })
})
