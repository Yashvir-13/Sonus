import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FlowingNotationStand, type FlowingChordItem } from '../flowing-notation-stand'
import { parseProgressionSequence } from '@/lib/music/chord-voicings'

describe('FlowingNotationStand', () => {
  const prog = parseProgressionSequence(['G', 'D', 'Am', 'C'])

  it('renders 6 guitar strings with frequency labels in guitar mode', () => {
    render(
      <FlowingNotationStand
        instrument="guitar"
        progression={prog}
        currentBeat={1}
        tempoBpm={80}
        isPlaying={false}
      />
    )
    expect(screen.getByTestId('flowing-notation-canvas')).toBeDefined()
    expect(screen.getByText(/1 \(e\) 329Hz/i)).toBeDefined()
    expect(screen.getByText(/6 \(E\) 82Hz/i)).toBeDefined()
  })

  it('renders left-aligned sight-reading caliper hit point indicator', () => {
    render(
      <FlowingNotationStand
        instrument="guitar"
        progression={prog}
        currentBeat={0}
        tempoBpm={80}
        isPlaying={true}
      />
    )
    const playhead = screen.getByTestId('center-playhead')
    expect(playhead).toBeDefined()
    expect(screen.getByText(/HIT POINT/i)).toBeDefined()
    // Verifies the playhead is positioned at 140px for comfortable forward sight reading
    expect(playhead.style.left).toBe('140px')
  })

  it('renders dual piano grand staff staves when instrument is piano', () => {
    render(
      <FlowingNotationStand
        instrument="piano"
        progression={prog}
        currentBeat={1}
        tempoBpm={80}
        isPlaying={false}
      />
    )
    expect(screen.getByTestId('piano-grand-staff')).toBeDefined()
    expect(screen.getByText(/TREBLE/i)).toBeDefined()
    expect(screen.getByText(/BASS/i)).toBeDefined()
  })

  it('renders authentic SVG noteheads for piano grand staff', () => {
    render(
      <FlowingNotationStand
        instrument="piano"
        progression={prog}
        currentBeat={0}
        tempoBpm={68}
        isPlaying={true}
      />
    )
    // Grand staff canvas should render SVG noteheads
    const noteheads = screen.getAllByTestId('grand-staff-notehead')
    expect(noteheads.length).toBeGreaterThan(0)
  })

  it('renders directional strumming arrows for guitar tablature', () => {
    const progWithStrum: FlowingChordItem[] = [
      {
        ...prog[0],
        strumEvents: [
          { beatOffset: 0, direction: 'down', accent: true, label: 'D' },
          { beatOffset: 1, direction: 'down', accent: false, label: 'D' },
          { beatOffset: 1.5, direction: 'up', accent: false, label: 'U' },
        ],
      },
    ]

    render(
      <FlowingNotationStand
        instrument="guitar"
        progression={progWithStrum}
        currentBeat={0}
        tempoBpm={70}
        isPlaying={true}
      />
    )

    const strumArrows = screen.getAllByTestId('strum-arrow-badge')
    expect(strumArrows.length).toBeGreaterThanOrEqual(3)
  })

  it('renders 3/4 waltz meter and proper melody notes with accidentals on Grand Staff', () => {
    const waltzProg: FlowingChordItem[] = [
      {
        chordName: 'Cm',
        root: 'C',
        quality: 'm',
        duration_beats: 3.0,
        expectedPitches: [48, 51, 55, 72, 74, 75],
        pitchClasses: [0, 3, 7],
        guitarTab: {
          frets: [null, 3, 5, 5, 4, 3],
          fingering: 'x-1-3-4-2-1',
          strings: 'x-A-D-G-B-e',
        },
        pianoVoicing: {
          lhNotes: ['C3'],
          rhNotes: ['Eb4', 'G4', 'C5'],
          lhPitches: [48],
          rhPitches: [63, 67, 72],
        },
        pitchSpelling: [
          { note: 'C', role: 'Root' },
          { note: 'Eb', role: 'Third' },
          { note: 'G', role: 'Fifth' },
        ],
        melodyNotes: [
          { pitch: 'C3', beatOffset: 0, duration: 1, clef: 'bass' },
          { pitch: 'Eb3', beatOffset: 1, duration: 1, clef: 'bass' },
          { pitch: 'G3', beatOffset: 1, duration: 1, clef: 'bass' },
          { pitch: 'Eb3', beatOffset: 2, duration: 1, clef: 'bass' },
          { pitch: 'G3', beatOffset: 2, duration: 1, clef: 'bass' },
          { pitch: 'C5', beatOffset: 0, duration: 1, clef: 'treble' },
          { pitch: 'D5', beatOffset: 1, duration: 1, clef: 'treble' },
          { pitch: 'Eb5', beatOffset: 2, duration: 1, clef: 'treble' },
        ],
      },
    ]

    render(
      <FlowingNotationStand
        instrument="piano"
        progression={waltzProg}
        currentBeat={0}
        tempoBpm={160}
        isPlaying={true}
        timeSignature="3/4"
      />
    )

    // Check meter banner
    expect(screen.getByText(/METER: 3\/4/i)).toBeDefined()
    // Check total beats header (3 beats for 1 measure)
    expect(screen.getByText(/3 BEATS \(1 MEASURES\)/i)).toBeDefined()
    // Check melody noteheads
    const noteheads = screen.getAllByTestId('grand-staff-notehead')
    expect(noteheads.length).toBe(8)
    // Check pitch label
    expect(screen.getByText('Eb5')).toBeDefined()
    // Check flat accidental symbol
    expect(screen.getAllByText('♭').length).toBeGreaterThanOrEqual(1)
  })
})

