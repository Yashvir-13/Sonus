import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'

import {

  FlowingNotationStand,

  type FlowingChordItem,

} from './flowing-notation-stand'

import { ActiveVoicingDisplay } from './active-voicing-display'

import { CodexRepertoireDrawer } from './codex-repertoire-drawer'

import { TakeEvaluationDrawer } from './take-evaluation-drawer'

import { BUILTIN_FULL_SONGS, createChordDrillExercise, type FullSongChordItem } from '@/lib/music/song-catalog'
import {
  projectSongToInstrument,
  projectToPiano,
  projectToGuitar,
  noteToMidi,
} from '@/lib/music/instrument-lens'

import {

  createPracticeSession,

  uploadSessionTake,

  submitChordsTake,

  fetchUserHabits,

  ApiError,

  type ExerciseDto,

  type TakeEvaluationResponse,

  type AdaptiveInterventionDto,

  type HabitPatternDto,

  type ChordMetricDto,

} from '@/api/sessions'

import { resolveChordVoicing } from '@/lib/music/chord-voicings'

import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'

import { RealtimePitchTracker, type PitchDetectionResult } from '@/lib/audio/realtime-pitch-tracker'

import { chromaToChord } from '@/lib/audio/chord-detector'

import { encodeMonoWav } from '@/lib/audio/wav-encoder'

import {

  Play,

  Pause,

  RotateCcw,

  Mic,

  Repeat,

  ArrowRight,

  X,

  CheckCircle2,

  AlertCircle,

} from 'lucide-react'

export interface PracticeStudioCockpitProps {

  onBackToDesk?: () => void

  onOpenProgress?: () => void

  onOpenCommunity?: () => void

  onTakeCompleted?: (

    evaluation: TakeEvaluationResponse,

    songTitle: string,

    instrument: 'piano' | 'guitar',

    tempoBpm: number

  ) => void

  initialSongId?: string

  onSelectSong?: (songId: string) => void

  availableExercises?: ExerciseDto[]

  initialHabits?: HabitPatternDto[]

  initialLoopDrill?: {

    fromChord: string

    toChord: string

    targetBpm: number

    description?: string

  } | null

  userButtonSlot?: React.ReactNode

  className?: string

  embedded?: boolean

  instrument?: 'guitar' | 'piano'

  onInstrumentChange?: (instrument: 'guitar' | 'piano') => void

  studioMode?: 'listen' | 'practice'

  onStudioModeChange?: (mode: 'listen' | 'practice') => void

  isRepertoireOpen?: boolean

  onRepertoireOpenChange?: (open: boolean) => void

  pianoNotationMode?: 'staff' | 'keys'

  onPianoNotationModeChange?: (mode: 'staff' | 'keys') => void

  isSignedIn?: boolean

  onRequestSignIn?: () => void

  isDeveloper?: boolean

}

type DiagnosticPresetMode = 'clean' | 'transition_lag' | 'voicing_drop' | 'tempo_rushing'

