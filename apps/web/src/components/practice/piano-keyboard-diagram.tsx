import React, { useMemo } from 'react'

export interface PianoKeyboardDiagramProps {
  /** Array of Left-Hand MIDI pitches (highlighted in Terracotta #9A2A2A) */
  lhPitches?: number[]

  /** Array of Right-Hand MIDI pitches (highlighted in Patina Jade #3B6E57) */
  rhPitches?: number[]

  /** Generic active MIDI pitches when hand separation is unassigned */
  activePitches?: number[]

  /** Starting MIDI note, defaults to 48 (C3) */
  startMidi?: number

  /** Ending MIDI note, defaults to 72 (C5) */
  endMidi?: number

  /** Interactive click or keydown callback */
  onKeyClick?: (midi: number) => void

  /** Optional chord title or badge caption */
  chordName?: string

  /** Display note pitch labels on pressed keys (default true) */
  showLabels?: boolean

  /** Display reference C3, C4, C5 labels (default true) */
  showOctaveMarkers?: boolean

  /** Optional CSS class extensions */
  className?: string
}

export const WHITE_KEY_WIDTH = 20
export const WHITE_KEY_HEIGHT = 80
export const BLACK_KEY_WIDTH = 12
export const BLACK_KEY_HEIGHT = 48

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10])

export type KeyHandState = 'lh' | 'rh' | 'both' | 'none'

export interface KeyLayoutModel {
  midi: number
  noteName: string
  octave: number
  pitchClass: number
  isBlack: boolean
  x: number
  y: number
  width: number
  height: number
  isMiddleC: boolean
}

export function resolveKeyHandState(
  midi: number,
  lhSet: Set<number>,
  rhSet: Set<number>,
  activeSet: Set<number>
): KeyHandState {
  const inLh = lhSet.has(midi)
  const inRh = rhSet.has(midi)
  if (inLh && inRh) return 'both'
  if (inLh) return 'lh'
  if (inRh) return 'rh'
  if (activeSet.has(midi)) {
    return midi < 60 ? 'lh' : 'rh'
  }
  return 'none'
}

export function buildKeyboardLayout(startMidi: number, endMidi: number): {
  whiteKeys: KeyLayoutModel[]
  blackKeys: KeyLayoutModel[]
  totalWidth: number
} {
  const whiteKeys: KeyLayoutModel[] = []
  const blackKeySpecs: { midi: number; noteName: string; octave: number; pitchClass: number; whiteIndexBefore: number }[] = []

  let currentWhiteIndex = 0

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const pc = ((midi % 12) + 12) % 12
    const octave = Math.floor(midi / 12) - 1
    const noteName = `${NOTE_NAMES[pc]}${octave}`
    const isBlack = BLACK_PITCH_CLASSES.has(pc)
    const isMiddleC = midi === 60

    if (!isBlack) {
      whiteKeys.push({
        midi,
        noteName,
        octave,
        pitchClass: pc,
        isBlack: false,
        x: currentWhiteIndex * WHITE_KEY_WIDTH,
        y: 0,
        width: WHITE_KEY_WIDTH,
        height: WHITE_KEY_HEIGHT,
        isMiddleC,
      })
      currentWhiteIndex++
    } else {
      blackKeySpecs.push({
        midi,
        noteName,
        octave,
        pitchClass: pc,
        whiteIndexBefore: currentWhiteIndex,
      })
    }
  }

  const blackKeys: KeyLayoutModel[] = blackKeySpecs.map((spec) => {
    // Dividing line between previous white key and next white key is at spec.whiteIndexBefore * WHITE_KEY_WIDTH
    const lineX = spec.whiteIndexBefore * WHITE_KEY_WIDTH
    const x = lineX - BLACK_KEY_WIDTH / 2
    return {
      midi: spec.midi,
      noteName: spec.noteName,
      octave: spec.octave,
      pitchClass: spec.pitchClass,
      isBlack: true,
      x,
      y: 0,
      width: BLACK_KEY_WIDTH,
      height: BLACK_KEY_HEIGHT,
      isMiddleC: false,
    }
  })

  return {
    whiteKeys,
    blackKeys,
    totalWidth: Math.max(whiteKeys.length * WHITE_KEY_WIDTH, 20),
  }
}

