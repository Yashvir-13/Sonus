import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FlowingPracticeStand } from '../flowing-practice-stand'

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
})
