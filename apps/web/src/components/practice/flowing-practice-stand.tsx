import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  FlowingNotationStand,
  type FlowingChordItem,
} from './flowing-notation-stand'
import { PracticeTelemetryHUD } from './practice-telemetry-hud'
import {
  parseProgressionSequence,
  resolveChordVoicing,
} from '@/lib/music/chord-voicings'
import { RealtimePitchTracker, type PitchDetectionResult } from '@/lib/audio/realtime-pitch-tracker'
import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'

export type FlowingPracticeStandProps = {
  mode?: 'studio' | 'hero'
  instrument?: 'guitar' | 'piano'
  onInstrumentChange?: (inst: 'guitar' | 'piano') => void
  progression?: FlowingChordItem[]
  pieceTitle?: string
  keySignature?: string
  tempoBpm?: number
  onTempoChange?: (bpm: number) => void
  autoPlay?: boolean
  className?: string
  showSequenceStrip?: boolean
  showCustomInput?: boolean
  customInput?: string
  onCustomInputChange?: (val: string) => void
  timeSignature?: string
  onSeekBeat?: (beat: number) => void
  onKeyClick?: (midi: number) => void
}

const DEFAULT_HERO_PROGRESSION_CHORDS = ['G', 'D', 'Em', 'C']

export function FlowingPracticeStand({
  mode = 'studio',
  instrument: controlledInstrument,
  onInstrumentChange,
  progression: controlledProgression,
  pieceTitle = 'Four-Chord Anthem',
  keySignature = 'G Major',
  tempoBpm: controlledTempoBpm,
  onTempoChange,
  autoPlay = mode === 'hero',
  className = '',
  showSequenceStrip = true,
  showCustomInput = mode === 'studio',
  customInput: controlledCustomInput,
  onCustomInputChange,
  timeSignature = '4/4',
  onSeekBeat,
  onKeyClick,
}: FlowingPracticeStandProps): React.JSX.Element {
  // Internal state when not fully controlled
  const [internalInstrument, setInternalInstrument] = useState<'guitar' | 'piano'>('guitar')
  const [internalTempoBpm, setInternalTempoBpm] = useState<number>(mode === 'hero' ? 76 : 80)
  const [internalCustomInput, setInternalCustomInput] = useState<string>('G - D - Em - C')

  const instrument = controlledInstrument ?? internalInstrument
  const tempoBpm = controlledTempoBpm ?? internalTempoBpm

  const handleInstrumentChange = useCallback(
    (inst: 'guitar' | 'piano') => {
      if (onInstrumentChange) onInstrumentChange(inst)
      else setInternalInstrument(inst)
    },
    [onInstrumentChange]
  )

  const handleTempoChange = useCallback(
    (bpm: number) => {
      const clamped = Math.max(40, Math.min(240, bpm))
      if (onTempoChange) onTempoChange(clamped)
      else setInternalTempoBpm(clamped)
    },
    [onTempoChange]
  )

  // Parse progression
  const progression = useMemo<FlowingChordItem[]>(() => {
    if (controlledProgression && controlledProgression.length > 0) {
      return controlledProgression
    }

    const inputToParse = controlledCustomInput ?? internalCustomInput
    const rawItems = inputToParse
      .split(/[-–—→,>|\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.toLowerCase() !== 'maj' && s.toLowerCase() !== 'min')

    const parsed = parseProgressionSequence(
      rawItems.length > 0 ? rawItems : DEFAULT_HERO_PROGRESSION_CHORDS
    )
    return parsed.length > 0 ? (parsed as FlowingChordItem[]) : [resolveChordVoicing('G')]
  }, [controlledProgression, controlledCustomInput, internalCustomInput])

  const beatsPerMeasure = timeSignature === '3/4' ? 3 : 4
  const totalMeasures = progression.length
  const totalBeats = progression.reduce((acc, c) => acc + (c.duration_beats ?? beatsPerMeasure), 0)

  // Transport and Playhead State
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay)
  const [currentBeat, setCurrentBeat] = useState<number>(0)
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState<boolean>(mode === 'studio')
  const [isBackingAudioEnabled, setIsBackingAudioEnabled] = useState<boolean>(mode === 'studio')

  // Telemetry & Live Audio State
  const [liveRmsDb, setLiveRmsDb] = useState<number>(mode === 'hero' ? -24 : -45)
  const [livePitchResult, setLivePitchResult] = useState<PitchDetectionResult | null>(null)
  const [intonationAccuracy, setIntonationAccuracy] = useState<number | null>(
    mode === 'hero' ? 98.6 : 98.4
  )
  const [timingSyncMs, setTimingSyncMs] = useState<number | null>(mode === 'hero' ? 4 : 6)
  const [voicingStringsCount, setVoicingStringsCount] = useState<number>(mode === 'hero' ? 6 : 6)
  const [livePitchText, setLivePitchText] = useState<string | undefined>(
    mode === 'hero' ? 'G3 (196Hz) - ON PITCH' : undefined
  )

  // Audio Engine Ref
  const audioEngineRef = useRef<PracticeAudioEngine | null>(null)
  useEffect(() => {
    audioEngineRef.current = new PracticeAudioEngine()
    return () => {
      audioEngineRef.current?.dispose()
      audioEngineRef.current = null
    }
  }, [])

  // Active chord calculation
  const currentMeasureIdx = useMemo(() => {
    let accum = 0
    for (let i = 0; i < progression.length; i++) {
      const dur = progression[i]?.duration_beats ?? beatsPerMeasure
      if (currentBeat >= accum && currentBeat < accum + dur) {
        return i
      }
      accum += dur
    }
    return 0
  }, [currentBeat, progression, beatsPerMeasure])

  const activeChord = progression[currentMeasureIdx] || progression[0]

  // Playback Animation Ref
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const pausedAtBeatRef = useRef<number>(0)
  const lastClickBeatRef = useRef<number>(-1)

  // Toggle play
  const handleTogglePlay = useCallback(() => {
    audioEngineRef.current?.unlock()
    setIsPlaying((prev) => {
      const next = !prev
      if (!next) {
        pausedAtBeatRef.current = currentBeat
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      } else {
        startTimeRef.current = performance.now()
      }
      return next
    })
  }, [currentBeat])

  // Restart
  const handleRestart = useCallback(() => {
    pausedAtBeatRef.current = 0
    setCurrentBeat(0)
    lastClickBeatRef.current = -1
    if (isPlaying) {
      startTimeRef.current = performance.now()
    }
  }, [isPlaying])

  // Key click callback for interactive piano keyboard
  const handleKeyClick = useCallback(
    (midi: number) => {
      audioEngineRef.current?.unlock()
      audioEngineRef.current?.playPianoNote(midi, 1.2, 0.8)
      onKeyClick?.(midi)
    },
    [onKeyClick]
  )

  // Rewind playhead to start when a different piece is loaded
  const prevPieceRef = useRef(pieceTitle)
  useEffect(() => {
    if (prevPieceRef.current !== pieceTitle) {
      prevPieceRef.current = pieceTitle
      handleRestart()
    }
  }, [pieceTitle, handleRestart])

  // Seek beat
  const handleSeek = useCallback(
    (beat: number) => {
      pausedAtBeatRef.current = beat
      setCurrentBeat(beat)
      lastClickBeatRef.current = Math.floor(beat) - 1
      if (isPlaying) {
        startTimeRef.current = performance.now()
      }
      onSeekBeat?.(beat)
    },
    [isPlaying, onSeekBeat]
  )

  // 60FPS Glide Animation Loop
  useEffect(() => {
    if (!isPlaying) return

    const secondsPerBeat = 60 / tempoBpm

    const loop = (time: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = time
      }
      const elapsedSeconds = (time - startTimeRef.current) / 1000
      const totalElapsedBeats = pausedAtBeatRef.current + elapsedSeconds / secondsPerBeat
      const loopBeat = totalElapsedBeats % (totalBeats || 16)

      setCurrentBeat(loopBeat)

      const currentIntBeat = Math.floor(loopBeat)
      if (currentIntBeat !== lastClickBeatRef.current) {
        lastClickBeatRef.current = currentIntBeat
        const isDownbeat = currentIntBeat % beatsPerMeasure === 0

        if (isMetronomeEnabled) {
          audioEngineRef.current?.playClick(isDownbeat)
        }

        if (isDownbeat && isBackingAudioEnabled) {
          const measureDurationSec = beatsPerMeasure * (60 / tempoBpm)
          const chordToPlay = progression[currentMeasureIdx] || progression[0]
          if (chordToPlay) {
            const pitchesToPlay =
              instrument === 'piano' && chordToPlay.pianoVoicing
                ? [...chordToPlay.pianoVoicing.lhPitches, ...chordToPlay.pianoVoicing.rhPitches]
                : chordToPlay.expectedPitches

            audioEngineRef.current?.playChord(
              chordToPlay.chordName,
              pitchesToPlay,
              measureDurationSec,
              instrument
            )
          }
        }

        // In Hero Mode: simulate grounded microtonal intonation jitter on beat transitions
        if (mode === 'hero') {
          const jitter = (Math.sin(currentIntBeat * 1.7) * 0.4).toFixed(1)
          const intonation = 98.4 + parseFloat(jitter)
          const delta = (currentIntBeat % 2 === 0 ? 3 : -4) + Math.round(Math.random() * 2)
          setIntonationAccuracy(intonation)
          setTimingSyncMs(delta)
          setVoicingStringsCount(instrument === 'guitar' ? 6 : 88)
          const noteName = activeChord.root || 'G'
          const rootPc = activeChord.pitchClasses?.[0] ?? 0
          const rootMidi = activeChord.pianoVoicing?.lhPitches?.[0] ?? (36 + rootPc)
          const rootFreq = Math.round(440 * Math.pow(2, (rootMidi - 69) / 12))
          const rootNote = activeChord.pianoVoicing?.lhNotes?.[0] ?? `${noteName}2`
          setLivePitchText(`${rootNote} (${rootFreq}Hz) - ON PITCH`)
          setLivePitchResult({
            isSoundDetected: true,
            detectedNote: rootNote,
            detectedFreqHz: rootFreq,
            centsDeviation: parseFloat(jitter) * 2,
            rmsDb: -22,
            clarityScore: 0.88,
            voicingCompleteness: 1.0,
            matchedPitchClasses: activeChord.pitchClasses || [0, 4, 7],
            missingPitchClasses: [],
            timingDeltaMs: delta,
          })
          setLiveRmsDb(-22 + Math.sin(currentIntBeat) * 3)
        }
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [
    isPlaying,
    tempoBpm,
    totalBeats,
    beatsPerMeasure,
    isMetronomeEnabled,
    isBackingAudioEnabled,
    currentMeasureIdx,
    progression,
    instrument,
    mode,
    activeChord,
  ])

  // Real-Time Microphone stream ONLY in studio mode (disabled in hero mode)
  const trackerRef = useRef<RealtimePitchTracker | null>(null)
  useEffect(() => {
    if (mode === 'hero' || !isPlaying) {
      if (trackerRef.current) {
        trackerRef.current.stop()
        trackerRef.current = null
      }
      return
    }

    let isMounted = true
    const tracker = new RealtimePitchTracker(44100, 2048)
    trackerRef.current = tracker

    tracker.startMicrophoneStream(
      (timeData) => {
        if (!isMounted) return
        const rms = tracker.computeRmsDb(timeData)
        setLiveRmsDb(rms)

        const match = tracker.evaluateChordMatch(timeData, activeChord, 0, 0)
        setLivePitchResult(match)

        if (match.detectedFreqHz && match.detectedFreqHz > 40) {
          if (match.voicingCompleteness > 0.3) {
            setIntonationAccuracy(98.8)
            setTimingSyncMs(4)
            setVoicingStringsCount(6)
          } else {
            setIntonationAccuracy(92.1)
            setTimingSyncMs(12)
            setVoicingStringsCount(5)
          }
        }
      },
      () => {
        // Microphone permission declined or not supported
      }
    )

    return () => {
      isMounted = false
      tracker.stop()
      trackerRef.current = null
    }
  }, [mode, isPlaying, activeChord])

  return (
    <div
      className={`w-full bg-[#FCFBF8] dark:bg-[#1E1C1A] border border-[#E2DDD3] dark:border-[#38342E] rounded-2xl shadow-sm overflow-hidden flex flex-col font-serif select-none transition-colors duration-200 ${className}`}
    >
      {/* ─────────────────────────────────────────────────────────────
          TOP TELEMETRY & TRANSPORT HUD
         ───────────────────────────────────────────────────────────── */}
      <PracticeTelemetryHUD
        instrument={instrument}
        onInstrumentChange={handleInstrumentChange}
        pieceTitle={pieceTitle}
        keySignature={keySignature}
        currentMeasure={currentMeasureIdx + 1}
        totalMeasures={totalMeasures}
        tempoBpm={tempoBpm}
        onTempoChange={handleTempoChange}
        activeChord={activeChord}
        intonationAccuracy={intonationAccuracy}
        timingSyncMs={timingSyncMs}
        voicingStringsCount={voicingStringsCount}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onRestart={handleRestart}
        onKeyClick={handleKeyClick}
        livePitchText={livePitchText}
        liveRmsDb={liveRmsDb}
        isBackingAudioEnabled={isBackingAudioEnabled}
        onToggleBackingAudio={() => setIsBackingAudioEnabled((v) => !v)}
        isMetronomeEnabled={isMetronomeEnabled}
        onToggleMetronome={() => setIsMetronomeEnabled((v) => !v)}
      />

      {/* ─────────────────────────────────────────────────────────────
          CENTRAL CONTINUOUS FLOWING NOTATION STAND
         ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full">
        <FlowingNotationStand
          instrument={instrument}
          progression={progression}
          currentBeat={currentBeat}
          tempoBpm={tempoBpm}
          isPlaying={isPlaying}
          activeHitResult={livePitchResult}
          beatsPerMeasure={beatsPerMeasure}
          timeSignature={timeSignature}
          onSeekBeat={handleSeek}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FULL SONG CHORD SEQUENCE STRIP
         ───────────────────────────────────────────────────────────── */}
      {showSequenceStrip && (
        <div className="w-full bg-[#EFECE6]/90 dark:bg-[#1A1816]/95 border-t border-[#E2DDD3] dark:border-[#38342E] px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#736E65] dark:text-[#A39C8F] uppercase tracking-wider text-[11px] font-semibold">
              CHORD SEQUENCE ({progression.length}):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {progression.map((chord, idx) => {
                const isCurrent = idx === currentMeasureIdx
                // Calculate starting beat for this chord
                let startBeat = 0
                for (let j = 0; j < idx; j++) {
                  startBeat += progression[j]?.duration_beats ?? beatsPerMeasure
                }

                return (
                  <button
                    key={`${chord.chordName}-${idx}`}
                    type="button"
                    onClick={() => handleSeek(startBeat)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] font-bold shadow-sm'
                        : 'bg-[#FCFBF8] text-[#242321] border border-[#D9D3C7] dark:bg-[#24221F] dark:text-[#EDE8DF] dark:border-[#38342E] hover:bg-[#E2DDD3] dark:hover:bg-[#2E2A24]'
                    }`}
                  >
                    <span>{chord.chordName}</span>
                    <span className="text-[10px] opacity-70 ml-1">
                      ({chord.duration_beats ?? beatsPerMeasure}b)
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#736E65] dark:text-[#A39C8F]">
            <span>METER: {timeSignature}</span>
            <span>•</span>
            <span>TEMPO: {tempoBpm} BPM</span>
            <span>•</span>
            <span>TOTAL: {totalBeats} BEATS</span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OPTIONAL CUSTOM CHORD INPUT (STUDIO MODE)
         ───────────────────────────────────────────────────────────── */}
      {showCustomInput && (
        <div className="w-full bg-[#FAF8F3] dark:bg-[#181614] border-t border-[#E2DDD3] dark:border-[#38342E] px-6 py-2.5 flex items-center justify-between gap-4 text-xs font-mono">
          <label htmlFor="flowing-custom-chord-input" className="text-[#736E65] dark:text-[#A39C8F] text-[11px] uppercase">
            CUSTOM SEQUENCE:
          </label>
          <input
            id="flowing-custom-chord-input"
            type="text"
            value={controlledCustomInput ?? internalCustomInput}
            onChange={(e) => {
              if (onCustomInputChange) onCustomInputChange(e.target.value)
              else setInternalCustomInput(e.target.value)
            }}
            placeholder="Enter chords (e.g. G - D - Em - C)"
            className="flex-1 max-w-sm px-3 py-1 bg-[#FCFBF8] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] rounded text-[#242321] dark:text-[#EDE8DF] font-mono text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>
      )}
    </div>
  )
}
