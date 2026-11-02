import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ActiveVoicingDisplay } from '../active-voicing-display'
import { resolveChordVoicing } from '@/lib/music/chord-voicings'

describe('ActiveVoicingDisplay Component', () => {
  const gChord = resolveChordVoicing('G')
  const bmChord = resolveChordVoicing('Bm')

  it('renders GuitarFretboardDiagram with fretboard-diagram testid in guitar mode', () => {
    render(
      <ActiveVoicingDisplay
        instrument="guitar"
        chordName={gChord.chordName}
        guitarTab={gChord.guitarTab}
      />
    )
    expect(screen.getByTestId('active-voicing-display')).toBeDefined()
    expect(screen.getByTestId('fretboard-diagram')).toBeDefined()
    // Absolutely no piano keyboard or staff in guitar mode
    expect(screen.queryByTestId('piano-keyboard-diagram')).toBeNull()
    expect(screen.queryByTestId('grand-staff-diagram')).toBeNull()
    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('renders dual piano visualizations (keyboard and grand staff) in piano mode by default', () => {
    render(
      <ActiveVoicingDisplay
        instrument="piano"
        chordName={bmChord.chordName}
        pianoVoicing={bmChord.pianoVoicing}
        activePitches={bmChord.expectedPitches}
      />
    )
    expect(screen.getByTestId('active-voicing-display')).toBeDefined()
    // In 'both' default mode, both components are rendered
    expect(screen.getByTestId('piano-keyboard-diagram')).toBeDefined()
    expect(screen.getByTestId('grand-staff-diagram')).toBeDefined()
    // Absolutely zero guitar fretboard in piano mode
    expect(screen.queryByTestId('fretboard-diagram')).toBeNull()
    expect(screen.queryByText(/fret/i)).toBeNull()
  })

  it('switches between sub-tabs [KEYBOARD | STAFF | BOTH]', () => {
    render(
      <ActiveVoicingDisplay
        instrument="piano"
        chordName={gChord.chordName}
        pianoVoicing={gChord.pianoVoicing}
        activePitches={gChord.expectedPitches}
      />
    )
    // 1. Initially in 'both' mode
    expect(screen.getByTestId('piano-keyboard-diagram')).toBeDefined()
    expect(screen.getByTestId('grand-staff-diagram')).toBeDefined()

    // 2. Click KEYBOARD tab
    const keyboardTab = screen.getByRole('tab', { name: /keyboard/i })
    fireEvent.click(keyboardTab)
    expect(screen.getByTestId('piano-keyboard-diagram')).toBeDefined()
    expect(screen.queryByTestId('grand-staff-diagram')).toBeNull()

    // 3. Click STAFF tab
    const staffTab = screen.getByRole('tab', { name: /staff/i })
    fireEvent.click(staffTab)
    expect(screen.queryByTestId('piano-keyboard-diagram')).toBeNull()
    expect(screen.getByTestId('grand-staff-diagram')).toBeDefined()

    // 4. Click BOTH tab
    const bothTab = screen.getByRole('tab', { name: /both/i })
    fireEvent.click(bothTab)
    expect(screen.getByTestId('piano-keyboard-diagram')).toBeDefined()
    expect(screen.getByTestId('grand-staff-diagram')).toBeDefined()
  })

  it('displays Left-Hand and Right-Hand note legends with proper styling', () => {
    render(
      <ActiveVoicingDisplay
        instrument="piano"
        chordName="C Major"
        pianoVoicing={{
          lhNotes: ['C3'],
          rhNotes: ['E4', 'G4', 'C5'],
          lhPitches: [48],
          rhPitches: [64, 67, 72],
        }}
      />
    )
    expect(screen.getByText(/LH:/i)).toBeDefined()
    expect(screen.getAllByText('C3').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/RH:/i)).toBeDefined()
    expect(screen.getByText(/E4 · G4 · C5/i)).toBeDefined()
  })

  it('passes onKeyClick callback to PianoKeyboardDiagram', () => {
    const handleKeyClick = vi.fn()
    render(
      <ActiveVoicingDisplay
        instrument="piano"
        chordName={gChord.chordName}
        pianoVoicing={gChord.pianoVoicing}
        onKeyClick={handleKeyClick}
        defaultViewMode="keyboard"
      />
    )
    // Click key C4 (MIDI 60)
    const keyC4 = screen.getByRole('button', { name: 'C4' })
    fireEvent.click(keyC4)
    expect(handleKeyClick).toHaveBeenCalledWith(60)
  })

  it('handles missing pianoVoicing gracefully by applying pitch partitioning heuristics', () => {
    render(
      <ActiveVoicingDisplay
        instrument="piano"
        chordName="Am"
        activePitches={[45, 60, 64, 69]} // A2, C4, E4, A4
      />
    )
    expect(screen.getByTestId('active-voicing-display')).toBeDefined()
    expect(screen.getByTestId('piano-keyboard-diagram')).toBeDefined()
    expect(screen.getByTestId('grand-staff-diagram')).toBeDefined()
  })

  it('handles missing guitarTab gracefully in guitar mode without crashing', () => {
    render(
      <ActiveVoicingDisplay
        instrument="guitar"
        chordName="Empty"
      />
    )
    expect(screen.getByTestId('active-voicing-display')).toBeDefined()
    expect(screen.getByText(/no guitar voicing/i)).toBeDefined()
  })
})
