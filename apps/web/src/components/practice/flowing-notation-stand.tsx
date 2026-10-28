import React, { useMemo } from 'react'
import type { VoicingDefinition } from '@/lib/music/chord-voicings'
import type { PitchDetectionResult } from '@/lib/audio/realtime-pitch-tracker'

export type GrandStaffNote = {
  pitch: string // e.g. "C4", "E4", "G4", "C3", "G2"
  beatOffset: number // 0, 1, 2, 3 within measure
  duration: number // 1 (quarter), 2 (half), 4 (whole), 0.5 (eighth)
  clef?: 'treble' | 'bass'
}

export type StrumEvent = {
  beatOffset: number // 0, 1, 1.5, 2, 2.5, 3, 3.5
  direction: 'down' | 'up' | 'rest' | 'mute'
  accent?: boolean
  label?: string // "D", "U"
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
  beatsPerMeasure?: number
  timeSignature?: string
  onSeekBeat?: (beat: number) => void
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

/**
 * Calculates absolute diatonic step scalar for pitch string (e.g. "C4" -> 28, "G4" -> 32, "C3" -> 21)
 */
export function getDiatonicStep(pitchStr: string): number {
  const match = pitchStr.match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
  if (!match) return 32 // fallback G4
  const letter = match[1].toUpperCase()
  const octave = parseInt(match[3], 10)
  return octave * 7 + (DIATONIC_INDEX[letter] ?? 0)
}

/**
 * Calculates Y coordinate and required ledger lines for a pitch on Treble or Bass staff.
 * Uses S = 9px line spacing (step = 4.5px).
 */
export function calculateStaffPitchY(
  pitchStr: string,
  preferredClef?: 'treble' | 'bass'
): { y: number; clef: 'treble' | 'bass'; ledgerYs: number[]; isMiddleC: boolean } {
  const step = getDiatonicStep(pitchStr)
  // Treble Line 5 (F5) is step 38, placed at Y = 24
  const TREBLE_TOP_Y = 24
  // Bass Line 5 (A3) is step 26, placed at Y = 96
  const BASS_TOP_Y = 96
  const STEP_PX = 4.5

  const clef: 'treble' | 'bass' = preferredClef ?? (step >= 28 ? 'treble' : 'bass')
  const isMiddleC = step === 28

  let y: number
  const ledgerYs: number[] = []

  if (clef === 'treble') {
    y = TREBLE_TOP_Y + (38 - step) * STEP_PX
    // Treble lines are at steps 38, 36, 34, 32, 30.
    // Below line 1 (step <= 28): ledger lines at 28 (C4), 26 (A3), 24 (F3)...
    if (step <= 28) {
      for (let s = 28; s >= step; s -= 2) {
        ledgerYs.push(TREBLE_TOP_Y + (38 - s) * STEP_PX)
      }
    }
    // Above line 5 (step >= 40): ledger lines at 40 (A5), 42 (C6)...
    if (step >= 40) {
      for (let s = 40; s <= step; s += 2) {
        ledgerYs.push(TREBLE_TOP_Y + (38 - s) * STEP_PX)
      }
    }
  } else {
    y = BASS_TOP_Y + (26 - step) * STEP_PX
    // Bass lines are at steps 26, 24, 22, 20, 18.
    // Above line 5 (step >= 28): ledger lines at 28 (C4), 30 (E4)...
    if (step >= 28) {
      for (let s = 28; s <= step; s += 2) {
        ledgerYs.push(BASS_TOP_Y + (26 - s) * STEP_PX)
      }
    }
    // Below line 1 (step <= 16): ledger lines at 16 (E2), 14 (C2)...
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
  beatsPerMeasure,
  timeSignature,
  onSeekBeat,
  className = '',
}: FlowingNotationStandProps): React.JSX.Element {
  // Pixels per beat on the notation timeline
  const BEAT_WIDTH = 90
  // Left offset for the hit caliper inside the scroll viewport (140px gives 80%+ forward sight reading horizon)
  const HIT_CALIPER_LEFT = 140

  const firstChordDur = progression[0]?.duration_beats
  const effectiveBeatsPerMeasure = beatsPerMeasure ?? firstChordDur ?? 4
  const displayMeter = timeSignature || `${effectiveBeatsPerMeasure}/4`

  // Calculate cumulative offsets and durations for each chord/measure
  const chordsWithOffsets = useMemo(() => {
    let currentOffset = 0
    return progression.map((chord, idx) => {
      const duration = chord.duration_beats ?? effectiveBeatsPerMeasure
      const item = {
        ...chord,
        duration_beats: duration,
        startBeat: currentOffset,
        measureNumber: idx + 1,
      }
      currentOffset += duration
      return item
    })
  }, [progression, effectiveBeatsPerMeasure])

  const totalBeats =
    chordsWithOffsets.length > 0
      ? chordsWithOffsets[chordsWithOffsets.length - 1].startBeat +
        chordsWithOffsets[chordsWithOffsets.length - 1].duration_beats
      : effectiveBeatsPerMeasure

  // Continuous playhead horizontal offset
  const playheadOffsetPx = currentBeat * BEAT_WIDTH

  return (
    <div
      data-testid="flowing-notation-canvas"
      className={`relative w-full h-[330px] bg-[#FAF8F3] dark:bg-[#141312] border-y border-[#E2DDD3] dark:border-[#38342E] overflow-hidden select-none font-serif text-[#242321] dark:text-[#EDE8DF] ${className}`}
    >
      {/* Top Archival Ledger Strip */}
      <div className="absolute top-0 left-0 right-0 h-7 bg-[#EFECE6]/90 dark:bg-[#1A1816]/95 border-b border-[#E2DDD3] dark:border-[#38342E] px-6 flex items-center justify-between text-[11px] font-mono tracking-widest text-[#736E65] dark:text-[#A39C8F] z-20">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#242321] dark:text-[#EDE8DF]">
            {instrument === 'guitar' ? 'STANDARD TABLATURE (6-STR & STRUM PATTERN)' : 'GRAND STAFF NOTATION'}
          </span>
          <span>•</span>
          <span>TEMPO: {tempoBpm} BPM</span>
          <span>•</span>
          <span>METER: {displayMeter}</span>
          <span>•</span>
          <span>LENGTH: {totalBeats} BEATS ({chordsWithOffsets.length} MEASURES)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px]">
            BEAT {Math.max(1, Math.floor(currentBeat) + 1)} / {totalBeats}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-[#4A6B5B] dark:bg-[#689F84] animate-pulse' : 'bg-[#A39E93] dark:bg-[#5C564C]'
            }`}
          />
        </div>
      </div>

      {/* Main Staff Container with fixed left column and sliding notation track */}
      <div className="relative w-full h-full pt-7 flex">
        {/* Fixed Left Header Column */}
        <div className="w-32 shrink-0 h-full bg-[#EFECE6] dark:bg-[#1E1C1A] border-r border-[#D9D3C7] dark:border-[#38342E] z-30 flex flex-col justify-center py-2 px-3 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
          {instrument === 'guitar' ? (
            <div className="flex flex-col justify-between h-[180px] text-[10px] font-mono text-[#524D44] dark:text-[#A39C8F]">
              {GUITAR_STRINGS.map((str) => (
                <div
                  key={str.num}
                  className="flex items-center justify-between px-1 border-b border-[#E2DDD3]/60 dark:border-[#38342E]/60 pb-0.5"
                >
                  <span className="font-bold text-[#242321] dark:text-[#EDE8DF]">
                    {str.num} ({str.name}) {str.hz}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              data-testid="piano-grand-staff"
              className="flex flex-col justify-between h-[180px] text-[10px] font-mono text-[#524D44] dark:text-[#A39C8F] px-1"
            >
              <div className="border-b border-[#D9D3C7] dark:border-[#38342E] pb-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#242321] dark:text-[#EDE8DF] block text-xs">TREBLE</span>
                  <span className="text-[9px] text-[#736E65] dark:text-[#A39C8F]">G Clef (RH)</span>
                </div>
                {/* SVG Treble Clef Glyph */}
                <svg width="22" height="42" viewBox="0 0 22 42" fill="none" className="text-[#242321] dark:text-[#EDE8DF]">
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
                  <span className="font-bold text-[#242321] dark:text-[#EDE8DF] block text-xs">BASS</span>
                  <span className="text-[9px] text-[#736E65] dark:text-[#A39C8F]">F Clef (LH)</span>
                </div>
                {/* SVG Bass Clef Glyph */}
                <svg width="20" height="28" viewBox="0 0 20 28" fill="none" className="text-[#242321] dark:text-[#EDE8DF]">
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
          {/* Subtle History Fade Gradient on the left (0 to HIT_CALIPER_LEFT) */}
          <div
            className="pointer-events-none absolute left-0 top-8 bottom-0 bg-gradient-to-r from-[#FAF8F3]/80 via-[#FAF8F3]/30 to-transparent dark:from-[#141312]/90 dark:via-[#141312]/40 dark:to-transparent z-35"
            style={{ width: `${HIT_CALIPER_LEFT}px` }}
          />

          {/* Left-Aligned Sight-Reading Caliper Playhead */}
          <div
            data-testid="center-playhead"
            className="absolute top-0 bottom-0 w-[2px] bg-[#9A2A2A] dark:bg-[#B83232] z-40 transform -translate-x-1/2 pointer-events-none flex flex-col items-center justify-between shadow-xs"
            style={{ left: `${HIT_CALIPER_LEFT}px` }}
          >
            {/* Top Playhead Caliper Badge */}
            <div
              className={`text-[#FCFBF8] text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-b shadow-sm uppercase font-semibold flex items-center gap-1 ${
                isCountingIn ? 'bg-[#9A2A2A] dark:bg-[#B83232] animate-pulse ring-2 ring-[#9A2A2A]/40' : 'bg-[#9A2A2A] dark:bg-[#B83232]'
              }`}
            >
              <span>{isCountingIn ? `COUNT-IN: ${countInBeat ?? 1}` : 'HIT POINT'}</span>
              {!isCountingIn && activeHitResult?.isSoundDetected && activeHitResult.centsDeviation !== 0 && (
                <span className="text-[8px] opacity-90">
                  {activeHitResult.centsDeviation > 0 ? '+' : ''}
                  {Math.round(activeHitResult.centsDeviation)}¢
                </span>
              )}
            </div>

            {/* Bottom Caliper Tag */}
            <div className="bg-[#9A2A2A] dark:bg-[#B83232] text-[#FCFBF8] text-[8px] font-mono px-1.5 py-0.5 rounded-t tracking-tighter">
              NOW ±0ms
            </div>
          </div>

          {/* Sliding Track: scrolls right-to-left from HIT_CALIPER_LEFT */}
          <div
            className="absolute top-0 bottom-0 flex transition-transform duration-75 ease-linear"
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

              return (
                <div
                  key={`${chord.chordName}-${measureIdx}`}
                  onClick={() => onSeekBeat?.(startBeat)}
                  className={`relative shrink-0 h-full border-r-2 border-[#C9C3B5] dark:border-[#3E3A32] cursor-pointer transition-colors ${
                    isCurrentMeasure ? 'bg-[#FCFBF8] dark:bg-[#1C1A18]' : 'hover:bg-[#F5F2EB] dark:hover:bg-[#201E1B]'
                  }`}
                  style={{ width: `${measureWidth}px` }}
                >
                  {/* Top Chord Badge & Measure Index */}
                  <div className="h-8 border-b border-[#E2DDD3] dark:border-[#38342E] px-3 pl-7 flex items-center justify-between bg-[#FAF8F3] dark:bg-[#181614]">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-serif font-bold text-[#242321] dark:text-[#EDE8DF]">
                        {chord.chordName}
                      </span>
                      {instrument === 'guitar' && chord.guitarTab?.barreFret && (
                        <span className="text-[9px] font-mono bg-[#E2DDD3] text-[#524D44] dark:bg-[#2A2723] dark:text-[#A39C8F] px-1 py-0.2 rounded">
                          Barre {chord.guitarTab.barreFret}fr
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                      M{chord.measureNumber} ({chordDuration}B)
                    </span>
                  </div>

                  {/* Staff Area: Guitar Tablature OR Piano Grand Staff */}
                  {instrument === 'guitar' ? (
                    <div className="relative h-[190px] pt-1">
                      {/* Top Strumming Direction Strip with Directional Arrows */}
                      <div className="h-7 border-b border-[#E2DDD3]/70 dark:border-[#38342E]/70 flex items-center px-2 relative bg-[#F7F5F0]/70 dark:bg-[#1A1816]/70">
                        {/* Strumming Events across the measure */}
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
                                  className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-bold shadow-2xs border ${
                                    isDown
                                      ? 'bg-[#9A2A2A]/10 text-[#9A2A2A] border-[#9A2A2A]/30 dark:bg-[#B83232]/20 dark:text-[#E57373] dark:border-[#B83232]/40'
                                      : 'bg-[#4A6B5B]/10 text-[#4A6B5B] border-[#4A6B5B]/30 dark:bg-[#689F84]/20 dark:text-[#689F84] dark:border-[#689F84]/40'
                                  } ${strum.accent ? 'ring-1 ring-[#9A2A2A]/50 dark:ring-[#B83232]/50' : ''}`}
                                >
                                  {/* Arrow Icon */}
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

                      {/* 6 String Lines with Fret Pills */}
                      <div className="relative h-[150px] flex flex-col justify-between py-2">
                        {GUITAR_STRINGS.map((str, sIdx) => {
                          const voicingIdx = 5 - sIdx
                          const fret = chord.guitarTab?.frets?.[voicingIdx]
                          const fretLabel = fret === null || fret === undefined ? '✕' : fret.toString()

                          return (
                            <div key={str.num} className="relative w-full h-[1px] bg-[#C9C3B5] dark:bg-[#3E3A32]">
                              {/* Beat 1 Primary Fret Number Pill */}
                              <div className="absolute left-3.5 -top-2.5 z-10">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold leading-none shadow-2xs ${
                                    fret === null || fret === undefined
                                      ? 'text-[#A39E93] dark:text-[#5C564C] bg-[#FAF8F3] dark:bg-[#181614]'
                                      : 'text-[#242321] dark:text-[#EDE8DF] bg-[#FAF8F3] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E]'
                                  }`}
                                >
                                  {fretLabel}
                                </span>
                              </div>

                              {/* Secondary rhythmic strum markers on subsequent beats */}
                              {Array.from({ length: chordDuration - 1 }).map((_, beatIdx) => (
                                <div
                                  key={beatIdx}
                                  className="absolute -top-2.5 z-10"
                                  style={{ left: `${(beatIdx + 1) * BEAT_WIDTH + 14}px` }}
                                >
                                  <span className="inline-block px-1 py-0.5 rounded text-[10px] font-mono font-semibold text-[#736E65] dark:text-[#A39C8F] bg-[#FAF8F3]/90 dark:bg-[#24221F]/90 border border-[#E2DDD3]/60 dark:border-[#38342E]/60">
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
                    /* Piano Grand Staff with authentic SVG noteheads, stems, and ledger lines */
                    <div className="relative h-[190px] px-2 pt-1">
                      <svg width={measureWidth} height="175" className="overflow-visible">
                        {/* Treble Staff: 5 Lines (Y = 24, 33, 42, 51, 60) */}
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
                              className="text-[#C9C3B5] dark:text-[#3E3A32]"
                              strokeWidth="1"
                            />
                          )
                        })}

                        {/* Bass Staff: 5 Lines (Y = 96, 105, 114, 123, 132) */}
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
                              className="text-[#C9C3B5] dark:text-[#3E3A32]"
                              strokeWidth="1"
                            />
                          )
                        })}

                        {/* Measure End Barline */}
                        <line
                          x1={measureWidth - 1}
                          y1={24}
                          x2={measureWidth - 1}
                          y2={132}
                          stroke="currentColor"
                          className="text-[#C9C3B5] dark:text-[#3E3A32]"
                          strokeWidth="1.5"
                        />

                        {/* SVG Noteheads for Piano */}
                        {(() => {
                          // Gather melody & bass notes for this measure
                          const noteItems: GrandStaffNote[] =
                            chord.melodyNotes && chord.melodyNotes.length > 0
                              ? chord.melodyNotes
                              : [
                                  // Right-Hand Triad Notes
                                  ...(chord.pianoVoicing?.rhNotes || ['C4', 'E4', 'G4']).map((n) => ({
                                    pitch: n,
                                    beatOffset: 0,
                                    duration: chordDuration,
                                    clef: 'treble' as const,
                                  })),
                                  // Left-Hand Bass Note
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
                            // Stem points up if below middle line (B4=34 in treble, D3=22 in bass)
                            const isTreble = note.clef === 'treble' || step >= 28
                            const middleStep = isTreble ? 34 : 22
                            const stemUp = step < middleStep
                            const stemX = stemUp ? x + 4.2 : x - 4.2
                            const stemLength = 26
                            const stemY2 = stemUp ? y - stemLength : y + stemLength

                            return (
                              <g key={nIdx} data-testid="grand-staff-notehead">
                                {/* Ledger Lines */}
                                {ledgerYs.map((ly, lIdx) => (
                                  <line
                                    key={lIdx}
                                    x1={x - 8}
                                    y1={ly}
                                    x2={x + 8}
                                    y2={ly}
                                    stroke="currentColor"
                                    className="text-[#524D44] dark:text-[#6E675C]"
                                    strokeWidth="1.2"
                                  />
                                ))}

                                {/* Accidental Glyph (♭ or ♯) */}
                                {note.pitch.includes('b') && (
                                  <text
                                    x={x - 9}
                                    y={y + 3.5}
                                    fontSize="12"
                                    fontFamily="serif"
                                    fontStyle="italic"
                                    fill="currentColor"
                                    className="select-none pointer-events-none text-[#242321] dark:text-[#EDE8DF]"
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
                                    className="select-none pointer-events-none text-[#242321] dark:text-[#EDE8DF]"
                                  >
                                    ♯
                                  </text>
                                )}

                                {/* Oval Notehead (Tilted at -15 degrees per SMuFL standard) */}
                                <ellipse
                                  cx={x}
                                  cy={y}
                                  rx={4.8}
                                  ry={3.6}
                                  transform={`rotate(-15 ${x} ${y})`}
                                  fill="currentColor"
                                  className="text-[#242321] dark:text-[#EDE8DF]"
                                />

                                {/* Notehead Center Cutout for Half/Whole Notes */}
                                {note.duration >= 2 && (
                                  <ellipse
                                    cx={x}
                                    cy={y}
                                    rx={2.6}
                                    ry={1.8}
                                    transform={`rotate(-15 ${x} ${y})`}
                                    fill="currentColor"
                                    className="text-[#FCFBF8] dark:text-[#181614]"
                                  />
                                )}

                                {/* Dotted Note Dot for 3-Beat Dotted Half Notes */}
                                {note.duration === 3 && (
                                  <circle
                                    cx={x + 8.5}
                                    cy={y}
                                    r={1.8}
                                    fill="currentColor"
                                    className="text-[#242321] dark:text-[#EDE8DF]"
                                  />
                                )}

                                {/* Vertical Stem (unless Whole Note duration 4) */}
                                {note.duration < 4 && (
                                  <line
                                    x1={stemX}
                                    y1={y}
                                    x2={stemX}
                                    y2={stemY2}
                                    stroke="currentColor"
                                    className="text-[#242321] dark:text-[#EDE8DF]"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                  />
                                )}

                                {/* Pitch Label Tooltip / Subtext */}
                                <text
                                  x={x}
                                  y={y - 7}
                                  textAnchor="middle"
                                  fontSize="8"
                                  fontFamily="monospace"
                                  fill="currentColor"
                                  className="pointer-events-none select-none text-[#736E65] dark:text-[#A39C8F] opacity-60"
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
                  <div className="absolute bottom-2 left-0 right-0 h-4 border-t border-[#E2DDD3] dark:border-[#38342E] flex items-center text-[9px] font-mono text-[#8A857A] dark:text-[#6E675C]">
                    {Array.from({ length: chordDuration }).map((_, b) => (
                      <div
                        key={b}
                        className="flex-1 text-center border-r border-[#E2DDD3]/40 dark:border-[#38342E]/40 last:border-r-0"
                      >
                        {b + 1}
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
