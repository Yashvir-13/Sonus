import React, { useMemo } from 'react'
import type { VoicingDefinition } from '@/lib/music/chord-voicings'
import type { PitchDetectionResult } from '@/lib/audio/realtime-pitch-tracker'
import type { ChordMetricDto } from '@/api/sessions'
import { PianoWaterfallStand } from './piano-waterfall-stand'

export type GrandStaffNote = {
  pitch: string
  beatOffset: number
  duration: number
  clef?: 'treble' | 'bass'
}

export type StrumEvent = {
  beatOffset: number
  direction: 'down' | 'up' | 'rest' | 'mute'
  accent?: boolean
  label?: string
}

export type FlowingChordItem = VoicingDefinition & {
  duration_beats?: number
  melodyNotes?: GrandStaffNote[]
  strumEvents?: StrumEvent[]
}

export type FlowingNotationStandProps = {
  instrument: 'guitar' | 'piano'
  progression: FlowingChordItem[]
  currentBeat: number
  tempoBpm: number
  isPlaying: boolean
  isCountingIn?: boolean
  countInBeat?: number
  activeHitResult?: PitchDetectionResult | null
  chordMetrics?: ChordMetricDto[]
  beatsPerMeasure?: number
  timeSignature?: string
  onSeekBeat?: (beat: number) => void
  pianoNotationMode?: 'staff' | 'keys'
  onKeyClick?: (midi: number) => void
  hideWatermark?: boolean
  className?: string
}

const GUITAR_STRINGS = [
  { num: 1, name: 'e', note: 'E4', hz: '329Hz', freq: 329.63 },
  { num: 2, name: 'B', note: 'B3', hz: '247Hz', freq: 246.94 },
  { num: 3, name: 'G', note: 'G3', hz: '196Hz', freq: 196.0 },
  { num: 4, name: 'D', note: 'D3', hz: '147Hz', freq: 146.83 },
  { num: 5, name: 'A', note: 'A2', hz: '110Hz', freq: 110.0 },
  { num: 6, name: 'E', note: 'E2', hz: '82Hz', freq: 82.41 },
]

const DIATONIC_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