export function PianoKeyboardDiagram({
  lhPitches = [],
  rhPitches = [],
  activePitches = [],
  startMidi = 48,
  endMidi = 72,
  onKeyClick,
  chordName,
  showLabels = true,
  showOctaveMarkers = true,
  className = '',
}: PianoKeyboardDiagramProps): React.JSX.Element {
  const lhSet = useMemo(() => new Set(lhPitches), [lhPitches])
  const rhSet = useMemo(() => new Set(rhPitches), [rhPitches])
  const activeSet = useMemo(() => new Set(activePitches), [activePitches])

  const { whiteKeys, blackKeys, totalWidth } = useMemo(
    () => buildKeyboardLayout(startMidi, endMidi),
    [startMidi, endMidi]
  )

  const handleKeyInteraction = (midi: number) => {
    onKeyClick?.(midi)
  }

  const handleKeyDown = (e: React.KeyboardEvent, midi: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onKeyClick?.(midi)
    }
  }

  return (
    <div
      data-testid="piano-keyboard-diagram"
      className={`flex flex-col items-center select-none ${className}`}
    >
      {chordName && (
        <div className="w-full flex items-center justify-between pb-1 px-2 border-b border-[#E2DDD3]/50 dark:border-[#38342E]/50 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
            KEYBOARD (C3–C5)
          </span>
          <span className="text-xs font-serif font-black text-[#242321] dark:text-[#EDE8DF]">
            {chordName}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${totalWidth} 80`}
        role="group"
        aria-label="Piano keyboard diagram spanning C3 to C5"
        className="w-full h-auto overflow-visible"
      >
        {/* Pass 1: White Keys Layer */}
        <g data-testid="white-keys">
          {whiteKeys.map((key) => {
            const handState = resolveKeyHandState(key.midi, lhSet, rhSet, activeSet)
            const isPressed = handState !== 'none'
            const isLh = handState === 'lh'
            const isRh = handState === 'rh' || handState === 'both'

            let fillClass = 'fill-[#FAF8F3] dark:fill-[#242321] hover:fill-[#EFECE6] dark:hover:fill-[#2D2A26] stroke-[#D9D3C7] dark:stroke-[#38342E]'
            if (isLh) {
              fillClass = 'fill-[#9A2A2A] dark:fill-[#B83232] stroke-[#7A1A1A] dark:stroke-[#9A2A2A]'
            } else if (isRh) {
              fillClass = 'fill-[#3B6E57] dark:fill-[#689F84] stroke-[#2A5240] dark:stroke-[#4A7F66]'
            }

            return (
              <rect
                key={key.midi}
                data-testid="piano-white-key"
                data-midi={key.midi}
                data-hand={isPressed ? handState : undefined}
                x={key.x}
                y={key.y}
                width={key.width}
                height={key.height}
                rx={1.5}
                ry={1.5}
                strokeWidth={1}
                role="button"
                tabIndex={0}
                aria-label={key.noteName}
                aria-pressed={isPressed}
                onClick={() => handleKeyInteraction(key.midi)}
                onKeyDown={(e) => handleKeyDown(e, key.midi)}
                className={`cursor-pointer transition-colors ${fillClass}`}
              />
            )
          })}
        </g>

        {/* Pass 2: Black Keys Layer */}
        <g data-testid="black-keys">
          {blackKeys.map((key) => {
            const handState = resolveKeyHandState(key.midi, lhSet, rhSet, activeSet)
            const isPressed = handState !== 'none'
            const isLh = handState === 'lh'
            const isRh = handState === 'rh' || handState === 'both'

            let fillClass = 'fill-[#242321] dark:fill-[#0E0D0C] hover:fill-[#38342E] dark:hover:fill-[#24221F] stroke-[#1E1C1A] dark:stroke-[#38342E]'
            if (isLh) {
              fillClass = 'fill-[#9A2A2A] dark:fill-[#B83232] stroke-[#7A1A1A] dark:stroke-[#9A2A2A]'
            } else if (isRh) {
              fillClass = 'fill-[#3B6E57] dark:fill-[#689F84] stroke-[#2A5240] dark:stroke-[#4A7F66]'
            }

            return (
              <rect
                key={key.midi}
                data-testid="piano-black-key"
                data-midi={key.midi}
                data-hand={isPressed ? handState : undefined}
                x={key.x}
                y={key.y}
                width={key.width}
                height={key.height}
                rx={1.5}
                ry={1.5}
                strokeWidth={1}
                role="button"
                tabIndex={0}
                aria-label={key.noteName}
                aria-pressed={isPressed}
                onClick={() => handleKeyInteraction(key.midi)}
                onKeyDown={(e) => handleKeyDown(e, key.midi)}
                className={`cursor-pointer transition-colors ${fillClass}`}
              />
            )
          })}
        </g>

        {/* Pass 3: Active Labels, Markers & Reference Indicators */}
        <g data-testid="key-active-labels" className="pointer-events-none select-none">
          {/* Unpressed Octave Markers: C3, C4, C5 */}
          {showOctaveMarkers &&
            whiteKeys
              .filter((k) => k.pitchClass === 0)
              .map((k) => {
                const handState = resolveKeyHandState(k.midi, lhSet, rhSet, activeSet)
                const isPressed = handState !== 'none'
                const isMiddleC = k.isMiddleC

                return (
                  <g key={`marker-${k.midi}`}>
                    {/* Middle C Burnished Brass Indicator Dot */}
                    {isMiddleC && (
                      <circle
                        cx={k.x + k.width / 2}
                        cy={isPressed ? 74 : 60}
                        r={2}
                        className={isPressed ? 'fill-[#FAF8F3]' : 'fill-[#C5A059] dark:fill-[#DFC07A]'}
                      />
                    )}

                    {/* Octave label (C3, C4, C5) */}
                    <text
                      x={k.x + k.width / 2}
                      y={isPressed ? 66 : 72}
                      textAnchor="middle"
                      fontSize="8"
                      fontFamily="monospace"
                      className={
                        isPressed
                          ? 'fill-[#FAF8F3] font-bold'
                          : 'fill-[#736E65] dark:fill-[#A39C8F]'
                      }
                    >
                      {k.noteName}
                    </text>
                  </g>
                )
              })}

          {/* Active Labels for Pressed White Keys (non-C keys or additional info) */}
          {showLabels &&
            whiteKeys.map((k) => {
              const handState = resolveKeyHandState(k.midi, lhSet, rhSet, activeSet)
              if (handState === 'none') return null
              const isC = k.pitchClass === 0

              return (
                <g key={`active-w-${k.midi}`}>
                  {!isC && (
                    <text
                      x={k.x + k.width / 2}
                      y={68}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="fill-[#FAF8F3]"
                    >
                      {k.noteName}
                    </text>
                  )}
                  <text
                    x={k.x + k.width / 2}
                    y={isC ? 52 : 54}
                    textAnchor="middle"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="fill-[#FAF8F3]"
                  >
                    {handState === 'lh' ? 'LH' : handState === 'rh' ? 'RH' : ''}
                  </text>
                </g>
              )
            })}

          {/* Active Labels for Pressed Black Keys */}
          {showLabels &&
            blackKeys.map((k) => {
              const handState = resolveKeyHandState(k.midi, lhSet, rhSet, activeSet)
              if (handState === 'none') return null

              return (
                <g key={`active-b-${k.midi}`}>
                  <text
                    x={k.x + k.width / 2}
                    y={40}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="fill-[#FAF8F3]"
                  >
                    {k.noteName}
                  </text>
                  <text
                    x={k.x + k.width / 2}
                    y={26}
                    textAnchor="middle"
                    fontSize="6.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="fill-[#FAF8F3]"
                  >
                    {handState === 'lh' ? 'LH' : 'RH'}
                  </text>
                </g>
              )
            })}
        </g>
      </svg>
    </div>
  )
}
