import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PracticeTelemetryHUD } from '../practice-telemetry-hud'
import { resolveChordVoicing } from '@/lib/music/chord-voicings'

describe('PracticeTelemetryHUD', () => {
  const chord = resolveChordVoicing('Bm')

  it('renders top HUD with BPM, metronome controls, and instrument toggle', () => {
    const onTempoChange = vi.fn()
    render(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={14}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={onTempoChange}
        activeChord={chord}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={6}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )
    expect(screen.getByText('80')).toBeDefined()
    expect(screen.getByText(/Four-Chord Anthem/i)).toBeDefined()
    expect(screen.getByText(/98.4%/i)).toBeDefined()
    expect(screen.getByText(/±6 ms/i)).toBeDefined()

    // Test tempo adjust button
    const plusBtn = screen.getByRole('button', { name: /\+/i })
    fireEvent.click(plusBtn)
    expect(onTempoChange).toHaveBeenCalledWith(81)
  })

  it('displays vector fretboard diagram without verbose text', () => {
    render(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={14}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={chord}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={6}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )
    expect(screen.getByTestId('fretboard-diagram')).toBeDefined()
    expect(screen.queryByText(/AI advice/i)).toBeNull()
    expect(screen.queryByText(/pedagogical/i)).toBeNull()
  })

  it('allows instrument switching between guitar and piano', () => {
    const onInstrumentChange = vi.fn()
    render(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={onInstrumentChange}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={14}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={chord}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={6}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )
    const pianoBtn = screen.getByRole('button', { name: /piano/i })
    fireEvent.click(pianoBtn)
    expect(onInstrumentChange).toHaveBeenCalledWith('piano')
  })

  it('renders and toggles beat ticks metronome button', () => {
    const onToggleMetronome = vi.fn()
    const { rerender } = render(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={14}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={chord}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={6}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
        isMetronomeEnabled={true}
        onToggleMetronome={onToggleMetronome}
      />
    )
    const ticksBtn = screen.getByRole('button', { name: /TICKS ON/i })
    expect(ticksBtn).toBeDefined()
    fireEvent.click(ticksBtn)
    expect(onToggleMetronome).toHaveBeenCalledTimes(1)

    rerender(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={14}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={chord}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={6}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
        isMetronomeEnabled={false}
        onToggleMetronome={onToggleMetronome}
      />
    )
    expect(screen.getByRole('button', { name: /TICKS OFF/i })).toBeDefined()
  })
})
