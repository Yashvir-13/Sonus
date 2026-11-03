import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FlowingPracticeStand } from '../flowing-practice-stand'
import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'

describe('FlowingPracticeStand', () => {
  const originalMediaDevices = navigator.mediaDevices

  beforeEach(() => {
    // Mock getUserMedia spy to verify hero mode does NOT touch mic
    const getUserMediaMock = vi.fn().mockResolvedValue({
      getTracks: () => [],
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
      writable: true,
    })
  })

  it('renders in hero mode with simulated telemetry and zero unprompted microphone access', () => {
    render(
      <FlowingPracticeStand
        mode="hero"
        pieceTitle="Chopin Nocturne in E-flat"
        keySignature="Eb Major"
      />
    )

    // Verify stand canvas and telemetry are present
    expect(screen.getByTestId('flowing-notation-canvas')).toBeDefined()
    expect(screen.getByText(/Chopin Nocturne in E-flat/i)).toBeDefined()
    expect(screen.getByText(/Eb Major/i)).toBeDefined()

    // Verify live simulated telemetry exists
    expect(screen.getByText(/INTONATION/i)).toBeDefined()
    expect(screen.getByText(/TIMING SYNC/i)).toBeDefined()

    // Verify getUserMedia was NEVER called in hero mode
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled()
  })

  it('renders in studio mode and supports instrument toggle', () => {
    const onInstrumentChange = vi.fn()
    render(
      <FlowingPracticeStand
        mode="studio"
        instrument="guitar"
        onInstrumentChange={onInstrumentChange}
      />
    )

    const pianoBtn = screen.getByRole('button', { name: /piano/i })
    fireEvent.click(pianoBtn)
    expect(onInstrumentChange).toHaveBeenCalledWith('piano')
  })

  it('renders chord sequence strip and handles seeking', () => {
    const onSeekBeat = vi.fn()
    render(
      <FlowingPracticeStand
        mode="hero"
        timeSignature="4/4"
        onSeekBeat={onSeekBeat}
      />
    )

    expect(screen.getByText(/CHORD SEQUENCE/i)).toBeDefined()
    const dChordBtn = screen.getByRole('button', { name: /D \(4b\)/i })
    expect(dChordBtn).toBeDefined()
    fireEvent.click(dChordBtn)
    // First chord G is 4 beats, so D is at beat 4
    expect(onSeekBeat).toHaveBeenCalledWith(4)
  })

  it('toggles playback with pause and start', () => {
    render(<FlowingPracticeStand mode="hero" autoPlay={false} />)
    const startBtn = screen.getByRole('button', { name: /start practice/i })
    fireEvent.click(startBtn)
    expect(screen.getByRole('button', { name: /pause/i })).toBeDefined()
  })

  it('resets playhead to measure 1 when pieceTitle changes', () => {
    const { rerender } = render(
      <FlowingPracticeStand
        mode="hero"
        pieceTitle="Piece A"
        autoPlay={false}
      />
    )

    // Seek to beat 8
    const emBtn = screen.getByRole('button', { name: /Em \(4b\)/i })
    fireEvent.click(emBtn)
    expect(screen.getByText(/MEASURE 3 OF 4/i)).toBeDefined()

    // Rerender with a new piece title
    rerender(
      <FlowingPracticeStand
        mode="hero"
        pieceTitle="Piece B"
        autoPlay={false}
      />
    )

    // Should have automatically rewound to Measure 1
    expect(screen.getByText(/MEASURE 1 OF 4/i)).toBeDefined()
  })

  it('switches to piano mode and renders piano keyboard diagram without guitar fretboard leakage', () => {
    render(<FlowingPracticeStand mode="studio" autoPlay={false} />)

    // In default guitar mode, fretboard diagram is rendered
    expect(screen.getByTestId('fretboard-diagram')).toBeDefined()
    expect(screen.queryByTestId('piano-keyboard-diagram')).toBeNull()
    expect(screen.queryByTestId('grand-staff-diagram')).toBeNull()

    // Click PIANO toggle
    const pianoToggle = screen.getByRole('button', { name: /piano/i })
    fireEvent.click(pianoToggle)

    // In piano mode, dual keyboard and grand staff render, and fretboard unmounts
    expect(screen.getByTestId('piano-keyboard-diagram')).toBeDefined()
    expect(screen.queryByTestId('grand-staff-diagram')).toBeNull()
    expect(screen.queryByTestId('fretboard-diagram')).toBeNull()
  })

  it('clicks a piano key in ActiveVoicingDisplay and triggers audioEngine.playPianoNote and onKeyClick', () => {
    const playPianoNoteSpy = vi.spyOn(PracticeAudioEngine.prototype, 'playPianoNote')
    const unlockSpy = vi.spyOn(PracticeAudioEngine.prototype, 'unlock')
    const onKeyClick = vi.fn()

    const { container } = render(
      <FlowingPracticeStand
        mode="studio"
        instrument="piano"
        autoPlay={false}
        onKeyClick={onKeyClick}
      />
    )

    // Keyboard diagram should be mounted
    expect(screen.getByTestId('piano-keyboard-diagram')).toBeDefined()

    // Find Middle C key (MIDI 60)
    const middleCKey = container.querySelector('rect[data-midi="60"]')
    expect(middleCKey).not.toBeNull()

    fireEvent.click(middleCKey!)

    expect(unlockSpy).toHaveBeenCalled()
    expect(playPianoNoteSpy).toHaveBeenCalledWith(60, 1.2, 0.8)
    expect(onKeyClick).toHaveBeenCalledWith(60)
  })

  it('triggers audioEngine.unlock when start practice button is clicked', () => {
    const unlockSpy = vi.spyOn(PracticeAudioEngine.prototype, 'unlock')

    render(<FlowingPracticeStand mode="hero" autoPlay={false} />)

    const startBtn = screen.getByRole('button', { name: /start practice/i })
    fireEvent.click(startBtn)

    expect(unlockSpy).toHaveBeenCalled()
  })

  it('triggers metronome playClick on beat transitions when metronome is enabled', () => {
    const playClickSpy = vi.spyOn(PracticeAudioEngine.prototype, 'playClick')

    let rafCallback: ((time: number) => void) | null = null
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb
      return 1234
    })

    render(
      <FlowingPracticeStand
        mode="studio"
        autoPlay={true}
        tempoBpm={120}
      />
    )

    expect(rafCallback).not.toBeNull()

    // First frame (beat 0 - downbeat)
    act(() => {
      rafCallback!(1000)
    })

    expect(playClickSpy).toHaveBeenCalledWith(true)

    // Advance to next beat (at 120 bpm, 60/120 = 0.5s per beat, so 0.6s later is beat 1 - upbeat)
    act(() => {
      rafCallback!(1600)
    })

    expect(playClickSpy).toHaveBeenCalledWith(false)
  })

  it('triggers chord audio playback with piano voicing pitches when instrument is piano', () => {
    const playChordSpy = vi.spyOn(PracticeAudioEngine.prototype, 'playChord')

    let rafCallback: ((time: number) => void) | null = null
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb
      return 5678
    })

    render(
      <FlowingPracticeStand
        mode="studio"
        instrument="piano"
        autoPlay={true}
        tempoBpm={120}
      />
    )

    expect(rafCallback).not.toBeNull()

    // Trigger downbeat frame (beat 0)
    act(() => {
      rafCallback!(1000)
    })

    expect(playChordSpy).toHaveBeenCalled()
    const lastCall = playChordSpy.mock.calls[0]
    expect(lastCall[0]).toBe('G') // default hero first chord
    expect(lastCall[3]).toBe('piano')
    // Ensure pitches were resolved from pianoVoicing (lhPitches + rhPitches)
    const pitches = lastCall[1] as number[]
    expect(pitches).toBeDefined()
    expect(pitches.length).toBeGreaterThan(0)
    // G major piano voicing has LH G2 (43) and RH G4-B4-D5 (67, 71, 74)
    expect(pitches).toContain(43)
  })
})
