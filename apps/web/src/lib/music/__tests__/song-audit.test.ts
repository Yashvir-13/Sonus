import { describe, it, expect } from 'vitest'
import { BUILTIN_FULL_SONGS } from '../song-catalog'
import { projectSongToInstrument } from '../instrument-lens'
import { renderVexFlowScore } from '../../notation/vexflow-score-builder'

describe('Comprehensive 20-Song Full Audio & Score Audit', () => {
  it('contains exactly 20 catalog songs', () => {
    expect(BUILTIN_FULL_SONGS.length).toBe(20)
  })

  it('guarantees Whiskey in the Jar preserves all 6 rhythmic strums and does not hijack into beat-0 plucks', () => {
    const whiskey = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_guitar_whiskey_in_the_jar')!
    expect(whiskey).toBeDefined()

    const guitarProg = projectSongToInstrument(whiskey, 'guitar')
    expect(guitarProg.length).toBeGreaterThan(0)

    for (const chord of guitarProg) {
      expect(chord.strumEvents).toBeDefined()
      expect(chord.strumEvents!.length).toBe(6) // D - D U - U D U
      expect(chord.plucked_notes).toBeUndefined()
      expect(chord.pluckedNotes).toBeUndefined()
      expect(chord.strumEvents!.map((e) => e.beatOffset)).toEqual([0, 1, 1.5, 2.5, 3, 3.5])
    }
  })

  it('guarantees Knockin and Blues Shuffle preserve authored acoustic picking and boogie plucks', () => {
    const knockin = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_guitar_knockin')!
    const knockinGuitar = projectSongToInstrument(knockin, 'guitar')
    // In Knockin, verse measures are fingerpicked arpeggios, chorus measures are strummed
    for (const chord of knockinGuitar) {
      const isPluck = Boolean(chord.plucked_notes && chord.plucked_notes.length > 0)
      const isStrum = Boolean(chord.strumEvents && chord.strumEvents.length > 0)
      expect(isPluck || isStrum).toBe(true)
    }

    const blues = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_guitar_blues_shuffle')!
    const bluesGuitar = projectSongToInstrument(blues, 'guitar')
    for (const chord of bluesGuitar) {
      expect(chord.plucked_notes).toBeDefined()
      expect(chord.plucked_notes!.length).toBe(4) // 4 driving boogie bassline plucks per bar
      const offsets = chord.plucked_notes!.map((p) => p.beatOffset)
      expect(offsets).toEqual([0, 1, 2, 3])
    }
  })

  it('guarantees arpeggio songs preserve all plucked notes across multiple beats', () => {
    const risingSun = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_guitar_rising_sun')!
    const risingSunGuitar = projectSongToInstrument(risingSun, 'guitar')
    for (const chord of risingSunGuitar) {
      expect(chord.plucked_notes).toBeDefined()
      expect(chord.plucked_notes!.length).toBe(6)
      const offsets = Array.from(new Set(chord.plucked_notes!.map((p) => p.beatOffset)))
      expect(offsets.length).toBe(6) // 6 distinct eighth-note offsets in 6/8
    }

    const bourree = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_guitar_bourree')!
    const bourreeGuitar = projectSongToInstrument(bourree, 'guitar')
    for (const chord of bourreeGuitar) {
      expect(chord.plucked_notes).toBeDefined()
      expect(chord.plucked_notes!.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('guarantees piano songs projected to guitar have valid multi-offset plucks via Viterbi search', () => {
    const furElise = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_piano_fur_elise')!
    const furEliseGuitar = projectSongToInstrument(furElise, 'guitar')
    for (const chord of furEliseGuitar) {
      expect(chord.plucked_notes).toBeDefined()
      expect(chord.plucked_notes!.length).toBeGreaterThanOrEqual(3)
      const offsets = Array.from(new Set(chord.plucked_notes!.map((p) => p.beatOffset)))
      expect(offsets.length).toBeGreaterThan(1) // multiple distinct beats across the measure
    }

    const clairDeLune = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_piano_clair_de_lune')!
    const clairGuitar = projectSongToInstrument(clairDeLune, 'guitar')
    for (const chord of clairGuitar) {
      expect(chord.plucked_notes).toBeDefined()
      const offsets = Array.from(new Set(chord.plucked_notes!.map((p) => p.beatOffset)))
      expect(offsets.length).toBeGreaterThanOrEqual(3) // 0, 3, 6 in 9/8
    }
  })

  it(
    'audits all 20 songs: projects to both guitar and piano, renders VexFlow score, and validates strictly monotonic beat anchors',
    () => {
      for (const song of BUILTIN_FULL_SONGS) {
      const beats = song.progression?.time_signature === '3/4' ? 3 : song.progression?.time_signature === '6/8' ? 6 : song.progression?.time_signature === '9/8' ? 9 : 4

      // 1. Guitar Lens
      const guitarProg = projectSongToInstrument(song, 'guitar')
      expect(guitarProg.length).toBeGreaterThan(0)
      for (const chord of guitarProg) {
        expect(chord.duration_beats).toBeGreaterThan(0)
        expect(chord.expectedPitches.length).toBeGreaterThan(0)
        // Must either be strummed OR plucked, never empty
        const isStrum = Boolean(chord.strumEvents && chord.strumEvents.length > 0)
        const isPluck = Boolean(chord.plucked_notes && chord.plucked_notes.length > 0)
        expect(isStrum || isPluck).toBe(true)
      }

      const divG = document.createElement('div')
      const metricsG = renderVexFlowScore(divG, {
        instrument: 'guitar',
        progression: guitarProg,
        beatsPerMeasure: beats,
        timeSignature: song.progression?.time_signature ?? '4/4',
        keySignature: song.progression?.key,
      })
      expect(metricsG.anchors.length).toBeGreaterThan(0)
      for (let i = 1; i < metricsG.anchors.length; i++) {
        expect(metricsG.anchors[i].beat).toBeGreaterThanOrEqual(metricsG.anchors[i - 1].beat)
        expect(metricsG.anchors[i].x).toBeGreaterThan(metricsG.anchors[i - 1].x) // strictly monotonic X coordinates!
      }

      // 2. Piano Lens
      const pianoProg = projectSongToInstrument(song, 'piano')
      expect(pianoProg.length).toBeGreaterThan(0)
      for (const chord of pianoProg) {
        expect(chord.duration_beats).toBeGreaterThan(0)
        expect(chord.expectedPitches.length).toBeGreaterThan(0)
        expect(chord.pianoVoicing).toBeDefined()
        expect(chord.pianoVoicing!.lhPitches.length).toBeGreaterThan(0)
        expect(chord.pianoVoicing!.rhPitches.length).toBeGreaterThan(0)
      }

      const divP = document.createElement('div')
      const metricsP = renderVexFlowScore(divP, {
        instrument: 'piano',
        progression: pianoProg,
        beatsPerMeasure: beats,
        timeSignature: song.progression?.time_signature ?? '4/4',
        keySignature: song.progression?.key,
      })
      expect(metricsP.anchors.length).toBeGreaterThan(0)
      for (let i = 1; i < metricsP.anchors.length; i++) {
        expect(metricsP.anchors[i].beat).toBeGreaterThanOrEqual(metricsP.anchors[i - 1].beat)
        expect(metricsP.anchors[i].x).toBeGreaterThan(metricsP.anchors[i - 1].x) // strictly monotonic X coordinates!
      }
    }
  }, 60000)
})
