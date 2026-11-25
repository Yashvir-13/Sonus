import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'
import { RealtimePitchTracker } from '@/lib/audio/realtime-pitch-tracker'
import { Mic, MicOff, Volume2, CheckCircle2, Disc, HelpCircle } from 'lucide-react'

export interface GuitarStringDef {
  stringNum: number // 6 to 1
  midi: number
  name: string
  note: string
  octave: number
  targetHz: number
  gaugeLabel: string
}

const GUITAR_STRING_BASE: Array<Omit<GuitarStringDef, 'targetHz'>> = [
  { stringNum: 6, midi: 40, name: 'E2', note: 'E', octave: 2, gaugeLabel: '6th • Low E' },
  { stringNum: 5, midi: 45, name: 'A2', note: 'A', octave: 2, gaugeLabel: '5th • A' },
  { stringNum: 4, midi: 50, name: 'D3', note: 'D', octave: 3, gaugeLabel: '4th • D' },
  { stringNum: 3, midi: 55, name: 'G3', note: 'G', octave: 3, gaugeLabel: '3rd • G' },
  { stringNum: 2, midi: 59, name: 'B3', note: 'B', octave: 3, gaugeLabel: '2nd • B' },
  { stringNum: 1, midi: 64, name: 'E4', note: 'E', octave: 4, gaugeLabel: '1st • High E' },
]

export function buildGuitarStrings(concertPitchHz = 440): GuitarStringDef[] {
  const safePitch = Number.isFinite(concertPitchHz) && concertPitchHz >= 380 && concertPitchHz <= 480
    ? concertPitchHz
    : 440
  return GUITAR_STRING_BASE.map((base) => ({
    ...base,
    targetHz: Number((safePitch * Math.pow(2, (base.midi - 69) / 12)).toFixed(2)),
  }))
}

export const GUITAR_STANDARD_STRINGS: GuitarStringDef[] = buildGuitarStrings(440)

export interface GuitarTunerPageProps {
  onBackToLanding?: () => void
  onOpenStudio?: () => void
  concertPitchHz?: number
  className?: string
}

