import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import {
  resolveChordVoicing,
  STANDARD_GUITAR_VOICINGS,
} from '@/lib/music/chord-voicings'
import {
  PianoKeyboardDiagram,
  buildKeyboardLayout,
  resolveKeyHandState,
  WHITE_KEY_WIDTH,
  WHITE_KEY_HEIGHT,
  BLACK_KEY_WIDTH,
  BLACK_KEY_HEIGHT,
} from '@/components/practice/piano-keyboard-diagram'

describe('Milestone 2 Empirical Challenger — Piano Dual Visual Rendering & Models', () => {
  // =========================================================================
  // SUITE 1: Exhaustive testing of resolveChordVoicing for all 39 chords
  // =========================================================================
  describe('Suite 1: Exhaustive resolveChordVoicing Verification (All 39 Chords)', () => {
    const chordList = Object.keys(STANDARD_GUITAR_VOICINGS)

    it('verifies STANDARD_GUITAR_VOICINGS contains exactly 39 chords', () => {
      expect(chordList.length).toBe(39)
    })

    chordList.forEach((chordName) => {
      it(`exhaustively verifies acoustic frequency and octave math for chord: ${chordName}`, () => {
        const voicing = resolveChordVoicing(chordName)
        expect(voicing).toBeDefined()
        expect(voicing.chordName).toBe(chordName)

        const { pianoVoicing } = voicing
        expect(pianoVoicing).toBeDefined()
        expect(pianoVoicing.lhPitches.length).toBeGreaterThan(0)
        expect(pianoVoicing.lhNotes.length).toBeGreaterThan(0)
        expect(pianoVoicing.rhPitches.length).toBeGreaterThanOrEqual(3)
        expect(pianoVoicing.rhNotes.length).toBeGreaterThanOrEqual(3)

        // 1. LH root verification
        pianoVoicing.lhPitches.forEach((midi, idx) => {
          // Acoustic formula
          const freq = 440 * Math.pow(2, (midi - 69) / 12)
          expect(freq).toBeGreaterThan(60) // C2 is ~65.4 Hz
          expect(freq).toBeLessThan(130)   // B2 is ~123.5 Hz

          const note = pianoVoicing.lhNotes[idx]
          const computedOctave = Math.floor(midi / 12) - 1
          expect(computedOctave).toBe(2)
          expect(note.endsWith('2')).toBe(true)
        })

        // 2. RH triad & extensions verification
        pianoVoicing.rhPitches.forEach((midi, idx) => {
          const note = pianoVoicing.rhNotes[idx]
          const computedOctave = Math.floor(midi / 12) - 1
          const actualNoteOctave = parseInt(note.slice(-1), 10)

          // Mathematical proof that octave in note name matches floor(midi/12) - 1
          expect(actualNoteOctave).toBe(computedOctave)

          // Acoustic frequency verification
          const freq = 440 * Math.pow(2, (midi - 69) / 12)
          expect(freq).toBeGreaterThan(250) // C4 is ~261.6 Hz
          expect(freq).toBeLessThan(1000)  // Below C6

          // If MIDI is >= 72 (C5), octave MUST be 5, not 4!
          if (midi >= 72) {
            expect(computedOctave).toBeGreaterThanOrEqual(5)
            expect(actualNoteOctave).toBeGreaterThanOrEqual(5)
          } else {
            expect(computedOctave).toBe(4)
            expect(actualNoteOctave).toBe(4)
          }
        })
      })
    })

    it('specifically checks known octave 5 boundary crossing chords (G, A, Bm, Dmaj9, Bb7, B7)', () => {
      // G Major: G4 (67), B4 (71), D5 (74)
      const g = resolveChordVoicing('G')
      expect(g.pianoVoicing.rhNotes).toEqual(['G4', 'B4', 'D5'])
      expect(g.pianoVoicing.rhPitches).toEqual([67, 71, 74])

      // A Major: A4 (69), C#5 (73), E5 (76)
      const a = resolveChordVoicing('A')
      expect(a.pianoVoicing.rhNotes).toEqual(['A4', 'C#5', 'E5'])
      expect(a.pianoVoicing.rhPitches).toEqual([69, 73, 76])

      // B Minor: B4 (71), D5 (74), F#5 (78)
      const bm = resolveChordVoicing('Bm')
      expect(bm.pianoVoicing.rhNotes).toEqual(['B4', 'D5', 'F#5'])
      expect(bm.pianoVoicing.rhPitches).toEqual([71, 74, 78])

      // Dmaj9: D4 (62), F#4 (66), A4 (69), C#5 (73), E5 (76)
      const dmaj9 = resolveChordVoicing('Dmaj9')
      expect(dmaj9.pianoVoicing.rhNotes).toEqual(['D4', 'F#4', 'A4', 'C#5', 'E5'])
      expect(dmaj9.pianoVoicing.rhPitches).toEqual([62, 66, 69, 73, 76])

      // Bb7: Bb4 (70), D5 (74), F5 (77), Ab5 (80)
      const bb7 = resolveChordVoicing('Bb7')
      expect(bb7.pianoVoicing.rhNotes).toEqual(['Bb4', 'D5', 'F5', 'Ab5'])
      expect(bb7.pianoVoicing.rhPitches).toEqual([70, 74, 77, 80])

      // B7: B4 (71), D#5 (75), F#5 (78), A5 (81)
      const b7 = resolveChordVoicing('B7')
      expect(b7.pianoVoicing.rhNotes).toEqual(['B4', 'D#5', 'F#5', 'A5'])
      expect(b7.pianoVoicing.rhPitches).toEqual([71, 75, 78, 81])
    })
  })

  // =========================================================================
  // SUITE 2: 25-Key Keyboard Matrix Verification (MIDI 48..72)
  // =========================================================================
  describe('Suite 2: 25-Key Keyboard Matrix Verification (C3 to C5)', () => {
    const layout = buildKeyboardLayout(48, 72)

    it('verifies exact total key counts: 15 white keys, 10 black keys, total 25 keys', () => {
      expect(layout.whiteKeys.length).toBe(15)
      expect(layout.blackKeys.length).toBe(10)
      expect(layout.totalWidth).toBe(300)
    })

    it('exhaustively verifies all 15 white keys: MIDI numbers, note names, X coordinates, dimensions', () => {
      const expectedWhiteMidis = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72]
      const expectedWhiteNames = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

      layout.whiteKeys.forEach((key, idx) => {
        expect(key.midi).toBe(expectedWhiteMidis[idx])
        expect(key.noteName).toBe(expectedWhiteNames[idx])
        expect(key.isBlack).toBe(false)
        expect(key.x).toBe(idx * WHITE_KEY_WIDTH)
        expect(key.y).toBe(0)
        expect(key.width).toBe(WHITE_KEY_WIDTH)
        expect(key.height).toBe(WHITE_KEY_HEIGHT)
        expect(key.isMiddleC).toBe(key.midi === 60)
      })
    })

    it('exhaustively verifies all 10 black keys: MIDI numbers, note names, centered X coordinates, dimensions', () => {
      const expectedBlackMidis = [49, 51, 54, 56, 58, 61, 63, 66, 68, 70]
      const expectedBlackNames = ['C#3', 'D#3', 'F#3', 'G#3', 'A#3', 'C#4', 'D#4', 'F#4', 'G#4', 'A#4']
      const expectedBlackXs = [14, 34, 74, 94, 114, 154, 174, 214, 234, 254]

      layout.blackKeys.forEach((key, idx) => {
        expect(key.midi).toBe(expectedBlackMidis[idx])
        expect(key.noteName).toBe(expectedBlackNames[idx])
        expect(key.isBlack).toBe(true)
        expect(key.x).toBe(expectedBlackXs[idx])
        expect(key.y).toBe(0)
        expect(key.width).toBe(BLACK_KEY_WIDTH)
        expect(key.height).toBe(BLACK_KEY_HEIGHT)
        expect(key.isMiddleC).toBe(false)
      })
    })

    it('verifies rendered SVG has white keys in Pass 1 and black keys in Pass 2 (correct stacking)', () => {
      const { container } = render(<PianoKeyboardDiagram startMidi={48} endMidi={72} />)
      const whiteGroup = container.querySelector('[data-testid="white-keys"]')
      const blackGroup = container.querySelector('[data-testid="black-keys"]')
      expect(whiteGroup).not.toBeNull()
      expect(blackGroup).not.toBeNull()

      // In SVG DOM, blackGroup must appear after whiteGroup so black keys are painted on top
      expect(whiteGroup?.nextElementSibling).toBe(blackGroup)

      const renderedWhiteKeys = container.querySelectorAll('[data-testid="piano-white-key"]')
      const renderedBlackKeys = container.querySelectorAll('[data-testid="piano-black-key"]')
      expect(renderedWhiteKeys.length).toBe(15)
      expect(renderedBlackKeys.length).toBe(10)
    })
  })

  // =========================================================================
  // SUITE 3: Hand Distinction (Terracotta LH vs Patina Jade RH)
  // =========================================================================
  describe('Suite 3: Hand Distinction Styling & Data Attributes', () => {
    it('applies Terracotta (#9A2A2A) styling to Left-Hand pitches and renders LH badge', () => {
      const { container } = render(
        <PianoKeyboardDiagram lhPitches={[48, 55]} rhPitches={[]} />
      )

      // C3 (48)
      const c3 = container.querySelector('[data-midi="48"]')
      expect(c3?.getAttribute('data-hand')).toBe('lh')
      expect(c3?.getAttribute('class')).toContain('#9A2A2A')

      // G3 (55)
      const g3 = container.querySelector('[data-midi="55"]')
      expect(g3?.getAttribute('data-hand')).toBe('lh')
      expect(g3?.getAttribute('class')).toContain('#9A2A2A')

      // Black key in LH: D#3 (51)
      const { container: containerBlack } = render(
        <PianoKeyboardDiagram lhPitches={[51]} rhPitches={[]} />
      )
      const dSharp3 = containerBlack.querySelector('[data-midi="51"]')
      expect(dSharp3?.getAttribute('data-hand')).toBe('lh')
      expect(dSharp3?.getAttribute('class')).toContain('#9A2A2A')
    })

    it('applies Patina Jade (#3B6E57) styling to Right-Hand pitches and renders RH badge', () => {
      const { container } = render(
        <PianoKeyboardDiagram lhPitches={[]} rhPitches={[60, 64, 67, 72]} />
      )

      const pitches = [60, 64, 67, 72]
      pitches.forEach((midi) => {
        const key = container.querySelector(`[data-midi="${midi}"]`)
        expect(key?.getAttribute('data-hand')).toBe('rh')
        expect(key?.getAttribute('class')).toContain('#3B6E57')
      })

      // Black key in RH: F#4 (66)
      const { container: containerBlack } = render(
        <PianoKeyboardDiagram lhPitches={[]} rhPitches={[66]} />
      )
      const fSharp4 = containerBlack.querySelector('[data-midi="66"]')
      expect(fSharp4?.getAttribute('data-hand')).toBe('rh')
      expect(fSharp4?.getAttribute('class')).toContain('#3B6E57')
    })

    it('simultaneously renders both LH (Terracotta) and RH (Patina Jade) with zero collision', () => {
      const { container } = render(
        <PianoKeyboardDiagram lhPitches={[48, 55]} rhPitches={[60, 64, 67]} />
      )

      const c3 = container.querySelector('[data-midi="48"]')
      const g3 = container.querySelector('[data-midi="55"]')
      expect(c3?.getAttribute('class')).toContain('#9A2A2A')
      expect(g3?.getAttribute('class')).toContain('#9A2A2A')

      const c4 = container.querySelector('[data-midi="60"]')
      const e4 = container.querySelector('[data-midi="64"]')
      const g4 = container.querySelector('[data-midi="67"]')
      expect(c4?.getAttribute('class')).toContain('#3B6E57')
      expect(e4?.getAttribute('class')).toContain('#3B6E57')
      expect(g4?.getAttribute('class')).toContain('#3B6E57')
    })
  })

  // =========================================================================
  // SUITE 4: Middle C Anchor Indicator
  // =========================================================================
  describe('Suite 4: Middle C Anchor Indicator Marker', () => {
    it('renders burnished brass dot (#C5A059) on Middle C (MIDI 60) when unpressed', () => {
      const { container } = render(<PianoKeyboardDiagram />)
      const labelsGroup = container.querySelector('[data-testid="key-active-labels"]')
      expect(labelsGroup).not.toBeNull()

      const middleCCircle = labelsGroup?.querySelector('circle')
      expect(middleCCircle).not.toBeNull()
      expect(middleCCircle?.getAttribute('cx')).toBe('150') // 140 + 20/2
      expect(middleCCircle?.getAttribute('cy')).toBe('60')
      expect(middleCCircle?.getAttribute('r')).toBe('2')
      expect(middleCCircle?.getAttribute('class')).toContain('#C5A059')
    })

    it('renders white dot on Middle C (MIDI 60) shifted to y=74 when pressed', () => {
      const { container } = render(<PianoKeyboardDiagram rhPitches={[60]} />)
      const labelsGroup = container.querySelector('[data-testid="key-active-labels"]')
      const middleCCircle = labelsGroup?.querySelector('circle')
      expect(middleCCircle).not.toBeNull()
      expect(middleCCircle?.getAttribute('cx')).toBe('150')
      expect(middleCCircle?.getAttribute('cy')).toBe('74')
      expect(middleCCircle?.getAttribute('class')).toContain('#FAF8F3')
    })

    it('verifies NO other key has the Middle C indicator dot', () => {
      const { container } = render(<PianoKeyboardDiagram />)
      const circles = container.querySelectorAll('[data-testid="key-active-labels"] circle')
      expect(circles.length).toBe(1)
    })
  })

  // =========================================================================
  // SUITE 5: Click-to-Play Verification
  // =========================================================================
  describe('Suite 5: Click-to-Play Interactive Verification', () => {
    it('exhaustively verifies clicking all 15 white keys invokes onKeyClick with exact MIDI number', () => {
      const onKeyClick = vi.fn()
      const { container } = render(<PianoKeyboardDiagram onKeyClick={onKeyClick} />)
      const whiteKeys = container.querySelectorAll('[data-testid="piano-white-key"]')

      whiteKeys.forEach((key) => {
        const midi = Number(key.getAttribute('data-midi'))
        fireEvent.click(key)
        expect(onKeyClick).toHaveBeenLastCalledWith(midi)
      })

      expect(onKeyClick).toHaveBeenCalledTimes(15)
    })

    it('exhaustively verifies clicking all 10 black keys invokes onKeyClick with exact MIDI number', () => {
      const onKeyClick = vi.fn()
      const { container } = render(<PianoKeyboardDiagram onKeyClick={onKeyClick} />)
      const blackKeys = container.querySelectorAll('[data-testid="piano-black-key"]')

      blackKeys.forEach((key) => {
        const midi = Number(key.getAttribute('data-midi'))
        fireEvent.click(key)
        expect(onKeyClick).toHaveBeenLastCalledWith(midi)
      })

      expect(onKeyClick).toHaveBeenCalledTimes(10)
    })

    it('verifies accessibility keyboard events (Enter and Space) on keys', () => {
      const onKeyClick = vi.fn()
      const { container } = render(<PianoKeyboardDiagram onKeyClick={onKeyClick} />)
      const middleC = container.querySelector('[data-midi="60"]')
      expect(middleC).not.toBeNull()

      fireEvent.keyDown(middleC!, { key: 'Enter' })
      expect(onKeyClick).toHaveBeenLastCalledWith(60)

      fireEvent.keyDown(middleC!, { key: ' ' })
      expect(onKeyClick).toHaveBeenLastCalledWith(60)

      expect(onKeyClick).toHaveBeenCalledTimes(2)
    })
  })

  // =========================================================================
  // SUITE 6: Edge Cases & Boundary Stress Testing
  // =========================================================================
  describe('Suite 6: Stress Testing, Hand Overlap & Edge Cases', () => {
    it('handles key in both LH and RH gracefully without crashing', () => {
      const state = resolveKeyHandState(60, new Set([60]), new Set([60]), new Set())
      expect(state).toBe('both')

      const { container } = render(
        <PianoKeyboardDiagram lhPitches={[60]} rhPitches={[60]} />
      )
      const key = container.querySelector('[data-midi="60"]')
      expect(key?.getAttribute('data-hand')).toBe('both')
      expect(key?.getAttribute('aria-pressed')).toBe('true')
    })

    it('handles activePitches fallback split at Middle C (<60 -> lh, >=60 -> rh)', () => {
      const { container } = render(
        <PianoKeyboardDiagram activePitches={[50, 59, 60, 67]} />
      )

      const d3 = container.querySelector('[data-midi="50"]')
      const b3 = container.querySelector('[data-midi="59"]')
      const c4 = container.querySelector('[data-midi="60"]')
      const g4 = container.querySelector('[data-midi="67"]')

      expect(d3?.getAttribute('data-hand')).toBe('lh')
      expect(b3?.getAttribute('data-hand')).toBe('lh')
      expect(c4?.getAttribute('data-hand')).toBe('rh')
      expect(g4?.getAttribute('data-hand')).toBe('rh')
    })

    it('handles out-of-range pitches without crashing or corrupting DOM', () => {
      // MIDI 36 is C2 (below C3), MIDI 84 is C6 (above C5)
      const { container } = render(
        <PianoKeyboardDiagram lhPitches={[36]} rhPitches={[84]} />
      )
      // Keyboard range is 48..72, so neither 36 nor 84 is rendered
      expect(container.querySelector('[data-midi="36"]')).toBeNull()
      expect(container.querySelector('[data-midi="84"]')).toBeNull()
      // Normal keys remain functional
      expect(container.querySelectorAll('[data-testid="piano-white-key"]').length).toBe(15)
    })

    it('supports custom pitch ranges: 3 octaves (C2 to C5 = 37 keys)', () => {
      const layout = buildKeyboardLayout(36, 72)
      expect(layout.whiteKeys.length).toBe(22)
      expect(layout.blackKeys.length).toBe(15)
      expect(layout.whiteKeys.length + layout.blackKeys.length).toBe(37)

      const { container } = render(
        <PianoKeyboardDiagram startMidi={36} endMidi={72} />
      )
      expect(container.querySelectorAll('[data-testid="piano-white-key"]').length).toBe(22)
      expect(container.querySelectorAll('[data-testid="piano-black-key"]').length).toBe(15)
    })
  })
})
