import React, { useMemo } from 'react'

export interface GrandStaffNoteItem {
  pitch: string
  midi?: number
  hand?: 'lh' | 'rh'
  clef?: 'treble' | 'bass'
  stepOffset?: number
  duration?: number
  label?: string
}

export interface GrandStaffDiagramProps {
  chordName?: string
  lhPitches?: number[]
  rhPitches?: number[]
  activePitches?: number[]
  notes?: GrandStaffNoteItem[]
  mode?: 'chord' | 'arpeggio' | 'linear'
  showLabels?: boolean
  showHandLegend?: boolean
  className?: string
  width?: number | string
  height?: number | string
}

const DIATONIC_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export function midiToPitchName(midi: number, preferFlats = false): string {
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  const name = preferFlats ? FLAT_NAMES[pc] : SHARP_NAMES[pc]
  return `${name}${octave}`
}

export function getDiatonicStep(pitchStr: string): number {
  const match = pitchStr.match(/^([A-Ga-g])([#bB]?)(-?\d+)$/)
  if (!match) return 32 // fallback G4
  const letter = match[1].toUpperCase()
  const octave = parseInt(match[3], 10)
  return octave * 7 + (DIATONIC_INDEX[letter] ?? 0)
}

export function computeStaffY(step: number): number {
  return 218 - 5 * step
}

export function computeLedgerLines(step: number, clef: 'treble' | 'bass'): number[] {
  const ledgerYs: number[] = []

  if (step === 28) {
    ledgerYs.push(78)
    return ledgerYs
  }

  if (clef === 'treble') {
    if (step < 30) {
      for (let s = 28; s >= step; s -= 2) {
        ledgerYs.push(218 - 5 * s)
      }
    } else if (step > 38) {
      const maxLedgerStep = step % 2 === 0 ? step : step - 1
      for (let s = 40; s <= maxLedgerStep; s += 2) {
        ledgerYs.push(218 - 5 * s)
      }
    }
  } else {
    if (step > 26) {
      for (let s = 28; s <= step; s += 2) {
        ledgerYs.push(218 - 5 * s)
      }
    } else if (step < 18) {
      const minLedgerStep = step % 2 === 0 ? step : step + 1
      for (let s = 16; s >= minLedgerStep; s -= 2) {
        ledgerYs.push(218 - 5 * s)
      }
    }
  }

  return ledgerYs
}

export const GrandStaffDiagram: React.FC<GrandStaffDiagramProps> = ({
  chordName,
  lhPitches,
  rhPitches,
  activePitches,
  notes,
  mode = 'chord',
  showLabels = true,
  showHandLegend = true,
  className = '',
  width = '100%',
  height = 'auto',
}) => {
  // 1. Resolve note models from props
  const resolvedNotes = useMemo(() => {
    if (notes && notes.length > 0) {
      return notes.map((n) => {
        const step = getDiatonicStep(n.pitch)
        const clef: 'treble' | 'bass' =
          n.clef ?? (n.hand === 'lh' ? 'bass' : n.hand === 'rh' ? 'treble' : step >= 28 ? 'treble' : 'bass')
        const hand: 'lh' | 'rh' = n.hand ?? (clef === 'bass' ? 'lh' : 'rh')
        return {
          ...n,
          step,
          clef,
          hand,
        }
      })
    }

    const items: (GrandStaffNoteItem & { step: number; clef: 'treble' | 'bass'; hand: 'lh' | 'rh' })[] = []
    const preferFlats = Boolean(chordName?.includes('b') || chordName?.startsWith('F'))

    if (lhPitches && lhPitches.length > 0) {
      lhPitches.forEach((m) => {
        const pitch = midiToPitchName(m, preferFlats)
        const step = getDiatonicStep(pitch)
        items.push({
          pitch,
          midi: m,
          hand: 'lh',
          clef: 'bass',
          step,
        })
      })
    }

    if (rhPitches && rhPitches.length > 0) {
      rhPitches.forEach((m) => {
        const pitch = midiToPitchName(m, preferFlats)
        const step = getDiatonicStep(pitch)
        items.push({
          pitch,
          midi: m,
          hand: 'rh',
          clef: 'treble',
          step,
        })
      })
    }

    if (items.length === 0 && activePitches && activePitches.length > 0) {
      activePitches.forEach((m) => {
        const pitch = midiToPitchName(m, preferFlats)
        const step = getDiatonicStep(pitch)
        const clef: 'treble' | 'bass' = m < 60 ? 'bass' : 'treble'
        const hand: 'lh' | 'rh' = clef === 'bass' ? 'lh' : 'rh'
        items.push({
          pitch,
          midi: m,
          hand,
          clef,
          step,
        })
      })
    }

    return items
  }, [notes, lhPitches, rhPitches, activePitches, chordName])

  // 2. Compute horizontal positions and cluster offsets
  const positionedNotes = useMemo(() => {
    if (resolvedNotes.length === 0) return []

    if (mode === 'arpeggio') {
      const stepWidth = resolvedNotes.length > 1 ? 170 / (resolvedNotes.length - 1) : 0
      return resolvedNotes.map((n, idx) => ({
        ...n,
        x: 85 + idx * stepWidth,
        displaced: false,
      }))
    }

    // Chord cluster mode: separate LH and RH slightly
    const lhItems = resolvedNotes.filter((n) => n.hand === 'lh')
    const rhItems = resolvedNotes.filter((n) => n.hand === 'rh')

    const layoutCluster = (items: typeof resolvedNotes, baseX: number) => {
      const sorted = [...items].sort((a, b) => a.step - b.step)
      return sorted.map((item, idx) => {
        let displaced = false
        if (idx > 0 && sorted[idx].step - sorted[idx - 1].step === 1) {
          displaced = true
        }
        return {
          ...item,
          x: displaced ? baseX + 9.5 : baseX,
          displaced,
        }
      })
    }

    const lhPositioned = layoutCluster(lhItems, lhItems.length > 0 && rhItems.length > 0 ? 135 : 150)
    const rhPositioned = layoutCluster(rhItems, lhItems.length > 0 && rhItems.length > 0 ? 165 : 150)

    return [...lhPositioned, ...rhPositioned]
  }, [resolvedNotes, mode])

  return (
    <div
      data-testid="grand-staff-diagram"
      className={`flex flex-col items-center select-none ${className}`}
      style={{ width }}
    >
      {chordName && (
        <div className="w-full flex items-center justify-between pb-1 px-2 border-b border-[#E2DDD3]/50 dark:border-[#38342E]/50 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
            GRAND STAFF
          </span>
          <span className="text-xs font-serif font-black text-[#242321] dark:text-[#EDE8DF]">
            {chordName}
          </span>
        </div>
      )}

      <svg
        viewBox="0 0 300 166"
        className="w-full h-auto overflow-visible text-[#242321] dark:text-[#EDE8DF]"
        style={{ maxHeight: height }}
      >
        {/* Classical Curly Brace on the Left */}
        <path
          data-brace="true"
          d="M 20 28 C 14 30 14 48 14 66 C 14 74 9 77 9 78 C 9 79 14 82 14 90 C 14 108 14 126 20 128"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="text-[#242321] dark:text-[#EDE8DF]"
        />

        {/* Double Initial Barlines */}
        <line x1="22" y1="28" x2="22" y2="128" stroke="currentColor" strokeWidth="2.5" />
        <line x1="25" y1="28" x2="25" y2="128" stroke="currentColor" strokeWidth="1" />

        {/* Treble Staff: 5 Lines (Y = 28, 38, 48, 58, 68) */}
        {[28, 38, 48, 58, 68].map((y) => (
          <line
            key={`treble-line-${y}`}
            data-staff-line="true"
            x1={22}
            y1={y}
            x2={286}
            y2={y}
            stroke="currentColor"
            className="text-[#C9C3B5] dark:text-[#3E3A32]"
            strokeWidth="1"
          />
        ))}

        {/* Bass Staff: 5 Lines (Y = 88, 98, 108, 118, 128) */}
        {[88, 98, 108, 118, 128].map((y) => (
          <line
            key={`bass-line-${y}`}
            data-staff-line="true"
            x1={22}
            y1={y}
            x2={286}
            y2={y}
            stroke="currentColor"
            className="text-[#C9C3B5] dark:text-[#3E3A32]"
            strokeWidth="1"
          />
        ))}

        {/* Right Final Barlines */}
        <line
          x1="282"
          y1="28"
          x2="282"
          y2="128"
          stroke="currentColor"
          strokeWidth="1"
          className="text-[#C9C3B5] dark:text-[#3E3A32]"
        />
        <line x1="286" y1="28" x2="286" y2="128" stroke="currentColor" strokeWidth="2.5" />

        {/* Treble G-Clef Glyph */}
        <svg x="30" y="24" width="22" height="42" viewBox="0 0 22 42" fill="none">
          <path
            d="M12 3C11 1 8 1 7 4C6 7 8 11 10 14C12 17 14 20 14 25C14 29 11 32 7 31C4 30 3 26 4 23C5 20 8 20 9 22C10 24 9 26 7 26C8 28 11 28 12 26C13 23 11 20 9 17C7 14 4 10 5 6C6 2 10 0 13 2C15 4 15 7 13 12L11 38C11 40 9 41 8 40C7 39 7 38 8 37L10 28"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Bass F-Clef Glyph */}
        <svg x="31" y="88" width="20" height="28" viewBox="0 0 20 28" fill="none">
          <path
            d="M6 10C6 7 8 5 11 5C14 5 16 7 16 11C16 17 10 22 5 24"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="6" cy="10" r="2.5" fill="currentColor" />
          <circle cx="17" cy="9" r="1.3" fill="currentColor" />
          <circle cx="17" cy="15" r="1.3" fill="currentColor" />
        </svg>

        {/* Notes, Stems, Accidental Markers & Ledger Lines */}
        {positionedNotes.map((note, idx) => {
          const y = computeStaffY(note.step)
          const ledgerYs = computeLedgerLines(note.step, note.clef)
          const isLh = note.hand === 'lh'
          const noteColorClass = isLh
            ? 'text-[#9A2A2A] dark:text-[#E57373]'
            : 'text-[#3B6E57] dark:text-[#689F84]'

          // Stem geometry
          const stemUp = !isLh
          const stemX = stemUp ? note.x + 4.5 : note.x - 4.5
          const stemLength = 26
          const stemY2 = stemUp ? y - stemLength : y + stemLength

          return (
            <g key={`${note.pitch}-${idx}`} data-testid="grand-staff-note">
              {/* Ledger Lines */}
              {ledgerYs.map((ly, lIdx) => {
                const isMiddleC = ly === 78
                return (
                  <line
                    key={`ledger-${lIdx}`}
                    data-testid={isMiddleC ? 'ledger-line-middle-c' : undefined}
                    x1={note.x - 9}
                    y1={ly}
                    x2={note.x + 9}
                    y2={ly}
                    stroke="currentColor"
                    className="text-[#524D44] dark:text-[#A09A8F]"
                    strokeWidth="1.4"
                  />
                )
              })}

              {/* Accidental Markers */}
              {note.pitch.includes('b') && (
                <text
                  x={note.x - 11}
                  y={y + 3.5}
                  fontSize="13"
                  fontFamily="serif"
                  fontStyle="italic"
                  fill="currentColor"
                  className={`${noteColorClass} font-semibold`}
                >
                  ♭
                </text>
              )}
              {note.pitch.includes('#') && (
                <text
                  x={note.x - 10}
                  y={y + 3.5}
                  fontSize="11"
                  fontFamily="sans-serif"
                  fill="currentColor"
                  className={`${noteColorClass} font-bold`}
                >
                  ♯
                </text>
              )}

              {/* Notehead with hand hierarchy testids */}
              <g data-testid={isLh ? 'grand-staff-notehead-lh' : 'grand-staff-notehead-rh'}>
                <ellipse
                  data-testid="grand-staff-notehead"
                  cx={note.x}
                  cy={y}
                  rx={4.8}
                  ry={3.5}
                  transform={`rotate(-15 ${note.x} ${y})`}
                  fill="currentColor"
                  className={noteColorClass}
                />
              </g>

              {/* Note Stem */}
              <line
                x1={stemX}
                y1={y}
                x2={stemX}
                y2={stemY2}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                className={noteColorClass}
              />

              {/* Pitch Label */}
              {showLabels && (
                <text
                  x={note.x}
                  y={stemUp ? y + 14 : y - 10}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="monospace"
                  fill="currentColor"
                  className="text-[#736E65] dark:text-[#A39C8F] font-bold"
                >
                  {note.pitch}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Hand Distinction Legend */}
      {showHandLegend && (
        <div className="flex items-center gap-4 pt-1 text-[9px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9A2A2A] dark:bg-[#E57373]" />
            <span className="text-[#736E65] dark:text-[#A39C8F]">LH Bass</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3B6E57] dark:bg-[#689F84]" />
            <span className="text-[#736E65] dark:text-[#A39C8F]">RH Treble</span>
          </div>
        </div>
      )}
    </div>
  )
}
