import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PitchDetectionResult } from '@/lib/audio/realtime-pitch-tracker'
import type { ChordMetricDto } from '@/api/sessions'
import { PianoWaterfallStand } from './piano-waterfall-stand'
import {
  interpolateBeatToX,
  normalizeKeySignature,
  renderVexFlowScore,
  type EngravedScoreMetrics,
  type FlowingChordItem,
  type GrandStaffNote,
  type StrumEvent,
} from '@/lib/notation/vexflow-score-builder'

export type { GrandStaffNote, StrumEvent, FlowingChordItem }

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
  keySignature?: string
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

function detectDarkTheme(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

export const FlowingNotationStand = React.memo(function FlowingNotationStand({
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
  keySignature,
  onSeekBeat,
  pianoNotationMode = 'staff',
  onKeyClick,
  hideWatermark = false,
  className = '',
}: FlowingNotationStandProps): React.JSX.Element {
  const HIT_CALIPER_LEFT = 140

  const firstChordDur = progression[0]?.duration_beats
  const effectiveBeatsPerMeasure = beatsPerMeasure ?? firstChordDur ?? 4
  const displayMeter = timeSignature || `${effectiveBeatsPerMeasure}/4`
  const normalizedKey = useMemo(
    () => normalizeKeySignature(keySignature ?? progression[0]?.chordName),
    [keySignature, progression]
  )

  const [isDark, setIsDark] = useState<boolean>(detectDarkTheme)
  const vexContainerRef = useRef<HTMLDivElement | null>(null)
  const [scoreMetrics, setScoreMetrics] = useState<EngravedScoreMetrics | null>(null)

  // Observe <html> dark class mutations so VexFlow SVG re-engraves crisply on theme toggle
  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
    const syncTheme = () => setIsDark(detectDarkTheme())
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const totalBeatsFallback = useMemo(() => {
    if (progression.length === 0) return effectiveBeatsPerMeasure
    return progression.reduce((acc, c) => acc + (c.duration_beats ?? effectiveBeatsPerMeasure), 0)
  }, [progression, effectiveBeatsPerMeasure])

  // Engrave the authentic VexFlow v5 (Bravura SMuFL) horizontal score whenever musical content or theme changes
  useLayoutEffect(() => {
    if (instrument === 'piano' && pianoNotationMode === 'keys') return
    const container = vexContainerRef.current
    if (!container) return

    const metrics = renderVexFlowScore(container, {
      instrument,
      progression,
      beatsPerMeasure: effectiveBeatsPerMeasure,
      timeSignature: displayMeter,
      keySignature: keySignature ?? progression[0]?.chordName,
      isDark,
    })
    setScoreMetrics(metrics)
  }, [
    instrument,
    pianoNotationMode,
    progression,
    effectiveBeatsPerMeasure,
    displayMeter,
    keySignature,
    isDark,
  ])

  const totalBeats = scoreMetrics?.totalBeats ?? totalBeatsFallback

  // Exact engraved X coordinate for the current continuous audio playback beat
  const playheadScoreX = useMemo(() => {
    if (!scoreMetrics || scoreMetrics.anchors.length === 0) {
      return 140 + currentBeat * 72
    }
    return interpolateBeatToX(currentBeat, scoreMetrics.anchors)
  }, [currentBeat, scoreMetrics])

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

  const standHeightClass = instrument === 'piano' ? 'h-[312px]' : 'h-[264px]'
  const svgHeight = scoreMetrics?.totalHeight ?? (instrument === 'piano' ? 278 : 236)
  const firstLineY = scoreMetrics?.firstLineY ?? (instrument === 'piano' ? 88 : 90)
  const lineSpacing = scoreMetrics?.lineSpacing ?? (instrument === 'piano' ? 10 : 14)
  const bassFirstLineY = scoreMetrics?.bassFirstLineY ?? 192
  const strumRowTop = Math.max(46, firstLineY - 28)

  return (
    <div
      data-testid="flowing-notation-canvas"
      className={`relative w-full ${standHeightClass} bg-white dark:bg-[#121215] border-y border-zinc-200 dark:border-zinc-800 overflow-hidden select-none font-sans text-zinc-900 dark:text-zinc-100 transition-colors ${className}`}
    >
      {/* Top Ledger Strip (standalone / non-cockpit mode) */}
      {!hideWatermark && (
        <div className="absolute top-0 left-0 right-0 h-7 bg-[#F8F8F6]/95 dark:bg-[#0E0E11]/95 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between text-[11px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 z-30">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {instrument === 'guitar' ? 'GUITAR TABLATURE & STRUMMING' : 'GRAND STAFF SHEET MUSIC'}
            </span>
            <span>•</span>
            <span>TEMPO: {tempoBpm} BPM</span>
            <span>•</span>
            <span>METER: {displayMeter}</span>
            <span>•</span>
            <span>KEY: {normalizedKey}</span>
            <span>•</span>
            <span>{progression.length} MEASURES</span>
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
        {/* Fixed Left Reference Gutter (pixel-aligned to VexFlow stave coordinates) */}
        <div className="w-28 sm:w-32 shrink-0 h-full bg-[#F8F8F6] dark:bg-[#0E0E11] border-r border-zinc-200 dark:border-zinc-800 z-30 relative">
          {instrument === 'guitar' ? (
            <div
              className="absolute inset-x-2 flex flex-col text-[10px] font-mono text-zinc-600 dark:text-zinc-400"
              style={{ top: `${Math.round(firstLineY - lineSpacing / 2)}px` }}
            >
              {GUITAR_STRINGS.map((str) => (
                <div
                  key={str.num}
                  className="flex items-center justify-between leading-none"
                  style={{ height: `${lineSpacing}px` }}
                >
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                    {str.num} ({str.name}) {str.hz}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div data-testid="piano-grand-staff" className="relative w-full h-full font-mono px-3">
              {/* Aligned to VexFlow Treble Staff */}
              <div
                className="absolute inset-x-3 flex flex-col"
                style={{ top: `${Math.round(firstLineY + 6)}px` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] tracking-wide">
                    TREBLE
                  </span>
                </div>
                <span className="text-[9px] text-zinc-500 pl-3.5">Right Hand</span>
              </div>

              {/* Subtle divider centered between Treble & Bass staves */}
              <div
                className="absolute inset-x-3 h-px bg-zinc-200 dark:bg-zinc-800"
                style={{ top: `${Math.round((firstLineY + 40 + bassFirstLineY) / 2)}px` }}
              />

              {/* Aligned to VexFlow Bass Staff */}
              <div
                className="absolute inset-x-3 flex flex-col"
                style={{ top: `${Math.round(bassFirstLineY + 6)}px` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] tracking-wide">
                    BASS
                  </span>
                </div>
                <span className="text-[9px] text-zinc-500 pl-3.5">Left Hand</span>
              </div>

              {/* Key & Meter Reference Badge at bottom of gutter */}
              <div className="absolute inset-x-3 bottom-3 text-[9px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-1.5 flex items-center justify-between">
                <span>Key: {normalizedKey}</span>
                <span>{displayMeter}</span>
              </div>
            </div>
          )}
        </div>

        {/* Viewport Ribbon for Flowing VexFlow Engraved Score */}
        <div className="relative flex-1 h-full overflow-hidden bg-white dark:bg-[#121215]">
          {/* Subtle edge fade on far-left only (keeps Beat 1 clef/key/time signature crisp) */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/75 dark:from-[#121215]/80 to-transparent z-25"
            aria-hidden="true"
          />

          {/* Left-Aligned Sight-Reading Caliper Playhead */}
          <div
            data-testid="center-playhead"
            className="absolute top-0 bottom-0 w-[2px] bg-amber-500/90 z-30 transform -translate-x-1/2 pointer-events-none flex flex-col items-center justify-between"
            style={{ left: `${HIT_CALIPER_LEFT}px` }}
          >
            <div
              className={`text-zinc-950 text-[8px] font-mono tracking-wider px-2 py-0.5 rounded-b uppercase font-bold whitespace-nowrap flex items-center gap-1 shadow-xs ${
                isCountingIn ? 'bg-amber-400 animate-pulse ring-2 ring-amber-500/40' : 'bg-amber-500'
              }`}
            >
              <span>{isCountingIn ? `COUNT-IN: ${countInBeat ?? 1}` : 'PLAY HERE'}</span>
              {!isCountingIn &&
                activeHitResult?.isSoundDetected &&
                activeHitResult.centsDeviation !== 0 && (
                  <span className="text-[8px] opacity-90">
                    {activeHitResult.centsDeviation > 0 ? '+' : ''}
                    {Math.round(activeHitResult.centsDeviation)}¢
                  </span>
                )}
            </div>

            <div className="bg-amber-500 text-zinc-950 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-t tracking-tighter whitespace-nowrap shadow-xs">
              BEAT NOW
            </div>
          </div>

          {/* Sliding VexFlow Engraved Track */}
          <div
            className={`absolute top-0 bottom-0 left-0 will-change-transform ${
              isPlaying ? 'transition-none' : 'transition-transform duration-150 ease-out'
            }`}
            style={{
              width: `${scoreMetrics?.totalWidth ?? 900}px`,
              transform: `translate3d(${HIT_CALIPER_LEFT - playheadScoreX}px, 0, 0)`,
            }}
          >
            {/* Layer 0: Measure Backdrop Highlights, Editorial Measure Numbers, Chord Symbols & Click-to-Seek */}
            <div className="absolute inset-0 z-10">
              {scoreMetrics?.measures.map((m) => {
                const isCurrentMeasure = currentBeat >= m.startBeat && currentBeat < m.endBeat
                const metric = chordMetrics?.[m.measureIndex]
                const hasVoicingDrop = Boolean(
                  metric && metric.missed_notes && metric.missed_notes.length > 0
                )
                const hasTransitionLag = Boolean(metric && metric.onset_error_ms >= 80)
                const hasTimingDrift = Boolean(metric && Math.abs(metric.onset_error_ms) >= 30)

                return (
                  <div
                    key={`measure-overlay-${m.measureIndex}`}
                    data-testid="score-measure-overlay"
                    role="button"
                    tabIndex={0}
                    aria-label={`Jump to Bar ${m.measureIndex + 1} (${m.chordName})`}
                    onClick={() => onSeekBeat?.(m.startBeat)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSeekBeat?.(m.startBeat)
                      }
                    }}
                    className={`absolute top-0 bottom-0 cursor-pointer transition-colors ${
                      isCurrentMeasure
                        ? 'bg-amber-500/[0.05] dark:bg-amber-500/[0.045]'
                        : 'hover:bg-zinc-900/[0.025] dark:hover:bg-white/[0.02]'
                    }`}
                    style={{ left: `${m.x}px`, width: `${m.width}px` }}
                  >
                    {/* Editorial Measure Number at top-left (authentic sheet music convention) */}
                    <span className="absolute top-1.5 left-2 text-[10px] font-mono italic text-zinc-400 dark:text-zinc-500 pointer-events-none">
                      {m.measureIndex + 1}
                    </span>

                    {/* Chord Symbol & Diagnostic Badges positioned cleanly below the top caliper tab */}
                    <div className="absolute top-[20px] inset-x-0 flex items-center justify-between pr-2.5 pointer-events-none">
                      <div
                        className="flex items-center gap-1.5"
                        style={{
                          paddingLeft: `${Math.max(12, m.noteStartX - m.x - 4)}px`,
                        }}
                      >
                        <span
                          className={
                            instrument === 'piano'
                              ? `text-[11px] font-sans font-medium tracking-wider uppercase ${
                                  isCurrentMeasure
                                    ? 'text-zinc-600 dark:text-zinc-300'
                                    : 'text-zinc-400 dark:text-zinc-600'
                                }`
                              : `font-brand font-bold text-sm leading-none tracking-tight ${
                                  isCurrentMeasure
                                    ? 'text-zinc-950 dark:text-white'
                                    : 'text-zinc-800 dark:text-zinc-200'
                                }`
                          }
                          data-testid="measure-harmonic-label"
                        >
                          {m.chordName}
                        </span>
                        {instrument === 'guitar' && m.barreFret && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 leading-none">
                            Barre {m.barreFret}fr
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasVoicingDrop && metric && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/40 text-red-700 dark:text-red-400 text-[9px] font-mono font-bold">
                            Missed {metric.missed_notes[0]}
                          </span>
                        )}
                        {hasTransitionLag && metric && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[9px] font-mono font-bold">
                            +{Math.round(metric.onset_error_ms)}ms
                          </span>
                        )}
                        {!hasTransitionLag && hasTimingDrift && metric && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9px] font-mono">
                            {metric.onset_error_ms > 0 ? '+' : ''}
                            {Math.round(metric.onset_error_ms)}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Layer 1: Authentic VexFlow v5 (Bravura SMuFL) Engraved SVG */}
            <div
              ref={vexContainerRef}
              className="relative z-20 pointer-events-none"
              style={{
                width: `${scoreMetrics?.totalWidth ?? 900}px`,
                height: `${svgHeight}px`,
              }}
            />

            {/* Layer 2: Crisp Guitar Directional Strum Markings aligned directly above TabNotes */}
            {instrument === 'guitar' && scoreMetrics && scoreMetrics.strumMarkers.length > 0 && (
              <div
                className="absolute left-0 right-0 h-5 z-25 pointer-events-none"
                style={{ top: `${strumRowTop}px` }}
              >
                {scoreMetrics.strumMarkers.map((marker, idx) => (
                  <div
                    key={`strum-${marker.measureIndex}-${idx}`}
                    data-testid="strum-arrow-badge"
                    className={`absolute -translate-x-1/2 flex items-center gap-0.5 font-mono text-[10px] leading-none px-1 py-0.5 rounded ${
                      marker.accent
                        ? 'text-amber-700 dark:text-amber-400 font-bold'
                        : marker.direction === 'up'
                        ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 font-medium'
                    }`}
                    style={{ left: `${marker.x}px` }}
                    title={`${marker.direction === 'up' ? 'Upstrum' : 'Downstrum'}${
                      marker.accent ? ' (Accented)' : ''
                    }`}
                  >
                    <span>{marker.direction === 'up' ? '↑' : '↓'}</span>
                    <span>{marker.label}</span>
                    {marker.accent && <span className="text-[9px]">&gt;</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
