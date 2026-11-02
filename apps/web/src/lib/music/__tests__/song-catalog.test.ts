import { describe, it, expect } from 'vitest'
import { BUILTIN_FULL_SONGS, type FullSongChordItem } from '../song-catalog'
import { resolveChordVoicing } from '../chord-voicings'

describe('Song Catalog (BUILTIN_FULL_SONGS)', () => {
  it('contains all curated production full songs for guitar and piano', () => {
    expect(BUILTIN_FULL_SONGS.length).toBe(5)

    const expectedIds = [
      'ex_guitar_knockin',
      'ex_piano_shostakovich_waltz_2',
      'ex_piano_canon',
      'ex_guitar_four_chord',
      'ex_guitar_rising_sun',
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
    expect(guitarSongs.length).toBe(3)

    for (const song of guitarSongs) {
      expect(song.progression).toBeDefined()
      if (!song.progression) continue

      const chords = (song.progression.chords ?? []) as FullSongChordItem[]
      expect(chords.length).toBeGreaterThanOrEqual(24)

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
    expect(pianoSongs.length).toBe(2)

    for (const song of pianoSongs) {
      expect(song.progression).toBeDefined()
      if (!song.progression) continue

      const chords = (song.progression.chords ?? []) as FullSongChordItem[]
      expect(chords.length).toBe(32)

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
})
