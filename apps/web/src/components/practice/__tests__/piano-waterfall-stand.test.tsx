import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PianoWaterfallStand } from '../piano-waterfall-stand'
import { resolveChordVoicing } from '@/lib/music/chord-voicings'

describe('PianoWaterfallStand Component', () => {
  const progression = [
    { ...resolveChordVoicing('Eb'), duration_beats: 4 },
    { ...resolveChordVoicing('Cm'), duration_beats: 4 },
  ]

  it('renders root container, falling canvas track, and caliper strike zone', () => {
    render(
      <PianoWaterfallStand
        progression={progression}
        currentBeat={0}
        tempoBpm={80}
        isPlaying={false}
      />
    )

    expect(screen.getByTestId('piano-waterfall-stand')).toBeDefined()
    expect(screen.getByTestId('waterfall-canvas-track')).toBeDefined()
    expect(screen.getByTestId('waterfall-strike-zone')).toBeDefined()
  })

  it('renders all 25 baseline keys with 15 white keys and 10 black keys', () => {
    render(
      <PianoWaterfallStand
        progression={progression}
        currentBeat={0}
        tempoBpm={80}
        isPlaying={false}
      />
    )

    const whiteGroup = screen.getByTestId('waterfall-white-keys')
    const blackGroup = screen.getByTestId('waterfall-black-keys')

    expect(whiteGroup.children.length).toBe(15)
    expect(blackGroup.children.length).toBe(10)
  })

  it('triggers onKeyClick when a baseline key is clicked with exact MIDI pitch', () => {
    const handleKeyClick = vi.fn()
    render(
      <PianoWaterfallStand
        progression={progression}
        currentBeat={0}
        tempoBpm={80}
        isPlaying={false}
        onKeyClick={handleKeyClick}
      />
    )

    // Click Middle C (MIDI 60)
    const middleCKey = screen.getByTestId('waterfall-key-60')
    fireEvent.click(middleCKey)

    expect(handleKeyClick).toHaveBeenCalledWith(60)
  })

  it('illuminates striking keys with hand-specific colors: LH Amber (#F59E0B) and RH Emerald (#10B981)', () => {
    const melodyProgression = [
      {
        ...resolveChordVoicing('Cm'),
        duration_beats: 3,
        melodyNotes: [
          { pitch: 'C3', beatOffset: 0, duration: 1, clef: 'bass' as const }, // MIDI 48 (white key, LH)
          { pitch: 'Eb5', beatOffset: 0, duration: 1, clef: 'treble' as const }, // MIDI 75 > 72
          { pitch: 'D4', beatOffset: 0, duration: 1, clef: 'treble' as const }, // MIDI 62 (white key, RH)
        ],
      },
    ]

    render(
      <PianoWaterfallStand
        progression={melodyProgression}
        currentBeat={0.2}
        tempoBpm={80}
        isPlaying={true}
      />
    )

    // C3 (MIDI 48) is a white key played by LH -> must illuminate in Amber (#F59E0B)
    const keyC3 = screen.getByTestId('waterfall-key-48')
    expect(keyC3.getAttribute('fill')).toBe('#F59E0B')

    // D4 (MIDI 62) is a white key played by RH -> must illuminate in Emerald (#10B981)
    const keyD4 = screen.getByTestId('waterfall-key-62')
    expect(keyD4.getAttribute('fill')).toBe('#10B981')
  })

  it('staggers falling note ribbons according to melodyNotes beatOffsets', () => {
    const melodyProgression = [
      {
        ...resolveChordVoicing('Cm'),
        duration_beats: 3,
        melodyNotes: [
          { pitch: 'C4', beatOffset: 0, duration: 1, clef: 'treble' as const },
          { pitch: 'D4', beatOffset: 1, duration: 1, clef: 'treble' as const },
          { pitch: 'E4', beatOffset: 2, duration: 1, clef: 'treble' as const },
        ],
      },
    ]

    const { rerender } = render(
      <PianoWaterfallStand
        progression={melodyProgression}
        currentBeat={0}
        tempoBpm={80}
        isPlaying={true}
      />
    )

    // At beat 0: C4 (60) is active at strike, D4 (62) is not active yet
    const keyC4AtBeat0 = screen.getByTestId('waterfall-key-60')
    const keyD4AtBeat0 = screen.getByTestId('waterfall-key-62')
    expect(keyC4AtBeat0.getAttribute('fill')).toBe('#10B981')
    expect(keyD4AtBeat0.getAttribute('fill')).toBe('#E4E4E7')

    // Advance to beat 1.2: D4 (62) becomes active, C4 (60) is no longer active
    rerender(
      <PianoWaterfallStand
        progression={melodyProgression}
        currentBeat={1.2}
        tempoBpm={80}
        isPlaying={true}
      />
    )

    const keyC4AtBeat1 = screen.getByTestId('waterfall-key-60')
    const keyD4AtBeat1 = screen.getByTestId('waterfall-key-62')
    expect(keyC4AtBeat1.getAttribute('fill')).toBe('#E4E4E7')
    expect(keyD4AtBeat1.getAttribute('fill')).toBe('#10B981')
  })
})