function getDiatonicStep(pitchStr: string): number {
  const match = pitchStr.match(/^([A-Ga-g])([#bB]?)(-?\d+)$/)
  if (!match) return 32
  const letter = match[1].toUpperCase()
  const octave = parseInt(match[3], 10)
  return octave * 7 + (DIATONIC_INDEX[letter] ?? 0)
}

function calculateStaffPitchY(
  pitchStr: string,
  preferredClef?: 'treble' | 'bass'
): { y: number; clef: 'treble' | 'bass'; ledgerYs: number[]; isMiddleC: boolean } {
  const step = getDiatonicStep(pitchStr)
  const TREBLE_TOP_Y = 24
  const BASS_TOP_Y = 96
  const STEP_PX = 4.5

  const clef: 'treble' | 'bass' = preferredClef ?? (step >= 28 ? 'treble' : 'bass')
  const isMiddleC = step === 28

  let y: number
  const ledgerYs: number[] = []

  if (clef === 'treble') {
    y = TREBLE_TOP_Y + (38 - step) * STEP_PX
    if (step <= 28) {
      for (let s = 28; s >= step; s -= 2) {
        ledgerYs.push(TREBLE_TOP_Y + (38 - s) * STEP_PX)
      }
    }
    if (step >= 40) {
      for (let s = 40; s <= step; s += 2) {
        ledgerYs.push(TREBLE_TOP_Y + (38 - s) * STEP_PX)
      }
    }
  } else {
    y = BASS_TOP_Y + (26 - step) * STEP_PX
    if (step >= 28) {
      for (let s = 28; s <= step; s += 2) {
        ledgerYs.push(BASS_TOP_Y + (26 - s) * STEP_PX)
      }
    }
    if (step <= 16) {
      for (let s = 16; s >= step; s -= 2) {
        ledgerYs.push(BASS_TOP_Y + (26 - s) * STEP_PX)
      }
    }
  }

  return { y, clef, ledgerYs, isMiddleC }
}

export function FlowingNotationStand({
  instrument,
  progression,
  currentBeat,
  tempoBpm,
  isPlaying,
  isCountingIn,
  countInBeat,
  activeHitResult,
  chordMetrics,
  beatsPerMeasure,
  timeSignature,
  onSeekBeat,
  pianoNotationMode = 'staff',
  onKeyClick,
  hideWatermark = false,
  className = '',
}: FlowingNotationStandProps): React.JSX.Element {
  const BEAT_WIDTH = 90
  const HIT_CALIPER_LEFT = 140

  const firstChordDur = progression[0]?.duration_beats
  const effectiveBeatsPerMeasure = beatsPerMeasure ?? firstChordDur ?? 4
  const displayMeter = timeSignature || `${effectiveBeatsPerMeasure}/4`

  const chordsWithOffsets = useMemo(() => {
    let currentOffset = 0
    const result: Array<FlowingChordItem & { duration_beats: number; startBeat: number; measureNumber: number }> = []
    for (let idx = 0; idx < progression.length; idx++) {
      const chord = progression[idx]
      const duration = chord.duration_beats ?? effectiveBeatsPerMeasure
      result.push({
        ...chord,
        duration_beats: duration,
        startBeat: currentOffset,
        measureNumber: idx + 1,
      })
      currentOffset += duration
    }
    return result
  }, [progression, effectiveBeatsPerMeasure])

  const totalBeats =
    chordsWithOffsets.length > 0
      ? chordsWithOffsets[chordsWithOffsets.length - 1].startBeat +
        chordsWithOffsets[chordsWithOffsets.length - 1].duration_beats
      : effectiveBeatsPerMeasure

  const playheadOffsetPx = currentBeat * BEAT_WIDTH

  if (instrument === 'piano' && pianoNotationMode === 'keys') {
    return (
      <div
        data-testid="flowing-notation-canvas"
        className={`relative w-full h-[280px] bg-[#F8F8F6] dark:bg-[#09090B] border-y border-zinc-200 dark:border-zinc-800 overflow-hidden select-none font-sans text-zinc-900 dark:text-zinc-100 transition-colors ${className}`}
      >
        <PianoWaterfallStand
          progression={progression}
          currentBeat={currentBeat}
          tempoBpm={tempoBpm}
          isPlaying={isPlaying}
          beatsPerMeasure={effectiveBeatsPerMeasure}
          onKeyClick={onKeyClick}
          onSeekBeat={onSeekBeat}
          className="w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      data-testid="flowing-notation-canvas"
      className={`relative w-full h-[280px] bg-[#F8F8F6] dark:bg-[#09090B] border-y border-zinc-200 dark:border-zinc-800 overflow-hidden select-none font-sans text-zinc-900 dark:text-zinc-100 transition-colors ${className}`}
    >
      {/* Top Ledger Strip */}
      {!hideWatermark && (
        <div className="absolute top-0 left-0 right-0 h-7 bg-white/95 dark:bg-[#111114]/95 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between text-[11px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 z-20">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {instrument === 'guitar' ? 'GUITAR TABLATURE & STRUMMING' : 'GRAND STAFF SHEET MUSIC'}
            </span>
            <span>•</span>
            <span>TEMPO: {tempoBpm} BPM</span>
            <span>•</span>
            <span>METER: {displayMeter}</span>
            <span>•</span>
            <span>{chordsWithOffsets.length} MEASURES</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px]">
              BEAT {Math.max(1, Math.floor(currentBeat) + 1)} / {totalBeats}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'
              }`}
            />
          </div>
        </div>
      )}

      {/* Main Staff Container */}
      <div className={`relative w-full h-full ${hideWatermark ? 'pt-0' : 'pt-7'} flex`}>
        {/* Fixed Left Header Column */}
        <div className="w-32 shrink-0 h-full bg-white dark:bg-[#111114] border-r border-zinc-200 dark:border-zinc-800 z-30 flex flex-col justify-center py-2 px-3">
          {instrument === 'guitar' ? (
            <div className="flex flex-col justify-between h-[170px] text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              {GUITAR_STRINGS.map((str) => (
                <div
                  key={str.num}
                  className="flex items-center justify-between px-1 border-b border-zinc-200/70 dark:border-zinc-800/70 pb-0.5"
                >
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {str.num} ({str.name}) {str.hz}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              data-testid="piano-grand-staff"
              className="flex flex-col justify-between h-[170px] text-[10px] font-mono text-zinc-500 dark:text-zinc-400 px-1"
            >
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">TREBLE</span>
                  <span className="text-[9px] text-zinc-500">Right Hand</span>
                </div>
                <svg width="22" height="42" viewBox="0 0 22 42" fill="none" className="text-zinc-700 dark:text-zinc-300">
                  <path
                    d="M12 3C11 1 8 1 7 4C6 7 8 11 10 14C12 17 14 20 14 25C14 29 11 32 7 31C4 30 3 26 4 23C5 20 8 20 9 22C10 24 9 26 7 26C8 28 11 28 12 26C13 23 11 20 9 17C7 14 4 10 5 6C6 2 10 0 13 2C15 4 15 7 13 12L11 38C11 40 9 41 8 40C7 39 7 38 8 37L10 28"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">BASS</span>
                  <span className="text-[9px] text-zinc-500">Left Hand</span>
                </div>
                <svg width="20" height="28" viewBox="0 0 20 28" fill="none" className="text-zinc-700 dark:text-zinc-300">
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
              </div>
            </div>
          )}
        </div>

        {/* Viewport Ribbon for Flowing Measures */}
        <div className="relative flex-1 h-full overflow-hidden">
          <div
            className="pointer-events-none absolute left-0 top-8 bottom-0 bg-gradient-to-r from-[#F8F8F6]/90 via-[#F8F8F6]/30 dark:from-[#09090B]/95 dark:via-[#09090B]/40 to-transparent z-35"
            style={{ width: `${HIT_CALIPER_LEFT}px` }}
          />

          {/* Left-Aligned Sight-Reading Playhead */}
          <div
            data-testid="center-playhead"
            className="absolute top-0 bottom-0 w-[2px] bg-amber-500 z-40 transform -translate-x-1/2 pointer-events-none flex flex-col items-center justify-between"
            style={{ left: `${HIT_CALIPER_LEFT}px` }}
          >
            <div
              className={`text-zinc-950 text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-b uppercase font-bold flex items-center gap-1 ${
                isCountingIn ? 'bg-amber-400 animate-pulse ring-2 ring-amber-500/40' : 'bg-amber-500'
              }`}
            >
              <span>{isCountingIn ? `COUNT-IN: ${countInBeat ?? 1}` : 'PLAY HERE'}</span>
              {!isCountingIn && activeHitResult?.isSoundDetected && activeHitResult.centsDeviation !== 0 && (
                <span className="text-[8px] opacity-90">
                  {activeHitResult.centsDeviation > 0 ? '+' : ''}
                  {Math.round(activeHitResult.centsDeviation)}¢
                </span>
              )}
            </div>

            <div className="bg-amber-500 text-zinc-950 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-t tracking-tighter">
              BEAT NOW
            </div>
          </div>

          {/* Sliding Track */}
          <div
            className={`absolute top-0 bottom-0 flex will-change-transform ${
              isPlaying ? 'transition-none' : 'transition-transform duration-100 ease-out'
            }`}
            style={{
              transform: `translateX(calc(${HIT_CALIPER_LEFT}px - ${playheadOffsetPx}px))`,
            }}
          >
            {chordsWithOffsets.map((chord, measureIdx) => {
              const startBeat = chord.startBeat
              const chordDuration = chord.duration_beats
              const measureWidth = chordDuration * BEAT_WIDTH
              const isCurrentMeasure =
                currentBeat >= startBeat && currentBeat < startBeat + chordDuration
              const metric = chordMetrics?.[measureIdx]

              const hasVoicingDrop = Boolean(metric && metric.missed_notes && metric.missed_notes.length > 0)
              const hasTransitionLag = Boolean(metric && metric.onset_error_ms >= 80)
              const hasTimingDrift = Boolean(metric && Math.abs(metric.onset_error_ms) >= 30)

              return (
                <div
                  key={`${chord.chordName}-${measureIdx}`}
                  onClick={() => onSeekBeat?.(startBeat)}
                  className={`relative shrink-0 h-full border-r border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors ${
                    isCurrentMeasure
                      ? 'bg-amber-500/[0.06] dark:bg-[#141418]'
                      : 'hover:bg-zinc-100/70 dark:hover:bg-[#111115]'
                  }`}
                  style={{ width: `${measureWidth}px` }}
                >
                  {/* Top Chord Badge & Feedback */}
                  <div className="h-8 border-b border-zinc-200 dark:border-zinc-800 px-3 pl-7 flex items-center justify-between bg-white dark:bg-[#111114]">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {chord.chordName}
                      </span>
                      {instrument === 'guitar' && chord.guitarTab?.barreFret && (
                        <span className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                          Barre {chord.guitarTab.barreFret}fr
                        </span>
                      )}
                      {metric && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            hasVoicingDrop || hasTransitionLag
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40'
                              : hasTimingDrift
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          {hasVoicingDrop
                            ? `Missed ${metric.missed_notes.join(',')}`
                            : hasTransitionLag
                            ? `Late +${Math.round(metric.onset_error_ms)}ms`
                            : metric.onset_error_ms <= -30
                            ? `Early ${Math.round(metric.onset_error_ms)}ms`
                            : metric.onset_error_ms >= 30
                            ? `Late +${Math.round(metric.onset_error_ms)}ms`
                            : `On Time (${metric.onset_error_ms >= 0 ? '+' : ''}${Math.round(metric.onset_error_ms)}ms)`}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Bar {chord.measureNumber}
                    </span>
                  </div>

                  {/* Staff Area */}
                  {instrument === 'guitar' ? (
                    <div className="relative h-[180px] pt-1">
                      <div className="h-7 border-b border-zinc-200/70 dark:border-zinc-800/70 flex items-center px-2 relative bg-zinc-50 dark:bg-[#0D0D10]">
                        {(() => {
                          const strumList: StrumEvent[] =
                            chord.strumEvents && chord.strumEvents.length > 0
                              ? chord.strumEvents
                              : [
                                  { beatOffset: 0, direction: 'down', accent: true, label: 'D' },
                                  { beatOffset: 1, direction: 'down', accent: false, label: 'D' },
                                  { beatOffset: 1.5, direction: 'up', accent: false, label: 'U' },
                                  { beatOffset: 2.5, direction: 'up', accent: false, label: 'U' },
                                  { beatOffset: 3, direction: 'down', accent: true, label: 'D' },
                                  { beatOffset: 3.5, direction: 'up', accent: false, label: 'U' },
                                ]

                          return strumList.map((strum, sIdx) => {
                            const strumX = strum.beatOffset * BEAT_WIDTH + 14
                            const isDown = strum.direction === 'down'

                            return (
                              <div
                                key={sIdx}
                                data-testid="strum-arrow-badge"
                                className="absolute top-0.5 flex flex-col items-center"
                                style={{ left: `${strumX}px` }}
                              >
                                <div
                                  className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                    isDown
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/35'
                                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/35'
                                  } ${strum.accent ? 'ring-1 ring-amber-500/50' : ''}`}
                                >
                                  <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                                    {isDown ? (
                                      <path
                                        d="M4 1V9M4 9L1 6M4 9L7 6"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    ) : (
                                      <path
                                        d="M4 9V1M4 1L1 4M4 1L7 4"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    )}
                                  </svg>
                                  <span>{strum.label || (isDown ? 'D' : 'U')}</span>
                                  {strum.accent && <span className="text-[8px] font-extrabold">&gt;</span>}
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>

                      <div className="relative h-[140px] flex flex-col justify-between py-2">
                        {GUITAR_STRINGS.map((str, sIdx) => {
                          const voicingIdx = 5 - sIdx
                          const fret = chord.guitarTab?.frets?.[voicingIdx]
                          const fretLabel = fret === null || fret === undefined ? '✕' : fret.toString()

                          return (
                            <div key={str.num} className="relative w-full h-[1px] bg-zinc-300 dark:bg-zinc-800">
                              <div className="absolute left-3.5 -top-2.5 z-10">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold leading-none ${
                                    fret === null || fret === undefined
                                      ? 'text-zinc-400 dark:text-zinc-600 bg-[#F8F8F6] dark:bg-[#09090B]'
                                      : 'text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#18181C] border border-zinc-300 dark:border-zinc-700'
                                  }`}
                                >
                                  {fretLabel}
                                </span>
                              </div>

                              {Array.from({ length: chordDuration - 1 }).map((_, beatIdx) => (
                                <div
                                  key={beatIdx}
                                  className="absolute -top-2.5 z-10"
                                  style={{ left: `${(beatIdx + 1) * BEAT_WIDTH + 14}px` }}
                                >
                                  <span className="inline-block px-1 py-0.5 rounded text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-white/90 dark:bg-[#111114]/90 border border-zinc-200 dark:border-zinc-800">
                                    {fretLabel}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-[180px] px-2 pt-1">
                      <svg width={measureWidth} height="165" className="overflow-visible">
                        {[0, 1, 2, 3, 4].map((i) => {
                          const y = 24 + i * 9
                          return (
                            <line
                              key={`treble-${i}`}
                              x1={0}
                              y1={y}
                              x2={measureWidth}
                              y2={y}
                              stroke="currentColor"
                              className="text-zinc-300 dark:text-zinc-800"
                              strokeWidth="1"
                            />
                          )
                        })}

                        {[0, 1, 2, 3, 4].map((i) => {
                          const y = 96 + i * 9
                          return (
                            <line
                              key={`bass-${i}`}
                              x1={0}
                              y1={y}
                              x2={measureWidth}
                              y2={y}
                              stroke="currentColor"
                              className="text-zinc-300 dark:text-zinc-800"
                              strokeWidth="1"
                            />
                          )
                        })}

                        <line
                          x1={measureWidth - 1}
                          y1={24}
                          x2={measureWidth - 1}
                          y2={132}
                          stroke="currentColor"
                          className="text-zinc-400 dark:text-zinc-700"
                          strokeWidth="1.5"
                        />

                        {(() => {
                          const noteItems: GrandStaffNote[] =
                            chord.melodyNotes && chord.melodyNotes.length > 0
                              ? chord.melodyNotes
                              : [
                                  ...(chord.pianoVoicing?.rhNotes || ['C4', 'E4', 'G4']).map((n) => ({
                                    pitch: n,
                                    beatOffset: 0,
                                    duration: chordDuration,
                                    clef: 'treble' as const,
                                  })),
                                  ...(chord.pianoVoicing?.lhNotes || ['C3']).map((n) => ({
                                    pitch: n,
                                    beatOffset: 0,
                                    duration: chordDuration,
                                    clef: 'bass' as const,
                                  })),
                                ]

                          return noteItems.map((note, nIdx) => {
                            const { y, ledgerYs } = calculateStaffPitchY(note.pitch, note.clef)
                            const x = note.beatOffset * BEAT_WIDTH + 24
                            const step = getDiatonicStep(note.pitch)
                            const isTreble = note.clef === 'treble' || step >= 28
                            const middleStep = isTreble ? 34 : 22
                            const stemUp = step < middleStep
                            const stemX = stemUp ? x + 4.2 : x - 4.2
                            const stemLength = 26
                            const stemY2 = stemUp ? y - stemLength : y + stemLength
                            const isMissedNote = metric?.missed_notes?.includes(note.pitch)

                            return (
                              <g key={nIdx} data-testid="grand-staff-notehead">
                                {ledgerYs.map((ly, lIdx) => (
                                  <line
                                    key={lIdx}
                                    x1={x - 8}
                                    y1={ly}
                                    x2={x + 8}
                                    y2={ly}
                                    stroke="currentColor"
                                    className="text-zinc-500 dark:text-zinc-600"
                                    strokeWidth="1.2"
                                  />
                                ))}

                                {note.pitch.includes('b') && (
                                  <text
                                    x={x - 9}
                                    y={y + 3.5}
                                    fontSize="12"
                                    fontFamily="serif"
                                    fontStyle="italic"
                                    fill="currentColor"
                                    className="select-none pointer-events-none text-zinc-700 dark:text-zinc-200"
                                  >
                                    ♭
                                  </text>
                                )}
                                {note.pitch.includes('#') && (
                                  <text
                                    x={x - 9}
                                    y={y + 3.5}
                                    fontSize="10"
                                    fontFamily="sans-serif"
                                    fill="currentColor"
                                    className="select-none pointer-events-none text-zinc-700 dark:text-zinc-200"
                                  >
                                    ♯
                                  </text>
                                )}

                                <ellipse
                                  cx={x}
                                  cy={y}
                                  rx={4.8}
                                  ry={3.6}
                                  transform={`rotate(-15 ${x} ${y})`}
                                  fill="currentColor"
                                  className={
                                    isMissedNote
                                      ? 'text-red-500'
                                      : isTreble
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-amber-600 dark:text-amber-400'
                                  }
                                />

                                {note.duration >= 2 && (
                                  <ellipse
                                    cx={x}
                                    cy={y}
                                    rx={2.6}
                                    ry={1.8}
                                    transform={`rotate(-15 ${x} ${y})`}
                                    fill="currentColor"
                                    className="text-[#F8F8F6] dark:text-[#09090B]"
                                  />
                                )}

                                {note.duration === 3 && (
                                  <circle
                                    cx={x + 8.5}
                                    cy={y}
                                    r={1.8}
                                    fill="currentColor"
                                    className="text-zinc-700 dark:text-zinc-200"
                                  />
                                )}

                                {note.duration < 4 && (
                                  <line
                                    x1={stemX}
                                    y1={y}
                                    x2={stemX}
                                    y2={stemY2}
                                    stroke="currentColor"
                                    className="text-zinc-600 dark:text-zinc-300"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                  />
                                )}

                                <text
                                  x={x}
                                  y={y - 7}
                                  textAnchor="middle"
                                  fontSize="8"
                                  fontFamily="monospace"
                                  fill="currentColor"
                                  className="pointer-events-none select-none text-zinc-500 dark:text-zinc-400 opacity-85"
                                >
                                  {note.pitch}
                                </text>
                              </g>
                            )
                          })
                        })()}
                      </svg>
                    </div>
                  )}

                  {/* Beat Subdivision Markers along bottom */}
                  <div className="absolute bottom-1.5 left-0 right-0 h-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center text-[9px] font-mono text-zinc-500">
                    {Array.from({ length: chordDuration }).map((_, b) => (
                      <div
                        key={b}
                        className="flex-1 text-center border-r border-zinc-200/70 dark:border-zinc-800/60 last:border-r-0"
                      >
                        Beat {b + 1}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
