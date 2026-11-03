import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PracticeTelemetryHUD } from '../practice-telemetry-hud'
import { resolveChordVoicing, type VoicingDefinition } from '@/lib/music/chord-voicings'

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

  it('renders ActiveVoicingDisplay in piano mode with zero guitar leakage', () => {
    render(
      <PracticeTelemetryHUD
        instrument="piano"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={1}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={resolveChordVoicing('Bm')}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={4}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )
    // 1. ActiveVoicingDisplay is present with dual visualizations
    expect(screen.getByTestId('active-voicing-display')).toBeDefined()
    expect(screen.getByTestId('piano-keyboard-diagram')).toBeDefined()
    expect(screen.queryByTestId('grand-staff-diagram')).toBeNull()

    // 2. Piano badge rendered; NO guitar barre or open position
    expect(screen.getByText('Piano Voicing — LH & RH')).toBeDefined()
    expect(screen.queryByText(/Barre/i)).toBeNull()
    expect(screen.queryByText(/Open Position/i)).toBeNull()
    expect(screen.queryByTestId('fretboard-diagram')).toBeNull()

    // 3. Telemetry dial renders keys, NEVER /6 str
    expect(screen.getByText('4 keys')).toBeDefined()
    expect(screen.queryByText(/str/i)).toBeNull()
  })

  it('formats voicing metric as Polyphonic when voicingStringsCount is 88 on piano', () => {
    render(
      <PracticeTelemetryHUD
        instrument="piano"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={1}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={resolveChordVoicing('G')}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={88}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )
    expect(screen.getByText('Polyphonic')).toBeDefined()
    expect(screen.queryByText('88/6 str')).toBeNull()
  })

  it('forwards onKeyClick to ActiveVoicingDisplay and triggers callback with MIDI pitch', () => {
    const onKeyClick = vi.fn()
    const { container } = render(
      <PracticeTelemetryHUD
        instrument="piano"
        onInstrumentChange={vi.fn()}
        pieceTitle="Four-Chord Anthem"
        keySignature="D Major"
        currentMeasure={1}
        totalMeasures={32}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={resolveChordVoicing('C')}
        intonationAccuracy={98.4}
        timingSyncMs={6}
        voicingStringsCount={4}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
        onKeyClick={onKeyClick}
      />
    )

    const keyRect = container.querySelector('rect[data-midi="60"]')
    expect(keyRect).not.toBeNull()
    fireEvent.click(keyRect!)
    expect(onKeyClick).toHaveBeenCalledWith(60)
  })

  it('displays Piano Voicing — RH badge when chord voicing has no LH notes', () => {
    const baseChord = resolveChordVoicing('C')
    const rhOnlyChord: VoicingDefinition = {
      ...baseChord,
      pianoVoicing: {
        lhNotes: [],
        rhNotes: ['C4', 'E4', 'G4'],
        lhPitches: [],
        rhPitches: [60, 64, 67],
      },
    }

    render(
      <PracticeTelemetryHUD
        instrument="piano"
        onInstrumentChange={vi.fn()}
        pieceTitle="Treble Study"
        keySignature="C Major"
        currentMeasure={1}
        totalMeasures={8}
        tempoBpm={72}
        onTempoChange={vi.fn()}
        activeChord={rhOnlyChord}
        intonationAccuracy={95.0}
        timingSyncMs={4}
        voicingStringsCount={3}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )

    expect(screen.getByText('Piano Voicing — RH')).toBeDefined()
    expect(screen.queryByText('Piano Voicing — LH & RH')).toBeNull()
  })

  it('renders correct voicing completeness indicator for guitar strings vs piano keys', () => {
    const { rerender } = render(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={vi.fn()}
        pieceTitle="Song"
        keySignature="G Major"
        currentMeasure={1}
        totalMeasures={4}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={resolveChordVoicing('G')}
        intonationAccuracy={98.0}
        timingSyncMs={0}
        voicingStringsCount={6}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )

    expect(screen.getByText('6/6 str')).toBeDefined()

    rerender(
      <PracticeTelemetryHUD
        instrument="guitar"
        onInstrumentChange={vi.fn()}
        pieceTitle="Song"
        keySignature="G Major"
        currentMeasure={1}
        totalMeasures={4}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={resolveChordVoicing('G')}
        intonationAccuracy={98.0}
        timingSyncMs={0}
        voicingStringsCount={0}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )

    expect(screen.getByText('0/6 str')).toBeDefined()

    rerender(
      <PracticeTelemetryHUD
        instrument="piano"
        onInstrumentChange={vi.fn()}
        pieceTitle="Song"
        keySignature="G Major"
        currentMeasure={1}
        totalMeasures={4}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={resolveChordVoicing('G')}
        intonationAccuracy={98.0}
        timingSyncMs={0}
        voicingStringsCount={3}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
      />
    )

    expect(screen.getByText('3 keys')).toBeDefined()
  })

  it('toggles backing audio guide when audio button is clicked', () => {
    const onToggleBackingAudio = vi.fn()
    const { rerender } = render(
      <PracticeTelemetryHUD
        instrument="piano"
        onInstrumentChange={vi.fn()}
        pieceTitle="Song"
        keySignature="C Major"
        currentMeasure={1}
        totalMeasures={4}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={resolveChordVoicing('C')}
        intonationAccuracy={98.0}
        timingSyncMs={0}
        voicingStringsCount={3}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
        isBackingAudioEnabled={true}
        onToggleBackingAudio={onToggleBackingAudio}
      />
    )

    const audioBtn = screen.getByRole('button', { name: /AUDIO ON/i })
    expect(audioBtn).toBeDefined()
    fireEvent.click(audioBtn)
    expect(onToggleBackingAudio).toHaveBeenCalledTimes(1)

    rerender(
      <PracticeTelemetryHUD
        instrument="piano"
        onInstrumentChange={vi.fn()}
        pieceTitle="Song"
        keySignature="C Major"
        currentMeasure={1}
        totalMeasures={4}
        tempoBpm={80}
        onTempoChange={vi.fn()}
        activeChord={resolveChordVoicing('C')}
        intonationAccuracy={98.0}
        timingSyncMs={0}
        voicingStringsCount={3}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        onRestart={vi.fn()}
        isBackingAudioEnabled={false}
        onToggleBackingAudio={onToggleBackingAudio}
      />
    )

    expect(screen.getByRole('button', { name: /AUDIO OFF/i })).toBeDefined()
  })
})