export function GuitarTunerPage({
  onBackToLanding,
  onOpenStudio,
  concertPitchHz = 440,
  className = '',
}: GuitarTunerPageProps): React.JSX.Element {
  const strings = useMemo(() => buildGuitarStrings(concertPitchHz), [concertPitchHz])
  const [selectedStringNum, setSelectedStringNum] = useState<number>(6)
  const selectedString = useMemo(
    () => strings.find((s) => s.stringNum === selectedStringNum) ?? strings[0]!,
    [strings, selectedStringNum]
  )
  const [isAutoDetect, setIsAutoDetect] = useState(true)
  const [isMicListening, setIsMicListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)

  // Mutable refs to prevent stale closure capture in continuous audio processing callbacks
  const stringsRef = useRef(strings)
  const selectedStringRef = useRef(selectedString)
  const isAutoDetectRef = useRef(isAutoDetect)
  const concertPitchHzRef = useRef(concertPitchHz)

  useEffect(() => {
    stringsRef.current = strings
    selectedStringRef.current = selectedString
  }, [strings, selectedString])

  useEffect(() => {
    isAutoDetectRef.current = isAutoDetect
  }, [isAutoDetect])

  // Live pitch state
  const [detectedHz, setDetectedHz] = useState<number | null>(null)
  const [centsDeviation, setCentsDeviation] = useState<number>(0)
  const [detectedNote, setDetectedNote] = useState<string | null>(null)
  const [hasSound, setHasSound] = useState(false)

  const audioEngineRef = useRef<PracticeAudioEngine | null>(null)
  const pitchTrackerRef = useRef<RealtimePitchTracker | null>(null)

  useEffect(() => {
    audioEngineRef.current = new PracticeAudioEngine()
    audioEngineRef.current.setConcertPitchHz(concertPitchHz)
    pitchTrackerRef.current = new RealtimePitchTracker(44100, 65, 450, -42, 0.35, concertPitchHz)

    return () => {
      audioEngineRef.current?.dispose()
      audioEngineRef.current = null
      pitchTrackerRef.current?.stop()
      pitchTrackerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    concertPitchHzRef.current = concertPitchHz
    audioEngineRef.current?.setConcertPitchHz(concertPitchHz)
    if (pitchTrackerRef.current) {
      pitchTrackerRef.current.concertPitchHz = concertPitchHz
    }
  }, [concertPitchHz])

  // Pluck reference tone using Karplus-Strong string synthesis
  const pluckString = useCallback((target: GuitarStringDef) => {
    if (!audioEngineRef.current) return
    audioEngineRef.current.unlock()
    audioEngineRef.current.stopAllSounds()
    audioEngineRef.current.playGuitarPluck(target.name, 3.0, 0.85)
  }, [])

  const startTunerMic = async () => {
    setMicError(null)
    if (!pitchTrackerRef.current) return

    try {
      await pitchTrackerRef.current.startMicrophoneStream(
        (timeData) => {
          if (!pitchTrackerRef.current) return
          const res = pitchTrackerRef.current.detectPitch(timeData)

          if (res && res.freq > 0) {
            setHasSound(true)
            const smoothedHz = pitchTrackerRef.current.getSmoothedPitch(res.freq, 5)
            setDetectedHz(smoothedHz)

            // Calculate note synchronously from smoothed frequency to eliminate visual glitch desync
            const midiVal = Math.round(12 * Math.log2(smoothedHz / concertPitchHzRef.current) + 69)
            const noteIdx = ((midiVal % 12) + 12) % 12
            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            setDetectedNote(noteNames[noteIdx] ?? res.note)

            const activeAutoDetect = isAutoDetectRef.current
            const activeSelected = selectedStringRef.current
            const currentStrings = stringsRef.current

            if (activeAutoDetect) {
              // Find closest guitar string using logarithmic musical distance (cents)
              let closest = currentStrings[0]!
              let minCentsDiff = Infinity
              for (const s of currentStrings) {
                const centsDistance = Math.abs(1200 * Math.log2(smoothedHz / s.targetHz))
                if (centsDistance < minCentsDiff) {
                  minCentsDiff = centsDistance
                  closest = s
                }
              }
              // Hysteresis: switch candidate if closest is already active or if candidate is >= 60 cents closer
              const currentDistance = Math.abs(1200 * Math.log2(smoothedHz / activeSelected.targetHz))
              const targetString =
                closest === activeSelected || minCentsDiff + 60 < currentDistance
                  ? closest
                  : activeSelected

              if (targetString.stringNum !== activeSelected.stringNum) {
                selectedStringRef.current = targetString
                setSelectedStringNum(targetString.stringNum)
              }
              const cents = 1200 * Math.log2(smoothedHz / targetString.targetHz)
              setCentsDeviation(Math.max(-50, Math.min(50, cents)))
            } else {
              const cents = 1200 * Math.log2(smoothedHz / activeSelected.targetHz)
              setCentsDeviation(Math.max(-50, Math.min(50, cents)))
            }
          } else {
            setHasSound(false)
            pitchTrackerRef.current.clearPitchHistory()
          }
        },
        (err) => {
          const msg = err instanceof Error ? err.message : 'Microphone permission denied.'
          setMicError(msg)
          setIsMicListening(false)
        }
      )
      setIsMicListening(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to access audio input.'
      setMicError(msg)
      setIsMicListening(false)
    }
  }

  const stopTunerMic = () => {
    pitchTrackerRef.current?.stop()
    setIsMicListening(false)
    setHasSound(false)
    setDetectedHz(null)
  }

  const isInTune = hasSound && Math.abs(centsDeviation) <= 3
  const needleRotation = Math.max(-45, Math.min(45, (centsDeviation / 50) * 45))

  return (
    <div
      data-testid="guitar-tuner-page"
      className={`min-h-screen w-full bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans transition-colors ${className}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Masthead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-amber-600 dark:text-amber-500">
                PRECISION ACOUSTIC UTILITY
              </span>
              <span className="text-zinc-400">•</span>
              <span className="text-[11px] font-mono text-zinc-500">Standard E-A-D-G-B-E ({concertPitchHz} Hz)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <Disc className="size-6 text-amber-500" />
              <span>Guitar Tuner</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              High-precision pitch detection with reference plucks and needle deviation meter.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-amber-500 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                ← Stage
              </button>
            )}
            {onOpenStudio && (
              <button
                type="button"
                onClick={onOpenStudio}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
              >
                Enter Studio →
              </button>
            )}
          </div>
        </div>

        {/* Top Control Bar: Mic Toggle & Auto-detect mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="toggle-tuner-mic-btn"
              onClick={isMicListening ? stopTunerMic : startTunerMic}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isMicListening
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/40 hover:bg-red-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              {isMicListening ? (
                <>
                  <MicOff className="size-4" />
                  <span>Stop Microphone</span>
                </>
              ) : (
                <>
                  <Mic className="size-4" />
                  <span>Enable Microphone</span>
                </>
              )}
            </button>

            <span className="text-xs font-mono text-zinc-500">
              {isMicListening ? (
                hasSound ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Listening to String Vibration...
                  </span>
                ) : (
                  'Play any open string...'
                )
              ) : (
                'Microphone idle (click button to begin live tuning)'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="toggle-auto-detect-btn"
              onClick={() => setIsAutoDetect((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors border cursor-pointer ${
                isAutoDetect
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40'
                  : 'bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Auto-Detect String: {isAutoDetect ? 'ON' : 'MANUAL'}
            </button>
          </div>
        </div>

        {micError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-600 dark:text-red-400 flex items-center gap-2">
            <HelpCircle className="size-4 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Central Gauge & Headstock Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Cent Needle Meter (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-between gap-6 shadow-xs relative overflow-hidden">
            {/* IN TUNE Banner */}
            <AnimatePresence>
              {isInTune && (
                <motion.div
                  data-testid="in-tune-banner"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute top-4 inset-x-8 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-mono font-bold text-xs uppercase tracking-widest text-center shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="size-4" />
                  <span>IN TUNE (±3 Cents)</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Note & Target Header */}
            <div className="text-center space-y-1 mt-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
                TARGET NOTE
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  {selectedString.note}
                </span>
                <span className="text-2xl font-mono text-zinc-400">{selectedString.octave}</span>
              </div>
              <span className="text-xs font-mono text-zinc-500 block">
                {selectedString.gaugeLabel} • Target: {selectedString.targetHz.toFixed(2)} Hz
              </span>
            </div>

            {/* Analog Needle Dial */}
            <div className="flex flex-col items-center gap-3 select-none">
              <div className="relative w-72 h-36 flex items-end justify-center">
                <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
                  {/* Arc Background */}
                  <path
                    d="M 20 110 A 100 100 0 0 1 220 110"
                    fill="none"
                    stroke="currentColor"
                    className="text-zinc-200 dark:text-zinc-800"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />

                  {/* In-Tune Sweet Zone (±3 cents around center) */}
                  <path
                    d="M 112 11 A 100 100 0 0 1 128 11"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />

                  {/* Ticks (-50 to +50 cents) */}
                  {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((cent) => {
                    const angle = (cent / 50) * 45 * (Math.PI / 180)
                    const x1 = 120 + 90 * Math.sin(angle)
                    const y1 = 110 - 90 * Math.cos(angle)
                    const x2 = 120 + 102 * Math.sin(angle)
                    const y2 = 110 - 102 * Math.cos(angle)
                    const isCenter = cent === 0
                    return (
                      <line
                        key={cent}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isCenter ? '#10B981' : cent < 0 ? '#DC2626' : '#D97706'}
                        strokeWidth={isCenter ? 2.5 : 1.2}
                        strokeOpacity={0.8}
                      />
                    )
                  })}

                  {/* Rotating Needle */}
                  <motion.g
                    animate={{ rotate: needleRotation }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    style={{
                      transformOrigin: '120px 110px',
                    }}
                  >
                    <polygon
                      points="118,110 122,110 120.5,15"
                      fill={isInTune ? '#10B981' : '#F59E0B'}
                    />
                    <circle cx="120" cy="110" r="5" fill="#18181B" />
                  </motion.g>
                </svg>
              </div>

              {/* -50 Flat and +50 Sharp labels positioned cleanly below dial without needle pivot overlap */}
              <div className="flex items-center justify-between w-72 px-1 text-[10px] font-mono text-zinc-500">
                <span className="text-red-600 dark:text-red-400 font-medium">♭ FLAT (-50¢)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">0¢ IN TUNE</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">SHARP (+50¢) ♯</span>
              </div>
            </div>

            {/* Realtime Frequency & Cents Deviation */}
            <div className="flex items-center justify-around w-full max-w-sm pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono">
              <div className="text-center">
                <span className="text-[10px] text-zinc-400 block uppercase">Detected Pitch</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {detectedHz ? `${detectedHz.toFixed(1)} Hz ${detectedNote ? `(${detectedNote})` : ''}` : '—'}
                </span>
              </div>

              <div className="h-6 w-px bg-zinc-200 dark:border-zinc-800" />

              <div className="text-center">
                <span className="text-[10px] text-zinc-400 block uppercase">Cents Deviation</span>
                <span
                  className={`font-bold ${
                    isInTune
                      ? 'text-emerald-500'
                      : centsDeviation > 0
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }`}
                >
                  {hasSound ? `${centsDeviation >= 0 ? '+' : ''}${centsDeviation.toFixed(0)}¢` : '0¢'}
                </span>
              </div>

              <div className="h-6 w-px bg-zinc-200 dark:border-zinc-800" />

              <div className="text-center">
                <span className="text-[10px] text-zinc-400 block uppercase">Tuner Status</span>
                <span
                  className={`font-bold uppercase ${
                    isInTune
                      ? 'text-emerald-500'
                      : hasSound
                      ? centsDeviation < 0
                        ? 'text-red-500'
                        : 'text-amber-500'
                      : 'text-zinc-400'
                  }`}
                >
                  {isInTune ? 'In Tune' : hasSound ? (centsDeviation < 0 ? 'Tune Up ↗' : 'Tune Down ↘') : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* 6-String Guitar Headstock & Peg Selector (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
                  6-STRING HEADSTOCK
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Select String or Hear Reference
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Click peg to pluck</span>
            </div>

            {/* String Peg List */}
            <div className="space-y-2">
              {strings.map((str) => {
                const isSelected = selectedString.stringNum === str.stringNum
                return (
                  <div
                    key={str.stringNum}
                    className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-xs'
                        : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    <motion.button
                      type="button"
                      data-testid={`tuner-peg-${str.stringNum}`}
                      aria-pressed={isSelected}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedStringNum(str.stringNum)
                        setIsAutoDetect(false)
                      }}
                      className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                    >
                      <span
                        className={`size-7 rounded-lg font-mono text-xs font-black flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {str.stringNum}
                      </span>
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {str.name}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                            ({str.targetHz.toFixed(1)} Hz)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">{str.gaugeLabel}</span>
                      </div>
                    </motion.button>

                    <button
                      type="button"
                      data-testid={`pluck-peg-${str.stringNum}`}
                      onClick={() => {
                        setSelectedStringNum(str.stringNum)
                        setIsAutoDetect(false)
                        pluckString(str)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-500 text-zinc-600 dark:text-zinc-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Volume2 className="size-3.5" />
                      <span>Pluck</span>
                    </button>
                  </div>
                )
              })}
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={() => pluckString(selectedString)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Volume2 className="size-4" />
              <span>Pluck Reference {selectedString.name} ({selectedString.targetHz.toFixed(2)} Hz)</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
