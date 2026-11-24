import { describe, it, expect } from 'vitest'
import {
  BUILTIN_FULL_SONGS,
  type FullSongChordItem,
  type CanonicalNoteEvent,
  type UnifiedMeasureItem,
} from '../song-catalog'
import { resolveChordVoicing } from '../chord-voicings'

describe('Song Catalog (BUILTIN_FULL_SONGS)', () => {
  it('contains all curated production full songs for guitar and piano', () => {
    expect(BUILTIN_FULL_SONGS.length).toBe(20)

    const expectedIds = [
      'ex_guitar_rising_sun',
      'ex_guitar_where_did_you_sleep',
      'ex_guitar_spanish_romance',
      'ex_guitar_scarborough_fair',
      'ex_guitar_greensleeves',
      'ex_guitar_bourree',
      'ex_guitar_whiskey_in_the_jar',
      'ex_guitar_malaguena',
      'ex_guitar_knockin',
      'ex_guitar_blues_shuffle',
      'ex_piano_shostakovich_waltz_2',
      'ex_piano_canon',
      'ex_piano_fur_elise',
      'ex_piano_gymnopedie_1',
      'ex_piano_moonlight_sonata',
      'ex_piano_bach_minuet_g',
      'ex_piano_prelude_c',
      'ex_piano_clair_de_lune',
      'ex_piano_the_entertainer',
      'ex_piano_autumn_turnaround',
    ]

    const actualIds = BUILTIN_FULL_SONGS.map((song) => song.id)
    expect(actualIds).toEqual(expectedIds)
  })

  it('validates common metadata schema for all catalog songs', () => {
    for (const song of BUILTIN_FULL_SONGS) {
      expect(song.id).toBeTruthy()
      expect(typeof song.title).toBe('string')
      expect(song.title.length).toBeGreaterThan(5)
      expect(song.description).toBeDefined()
      expect(typeof song.description).toBe('string')
      expect((song.description ?? '').length).toBeGreaterThan(10)
      expect(['guitar', 'piano']).toContain(song.instrument)
      expect(song.tempo_bpm).toBeGreaterThan(40)
      expect(song.tempo_bpm).toBeLessThanOrEqual(240)
      expect(song.difficulty).toBeGreaterThanOrEqual(1)
      expect(song.difficulty).toBeLessThanOrEqual(5)

      // Progression structure
      expect(song.progression).toBeDefined()
      if (!song.progression) continue

      expect(song.progression.key).toBeTruthy()
      expect(song.progression.chords).toBeDefined()
      expect((song.progression.chords ?? []).length).toBeGreaterThan(0)

      // Tempo range constraints
      const range = song.progression.tempo_range
      expect(range).toBeDefined()
      if (range) {
        expect(range.min_bpm).toBeLessThanOrEqual(range.default_bpm)
        expect(range.default_bpm).toBeLessThanOrEqual(range.max_bpm)
        expect(range.gradual_step_bpm).toBeGreaterThan(0)
      }
    }
  })

  it('validates guitar repertoire song tab voicings, fingerings, and strumming events', () => {
    const guitarSongs = BUILTIN_FULL_SONGS.filter((s) => s.instrument === 'guitar')
    expect(guitarSongs.length).toBe(10)

    for (const song of guitarSongs) {
      expect(song.progression).toBeDefined()
      if (!song.progression) continue

      const chords = (song.progression.chords ?? []) as FullSongChordItem[]
      expect(chords.length).toBeGreaterThanOrEqual(16)

      for (const chord of chords) {
        expect(chord.name).toBeTruthy()
        expect(chord.duration_beats).toBeGreaterThan(0)
        expect(chord.beat).toBeGreaterThanOrEqual(1)

        // Guitar tab data model
        const tabs = chord.guitar_tabs
        expect(tabs).toBeDefined()
        expect(tabs?.frets).toHaveLength(6)
        expect(tabs?.strings).toBeTruthy()

        // Finger assignments must exist for any fretted string (fret > 0)
        if (tabs?.frets) {
          tabs.frets.forEach((fret, stringIdx) => {
            if (fret !== null && fret > 0) {
              expect(tabs.fingers).toBeDefined()
              const finger = tabs.fingers?.[stringIdx]
              expect(finger).not.toBeNull()
              expect(finger).toBeDefined()
            }
          })
        }

        // Strum events
        if (chord.strum_events && chord.strum_events.length > 0) {
          let prevOffset = -1
          for (const ev of chord.strum_events) {
            expect(['down', 'up']).toContain(ev.direction)
            expect(ev.beatOffset).toBeGreaterThanOrEqual(0)
            expect(ev.beatOffset).toBeLessThan(chord.duration_beats ?? 4)
            // Monotonic non-decreasing order
            expect(ev.beatOffset).toBeGreaterThanOrEqual(prevOffset)
            prevOffset = ev.beatOffset
          }
        }
      }
    }
  })

  it('validates piano repertoire song voicings, dual hand pitch octaves, and notation', () => {
    const pianoSongs = BUILTIN_FULL_SONGS.filter((s) => s.instrument === 'piano')
    expect(pianoSongs.length).toBe(10)

    for (const song of pianoSongs) {
      expect(song.progression).toBeDefined()
      if (!song.progression) continue

      const chords = (song.progression.chords ?? []) as FullSongChordItem[]
      expect(chords.length).toBeGreaterThanOrEqual(16)

      for (const chord of chords) {
        expect(chord.name).toBeTruthy()
        expect(chord.duration_beats).toBeGreaterThan(0)

        // Piano voicings model
        const pv = chord.piano_voicings
        expect(pv).toBeDefined()
        expect(pv?.lh_note).toBeTruthy()
        expect(pv?.rh_notes.length).toBeGreaterThan(0)
        expect(pv?.lh_pitches.length).toBeGreaterThan(0)
        expect(pv?.rh_pitches.length).toBeGreaterThan(0)

        // Octave range bounds: LH bass vs RH treble
        for (const lhPitch of pv?.lh_pitches || []) {
          expect(lhPitch).toBeGreaterThanOrEqual(24) // C1
          expect(lhPitch).toBeLessThanOrEqual(59) // Below Middle C (B3)
        }

        for (const rhPitch of pv?.rh_pitches || []) {
          expect(rhPitch).toBeGreaterThanOrEqual(48) // C3 or above
          expect(rhPitch).toBeLessThanOrEqual(84) // C6
        }

        // Melody notes on Grand Staff
        if (chord.melody_notes && chord.melody_notes.length > 0) {
          for (const note of chord.melody_notes) {
            expect(['treble', 'bass']).toContain(note.clef)
            expect(note.duration).toBeGreaterThan(0)
            expect(note.pitch).toMatch(/^[A-G][b#]?[1-6]$/)
            expect(note.beatOffset).toBeGreaterThanOrEqual(0)
          }
        }
      }
    }
  })

  it('validates progression_json parses and aligns with progression.chords', () => {
    for (const song of BUILTIN_FULL_SONGS) {
      expect(song.progression_json).toBeDefined()
      expect(song.progression).toBeDefined()
      if (!song.progression_json || !song.progression) continue

      const parsed = JSON.parse(song.progression_json)
      const chords = (song.progression.chords ?? []) as FullSongChordItem[]

      expect(parsed.key).toBe(song.progression.key)
      expect(parsed.chords.length).toBe(chords.length)

      // Spot check first and last chord names
      expect(parsed.chords[0].name).toBe(chords[0].name)
      const lastIdx = chords.length - 1
      expect(parsed.chords[lastIdx].name).toBe(chords[lastIdx].name)
    }
  })

  it('resolves every chord name across the entire catalog cleanly via resolveChordVoicing', () => {
    const allChordNames = new Set<string>()
    for (const song of BUILTIN_FULL_SONGS) {
      if (!song.progression?.chords) continue
      for (const chord of song.progression.chords) {
        allChordNames.add(chord.name)
      }
    }

    expect(allChordNames.size).toBeGreaterThanOrEqual(8)

    for (const chordName of allChordNames) {
      const voicing = resolveChordVoicing(chordName)
      expect(voicing).toBeDefined()
      expect(voicing.chordName).toBe(chordName)
      expect(voicing.expectedPitches.length).toBeGreaterThan(0)
      expect(voicing.guitarTab).toBeDefined()
      expect(voicing.guitarTab?.frets).toHaveLength(6)
      expect(voicing.pianoVoicing).toBeDefined()
      expect(voicing.pianoVoicing?.lhPitches.length).toBeGreaterThan(0)
      expect(voicing.pianoVoicing?.rhPitches.length).toBeGreaterThan(0)
    }
  })

  it('verifies complete beat coverage across all measures (no missing 4th beats)', () => {
    for (const song of BUILTIN_FULL_SONGS) {
      const parsed = song.progression_json ? JSON.parse(song.progression_json) : {}
      const timeSig = song.progression?.time_signature ?? parsed.time_signature ?? '4/4'
      const chords = (song.progression?.chords ?? []) as FullSongChordItem[]

      for (let mIdx = 0; mIdx < chords.length; mIdx++) {
        const chord = chords[mIdx]
        if (song.instrument === 'piano') {
          const notes = chord.melody_notes ?? []
          const offsets = notes.map((n) => n.beatOffset)

          if (timeSig === '4/4') {
            for (let b = 0; b < 4; b++) {
              const hasBeat = offsets.some((o) => o >= b && o < b + 1.0)
              expect(
                hasBeat,
                `${song.id} M${mIdx + 1} (${chord.name}) missing beat ${b + 1} (offsets: ${JSON.stringify(offsets)})`
              ).toBe(true)
            }
          } else if (timeSig === '3/4') {
            for (let b = 0; b < 3; b++) {
              const hasBeat = offsets.some((o) => o >= b && o < b + 1.0)
              expect(
                hasBeat,
                `${song.id} M${mIdx + 1} (${chord.name}) missing beat ${b + 1} (offsets: ${JSON.stringify(offsets)})`
              ).toBe(true)
            }
          } else if (timeSig === '2/4') {
            for (let b = 0; b < 2; b++) {
              const hasBeat = offsets.some((o) => o >= b && o < b + 1.0)
              expect(
                hasBeat,
                `${song.id} M${mIdx + 1} (${chord.name}) missing beat ${b + 1} (offsets: ${JSON.stringify(offsets)})`
              ).toBe(true)
            }
          } else if (timeSig === '3/8') {
            for (let b = 0; b < 3; b++) {
              const hasBeat = offsets.some((o) => o >= b && o < b + 1.0)
              expect(
                hasBeat,
                `${song.id} M${mIdx + 1} (${chord.name}) missing eighth ${b + 1} (offsets: ${JSON.stringify(offsets)})`
              ).toBe(true)
            }
          } else if (timeSig === '9/8') {
            for (let b = 0; b < 9; b += 3) {
              const hasBeat = offsets.some((o) => o >= b && o < b + 3.0)
              expect(
                hasBeat,
                `${song.id} M${mIdx + 1} (${chord.name}) missing dotted-quarter ${b / 3 + 1}`
              ).toBe(true)
            }
          }
        } else if (song.instrument === 'guitar') {
          const plucks = (chord.plucked_notes ?? []).map((p) => p.beatOffset)
          const strums = (chord.strum_events ?? []).map((s) => s.beatOffset)
          const allOffsets = [...plucks, ...strums]

          if (timeSig === '6/8') {
            for (let b = 0; b < 6; b++) {
              const hasBeat = allOffsets.some((o) => o >= b && o < b + 1.0)
              expect(
                hasBeat,
                `${song.id} M${mIdx + 1} (${chord.name}) missing 6/8 beat ${b + 1}`
              ).toBe(true)
            }
          } else if (timeSig === '4/4') {
            for (let b = 0; b < 4; b++) {
              const hasBeat = allOffsets.some((o) => o >= b && o < b + 1.0)
              expect(
                hasBeat,
                `${song.id} M${mIdx + 1} (${chord.name}) missing 4/4 beat ${b + 1}`
              ).toBe(true)
            }
          } else if (timeSig === '3/4') {
            for (let b = 0; b < 3; b++) {
              const hasBeat = allOffsets.some((o) => o >= b && o < b + 1.0)
              expect(
                hasBeat,
                `${song.id} M${mIdx + 1} (${chord.name}) missing 3/4 beat ${b + 1}`
              ).toBe(true)
            }
          }
        }
      }
    }
  })

  it('confirms House of the Rising Sun has authentic 6/8 single-string plucked arpeggios', () => {
    const risingSun = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_guitar_rising_sun')
    expect(risingSun).toBeDefined()
    const chords = (risingSun?.progression?.chords ?? []) as FullSongChordItem[]
    expect(chords.length).toBe(24)

    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i]
      expect(chord.plucked_notes).toBeDefined()
      expect(chord.plucked_notes?.length).toBe(6)

      // Strings must be single discrete strings
      const strings = chord.plucked_notes?.map((p) => p.string)
      expect(strings).toBeDefined()
      // Offsets 0 through 5
      const offsets = chord.plucked_notes?.map((p) => p.beatOffset)
      expect(offsets).toEqual([0, 1, 2, 3, 4, 5])
    }
  })

  it('confirms Prelude in C Major has active 4th beat notes in both treble and bass', () => {
    const preludeC = BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_piano_prelude_c')
    expect(preludeC).toBeDefined()
    const chords = (preludeC?.progression?.chords ?? []) as FullSongChordItem[]
    expect(chords.length).toBe(16)

    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i]
      const trebleNotes = chord.melody_notes?.filter((n) => n.clef === 'treble') ?? []
      const bassNotes = chord.melody_notes?.filter((n) => n.clef === 'bass') ?? []

      // Beat 3 (the 4th beat in 0-indexed beats) must be present in both staves
      const trebleHasBeat4 = trebleNotes.some((n) => n.beatOffset >= 3 && n.beatOffset < 4)
      const bassHasBeat4 = bassNotes.some((n) => n.beatOffset >= 3 && n.beatOffset < 4)

      expect(trebleHasBeat4, `M${i + 1} treble missing 4th beat`).toBe(true)
      expect(bassHasBeat4, `M${i + 1} bass missing 4th beat`).toBe(true)
    }
  })

  it('supports CanonicalNoteEvent and UnifiedMeasureItem typing with voice assignment', () => {
    const note: CanonicalNoteEvent = {
      pitch: 'E4',
      beatOffset: 0,
      duration: 1,
      voice: 'melody',
      guitarOverride: { string: 1, fret: 0 },
    }
    expect(note.pitch).toBe('E4')
    expect(note.voice).toBe('melody')
    expect(note.guitarOverride?.string).toBe(1)

    const measure: UnifiedMeasureItem = {
      name: 'Am',
      beat: 1.0,
      duration_beats: 4.0,
      notes: [note],
    }
    expect(measure.notes).toHaveLength(1)
  })
})
