import React, { useMemo, useRef } from 'react'
import type { FlowingChordItem } from './flowing-notation-stand'
import { midiToPitchName } from './grand-staff-diagram'

export interface PianoWaterfallStandProps {
  progression: FlowingChordItem[]
  currentBeat: number
  tempoBpm: number
  isPlaying: boolean
  beatsPerMeasure?: number
  onKeyClick?: (midi: number) => void
  onSeekBeat?: (beat: number) => void
  className?: string
}

// 25-key keyboard spans C3 (MIDI 48) to C5 (MIDI 72)
const START_MIDI = 48
const END_MIDI = 72
const WHITE_KEY_INDICES = [0, 2, 4, 5, 7, 9, 11] // C, D, E, F, G, A, B

export function pitchNameToMidi(pitchStr: string): number {
  const match = pitchStr.match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
  if (!match) return 60
  const letter = match[1].toUpperCase()
  const acc = match[2]
  const oct = parseInt(match[3], 10)
  const baseMidi: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  let midi = (oct + 1) * 12 + (baseMidi[letter] ?? 0)
  if (acc === '#') midi += 1
  if (acc === 'b') midi -= 1
  return midi
}

export function PianoWaterfallStand({
  progression,
  currentBeat,
  tempoBpm: _tempoBpm,
  isPlaying: _isPlaying,
  beatsPerMeasure = 4,
  onKeyClick,
  onSeekBeat: _onSeekBeat,
  className = '',
}: PianoWaterfallStandProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  // Map 25 keys to their X coordinates and dimensions
  const keyMap = useMemo(() => {
    const keys: Array<{
      midi: number
      isWhite: boolean
      name: string
      x: number
      width: number
    }> = []

    const WHITE_KEY_COUNT = 15
    const TOTAL_WIDTH = 600
    const wkWidth = TOTAL_WIDTH / WHITE_KEY_COUNT
    const bkWidth = wkWidth * 0.62

    let whiteIdx = 0
    for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
      const noteInOct = midi % 12
      const isWhite = WHITE_KEY_INDICES.includes(noteInOct)
      if (isWhite) {
        keys.push({
          midi,
          isWhite: true,
          name: midiToPitchName(midi),
          x: whiteIdx * wkWidth,
          width: wkWidth,
        })
        whiteIdx++
      }
    }

    whiteIdx = 0
    for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
      const noteInOct = midi % 12
      const isBlack = !WHITE_KEY_INDICES.includes(noteInOct)
      if (isBlack) {
        keys.push({
          midi,
          isWhite: false,
          name: midiToPitchName(midi),
          x: whiteIdx * wkWidth - bkWidth / 2,
          width: bkWidth,
        })
      } else {
        whiteIdx++
      }
    }

    return keys
  }, [])

  // Quick lookup from MIDI to key coordinate
  const keyCoordByMidi = useMemo(() => {
    const map = new Map<number, { x: number; width: number; isWhite: boolean }>()
    keyMap.forEach((k) => map.set(k.midi, { x: k.x, width: k.width, isWhite: k.isWhite }))
    return map
  }, [keyMap])

  // Extract all timeline events/notes with startBeat and durationBeats
  const waterfallNotes = useMemo(() => {
    const notes: Array<{
      id: string
      midi: number
      startBeat: number
      durationBeats: number
      hand: 'lh' | 'rh'
      chordName: string
    }> = []

    let currentAccumBeat = 0
    progression.forEach((chord, chordIdx) => {
      const chordDuration = chord.duration_beats ?? beatsPerMeasure

      if (chord.melodyNotes && chord.melodyNotes.length > 0) {
        chord.melodyNotes.forEach((note, nIdx) => {
          const midi = pitchNameToMidi(note.pitch)
          if (midi >= START_MIDI && midi <= END_MIDI) {
            const hand: 'lh' | 'rh' = note.clef === 'bass' ? 'lh' : 'rh'
            notes.push({
              id: `${hand}-${chordIdx}-${midi}-${nIdx}`,
              midi,
              startBeat: currentAccumBeat + (note.beatOffset ?? 0),
              durationBeats: Math.max(0.4, (note.duration ?? 1) * 0.85),
              hand,
              chordName: chord.chordName,
            })
          }
        })
      } else {
        const lhPitches = chord.pianoVoicing?.lhPitches ?? []
        const rhPitches = chord.pianoVoicing?.rhPitches ?? []

        lhPitches.forEach((p, pIdx) => {
          if (p >= START_MIDI && p <= END_MIDI) {
            notes.push({
              id: `lh-${chordIdx}-${p}-${pIdx}`,
              midi: p,
              startBeat: currentAccumBeat,
              durationBeats: chordDuration * 0.85,
              hand: 'lh',
              chordName: chord.chordName,
            })
          }
        })

        rhPitches.forEach((p, pIdx) => {
          if (p >= START_MIDI && p <= END_MIDI) {
            notes.push({
              id: `rh-${chordIdx}-${p}-${pIdx}`,
              midi: p,
              startBeat: currentAccumBeat,
              durationBeats: chordDuration * 0.85,
              hand: 'rh',
              chordName: chord.chordName,
            })
          }
        })
      }

      currentAccumBeat += chordDuration
    })

    return notes
  }, [progression, beatsPerMeasure])

  // Pixels per beat calibration (vertical speed)
  const PX_PER_BEAT = 75
  const STRIKE_LINE_Y = 180 // Y coordinate of strike threshold

  // Map of active MIDI pitch -> hand ('lh' | 'rh') at the strike line
  const activeKeysAtStrike = useMemo(() => {
    const activeMap = new Map<number, 'lh' | 'rh'>()
    waterfallNotes.forEach((n) => {
      if (currentBeat >= n.startBeat && currentBeat <= n.startBeat + n.durationBeats) {
        if (!activeMap.has(n.midi) || n.hand === 'rh') {
          activeMap.set(n.midi, n.hand)
        }
      }
    })
    return activeMap
  }, [waterfallNotes, currentBeat])

  return (
    <div
      data-testid="piano-waterfall-stand"
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-[#141312] ${className}`}
    >
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between overflow-hidden relative px-2">
        {/* ─────────────────────────────────────────────────────────────
            1. VERTICAL FALLING NOTE CANVAS TRACK
           ───────────────────────────────────────────────────────────── */}
        <div
          ref={containerRef}
          data-testid="waterfall-canvas-track"
          className="relative w-full flex-1 overflow-hidden"
          style={{ minHeight: '180px' }}
        >
          <svg
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            {/* Subtle lane separators */}
            {keyMap
              .filter((k) => k.isWhite)
              .map((k) => (
                <line
                  key={`lane-${k.midi}`}
                  x1={k.x}
                  y1={0}
                  x2={k.x}
                  y2={200}
                  stroke="#24221F"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}

            {/* Falling Note Ribbons (Slender & Translucent) */}
            {waterfallNotes.map((note) => {
              const coord = keyCoordByMidi.get(note.midi)
              if (!coord) return null

              // Y position calculation:
              // When currentBeat === note.startBeat, note bottom hits STRIKE_LINE_Y
              const noteHeight = Math.max(16, note.durationBeats * PX_PER_BEAT)
              const beatsUntilHit = note.startBeat - currentBeat
              const noteBottomY = STRIKE_LINE_Y - beatsUntilHit * PX_PER_BEAT
              const noteTopY = noteBottomY - noteHeight

              // Only render notes within viewport window
              if (noteBottomY < -50 || noteTopY > 250) return null

              const isLh = note.hand === 'lh'
              const fillColor = isLh ? '#9A2A2A' : '#3B6E57'
              const strokeColor = isLh ? '#C25454' : '#558B70'

              // Slender ribbon dimensions centered precisely above the key
              const ribbonWidth = coord.isWhite ? coord.width * 0.68 : coord.width * 0.76
              const ribbonX = coord.x + (coord.width - ribbonWidth) / 2

              return (
                <g key={note.id} className="transition-transform duration-75">
                  <rect
                    x={ribbonX}
                    y={noteTopY}
                    width={ribbonWidth}
                    height={noteHeight}
                    rx={2}
                    ry={2}
                    fill={fillColor}
                    fillOpacity={0.48}
                    stroke={strokeColor}
                    strokeWidth={1}
                    className="shadow-2xs"
                  />
                  {noteHeight >= 22 && (
                    <text
                      x={coord.x + coord.width / 2}
                      y={noteBottomY - 5}
                      textAnchor="middle"
                      fill="#EDE8DF"
                      fillOpacity={0.85}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                      letterSpacing="0.05em"
                      className="select-none pointer-events-none"
                    >
                      {midiToPitchName(note.midi)}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Precision Vernier Caliper Sightline */}
            <g data-testid="waterfall-strike-zone">
              <line
                x1={0}
                y1={STRIKE_LINE_Y}
                x2={600}
                y2={STRIKE_LINE_Y}
                stroke="#C5A059"
                strokeWidth={1.5}
                className="drop-shadow-[0_0_6px_#C5A059]"
              />
              {/* Millimeter graduation ticks along caliper rule */}
              {Array.from({ length: 41 }).map((_, i) => (
                <line
                  key={`tick-${i}`}
                  x1={i * 15}
                  y1={STRIKE_LINE_Y - (i % 5 === 0 ? 4 : 2)}
                  x2={i * 15}
                  y2={STRIKE_LINE_Y + (i % 5 === 0 ? 4 : 2)}
                  stroke="#C5A059"
                  strokeWidth={0.75}
                  strokeOpacity={0.7}
                />
              ))}
              {/* Refined Engraver's Badge */}
              <rect
                x={8}
                y={STRIKE_LINE_Y - 8}
                width={104}
                height={16}
                rx={2}
                fill="#1E1C1A"
                stroke="#C5A059"
                strokeWidth={1}
                className="shadow-sm"
              />
              <text
                x={60}
                y={STRIKE_LINE_Y + 3}
                textAnchor="middle"
                fill="#C5A059"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.12em"
                className="select-none pointer-events-none uppercase"
              >
                CALIPER SIGHTLINE
              </text>
            </g>
          </svg>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. AUTHENTIC 25-KEY STRIKE KEYBOARD AT BASELINE
           ───────────────────────────────────────────────────────────── */}
        <div className="relative w-full h-16 bg-[#141312] border-t border-[#38342E] flex justify-center items-end pb-1 z-30 shrink-0">
          <svg
            viewBox="0 0 600 65"
            preserveAspectRatio="none"
            className="w-full h-full drop-shadow-md select-none"
          >
            {/* Pass 1: White Keys */}
            <g data-testid="waterfall-white-keys">
              {keyMap
                .filter((k) => k.isWhite)
                .map((k) => {
                  const activeHand = activeKeysAtStrike.get(k.midi)
                  const isActive = Boolean(activeHand)
                  const activeFill = activeHand === 'lh' ? '#9A2A2A' : '#3B6E57'
                  return (
                    <g key={`wk-${k.midi}`}>
                      <rect
                        data-testid={`waterfall-key-${k.midi}`}
                        x={k.x}
                        y={0}
                        width={k.width - 1}
                        height={65}
                        rx={2}
                        ry={2}
                        fill={isActive ? activeFill : '#FAF8F3'}
                        stroke={isActive ? '#C5A059' : '#242321'}
                        strokeWidth={isActive ? 1.5 : 1}
                        onClick={() => onKeyClick?.(k.midi)}
                        className="cursor-pointer transition-colors"
                      />
                      {isActive && (
                        <>
                          <rect
                            x={k.x + 2}
                            y={1}
                            width={k.width - 5}
                            height={4}
                            rx={1}
                            fill={activeFill}
                          />
                          <circle
                            cx={k.x + (k.width - 1) / 2}
                            cy={54}
                            r={3}
                            fill={activeFill}
                          />
                        </>
                      )}
                    </g>
                  )
                })}
            </g>

            {/* Pass 2: Black Keys */}
            <g data-testid="waterfall-black-keys">
              {keyMap
                .filter((k) => !k.isWhite)
                .map((k) => {
                  const activeHand = activeKeysAtStrike.get(k.midi)
                  const isActive = Boolean(activeHand)
                  const activeFill = activeHand === 'lh' ? '#9A2A2A' : '#3B6E57'
                  return (
                    <g key={`bk-${k.midi}`}>
                      <rect
                        data-testid={`waterfall-key-${k.midi}`}
                        x={k.x}
                        y={0}
                        width={k.width}
                        height={40}
                        rx={1.5}
                        ry={1.5}
                        fill={isActive ? activeFill : '#1E1C1A'}
                        stroke={isActive ? '#C5A059' : '#141312'}
                        strokeWidth={isActive ? 1.5 : 1}
                        onClick={() => onKeyClick?.(k.midi)}
                        className="cursor-pointer transition-colors"
                      />
                      {isActive && (
                        <circle
                          cx={k.x + k.width / 2}
                          cy={30}
                          r={2.5}
                          fill={activeFill}
                        />
                      )}
                    </g>
                  )
                })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
