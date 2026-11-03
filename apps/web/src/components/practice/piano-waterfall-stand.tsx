import React, { useMemo, useRef } from 'react'
import type { FlowingChordItem } from './flowing-notation-stand'
import { midiToPitchName } from './grand-staff-diagram'
import { useTheme } from '@/hooks/use-theme'

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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

  const keyCoordByMidi = useMemo(() => {
    const map = new Map<number, { x: number; width: number; isWhite: boolean }>()
    keyMap.forEach((k) => map.set(k.midi, { x: k.x, width: k.width, isWhite: k.isWhite }))
    return map
  }, [keyMap])

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

  const PX_PER_BEAT = 75
  const STRIKE_LINE_Y = 180

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
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-[#F8F8F6] dark:bg-[#09090B] transition-colors ${className}`}
    >
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between overflow-hidden relative px-2">
        {/* 1. VERTICAL FALLING NOTE CANVAS TRACK */}
        <div
          ref={containerRef}
          data-testid="waterfall-canvas-track"
          className="relative w-full flex-1 overflow-hidden"
          style={{ minHeight: '160px' }}
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
                  stroke={isDark ? '#18181C' : '#E4E4E0'}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}

            {/* Falling Note Ribbons (LH Amber #F59E0B, RH Emerald #10B981) */}
            {waterfallNotes.map((note) => {
              const coord = keyCoordByMidi.get(note.midi)
              if (!coord) return null

              const noteHeight = Math.max(16, note.durationBeats * PX_PER_BEAT)
              const beatsUntilHit = note.startBeat - currentBeat
              const noteBottomY = STRIKE_LINE_Y - beatsUntilHit * PX_PER_BEAT
              const noteTopY = noteBottomY - noteHeight

              if (noteBottomY < -50 || noteTopY > 250) return null

              const isLh = note.hand === 'lh'
              const fillColor = isLh ? '#F59E0B' : '#10B981'
              const strokeColor = isLh ? '#D97706' : '#059669'

              const ribbonWidth = coord.isWhite ? coord.width * 0.68 : coord.width * 0.76
              const ribbonX = coord.x + (coord.width - ribbonWidth) / 2

              return (
                <g key={note.id} className="transition-transform duration-75">
                  <rect
                    x={ribbonX}
                    y={noteTopY}
                    width={ribbonWidth}
                    height={noteHeight}
                    rx={2.5}
                    ry={2.5}
                    fill={fillColor}
                    fillOpacity={isDark ? 0.38 : 0.78}
                    stroke={strokeColor}
                    strokeWidth={1.2}
                  />
                  {noteHeight >= 22 && (
                    <text
                      x={coord.x + coord.width / 2}
                      y={noteBottomY - 5}
                      textAnchor="middle"
                      fill={isDark ? '#F4F4F5' : '#18181B'}
                      fillOpacity={0.95}
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

            {/* Strike Zone Line */}
            <g data-testid="waterfall-strike-zone">
              <line
                x1={0}
                y1={STRIKE_LINE_Y}
                x2={600}
                y2={STRIKE_LINE_Y}
                stroke="#F59E0B"
                strokeWidth={1.5}
              />
              {Array.from({ length: 41 }).map((_, i) => (
                <line
                  key={`tick-${i}`}
                  x1={i * 15}
                  y1={STRIKE_LINE_Y - (i % 5 === 0 ? 4 : 2)}
                  x2={i * 15}
                  y2={STRIKE_LINE_Y + (i % 5 === 0 ? 4 : 2)}
                  stroke="#F59E0B"
                  strokeWidth={0.75}
                  strokeOpacity={0.7}
                />
              ))}
              <rect
                x={8}
                y={STRIKE_LINE_Y - 8}
                width={108}
                height={16}
                rx={2}
                fill={isDark ? '#111114' : '#FFFFFF'}
                stroke="#F59E0B"
                strokeWidth={1}
              />
              <text
                x={62}
                y={STRIKE_LINE_Y + 3}
                textAnchor="middle"
                fill="#D97706"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.12em"
                className="select-none pointer-events-none uppercase"
              >
                PLAY ON THIS LINE
              </text>
            </g>
          </svg>
        </div>

        {/* 2. AUTHENTIC 25-KEY STRIKE KEYBOARD AT BASELINE */}
        <div className="relative w-full h-16 bg-[#F8F8F6] dark:bg-[#09090B] border-t border-zinc-200 dark:border-zinc-800 flex justify-center items-end pb-1 z-30 shrink-0">
          <svg
            viewBox="0 0 600 65"
            preserveAspectRatio="none"
            className="w-full h-full drop-shadow-sm select-none"
          >
            {/* Pass 1: White Keys */}
            <g data-testid="waterfall-white-keys">
              {keyMap
                .filter((k) => k.isWhite)
                .map((k) => {
                  const activeHand = activeKeysAtStrike.get(k.midi)
                  const isActive = Boolean(activeHand)
                  const activeFill = activeHand === 'lh' ? '#F59E0B' : '#10B981'
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
                        fill={isActive ? activeFill : isDark ? '#E4E4E7' : '#FFFFFF'}
                        stroke={isActive ? '#F59E0B' : isDark ? '#18181B' : '#A1A1AA'}
                        strokeWidth={isActive ? 1.5 : 1}
                        onClick={() => onKeyClick?.(k.midi)}
                        className="cursor-pointer transition-colors"
                      />
                      {isActive && (
                        <circle
                          cx={k.x + (k.width - 1) / 2}
                          cy={54}
                          r={3}
                          fill="#09090B"
                        />
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
                  const activeFill = activeHand === 'lh' ? '#F59E0B' : '#10B981'
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
                        fill={isActive ? activeFill : '#18181B'}
                        stroke={isActive ? '#F59E0B' : '#09090B'}
                        strokeWidth={isActive ? 1.5 : 1}
                        onClick={() => onKeyClick?.(k.midi)}
                        className="cursor-pointer transition-colors"
                      />
                      {isActive && (
                        <circle
                          cx={k.x + k.width / 2}
                          cy={30}
                          r={2.5}
                          fill="#09090B"
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
