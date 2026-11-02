import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  GrandStaffDiagram,
  getDiatonicStep,
  computeStaffY,
  computeLedgerLines,
  midiToPitchName,
} from '../grand-staff-diagram'

describe('GrandStaffDiagram Math & Utilities', () => {
  it('correctly maps pitch strings to diatonic step scalar', () => {
    expect(getDiatonicStep('C2')).toBe(14)
    expect(getDiatonicStep('G2')).toBe(18) // Bass bottom line
    expect(getDiatonicStep('A3')).toBe(26) // Bass top line
    expect(getDiatonicStep('C4')).toBe(28) // Middle C
    expect(getDiatonicStep('E4')).toBe(30) // Treble bottom line
    expect(getDiatonicStep('F5')).toBe(38) // Treble top line
    expect(getDiatonicStep('A5')).toBe(40) // High treble ledger
    expect(getDiatonicStep('C6')).toBe(42) // High treble C6
  })

  it('correctly calculates unified affine Y coordinates for all staves', () => {
    expect(computeStaffY(38)).toBe(28) // Treble Line 5
    expect(computeStaffY(30)).toBe(68) // Treble Line 1
    expect(computeStaffY(28)).toBe(78) // Middle C (equidistant)
    expect(computeStaffY(26)).toBe(88) // Bass Line 5
    expect(computeStaffY(18)).toBe(128) // Bass Line 1
    expect(computeStaffY(14)).toBe(148) // C2
    expect(computeStaffY(42)).toBe(8) // C6
  })

  it('computes exact ledger lines for Middle C and extreme pitches', () => {
    // Middle C
    expect(computeLedgerLines(28, 'treble')).toEqual([78])
    expect(computeLedgerLines(28, 'bass')).toEqual([78])

    // High Treble A5 and C6
    expect(computeLedgerLines(40, 'treble')).toEqual([18])
    expect(computeLedgerLines(42, 'treble')).toEqual([18, 8])

    // Low Bass E2 and C2
    expect(computeLedgerLines(16, 'bass')).toEqual([138])
    expect(computeLedgerLines(14, 'bass')).toEqual([138, 148])

    // Notes within staff require 0 ledger lines
    expect(computeLedgerLines(32, 'treble')).toEqual([]) // G4
    expect(computeLedgerLines(22, 'bass')).toEqual([])   // D3
  })

  it('converts MIDI numbers to pitch names with sharp and flat options', () => {
    expect(midiToPitchName(60)).toBe('C4')
    expect(midiToPitchName(74)).toBe('D5')
    expect(midiToPitchName(43)).toBe('G2')
    expect(midiToPitchName(61, false)).toBe('C#4')
    expect(midiToPitchName(61, true)).toBe('Db4')
  })
})

describe('GrandStaffDiagram Component Rendering', () => {
  it('renders root grand-staff-diagram container with Treble and Bass staves and curly brace', () => {
    const { container } = render(<GrandStaffDiagram chordName="C Major" />)
    const diagram = screen.getByTestId('grand-staff-diagram')
    expect(diagram).toBeDefined()
    expect(screen.getByText('C Major')).toBeDefined()
    expect(screen.getByText('LH Bass')).toBeDefined()
    expect(screen.getByText('RH Treble')).toBeDefined()

    // 5 lines for Treble + 5 lines for Bass = 10 horizontal staff lines
    const staffLines = diagram.querySelectorAll('line[data-staff-line]')
    expect(staffLines.length).toBe(10)

    // Connecting brace
    expect(container.querySelector('path[data-brace]')).toBeDefined()
  })

  it('renders noteheads on Treble and Bass staves for chord voicings', () => {
    render(
      <GrandStaffDiagram
        chordName="C Major"
        lhPitches={[48]} // C3 on Bass staff
        rhPitches={[64, 67, 72]} // E4, G4, C5 on Treble staff
      />
    )
    const notes = screen.getAllByTestId('grand-staff-note')
    expect(notes.length).toBe(4)
    const noteheads = screen.getAllByTestId('grand-staff-notehead')
    expect(noteheads.length).toBe(4)
  })

  it('renders Middle C (C4, MIDI 60) with middle C ledger line between staves', () => {
    const { container } = render(
      <GrandStaffDiagram
        chordName="C"
        rhPitches={[60]} // Middle C
      />
    )
    const middleCLedger = screen.getByTestId('ledger-line-middle-c')
    expect(middleCLedger).toBeDefined()
    const ledgerByY = container.querySelector('line[y1="78"]')
    expect(ledgerByY).toBeDefined()
  })

  it('renders accidentals (sharp and flat) correctly for altered pitches', () => {
    render(
      <GrandStaffDiagram
        notes={[
          { pitch: 'F#4', hand: 'rh' },
          { pitch: 'Bb2', hand: 'lh' },
        ]}
      />
    )
    expect(screen.getByText('♯')).toBeDefined()
    expect(screen.getByText('♭')).toBeDefined()
  })

  it('distinguishes Left-Hand (Terracotta) and Right-Hand (Patina Jade) notes with testids and classes', () => {
    const { container } = render(
      <GrandStaffDiagram
        chordName="G Major"
        lhPitches={[43]} // G2
        rhPitches={[59, 62, 67]} // B3, D4, G4
      />
    )
    const lhNotes = screen.getAllByTestId('grand-staff-notehead-lh')
    const rhNotes = screen.getAllByTestId('grand-staff-notehead-rh')
    expect(lhNotes.length).toBe(1)
    expect(rhNotes.length).toBe(3)

    // Check color classes on ellipses
    const lhNotehead = container.querySelector('ellipse.text-\\[\\#9A2A2A\\]')
    expect(lhNotehead).toBeDefined()
    const rhNoteheads = container.querySelectorAll('ellipse.text-\\[\\#3B6E57\\]')
    expect(rhNoteheads.length).toBe(3)
  })

  it('renders arpeggiated sequence across horizontal timeline', () => {
    render(
      <GrandStaffDiagram
        mode="arpeggio"
        notes={[
          { pitch: 'C3', hand: 'lh', stepOffset: 0 },
          { pitch: 'G3', hand: 'lh', stepOffset: 1 },
          { pitch: 'C4', hand: 'rh', stepOffset: 2 },
          { pitch: 'E4', hand: 'rh', stepOffset: 3 },
        ]}
      />
    )
    const notes = screen.getAllByTestId('grand-staff-note')
    expect(notes.length).toBe(4)
  })
})