export function PracticeStudioCockpit({

  onBackToDesk: _onBackToDesk,

  onOpenProgress: _onOpenProgress,

  onOpenCommunity: _onOpenCommunity,

  onTakeCompleted,

  initialSongId = 'ex_guitar_knockin',

  onSelectSong,

  initialLoopDrill = null,

  availableExercises,

  initialHabits,

  userButtonSlot: _userButtonSlot,

  className = '',

  embedded = false,

  instrument: propInstrument,

  onInstrumentChange,

  studioMode: propStudioMode,

  onStudioModeChange,

  isRepertoireOpen: propRepertoireOpen,

  onRepertoireOpenChange,

  pianoNotationMode: propPianoNotationMode,

  onPianoNotationModeChange,

  isSignedIn = true,

  onRequestSignIn,

  isDeveloper = false,

}: PracticeStudioCockpitProps): React.JSX.Element {

  const isDevHarnessVisible = Boolean(
    import.meta.env.DEV ||
    import.meta.env.MODE === 'test' ||
    (isDeveloper && typeof window !== 'undefined' && (
      window.location.search.includes('dev=true') ||
      window.location.search.includes('debug=1')
    ))
  )

  // ───────────────────────────────────────────────────────────────────────────

  // 1. REPERTOIRE & INSTRUMENT STATE

  // ───────────────────────────────────────────────────────────────────────────

  const [selectedSong, setSelectedSong] = useState<ExerciseDto>(() => {
    const pool = availableExercises && availableExercises.length > 0 ? availableExercises : BUILTIN_FULL_SONGS
    const direct =
      pool.find((s) => s.id === initialSongId) ??
      BUILTIN_FULL_SONGS.find((s) => s.id === initialSongId)
    if (direct) return direct

    if (initialSongId?.startsWith('drill_chord_')) {
      const rawChord = initialSongId
        .replace(/^drill_chord_/, '')
        .replace(/_sharp/g, '#')
        .replace(/_/g, ' ')
      const chordSymbol = rawChord.charAt(0).toUpperCase() + rawChord.slice(1)
      return createChordDrillExercise(chordSymbol, propInstrument || 'guitar')
    }

    return (
      pool[1] ??
      pool[0] ??
      BUILTIN_FULL_SONGS[0]
    )
  })

  const prevInitialSongIdRef = useRef<string | undefined>(initialSongId)

  useEffect(() => {
    const list = availableExercises && availableExercises.length > 0 ? availableExercises : BUILTIN_FULL_SONGS
    let found = initialSongId ? list.find((s: ExerciseDto) => s.id === initialSongId) : undefined

    if (!found && initialSongId?.startsWith('drill_chord_')) {
      const rawChord = initialSongId
        .replace(/^drill_chord_/, '')
        .replace(/_sharp/g, '#')
        .replace(/_/g, ' ')
      const chordSymbol = rawChord.charAt(0).toUpperCase() + rawChord.slice(1)
      found = createChordDrillExercise(chordSymbol, propInstrument || 'guitar')
    }

    if (found && (selectedSong.id !== found.id || initialSongId !== prevInitialSongIdRef.current)) {
      prevInitialSongIdRef.current = initialSongId
      setSelectedSong(found)
      setInstrument(found.instrument.toLowerCase() === 'guitar' ? 'guitar' : 'piano')
      setTempoBpm(found.tempo_bpm || 76)
      setCurrentBeat(0)
      setIsPlaying(false)
      if (!initialLoopDrill) {
        setActiveDrillSlice(null)
      }
    } else if (initialSongId !== prevInitialSongIdRef.current) {
      prevInitialSongIdRef.current = initialSongId
    }
  }, [initialSongId, availableExercises, initialLoopDrill, selectedSong.id, propInstrument])

  const [internalInstrument, setInternalInstrument] = useState<'guitar' | 'piano'>(
    propInstrument ?? (selectedSong.instrument.toLowerCase() === 'guitar' ? 'guitar' : 'piano')
  )
  const instrument = propInstrument ?? internalInstrument
  const setInstrument = useCallback(
    (inst: 'guitar' | 'piano') => {
      setInternalInstrument(inst)
      onInstrumentChange?.(inst)
    },
    [onInstrumentChange]
  )

  const [internalPianoNotationMode, setInternalPianoNotationMode] = useState<'staff' | 'keys'>(
    propPianoNotationMode ?? 'staff'
  )
  const pianoNotationMode = propPianoNotationMode ?? internalPianoNotationMode
  const setPianoNotationMode = useCallback(
    (mode: 'staff' | 'keys') => {
      setInternalPianoNotationMode(mode)
      onPianoNotationModeChange?.(mode)
    },
    [onPianoNotationModeChange]
  )

  const [tempoBpm, setTempoBpm] = useState<number>(
    initialLoopDrill?.targetBpm ?? (selectedSong.tempo_bpm || 76)
  )

  const [internalRepertoireOpen, setInternalRepertoireOpen] = useState(
    propRepertoireOpen ?? false
  )
  const isRepertoireOpen = propRepertoireOpen ?? internalRepertoireOpen
  const setIsRepertoireOpen = useCallback(
    (open: boolean) => {
      setInternalRepertoireOpen(open)
      onRepertoireOpenChange?.(open)
    },
    [onRepertoireOpenChange]
  )

  const [isTakeDrawerOpen, setIsTakeDrawerOpen] = useState(false)

  // ───────────────────────────────────────────────────────────────────────────
  // 2. PLAYBACK, MEASURE LOOPING & ENGINE STATE
  // ───────────────────────────────────────────────────────────────────────────

  const [isPlaying, setIsPlaying] = useState(false)

  const [internalStudioMode, setInternalStudioMode] = useState<'practice' | 'listen'>(
    propStudioMode ?? 'practice'
  )
  const studioMode = propStudioMode ?? internalStudioMode
  const setStudioMode = useCallback(
    (mode: 'practice' | 'listen') => {
      setInternalStudioMode(mode)
      onStudioModeChange?.(mode)
    },
    [onStudioModeChange]
  )

  const [currentBeat, setCurrentBeat] = useState(0)

  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(true)

  const [isBackingAudioEnabled, setIsBackingAudioEnabled] = useState(true)

  const [activeDrillSlice, setActiveDrillSlice] = useState<AdaptiveInterventionDto | null>(() => {

    if (!initialLoopDrill) return null

    const iso = initialLoopDrill.targetBpm

    const base = Math.round(iso / 0.7)

    return {

      id: `drill_init_${Date.now()}`,

      user_id: 'user',

      pattern_id: 'pat_init',

      drill_type: 'isolated_transition',

      target_tempo: iso,

      target_repetitions: 6,

      completed: false,

      measured_improvement: null,

      progression: [

        { name: initialLoopDrill.fromChord, beats: 4 },

        { name: initialLoopDrill.toChord, beats: 4 },

      ],

      tempo_stages: {

        isolation_bpm: iso,

        step_bpm: Math.round(base * 0.85),

        target_bpm: base,

        goal_bpm: Math.round(base * 1.05),

      },

      description:

        initialLoopDrill.description ||

        `Looping ${initialLoopDrill.fromChord} ↔ ${initialLoopDrill.toChord} at ${iso} BPM.`,

    }

  })

  useEffect(() => {

    if (!initialLoopDrill) return

    const iso = initialLoopDrill.targetBpm

    const base = Math.round(iso / 0.7)

    setActiveDrillSlice({

      id: `drill_init_${Date.now()}`,

      user_id: 'user',

      pattern_id: 'pat_init',

      drill_type: 'isolated_transition',

      target_tempo: iso,

      target_repetitions: 6,

      completed: false,

      measured_improvement: null,

      progression: [

        { name: initialLoopDrill.fromChord, beats: 4 },

        { name: initialLoopDrill.toChord, beats: 4 },

      ],

      tempo_stages: {

        isolation_bpm: iso,

        step_bpm: Math.round(base * 0.85),

        target_bpm: base,

        goal_bpm: Math.round(base * 1.05),

      },

      description:

        initialLoopDrill.description ||

        `Looping ${initialLoopDrill.fromChord} ↔ ${initialLoopDrill.toChord} at ${iso} BPM.`,

    })

    setTempoBpm(iso)

    setCurrentBeat(0)

  }, [initialLoopDrill])

  const [activeHabits, setActiveHabits] = useState<HabitPatternDto[]>(() => initialHabits ?? [])

  useEffect(() => {
    if (initialHabits) {
      setActiveHabits(initialHabits)
    }
  }, [initialHabits])

  const audioEngineRef = useRef<PracticeAudioEngine | null>(null)

  const [livePitchResult, setLivePitchResult] = useState<PitchDetectionResult | null>(null)

  const [isRecordingMic, setIsRecordingMic] = useState(false)

  const [micSeconds, setMicSeconds] = useState(0)

  const [isEvaluating, setIsEvaluating] = useState(false)

  const [evaluationResult, setEvaluationResult] = useState<TakeEvaluationResponse | null>(null)

  const [generatedDrill, setGeneratedDrill] = useState<AdaptiveInterventionDto | null>(null)

  const [evaluationError, setEvaluationError] = useState<string | null>(null)

  const mediaStreamRef = useRef<MediaStream | null>(null)

  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)

  const recordedSamplesRef = useRef<Float32Array[]>([])

  const recordingTimerRef = useRef<number | null>(null)

  const activeSessionIdRef = useRef<string | null>(null)
  const recordedSampleRateRef = useRef<number>(44100)
  const recordingStartMsRef = useRef<number>(0)
  const downbeatMsRef = useRef<number>(0)

  // Parse current song progression (or active 2-bar loop slice)
  // Parse current song progression (or active 2-bar loop slice) via Instrument Lens
  const flowingProgression = useMemo<FlowingChordItem[]>(() => {
    if (activeDrillSlice?.progression && activeDrillSlice.progression.length > 0) {
      const sliceChords = activeDrillSlice.progression.map((item) => {
        return {
          name: item.name,
          beat: 1.0,
          duration_beats: item.beats ?? 4,
          expected_pitches: resolveChordVoicing(item.name).expectedPitches,
        }
      })
      return sliceChords.map((chord) =>
        instrument === 'piano' ? projectToPiano(chord) : projectToGuitar(chord)
      )
    }

    return projectSongToInstrument(selectedSong, instrument)
  }, [selectedSong, instrument, activeDrillSlice])

  const beatsPerMeasure = useMemo(() => {

    try {

      if (selectedSong.progression_json) {

        const parsed = JSON.parse(selectedSong.progression_json)

        if (parsed.time_signature) {

          const [num] = parsed.time_signature.split('/').map(Number)

          if (num && !isNaN(num) && num > 0) return num

        }

      }

    } catch {

      // JSON parse fallback

    }

    const firstDur = flowingProgression[0]?.duration_beats

    if (firstDur && firstDur > 0) return firstDur

    return 4

  }, [selectedSong.progression_json, flowingProgression])

  const songTimeSignature = useMemo(() => {
    try {
      if (selectedSong.progression_json) {
        const parsed = JSON.parse(selectedSong.progression_json)
        if (typeof parsed.time_signature === 'string' && /^\d+\/\d+$/.test(parsed.time_signature.trim())) {
          return parsed.time_signature.trim()
        }
      }
    } catch {
      // JSON parse fallback
    }
    return beatsPerMeasure === 3 ? '3/4' : beatsPerMeasure === 6 ? '6/8' : '4/4'
  }, [selectedSong.progression_json, beatsPerMeasure])

  const totalBeats = useMemo(() => {

    return flowingProgression.reduce((acc, c) => acc + (c.duration_beats ?? beatsPerMeasure), 0)

  }, [flowingProgression, beatsPerMeasure])

  const currentMeasureIdx = useMemo(() => {

    let accum = 0

    for (let i = 0; i < flowingProgression.length; i++) {

      const dur = flowingProgression[i]?.duration_beats ?? beatsPerMeasure

      if (currentBeat >= accum && currentBeat < accum + dur) {

        return i

      }

      accum += dur

    }

    return Math.max(0, flowingProgression.length - 1)

  }, [flowingProgression, currentBeat, beatsPerMeasure])

  const activeChord = useMemo(() => {

    return flowingProgression[currentMeasureIdx] ?? resolveChordVoicing('C')

  }, [flowingProgression, currentMeasureIdx])

  const activeChordRef = useRef(activeChord)

  useEffect(() => {

    activeChordRef.current = activeChord

  }, [activeChord])

  const nextMeasureIdx = useMemo(() => {

    if (flowingProgression.length <= 1) return 0

    return (currentMeasureIdx + 1) % flowingProgression.length

  }, [flowingProgression.length, currentMeasureIdx])

  const nextChord = useMemo(() => {

    return flowingProgression[nextMeasureIdx] ?? activeChord

  }, [flowingProgression, nextMeasureIdx, activeChord])

  const [isCountingIn, setIsCountingIn] = useState(false)

  const [countInBeat, setCountInBeat] = useState(1)

  useEffect(() => {

    const engine = new PracticeAudioEngine()

    audioEngineRef.current = engine

    return () => {

      engine.dispose()

      audioEngineRef.current = null

    }

  }, [])

  // ───────────────────────────────────────────────────────────────────────────

  // 3. PLAYBACK TICKER & LOOKAHEAD RHYTHMIC AUDIO SCHEDULING

  // ───────────────────────────────────────────────────────────────────────────

  const lastTickBeatRef = useRef<number>(-1)

  const lastChordIdxRef = useRef<number>(-1)

  const loopCountRef = useRef<number>(0)
  const playbackAudioStartRef = useRef<number>(0)
  const playbackBeatStartRef = useRef<number>(0)
  const scheduledMeasuresRef = useRef<Set<string>>(new Set())
  const currentBeatRef = useRef<number>(currentBeat)

  const handleCockpitKeyClick = useCallback((midi: number) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.unlock()
      audioEngineRef.current.stopAllSounds()
      audioEngineRef.current.playPianoNote(midi, 1.0, 0.8)
    }
  }, [])

  const handleSeekBeat = useCallback((beat: number) => {
    currentBeatRef.current = beat
    if (audioEngineRef.current) {
      audioEngineRef.current.stopAllSounds()
      playbackAudioStartRef.current = audioEngineRef.current.getCurrentTime() + 0.05
      playbackBeatStartRef.current = beat
    }
    loopCountRef.current = 0
    scheduledMeasuresRef.current.clear()
    lastChordIdxRef.current = -1
    lastTickBeatRef.current = -1
    setCurrentBeat(beat)
  }, [])

  // Re-anchor audio and visual clock when tempo changes dynamically mid-playback
  const prevTempoRef = useRef(tempoBpm)
  useEffect(() => {
    if (prevTempoRef.current !== tempoBpm) {
      if (isPlaying && audioEngineRef.current) {
        audioEngineRef.current.stopAllSounds()
        playbackAudioStartRef.current = audioEngineRef.current.getCurrentTime() + 0.05
        playbackBeatStartRef.current = currentBeatRef.current
        scheduledMeasuresRef.current.clear()
        loopCountRef.current = 0
        lastTickBeatRef.current = Math.floor(currentBeatRef.current)
      }
      prevTempoRef.current = tempoBpm
    }
  }, [tempoBpm, isPlaying])

  useEffect(() => {
    if (!isPlaying) {
      audioEngineRef.current?.stopAllSounds()
      scheduledMeasuresRef.current.clear()
      loopCountRef.current = 0
      lastChordIdxRef.current = -1
      lastTickBeatRef.current = -1
    }
  }, [isPlaying])

  const startCountInThenPlay = useCallback(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.unlock()
    }

    if (isPlaying) {
      setIsPlaying(false)
      setIsCountingIn(false)
      return
    }

    const startFromBeat = currentBeatRef.current >= totalBeats ? 0 : currentBeatRef.current
    setIsCountingIn(true)
    setCountInBeat(1)

    let currentCount = 1
    const msPerBeat = (60 / tempoBpm) * 1000

    if (audioEngineRef.current && isMetronomeEnabled) {
      audioEngineRef.current.playClick(true)
    }

    const countTimer = window.setInterval(() => {
      currentCount += 1
      if (currentCount <= beatsPerMeasure) {
        setCountInBeat(currentCount)
        if (audioEngineRef.current && isMetronomeEnabled) {
          audioEngineRef.current.playClick(false)
        }
      } else {
        clearInterval(countTimer)
        setIsCountingIn(false)
        downbeatMsRef.current = performance.now()
        if (audioEngineRef.current) {
          audioEngineRef.current.unlock()
          audioEngineRef.current.stopAllSounds()
          playbackAudioStartRef.current = audioEngineRef.current.getCurrentTime() + 0.05
        }
        playbackBeatStartRef.current = startFromBeat
        currentBeatRef.current = startFromBeat
        setCurrentBeat(startFromBeat)
        scheduledMeasuresRef.current.clear()
        loopCountRef.current = 0
        lastChordIdxRef.current = -1
        lastTickBeatRef.current = -1
        setIsPlaying(true)
      }
    }, msPerBeat)
  }, [isPlaying, totalBeats, tempoBpm, beatsPerMeasure, isMetronomeEnabled])

  const toggleListenPlay = useCallback(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.unlock()
    }

    if (isPlaying) {
      setIsPlaying(false)
      setIsCountingIn(false)
      return
    }

    setIsCountingIn(false)
    const startFromBeat = currentBeatRef.current >= totalBeats ? 0 : currentBeatRef.current
    if (audioEngineRef.current) {
      audioEngineRef.current.stopAllSounds()
      playbackAudioStartRef.current = audioEngineRef.current.getCurrentTime() + 0.05
    }
    playbackBeatStartRef.current = startFromBeat
    currentBeatRef.current = startFromBeat
    setCurrentBeat(startFromBeat)
    scheduledMeasuresRef.current.clear()
    loopCountRef.current = 0
    lastChordIdxRef.current = -1
    lastTickBeatRef.current = -1
    setIsPlaying(true)
  }, [isPlaying, totalBeats])

  useEffect(() => {

    if (!isPlaying) return

    const stepIntervalMs = 25
    const fallbackWallStart = performance.now()
    const fallbackBeatStart = currentBeat

    const timer = setInterval(() => {
      if (audioEngineRef.current) {
        const currentAudioTime = audioEngineRef.current.getCurrentTime()
        const elapsedSec = currentAudioTime - playbackAudioStartRef.current
        const elapsedBeats = Math.max(0, elapsedSec) * (tempoBpm / 60)
        const totalElapsedBeats = playbackBeatStartRef.current + elapsedBeats
        const nextBeat = totalBeats > 0 ? totalElapsedBeats % totalBeats : 0
        currentBeatRef.current = nextBeat
        setCurrentBeat(nextBeat)
        loopCountRef.current = totalBeats > 0 ? Math.floor(totalElapsedBeats / totalBeats) : 0
      } else {
        const elapsedSec = (performance.now() - fallbackWallStart) / 1000
        const elapsedBeats = Math.max(0, elapsedSec) * (tempoBpm / 60)
        const totalElapsedBeats = fallbackBeatStart + elapsedBeats
        const nextBeat = totalBeats > 0 ? totalElapsedBeats % totalBeats : 0
        currentBeatRef.current = nextBeat
        setCurrentBeat(nextBeat)
        loopCountRef.current = totalBeats > 0 ? Math.floor(totalElapsedBeats / totalBeats) : 0
      }
    }, stepIntervalMs)

    return () => clearInterval(timer)

  }, [isPlaying, tempoBpm, totalBeats])

  useEffect(() => {

    if (!isPlaying) return

    const wholeBeat = Math.floor(currentBeat)

    if (wholeBeat !== lastTickBeatRef.current) {

      lastTickBeatRef.current = wholeBeat

      if (isMetronomeEnabled && audioEngineRef.current) {
        const isDownbeat = wholeBeat % beatsPerMeasure === 0
        const secondsPerBeat = 60 / tempoBpm
        const currentAudioTime = audioEngineRef.current.getCurrentTime()
        const elapsedSec = currentAudioTime - playbackAudioStartRef.current
        const elapsedBeats = Math.max(0, elapsedSec) * (tempoBpm / 60)
        const totalElapsedBeats = playbackBeatStartRef.current + elapsedBeats
        const currentLoop = totalBeats > 0 ? Math.floor(totalElapsedBeats / totalBeats) : 0
        const absoluteBeat = currentLoop * totalBeats + wholeBeat
        const beatAudioTime =
          playbackAudioStartRef.current +
          (absoluteBeat - playbackBeatStartRef.current) * secondsPerBeat
        const clickTime = Math.max(currentAudioTime, beatAudioTime)

        audioEngineRef.current.playClick(isDownbeat, clickTime)
      }

    }

    if (currentMeasureIdx !== lastChordIdxRef.current) {
      lastChordIdxRef.current = currentMeasureIdx
    }

    if (isBackingAudioEnabled && audioEngineRef.current && isPlaying) {
      const secondsPerBeat = 60 / tempoBpm
      const currentAudioTime = audioEngineRef.current.getCurrentTime()
      const totalMeasures = flowingProgression.length
      if (totalMeasures === 0 || totalBeats <= 0) return

      const currentLoop = loopCountRef.current

      // Precompute cumulative measure start beats
      const measureStartBeats: number[] = []
      let accumBeats = 0
      for (let i = 0; i < totalMeasures; i++) {
        measureStartBeats.push(accumBeats)
        accumBeats += flowingProgression[i]?.duration_beats ?? beatsPerMeasure
      }

      // Scan upcoming measures within lookahead horizon (scheduledAudioTime <= currentAudioTime + 2.5)
      let scanLoop = currentLoop
      let scanMIdx = currentMeasureIdx
      const maxScanSteps = Math.max(totalMeasures * 4, 64)

      for (let step = 0; step < maxScanSteps; step++) {
        const chord = flowingProgression[scanMIdx]
        if (!chord) break

        const chordDurationBeats = chord.duration_beats ?? beatsPerMeasure
        const measureStartBeat = measureStartBeats[scanMIdx] ?? 0
        const absoluteMeasureBeat = scanLoop * totalBeats + measureStartBeat
        const measureEndBeat = absoluteMeasureBeat + chordDurationBeats
        const beatDelta = absoluteMeasureBeat - playbackBeatStartRef.current
        const scheduledAudioTime = playbackAudioStartRef.current + beatDelta * secondsPerBeat

        // Lookahead horizon: do not scan beyond 2.5s ahead
        if (scheduledAudioTime > currentAudioTime + 2.5) {
          break
        }

        // Only schedule if this measure occurrence is active or upcoming relative to playback start
        if (measureEndBeat > playbackBeatStartRef.current) {
          const scheduleKey = `${scanLoop}_${scanMIdx}`

          if (!scheduledMeasuresRef.current.has(scheduleKey)) {
            const scheduleTime = Math.max(currentAudioTime, scheduledAudioTime)
            scheduledMeasuresRef.current.add(scheduleKey)

            // Prune old scheduled keys from previous loops to keep set bounded
            for (const key of Array.from(scheduledMeasuresRef.current)) {
              const keyLoop = parseInt(key.split('_')[0] ?? '0', 10)
              if (keyLoop < currentLoop) {
                scheduledMeasuresRef.current.delete(key)
              }
            }

            if (instrument === 'guitar') {
              const plucks = (chord as any).plucked_notes ?? (chord as any).pluckedNotes
              const hasMultiPlucks =
                Array.isArray(plucks) &&
                plucks.length > 0 &&
                plucks.some((p: any) => (p.beatOffset ?? 0) > 0)

              if (
                hasMultiPlucks ||
                (plucks && plucks.length > 0 && (!chord.strumEvents || chord.strumEvents.length === 0))
              ) {
                audioEngineRef.current.schedulePluckedNotes(
                  plucks,
                  scheduleTime,
                  secondsPerBeat
                )
              } else if (chord.strumEvents && chord.strumEvents.length > 0) {
                audioEngineRef.current.scheduleStrumPattern(
                  chord.expectedPitches,
                  chord.strumEvents,
                  scheduleTime,
                  secondsPerBeat,
                  secondsPerBeat * 1.5
                )
              } else {
                audioEngineRef.current.playGuitarStrum(
                  chord.expectedPitches,
                  'down',
                  true,
                  secondsPerBeat * chordDurationBeats,
                  scheduleTime
                )
              }
            } else if (instrument === 'piano') {
              if (
                chord.pianoVoicing &&
                Array.isArray(chord.pianoVoicing.lhPitches) &&
                Array.isArray(chord.pianoVoicing.rhPitches)
              ) {
                // Authentic accompaniment pattern (e.g. 3/4 Waltz Boom-Chick-Chick or ballad chord pulses)
                audioEngineRef.current.schedulePianoAccompaniment(
                  chord.pianoVoicing.lhPitches,
                  chord.pianoVoicing.rhPitches,
                  chordDurationBeats,
                  scheduleTime,
                  secondsPerBeat
                )
              } else {
                audioEngineRef.current.playChord(
                  chord.chordName,
                  chord.expectedPitches,
                  secondsPerBeat * chordDurationBeats,
                  'piano',
                  scheduleTime
                )
              }

              if (chord.melodyNotes && chord.melodyNotes.length > 0) {
                // Filter to melody notes when bass accompaniment is already handled by schedulePianoAccompaniment
                const melodyOnly = chord.melodyNotes.some((n) => n.clef === 'bass')
                  ? chord.melodyNotes.filter((n) => n.clef !== 'bass')
                  : chord.melodyNotes

                const toSchedule = melodyOnly.length > 0 ? melodyOnly : chord.melodyNotes
                audioEngineRef.current.schedulePianoNotes(
                  toSchedule,
                  scheduleTime,
                  secondsPerBeat
                )
              }
            }
          }
        }

        // Advance to next measure
        scanMIdx += 1
        if (scanMIdx >= totalMeasures) {
          scanMIdx = 0
          scanLoop += 1
        }
      }
    }

  }, [

    isPlaying,

    currentBeat,

    currentMeasureIdx,

    beatsPerMeasure,

    flowingProgression,

    isMetronomeEnabled,

    isBackingAudioEnabled,

    activeChord,

    instrument,

    tempoBpm,
    totalBeats,
  ])

  // ───────────────────────────────────────────────────────────────────────────

  // 4. PRACTICE TAKE SIMULATOR & EVALUATOR

  // ───────────────────────────────────────────────────────────────────────────

  const runDiagnosticPreset = useCallback(

    async (preset: DiagnosticPresetMode, openDrawer = false) => {

      setEvaluationError(null)

      setIsEvaluating(true)

      try {

        const chordCount = Math.min(8, flowingProgression.length)

        const slice = flowingProgression.slice(0, chordCount)
        const secondChord = slice[1]?.chordName || 'C'
        const thirdChord = slice[2]?.chordName || slice[0]?.chordName || 'Am'

        const simulatedOffsets: ChordMetricDto[] = slice.map((c, idx) => {

          if (preset === 'transition_lag' && idx === 2) {

            return {

              chord_index: idx,

              expected_chord: c.chordName,

              detected_chord: c.chordName,

              onset_error_ms: 142,

              voicing_completeness: 1.0,

              missed_notes: [],

              extra_notes: [],

              is_matched: true,

            }

          }

          if (preset === 'voicing_drop' && idx === 1) {

            const droppedPitch =

              c.pianoVoicing?.rhNotes?.[1] || c.pitchSpelling?.[1]?.note || 'E4'

            return {

              chord_index: idx,

              expected_chord: c.chordName,

              detected_chord: c.chordName,

              onset_error_ms: 12,

              voicing_completeness: 0.67,

              missed_notes: [droppedPitch],

              extra_notes: [],

              is_matched: true,

            }

          }

          if (preset === 'tempo_rushing') {

            return {

              chord_index: idx,

              expected_chord: c.chordName,

              detected_chord: c.chordName,

              onset_error_ms: idx === 0 ? -12 : -38 - (idx % 3) * 6,

              voicing_completeness: 1.0,

              missed_notes: [],

              extra_notes: [],

              is_matched: true,

            }

          }

          return {

            chord_index: idx,

            expected_chord: c.chordName,

            detected_chord: c.chordName,

            onset_error_ms: idx % 2 === 0 ? -4 : 3,

            voicing_completeness: 1.0,

            missed_notes: [],

            extra_notes: [],

            is_matched: true,

          }

        })

        const beatSec = 60 / Math.max(30, tempoBpm)
        let beatCursor = 1
        const playedEvents = slice.map((c, idx) => {
          const expectedSec = (beatCursor - 1) * beatSec
          beatCursor += c.duration_beats ?? beatsPerMeasure
          const offsetMs = simulatedOffsets[idx]?.onset_error_ms ?? 0
          const missedSet = new Set(simulatedOffsets[idx]?.missed_notes ?? [])
          const pitches = (c.expectedPitches || []).filter((p) => {
            if (missedSet.size === 0) return true
            const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            const pcName = `${names[((p % 12) + 12) % 12]}${Math.floor(p / 12) - 1}`
            return !missedSet.has(pcName)
          })
          return {
            chord: c.chordName,
            timestamp_sec: Number((expectedSec + offsetMs / 1000).toFixed(3)),
            pitches: pitches.length > 0 ? pitches : c.expectedPitches,
          }
        })

        const sess = await createPracticeSession(selectedSong.id, undefined, { tempoBpm })
        const evalResp = await submitChordsTake(sess.id, playedEvents, undefined, tempoBpm)

        const rawDrill = evalResp.coaching_report?.tailored_drills?.[0]
        if (rawDrill) {
          const isoBpm = Math.max(40, Math.round(rawDrill.target_tempo * 0.7))
          setGeneratedDrill({
            id: `drill_${sess.id}`,
            user_id: sess.user_id || 'user',
            pattern_id: `pat_${sess.id}`,
            drill_type: rawDrill.drill_type,
            target_tempo: rawDrill.target_tempo,
            target_repetitions: rawDrill.target_repetitions,
            completed: false,
            measured_improvement: null,
            progression: [
              { name: secondChord, beats: beatsPerMeasure },
              { name: thirdChord, beats: beatsPerMeasure },
            ],
            tempo_stages: {
              isolation_bpm: isoBpm,
              step_bpm: Math.max(45, Math.round(rawDrill.target_tempo * 0.85)),
              target_bpm: rawDrill.target_tempo,
              goal_bpm: Math.min(220, Math.round(rawDrill.target_tempo * 1.05)),
            },
            description: rawDrill.description,
          })
        } else {
          setGeneratedDrill(null)
        }

        setEvaluationResult(evalResp)

        try {
          const updatedHabits = await fetchUserHabits()
          setActiveHabits(updatedHabits)
        } catch {
          // Habits refresh is non-blocking
        }

        onTakeCompleted?.(evalResp, selectedSong.title, instrument, tempoBpm)

        if (openDrawer) {
          setIsTakeDrawerOpen(true)
        }

      } catch (err: unknown) {

        const msg = err instanceof Error ? err.message : 'Backend take evaluation failed.'

        setEvaluationError(msg)

      } finally {

        setIsEvaluating(false)

      }

    },

    [flowingProgression, selectedSong.id, selectedSong.title, instrument, tempoBpm, beatsPerMeasure, onTakeCompleted]

  )

  // ───────────────────────────────────────────────────────────────────────────

  // 5. MICROPHONE TAKE CAPTURE

  // ───────────────────────────────────────────────────────────────────────────

  const startMicRecording = useCallback(async () => {

    if (!isSignedIn) {

      onRequestSignIn?.()

      setEvaluationError('Sign in to record your take, unlock AI chord feedback, and save your practice history.')

      return

    }

    try {

      setEvaluationError(null)

      const sess = await createPracticeSession(selectedSong.id, undefined, { tempoBpm })

      activeSessionIdRef.current = sess.id

      const stream = await navigator.mediaDevices.getUserMedia({

        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },

      })

      mediaStreamRef.current = stream

      const AudioCtx =

        window.AudioContext ||

        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

      const ctx = new AudioCtx()

      const actualSampleRate = ctx.sampleRate || 44100

      recordedSampleRateRef.current = actualSampleRate

      const source = ctx.createMediaStreamSource(stream)

      const analyser = ctx.createAnalyser()

      analyser.fftSize = 2048

      source.connect(analyser)

      const processor = ctx.createScriptProcessor(4096, 1, 1)

      analyser.connect(processor)

      // Safe muted output: keeps Web Audio graph running without routing mic to speakers

      const muteGain = ctx.createGain()

      muteGain.gain.setValueAtTime(0, ctx.currentTime)

      processor.connect(muteGain)

      muteGain.connect(ctx.destination)

      const tracker = new RealtimePitchTracker(actualSampleRate)

      const bufferLength = analyser.frequencyBinCount

      const freqData = new Float32Array(bufferLength)

      const binHz = actualSampleRate / 2 / bufferLength

      recordedSamplesRef.current = []
      recordingStartMsRef.current = performance.now()
      downbeatMsRef.current = 0

      processor.onaudioprocess = (e) => {

        const inputData = e.inputBuffer.getChannelData(0)

        recordedSamplesRef.current.push(new Float32Array(inputData))

        analyser.getFloatFrequencyData(freqData)

        // Monophonic pitch tracking

        const pitchRes = tracker.detectPitch(inputData)

        const rms = tracker.computeRmsDb(inputData)

        // 12-semitone polyphonic chromagram extraction

        const instantChroma = new Array(12).fill(0)

        const minBin = Math.max(2, Math.floor(65 / binHz))

        const maxBin = Math.min(bufferLength - 2, Math.ceil(1400 / binHz))

        let maxDbInZone = -100

        for (let b = minBin; b <= maxBin; b++) {

          const db = freqData[b] ?? -100

          if (db > maxDbInZone) maxDbInZone = db

        }

        const peakThreshold = Math.max(-60, maxDbInZone - 28)

        for (let b = minBin; b <= maxBin; b++) {

          const prev = freqData[b - 1] ?? -100

          const curr = freqData[b] ?? -100

          const next = freqData[b + 1] ?? -100

          if (curr > prev && curr > next && curr > peakThreshold) {

            const alpha = Math.pow(10, (prev + 100) / 20)

            const beta = Math.pow(10, (curr + 100) / 20)

            const gamma = Math.pow(10, (next + 100) / 20)

            const denom = alpha - 2 * beta + gamma

            const delta = denom !== 0 ? (0.5 * (alpha - gamma)) / denom : 0

            const trueFreq = (b + delta) * binHz

            if (trueFreq >= 65 && trueFreq <= 1400) {

              const midi = 69 + 12 * Math.log2(trueFreq / 440)

              const pc = ((Math.round(midi) % 12) + 12) % 12

              instantChroma[pc] += beta

            }

          }

        }

        const chordMatch = chromaToChord(instantChroma)

        // Real polyphonic or single-note voicing completeness against currently active chord/pluck/melody
        const currentTarget = activeChordRef.current
        const plucks = currentTarget?.plucked_notes ?? currentTarget?.pluckedNotes
        const melodies = currentTarget?.melodyNotes
        let targetPcs = currentTarget?.pitchClasses || []
        let isSingleNoteMatch = false

        if (instrument === 'guitar' && plucks && plucks.length > 0) {
          const mDuration = currentTarget.duration_beats ?? beatsPerMeasure
          const curBeat = currentBeatRef.current
          let mStart = 0
          for (let m = 0; m < currentMeasureIdx; m++) {
            mStart += flowingProgression[m]?.duration_beats ?? beatsPerMeasure
          }
          const offsetInMeasure = Math.max(0, curBeat - mStart)
          const sorted = [...plucks].sort((a, b) => a.beatOffset - b.beatOffset)
          let activePluck = sorted[0]
          for (let i = 0; i < sorted.length; i++) {
            const nextOffset = i + 1 < sorted.length ? sorted[i + 1].beatOffset : mDuration
            if (offsetInMeasure >= sorted[i].beatOffset && offsetInMeasure < nextOffset) {
              activePluck = sorted[i]
              break
            }
          }
          if (activePluck && activePluck.fret !== 'x') {
            targetPcs = [activePluck.pitch % 12]
            isSingleNoteMatch = true
          }
        } else if (instrument === 'piano' && melodies && melodies.length > 0) {
          const mDuration = currentTarget.duration_beats ?? beatsPerMeasure
          const curBeat = currentBeatRef.current
          let mStart = 0
          for (let m = 0; m < currentMeasureIdx; m++) {
            mStart += flowingProgression[m]?.duration_beats ?? beatsPerMeasure
          }
          const offsetInMeasure = Math.max(0, curBeat - mStart)
          const sorted = [...melodies].sort((a, b) => a.beatOffset - b.beatOffset)
          let activeNote = sorted[0]
          for (let i = 0; i < sorted.length; i++) {
            const nextOffset = i + 1 < sorted.length ? sorted[i + 1].beatOffset : mDuration
            if (offsetInMeasure >= sorted[i].beatOffset && offsetInMeasure < nextOffset) {
              activeNote = sorted[i]
              break
            }
          }
          if (activeNote) {
            const midi = typeof activeNote.pitch === 'number' ? activeNote.pitch : noteToMidi(activeNote.pitch)
            targetPcs = [midi % 12]
            isSingleNoteMatch = true
          }
        }

        const maxChromaVal = Math.max(...instantChroma)
        const activeThreshold = Math.max(0.05, maxChromaVal * 0.25)
        let matchedPcs: number[] = []
        let missingPcs: number[] = []
        let voicingCompleteness = 1.0

        if (isSingleNoteMatch && pitchRes) {
          const detectedMidi = Math.round(69 + 12 * Math.log2(pitchRes.freq / 440))
          const detectedPc = ((detectedMidi % 12) + 12) % 12
          if (targetPcs.includes(detectedPc)) {
            matchedPcs = targetPcs
            missingPcs = []
            voicingCompleteness = 1.0
          } else {
            matchedPcs = []
            missingPcs = targetPcs
            voicingCompleteness = 0.0
          }
        } else {
          matchedPcs = targetPcs.filter((pc) => (instantChroma[pc] ?? 0) >= activeThreshold)
          missingPcs = targetPcs.filter((pc) => !matchedPcs.includes(pc))
          voicingCompleteness = targetPcs.length > 0 ? matchedPcs.length / targetPcs.length : 1.0
        }

        if (pitchRes || chordMatch.chord !== 'None' || rms > -45) {

          setLivePitchResult({

            detectedFreqHz: pitchRes?.freq ?? (chordMatch.chord !== 'None' ? 220 : null),

            detectedNote: chordMatch.chord !== 'None' ? chordMatch.chord : (pitchRes?.note ?? null),

            centsDeviation: pitchRes?.cents ?? 0,

            rmsDb: rms,

            voicingCompleteness: Math.round(voicingCompleteness * 100) / 100,

            matchedPitchClasses: matchedPcs,

            missingPitchClasses: missingPcs,

            timingDeltaMs: 0,

            isSoundDetected: rms > -45,

            clarityScore: chordMatch.confidence || (pitchRes?.clarity ?? 0.5),

          })

        }

      }

      scriptProcessorRef.current = processor

      setIsRecordingMic(true)

      setMicSeconds(0)

      recordingTimerRef.current = window.setInterval(() => {

        setMicSeconds((s) => s + 1)

      }, 1000)

    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? `Unable to start practice session (${err.message}).`
          : 'Microphone permission denied or audio device unavailable.'
      setEvaluationError(msg)
    }

  }, [selectedSong.id, tempoBpm, isSignedIn, onRequestSignIn])

  const stopMicAndSubmitTake = useCallback(async () => {

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)

    if (scriptProcessorRef.current) {

      scriptProcessorRef.current.disconnect()

      scriptProcessorRef.current = null

    }

    if (mediaStreamRef.current) {

      mediaStreamRef.current.getTracks().forEach((t) => t.stop())

      mediaStreamRef.current = null

    }

    setIsRecordingMic(false)

    setIsPlaying(false)

    setIsEvaluating(true)

    setEvaluationError(null)

    try {

      const chunks = recordedSamplesRef.current

      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0)

      if (totalLen === 0) {

        throw new Error('No audio frames were recorded from the microphone.')

      }

      const merged = new Float32Array(totalLen)

      let offset = 0

      chunks.forEach((c) => {

        merged.set(c, offset)

        offset += c.length

      })

      const sampleRate = recordedSampleRateRef.current || 44100
      let audioToEncode = merged
      let leadInSec = 0

      if (downbeatMsRef.current > recordingStartMsRef.current) {
        const leadInMs = downbeatMsRef.current - recordingStartMsRef.current
        const rawLeadInSec = leadInMs / 1000
        // Retain 100ms pre-roll before the downbeat so transients on Beat 1 aren't cut
        const preRollSec = 0.1
        const cutSample = Math.max(0, Math.floor((rawLeadInSec - preRollSec) * sampleRate))
        if (cutSample < merged.length) {
          audioToEncode = merged.subarray(cutSample)
          leadInSec = Math.max(0, cutSample > 0 ? preRollSec : rawLeadInSec)
        }
      }

      const wavBlob = encodeMonoWav(audioToEncode, sampleRate)

      const sessionId = activeSessionIdRef.current

      if (!sessionId) {

        throw new Error('Practice session was not initialized.')

      }

      const evalResp = await uploadSessionTake(sessionId, wavBlob, undefined, leadInSec, tempoBpm)

      setEvaluationResult(evalResp)

      onTakeCompleted?.(evalResp, selectedSong.title, instrument, tempoBpm)

      if (evalResp.coaching_report?.tailored_drills?.[0]) {

        const d = evalResp.coaching_report.tailored_drills[0]

        const isoBpm = Math.max(40, Math.round(d.target_tempo * 0.7))

        setGeneratedDrill({

          id: `drill_${Date.now()}`,

          user_id: 'user',

          pattern_id: 'pattern_transition',

          drill_type: d.drill_type,

          target_tempo: d.target_tempo,

          target_repetitions: d.target_repetitions,

          completed: false,

          measured_improvement: null,

          tempo_stages: {

            isolation_bpm: isoBpm,

            step_bpm: Math.round(d.target_tempo * 0.85),

            target_bpm: d.target_tempo,

            goal_bpm: Math.round(d.target_tempo * 1.05),

          },

          description: d.description,

        })

      }

      setIsTakeDrawerOpen(true)

    } catch (err: unknown) {

      const msg = err instanceof Error ? err.message : 'Take evaluation failed.'

      setEvaluationError(msg)

    } finally {

      setIsEvaluating(false)

    }

  }, [selectedSong.title, instrument, tempoBpm, onTakeCompleted])

  const handleSelectSong = (song: ExerciseDto) => {

    prevInitialSongIdRef.current = song.id

    setSelectedSong(song)

    setInstrument(song.instrument.toLowerCase() === 'guitar' ? 'guitar' : 'piano')

    setTempoBpm(song.tempo_bpm || 76)

    setCurrentBeat(0)

    setIsPlaying(false)

    setActiveDrillSlice(null)

    onSelectSong?.(song.id)

  }

  const handleLaunchDrillLoop = (drill: AdaptiveInterventionDto) => {

    const first = activeChord?.chordName || flowingProgression[0]?.chordName || 'Am'

    const second = nextChord?.chordName || flowingProgression[1]?.chordName || 'C'

    const isoBpm = drill.tempo_stages?.isolation_bpm ?? Math.max(44, Math.round(tempoBpm * 0.7))

    const firstBeats = activeChord?.duration_beats ?? beatsPerMeasure

    const secondBeats = nextChord?.duration_beats ?? beatsPerMeasure

    const enrichedDrill: AdaptiveInterventionDto = {

      ...drill,

      progression:

        drill.progression && drill.progression.length > 0

          ? drill.progression

          : [

              { name: first, beats: firstBeats },

              { name: second, beats: secondBeats },

            ],

      tempo_stages: drill.tempo_stages ?? {

        isolation_bpm: isoBpm,

        step_bpm: Math.round(tempoBpm * 0.85),

        target_bpm: tempoBpm,

        goal_bpm: Math.round(tempoBpm * 1.05),

      },

    }

    setActiveDrillSlice(enrichedDrill)

    setTempoBpm(isoBpm)

    handleSeekBeat(0)

    setIsPlaying(true)

  }

  const toggleQuickLoopCurrentPair = () => {

    if (activeDrillSlice) {

      setActiveDrillSlice(null)

      setTempoBpm(selectedSong.tempo_bpm || 76)

      handleSeekBeat(0)

      return

    }

    const baseBpm = selectedSong.tempo_bpm || 76

    const isoBpm = Math.max(40, Math.round(baseBpm * 0.7))

    const firstBeats = activeChord?.duration_beats ?? beatsPerMeasure

    const secondBeats = nextChord?.duration_beats ?? beatsPerMeasure

    setActiveDrillSlice({

      id: `loop_${Date.now()}`,

      user_id: 'user',

      pattern_id: 'manual_loop',

      drill_type: 'isolated_transition',

      target_tempo: isoBpm,

      target_repetitions: 6,

      completed: false,

      measured_improvement: null,

      progression: [

        { name: activeChord.chordName, beats: firstBeats },

        { name: nextChord.chordName, beats: secondBeats },

      ],

      tempo_stages: {

        isolation_bpm: isoBpm,

        step_bpm: Math.round(baseBpm * 0.85),

        target_bpm: baseBpm,

        goal_bpm: Math.round(baseBpm * 1.05),

      },

      description: `Looping ${activeChord.chordName} ↔ ${nextChord.chordName}`,

    })

    setTempoBpm(isoBpm)

    handleSeekBeat(0)

  }

  const baseSongBpm = selectedSong.tempo_bpm || 76

  return (

    <div

      data-testid="practice-studio-cockpit"

      className={`min-h-screen w-full flex flex-col bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans select-none transition-colors ${className}`}

    >

      {/* ─────────────────────────────────────────────────────────────
          1. PRACTICE COCKPIT ACTION STRIP (Piece & Notation Selection)
          (Only rendered standalone; when embedded in App, integrated into global sticky header)
         ───────────────────────────────────────────────────────────── */}
      {!embedded && (
        <div className="w-full bg-white dark:bg-[#111114] border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 z-30 shrink-0">

        {/* Left: Piece Title Drawer Trigger & Key Info */}

        <div className="flex items-center gap-2.5 min-w-0">

          <span className="font-brand font-bold tracking-[0.15em] text-amber-600 dark:text-amber-500 text-xs shrink-0">
            § SONUS
          </span>

          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

          <button

            type="button"

            data-testid="open-repertoire-drawer"

            onClick={() => setIsRepertoireOpen(true)}

            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 border border-zinc-300 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer truncate"

          >

            <span className="text-amber-600 dark:text-amber-400 truncate max-w-[150px] sm:max-w-[260px]">

              {selectedSong.title}

            </span>

            <span className="text-[10px] text-zinc-400">▾</span>

          </button>

          <span className="hidden sm:inline text-[11px] font-mono text-zinc-500 shrink-0">

            Key: <strong className="text-zinc-700 dark:text-zinc-300">{selectedSong.progression?.key || 'C'}</strong>

          </span>

          {selectedSong.artist && (

            <span className="hidden md:inline text-[11px] font-mono text-zinc-400 shrink-0">

              • {selectedSong.artist}

            </span>

          )}

        </div>

        {/* Right: Studio Mode, Instrument Mode & Notation Mode Toggles */}

        <div className="flex items-center gap-2 shrink-0 ml-auto">

          {/* Studio Mode Selector: Listen vs Practice */}
          <div className="flex items-center rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 p-0.5 text-xs font-mono">
            <button
              type="button"
              data-testid="mode-listen-btn"
              onClick={() => {
                setStudioMode('listen')
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                studioMode === 'listen'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>🎧 Listen</span>
            </button>
            <button
              type="button"
              data-testid="mode-practice-btn"
              onClick={() => setStudioMode('practice')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                studioMode === 'practice'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>🎯 Practice</span>
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 p-0.5 text-xs font-mono">

            <button

              type="button"

              data-testid="toggle-inst-guitar"

              onClick={() => setInstrument('guitar')}

              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${

                instrument === 'guitar'

                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'

                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

              }`}

            >

              GUITAR

            </button>

            <button

              type="button"

              data-testid="toggle-inst-piano"

              onClick={() => setInstrument('piano')}

              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${

                instrument === 'piano'

                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'

                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

              }`}

            >

              PIANO

            </button>

          </div>

          {instrument === 'piano' && (

            <div

              data-testid="piano-notation-toggle"

              className="flex items-center rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 p-0.5 text-xs font-mono"

            >

              <button

                type="button"

                onClick={() => setPianoNotationMode('keys')}

                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${

                  pianoNotationMode === 'keys'

                    ? 'bg-amber-500 text-zinc-950 font-bold'

                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

                }`}

              >

                FALLING KEYS

              </button>

              <button

                type="button"

                onClick={() => setPianoNotationMode('staff')}

                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${

                  pianoNotationMode === 'staff'

                    ? 'bg-amber-500 text-zinc-950 font-bold'

                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

                }`}

              >

                SHEET MUSIC

              </button>

            </div>

          )}

        </div>

      </div>
      )}

      {/* Active 2-Bar Loop Banner (when practicing an isolated transition) */}

      {activeDrillSlice && (

        <div className="w-full py-2 bg-amber-500/15 border-b border-amber-500/40 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs font-mono z-25 shrink-0">

          <div className="flex items-center gap-2.5">

            <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold text-[10px] uppercase">

              2-BAR TRANSITION LOOP ACTIVE

            </span>

            <span className="text-zinc-900 dark:text-amber-300 font-bold">

              {activeDrillSlice.progression?.map((p) => p.name).join(' ↔ ')}

            </span>

            <span className="hidden md:inline text-zinc-600 dark:text-zinc-400 text-[11px]">

              — Step up the speed as your fingers settle cleanly

            </span>

          </div>

          {activeDrillSlice.tempo_stages && (

            <div className="flex items-center gap-1.5">

              {[

                { label: '70% Slow', bpm: activeDrillSlice.tempo_stages.isolation_bpm },

                { label: '85% Step', bpm: activeDrillSlice.tempo_stages.step_bpm },

                { label: '100% Tempo', bpm: activeDrillSlice.tempo_stages.target_bpm },

                { label: '105% Mastery', bpm: activeDrillSlice.tempo_stages.goal_bpm },

              ].map((st) => (

                <button

                  key={st.label}

                  type="button"

                  onClick={() => setTempoBpm(st.bpm)}

                  className={`px-2.5 py-1 rounded text-[10px] border transition-colors cursor-pointer ${

                    tempoBpm === st.bpm

                      ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold'

                      : 'bg-white dark:bg-[#09090B] text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-800 hover:border-amber-500'

                  }`}

                >

                  {st.label} ({st.bpm})

                </button>

              ))}

              <button

                type="button"

                onClick={() => {

                  setActiveDrillSlice(null)

                  setTempoBpm(selectedSong.tempo_bpm || 76)

                  setCurrentBeat(0)

                }}

                className="ml-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1 text-[10px] cursor-pointer"

              >

                <X className="size-3" />

                <span>Full Song</span>

              </button>

            </div>

          )}

        </div>

      )}

      {/* ─────────────────────────────────────────────────────────────

          2. MAIN SCORE & MEASURE LOOP STAGE

         ───────────────────────────────────────────────────────────── */}

      <main className="relative w-full flex-1 flex flex-col justify-between bg-[#F8F8F6] dark:bg-[#09090B] transition-colors">

        {/* Stage Status & Quick 2-Bar Loop Control Strip */}

        <div className="w-full px-4 sm:px-6 py-2 bg-white/70 dark:bg-[#111114]/70 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">

          <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">

            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

            <span className="uppercase font-bold text-zinc-900 dark:text-zinc-100">

              {instrument === 'piano'

                ? pianoNotationMode === 'keys'

                  ? 'PIANO • SYNTHESIA WATERFALL ROLL'

                  : 'PIANO • FLOWING GRAND STAFF'

                : 'GUITAR • 6-STRING CONTINUOUS TAB'}

            </span>

            <span>•</span>

            <span>

              Bar {currentMeasureIdx + 1} of {flowingProgression.length} ({activeChord.chordName} → {nextChord.chordName})

            </span>

          </div>

          {/* Measure Loop Bracket Button */}

          <div className="flex items-center gap-2">

            <button

              type="button"

              data-testid="toggle-loop-pair-btn"

              onClick={toggleQuickLoopCurrentPair}

              className={`px-3 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${

                activeDrillSlice

                  ? 'bg-amber-500 text-zinc-950 border-amber-500'

                  : 'bg-white dark:bg-[#18181C] text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-amber-500'

              }`}

            >

              <Repeat className="size-3.5" />

              <span>

                {activeDrillSlice

                  ? 'Exit 2-Bar Loop (Return to Full Song)'

                  : `Loop This Change (${activeChord.chordName} ↔ ${nextChord.chordName})`}

              </span>

            </button>

          </div>

        </div>

        {/* Primary Flowing Stand */}

        <div className="relative w-full flex flex-col justify-center">

          <FlowingNotationStand

            instrument={instrument}

            progression={flowingProgression}

            currentBeat={currentBeat}

            tempoBpm={tempoBpm}

            isPlaying={isPlaying}

            isCountingIn={isCountingIn}

            countInBeat={countInBeat}

            activeHitResult={livePitchResult}

            chordMetrics={evaluationResult?.chord_metrics}

            beatsPerMeasure={beatsPerMeasure}

            timeSignature={songTimeSignature}

            keySignature={selectedSong.progression?.key}

            pianoNotationMode={pianoNotationMode}

            hideWatermark={true}

            onKeyClick={(midi) => {

              if (audioEngineRef.current) {

                audioEngineRef.current.unlock()

                audioEngineRef.current.stopAllSounds()

                audioEngineRef.current.playPianoNote(midi, 1.2, 0.8)

              }

            }}

            onSeekBeat={handleSeekBeat}

            className="w-full"

          />

        </div>

        {/* Interactive Measure Progression & Feedback Strip */}

        <div className="w-full py-2 bg-white dark:bg-[#111114] border-t border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between text-xs font-mono z-20 shrink-0 gap-4">

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-2">

            <span className="text-zinc-500 uppercase text-[10px] tracking-wider font-semibold shrink-0">

              CLICK ANY BAR TO JUMP:

            </span>

            <div className="flex items-center gap-1.5 shrink-0">

              {flowingProgression.map((chord, idx) => {

                const isCurrent = idx === currentMeasureIdx

                let startBeat = 0

                for (let j = 0; j < idx; j++) {

                  startBeat += flowingProgression[j]?.duration_beats ?? beatsPerMeasure

                }

                const metric = evaluationResult?.chord_metrics?.[idx]

                const hasError = Boolean(

                  metric &&

                    ((metric.missed_notes && metric.missed_notes.length > 0) ||

                      metric.onset_error_ms >= 80)

                )

                const hasDrift = Boolean(metric && Math.abs(metric.onset_error_ms) >= 30)

                return (

                  <button

                    key={`${chord.chordName}-${idx}`}

                    type="button"

                    onClick={() => handleSeekBeat(startBeat)}

                    className={`px-2.5 py-1 rounded-md text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${

                      isCurrent

                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'

                        : hasError

                        ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/40'

                        : hasDrift

                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40'

                        : metric

                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'

                        : 'bg-[#F8F8F6] dark:bg-[#18181C] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50'

                    }`}

                  >

                    <span className="text-[10px] opacity-65">M{idx + 1}</span>

                    <span className="font-bold">{chord.chordName}</span>

                    {metric && (

                      <span className="text-[9px]">

                        {metric.missed_notes?.length

                          ? `Missed ${metric.missed_notes[0]}`

                          : `${metric.onset_error_ms >= 0 ? '+' : ''}${Math.round(metric.onset_error_ms)}ms`}

                      </span>

                    )}

                  </button>

                )

              })}

            </div>

          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-zinc-500 shrink-0 pl-3 border-l border-zinc-200 dark:border-zinc-800 tabular-nums">

            <span>{totalBeats} BEATS TOTAL</span>

          </div>

        </div>

      </main>

      {/* ─────────────────────────────────────────────────────────────

          3. MUSICIAN'S PRACTICE DOCK: HAND PREPARATION & PRACTICE COACH

         ───────────────────────────────────────────────────────────── */}

      <footer

        role="contentinfo"

        className="w-full bg-white dark:bg-[#111114] border-t border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 shrink-0 z-30"

      >

        {/* LEFT 7 COLS: CURRENT CHORD → NEXT CHORD HAND PREPARATION DOCK */}

        <div

          data-testid="hand-preparation-dock"

          className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-4 flex flex-col justify-between gap-3"

        >

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">

            <div className="flex items-center gap-2">

              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500 font-bold">

                HAND PREPARATION GUIDE

              </span>

              <span className="text-xs font-sans text-zinc-500">

                — See both your current chord and the upcoming chord so your fingers can prepare early

              </span>

            </div>

            {livePitchResult?.isSoundDetected && (

              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">

                Mic Heard: {livePitchResult.detectedNote} ({livePitchResult.centsDeviation >= 0 ? '+' : ''}

                {Math.round(livePitchResult.centsDeviation)}¢)

              </span>

            )}

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">

            {/* Current Chord Shape */}

            <div className="sm:col-span-5 rounded-lg border border-amber-500/50 bg-white dark:bg-[#121215] p-3 flex flex-col justify-between">

              <div className="flex items-center justify-between mb-1">

                <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">

                  NOW PLAYING (BAR {currentMeasureIdx + 1})

                </span>

                <span className="font-brand text-lg font-bold text-zinc-900 dark:text-zinc-100">

                  {activeChord.chordName}

                </span>

              </div>

              <ActiveVoicingDisplay

                instrument={instrument}

                chordName={activeChord.chordName}

                guitarTab={activeChord.guitarTab}

                pianoVoicing={activeChord.pianoVoicing}

                activePitches={activeChord.expectedPitches}

                showModeSelector={false}

                defaultViewMode="keyboard"

                onKeyClick={handleCockpitKeyClick}

              />

            </div>

            {/* Transition Arrow */}

            <div className="sm:col-span-1 flex sm:flex-col items-center justify-center gap-1 text-zinc-400 font-mono text-[10px]">

              <ArrowRight className="size-5 text-amber-500" />

              <span>SHIFT</span>

            </div>

            {/* Upcoming Next Chord Shape */}

            <div className="sm:col-span-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-3 flex flex-col justify-between opacity-95">

              <div className="flex items-center justify-between mb-1">

                <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">

                  PREPARE NEXT (BAR {nextMeasureIdx + 1})

                </span>

                <span className="font-brand text-lg font-bold text-zinc-800 dark:text-zinc-200">

                  {nextChord.chordName}

                </span>

              </div>

              <ActiveVoicingDisplay

                instrument={instrument}

                chordName={nextChord.chordName}

                guitarTab={nextChord.guitarTab}

                pianoVoicing={nextChord.pianoVoicing}

                activePitches={nextChord.expectedPitches}

                showModeSelector={false}

                defaultViewMode="keyboard"

                onKeyClick={handleCockpitKeyClick}

              />

            </div>

          </div>

        </div>

        {/* RIGHT 5 COLS: PRACTICE SPEED, TRANSPORT & MISTAKE COACH */}

        <div className="lg:col-span-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-4 flex flex-col justify-between gap-3">

          {/* Speed Presets & Audio Toggles */}

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5 font-mono text-xs">

            <div className="flex items-center gap-1">

              <span className="text-[10px] text-zinc-500 mr-1">SPEED:</span>

              {[

                { label: '70% Slow', bpm: Math.max(40, Math.round(baseSongBpm * 0.7)) },

                { label: '85% Med', bpm: Math.max(45, Math.round(baseSongBpm * 0.85)) },

                { label: '100%', bpm: baseSongBpm },

              ].map((sp) => (

                <button

                  key={sp.label}

                  type="button"

                  onClick={() => setTempoBpm(sp.bpm)}

                  className={`px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer ${

                    tempoBpm === sp.bpm

                      ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold'

                      : 'bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-amber-500'

                  }`}

                >

                  {sp.label}

                </button>

              ))}

            </div>

            {/* Fine BPM Stepper & Metronome/Audio Toggles */}

            <div className="flex items-center gap-1.5">

              <div className="flex items-center gap-1 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-lg">

                <button

                  type="button"

                  onClick={() => setTempoBpm((b) => Math.max(40, b - 2))}

                  className="w-5 h-5 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"

                >

                  -

                </button>

                <span className="font-bold text-amber-600 dark:text-amber-400 w-8 text-center tabular-nums">

                  {tempoBpm}

                </span>

                <span className="text-[9px] text-zinc-500">BPM</span>

                <button

                  type="button"

                  onClick={() => setTempoBpm((b) => Math.min(240, b + 2))}

                  className="w-5 h-5 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"

                >

                  +

                </button>

              </div>

              <button

                type="button"

                data-testid="toggle-metronome"

                onClick={() => setIsMetronomeEnabled((v) => !v)}

                className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${

                  isMetronomeEnabled

                    ? 'bg-white dark:bg-[#18181C] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'

                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-400'

                }`}

              >

                {isMetronomeEnabled ? 'Click ON' : 'Click OFF'}

              </button>

              <button

                type="button"

                data-testid="toggle-backing-audio"

                onClick={() => setIsBackingAudioEnabled((v) => !v)}

                className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${

                  isBackingAudioEnabled

                    ? 'bg-white dark:bg-[#18181C] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'

                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-400'

                }`}

              >

                {isBackingAudioEnabled ? 'Chords ON' : 'Chords OFF'}

              </button>

            </div>

          </div>

          {/* Primary Play / Record Controls */}

          <div className="flex items-center gap-2">

            <button

              type="button"

              data-testid="stand-play-toggle"

              onClick={() => {

                if (isPlaying) {

                  setIsPlaying(false)

                } else if (studioMode === 'listen') {

                  toggleListenPlay()

                } else {

                  startCountInThenPlay()

                }

              }}

              className={`flex-1 py-2.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${

                isPlaying

                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'

                  : studioMode === 'listen'

                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-xs'

                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'

              }`}

            >

              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}

              <span>

                {isPlaying

                  ? (studioMode === 'listen' ? 'Pause Song' : 'Pause Score')

                  : (studioMode === 'listen' ? 'Play Song (Listen)' : 'Play Along')}

              </span>

            </button>

            <button

              type="button"

              onClick={() => {

                setIsPlaying(false)

                setCurrentBeat(0)

              }}

              title="Restart from Measure 1"

              className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#18181C] text-zinc-700 dark:text-zinc-300 hover:border-amber-500 transition-colors cursor-pointer"

            >

              <RotateCcw className="size-4" />

            </button>

            {studioMode === 'listen' ? (

              <div

                data-testid="listen-mode-indicator"

                className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#18181C] text-[11px] font-mono text-zinc-500 flex items-center justify-center gap-1.5 select-none"

              >

                <span>🎧 Listen Mode (Score Preview)</span>

              </div>

            ) : !isRecordingMic ? (

              <button

                type="button"

                data-testid="record-take-btn"

                disabled={isEvaluating}

                onClick={async () => {

                  if (!isSignedIn) {

                    onRequestSignIn?.()

                    setEvaluationError('Sign in to record your take, unlock AI chord feedback, and save your practice history.')

                    return

                  }

                  await startMicRecording()

                  if (!isPlaying) {

                    startCountInThenPlay()

                  }

                }}

                className="flex-1 py-2.5 px-4 rounded-xl bg-[#C5A059] hover:bg-[#b58f48] text-[#141312] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"

              >

                <Mic className="size-4" />

                <span>{isEvaluating ? 'Checking...' : 'Record Take'}</span>

              </button>

            ) : (

              <button

                type="button"

                data-testid="stop-take-btn"

                onClick={stopMicAndSubmitTake}

                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-400 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 animate-pulse cursor-pointer"

              >

                <span>Stop &amp; Check ({micSeconds}s)</span>

              </button>

            )}

          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">

            {isDevHarnessVisible && (
              <details className="text-[10px] font-mono text-zinc-400 group">
                <summary className="cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors list-none flex items-center justify-between py-0.5">
                  <span className="uppercase tracking-wider font-semibold text-[9px] text-zinc-500">Developer Diagnostic Signal Harness</span>
                  <span className="text-[8px] text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-1.5 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                    PRESET TAKE INJECTION:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
                    <button
                      type="button"
                      data-testid="simulate-clean-take"
                      onClick={() => runDiagnosticPreset('clean', true)}
                      className="px-2 py-1 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-bold cursor-pointer"
                    >
                      Clean Take
                    </button>
                    <button
                      type="button"
                      data-testid="inject-transition-lag"
                      onClick={() => runDiagnosticPreset('transition_lag', false)}
                      className="px-2 py-1 rounded border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/20 font-bold cursor-pointer"
                    >
                      Late Change (+142ms)
                    </button>
                    <button
                      type="button"
                      data-testid="inject-voicing-drop"
                      onClick={() => runDiagnosticPreset('voicing_drop', false)}
                      className="px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-bold cursor-pointer"
                    >
                      Missed 3rd
                    </button>
                    <button
                      type="button"
                      data-testid="inject-tempo-rushing"
                      onClick={() => runDiagnosticPreset('tempo_rushing', false)}
                      className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#18181C] text-zinc-700 dark:text-zinc-300 hover:border-amber-500 cursor-pointer"
                    >
                      Rushing (-38ms)
                    </button>
                  </div>
                </div>
              </details>
            )}

          {/* Live Mistake Coach Banner */}

            {evaluationError ? (

              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">

                <AlertCircle className="size-4 shrink-0" />

                <span className="truncate">{evaluationError}</span>

              </div>

            ) : evaluationResult ? (

              <div className="px-3 py-2 rounded-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs">

                <div className="min-w-0">

                  <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {(evaluationResult.overall_accuracy <= 1.0
                      ? evaluationResult.overall_accuracy * 100
                      : evaluationResult.overall_accuracy
                    ).toFixed(1)}% —{' '}
                    {evaluationResult.coaching_report?.primary_bottleneck}
                  </div>

                  <div className="text-[11px] text-zinc-500 truncate">

                    {evaluationResult.coaching_report?.summary}

                  </div>

                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">

                  {generatedDrill && (

                    <button

                      type="button"

                      data-testid="launch-remedial-drill-btn"

                      onClick={() => handleLaunchDrillLoop(generatedDrill)}

                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase cursor-pointer"

                    >

                      Loop Transition

                    </button>

                  )}

                  <button

                    type="button"

                    onClick={() => setIsTakeDrawerOpen(true)}

                    className="px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-amber-500 cursor-pointer"

                  >

                    Details

                  </button>

                </div>

              </div>

            ) : (

              <div className="px-3 py-2 rounded-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs">

                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 truncate">

                  <CheckCircle2 className="size-3.5 text-amber-500 shrink-0" />

                  <span className="truncate">

                    {activeHabits[0] ? (
                      <>Focus Habit: <b>{activeHabits[0].trigger_context}</b></>
                    ) : (
                      <>Ready to listen — press <b>Record Take</b> to evaluate your timing and chord voicing</>
                    )}

                  </span>

                </div>

                <button

                  type="button"

                  onClick={toggleQuickLoopCurrentPair}

                  className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold shrink-0 cursor-pointer"

                >

                  Loop 2 Bars

                </button>

              </div>

            )}

          </div>

        </div>

      </footer>

      {/* Drawers */}

      <CodexRepertoireDrawer

        isOpen={isRepertoireOpen}

        onClose={() => setIsRepertoireOpen(false)}

        onSelectSong={handleSelectSong}

        activeSongId={selectedSong.id}

      />

      <TakeEvaluationDrawer

        isOpen={isTakeDrawerOpen}

        onClose={() => setIsTakeDrawerOpen(false)}

        evaluation={evaluationResult}

        generatedDrill={generatedDrill}

        onLaunchDrill={(drill) => handleLaunchDrillLoop(drill)}

        onRetake={() => {

          handleSeekBeat(0)

          setIsPlaying(true)

        }}

      />

    </div>

  )

}