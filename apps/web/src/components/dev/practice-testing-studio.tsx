import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  fetchExercises,
  createPracticeSession,
  uploadSessionTake,
  submitChordsTake,
  createSessionDrill,
  fetchUserHabits,
  fetchUserStats,
  type ExerciseDto,
  type PracticeSessionDto,
  type TakeEvaluationResponse,
  type AdaptiveInterventionDto,
  type HabitPatternDto,
  type UserStatsDto,
} from '@/api/sessions'
import { encodeMonoWav } from '@/lib/audio/wav-encoder'
import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'
import {
  FlowingNotationStand,
  type FlowingChordItem,
  type GrandStaffNote,
  type StrumEvent,
} from '@/components/practice/flowing-notation-stand'
import { PracticeTelemetryHUD } from '@/components/practice/practice-telemetry-hud'
import { resolveChordVoicing } from '@/lib/music/chord-voicings'
import { RealtimePitchTracker, type PitchDetectionResult } from '@/lib/audio/realtime-pitch-tracker'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'

export type ProgressionChordItem = {
  name: string
  beat?: number
  duration_beats?: number
  expected_pitches?: number[]
  guitar_tabs?: {
    frets?: Array<number | null>
    strings?: string
    fingering?: string
  }
  piano_keys?: {
    keys?: string[]
    octave?: number
  }
  piano_voicings?: {
    lh_note?: string
    rh_notes?: string[]
    lh_pitches?: number[]
    rh_pitches?: number[]
    inversion?: string
  }
  melody_notes?: GrandStaffNote[]
  strum_events?: StrumEvent[]
  common_mistakes?: string[]
  section?: string
  variation?: string
}

export function PracticeTestingStudio() {
  const [exercises, setExercises] = useState<ExerciseDto[]>([])
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDto | null>(null)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [activeSession, setActiveSession] = useState<PracticeSessionDto | null>(null)

  // Live Play-Along & Pacing Engine State
  const [isPlayingAlong, setIsPlayingAlong] = useState(false)
  const [isCountingIn, setIsCountingIn] = useState(false)
  const [countInBeat, setCountInBeat] = useState(4)
  const [playAlongTempo, setPlayAlongTempo] = useState<number>(70)
  const [currentChordIdx, setCurrentChordIdx] = useState<number>(0)
  const [currentChordBeat, setCurrentChordBeat] = useState<number>(1)
  const isMetronomeEnabled = true
  const [isChordAudioEnabled, setIsChordAudioEnabled] = useState(true)
  const [isPlayAlongComplete, setIsPlayAlongComplete] = useState(false)

  // Take submission state
  const [isRecordingMic, setIsRecordingMic] = useState(false)
  const [micSeconds, setMicSeconds] = useState(0)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<TakeEvaluationResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Drill & Longitudinal Intervention state
  const [isGeneratingDrill, setIsGeneratingDrill] = useState(false)
  const [generatedDrill, setGeneratedDrill] = useState<AdaptiveInterventionDto | null>(null)
  const [isPracticingDrill, setIsPracticingDrill] = useState(false)

  // Habit & Longitudinal Stats
  const [userHabits, setUserHabits] = useState<HabitPatternDto[]>([])
  const [userStats, setUserStats] = useState<UserStatsDto | null>(null)
  const [activeTab, setActiveTab] = useState<'practice' | 'profile'>('practice')
  const [instrumentFilter, setInstrumentFilter] = useState<'all' | 'guitar' | 'piano'>('all')

  // Microphone recording refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const recordedSamplesRef = useRef<Float32Array[]>([])
  const timerIntervalRef = useRef<number | null>(null)

  // Web Audio Play-Along Synth & Timer refs
  const audioEngineRef = useRef<PracticeAudioEngine | null>(null)
  const playAlongTimerRef = useRef<number | null>(null)

  // Initialize AudioEngine on mount & cleanup on unmount
  useEffect(() => {
    audioEngineRef.current = new PracticeAudioEngine()
    return () => {
      if (playAlongTimerRef.current) {
        clearInterval(playAlongTimerRef.current)
        playAlongTimerRef.current = null
      }
      audioEngineRef.current?.dispose()
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect()
        scriptProcessorRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [])

  // Safely stop and cleanup mic recording
  const cleanupMic = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect()
      scriptProcessorRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setIsRecordingMic(false)
    setMicSeconds(0)
  }, [])

  // Stop play-along timer
  const stopPlayAlong = useCallback(() => {
    if (playAlongTimerRef.current) {
      clearInterval(playAlongTimerRef.current)
      playAlongTimerRef.current = null
    }
    setIsPlayingAlong(false)
    setIsCountingIn(false)
  }, [])

  // Load exercises and user profile on mount
  const refreshExercises = useCallback(async () => {
    try {
      setLoadingExercises(true)
      let list: ExerciseDto[] = []
      try {
        const data = await fetchExercises()
        list = data.length > 0 ? data : BUILTIN_FULL_SONGS
      } catch {
        list = BUILTIN_FULL_SONGS
      }
      setExercises(list)
      setSelectedExercise((current) => {
        if (!current && list.length > 0) {
          setPlayAlongTempo(list[0].tempo_bpm || 70)
          return list[0]
        }
        return current
      })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch exercises')
    } finally {
      setLoadingExercises(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      const [habitsData, statsData] = await Promise.allSettled([
        fetchUserHabits(),
        fetchUserStats(),
      ])
      if (habitsData.status === 'fulfilled') setUserHabits(habitsData.value)
      if (statsData.status === 'fulfilled') setUserStats(statsData.value)
    } catch {
      // Profile can be seeded on first practice
    }
  }, [])

  useEffect(() => {
    refreshExercises()
    refreshProfile()
  }, [refreshExercises, refreshProfile])

  // Cleanly select exercise without leaving stale sessions or timers
  const handleSelectExercise = (ex: ExerciseDto) => {
    if (selectedExercise?.id === ex.id) return
    stopPlayAlong()
    cleanupMic()
    setActiveSession(null)
    setEvaluationResult(null)
    setErrorMessage(null)
    setSelectedExercise(ex)
    setPlayAlongTempo(ex.tempo_bpm || 70)
    setCurrentChordIdx(0)
    setCurrentChordBeat(1)
    setIsPlayAlongComplete(false)
  }

  // Handle starting a practice session with timeout protection
  const handleStartSession = useCallback(async (interventionId?: string, overrideExercise?: ExerciseDto) => {
    const targetExercise = overrideExercise || selectedExercise
    if (!targetExercise) return null

    stopPlayAlong()
    cleanupMic()

    try {
      setErrorMessage(null)
      setEvaluationResult(null)
      setIsPlayAlongComplete(false)
      setCurrentChordIdx(0)
      setCurrentChordBeat(1)

      // Timeout safety: 6 seconds max so it never stays stuck
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session request timed out. Please check backend connection.')), 6000)
      )

      const apiPromise = createPracticeSession(targetExercise.id, undefined, {
        tempoBpm: playAlongTempo || targetExercise.tempo_bpm || 80,
        interventionId,
      })

      const newSession = await Promise.race([apiPromise, timeoutPromise])
      setActiveSession(newSession)
      return newSession
    } catch (err) {
      console.error('Session start error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start session')
      return null
    }
  }, [selectedExercise, playAlongTempo, stopPlayAlong, cleanupMic])

  // Handle Microphone Recording Take
  const startMicRecording = async () => {
    try {
      setErrorMessage(null)
      recordedSamplesRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      mediaStreamRef.current = stream

      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      scriptProcessorRef.current = processor

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        recordedSamplesRef.current.push(new Float32Array(inputData))
      }

      source.connect(processor)
      processor.connect(audioCtx.destination)

      setIsRecordingMic(true)
      setMicSeconds(0)
      timerIntervalRef.current = window.setInterval(() => {
        setMicSeconds((sec) => sec + 1)
      }, 1000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Microphone access denied')
    }
  }

  const stopMicAndSubmitTake = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect()
      scriptProcessorRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    setIsRecordingMic(false)
    const audioCtx = audioContextRef.current
    const sampleRate = audioCtx ? audioCtx.sampleRate : 44100
    if (audioCtx && audioCtx.state !== 'closed') {
      await audioCtx.close()
      audioContextRef.current = null
    }

    // Flatten samples & encode to 16-bit Mono WAV
    const totalSamples = recordedSamplesRef.current.reduce((acc, chunk) => acc + chunk.length, 0)
    const flatSamples = new Float32Array(totalSamples)
    let offset = 0
    for (const chunk of recordedSamplesRef.current) {
      flatSamples.set(chunk, offset)
      offset += chunk.length
    }

    let session = activeSession
    if (!session) {
      session = await handleStartSession()
      if (!session) {
        setErrorMessage('Could not establish practice session for take.')
        return
      }
    }

    try {
      setIsEvaluating(true)
      const wavBlob = encodeMonoWav(flatSamples, sampleRate)
      const result = await uploadSessionTake(session.id, wavBlob)
      setEvaluationResult(result)
      refreshProfile()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload audio take')
    } finally {
      setIsEvaluating(false)
    }
  }

  // Handle Preset Simulation Take
  const submitSimulatedPreset = async (presetType: 'clean' | 'lag' | 'rushing' | 'dragging' | 'voicing_drop') => {
    let session = activeSession
    if (!session) {
      session = await handleStartSession()
      if (!session) return
    }
    setIsEvaluating(true)
    setErrorMessage(null)

    let playedChords: Array<Record<string, unknown>> = []

    if (presetType === 'clean') {
      playedChords = [
        { chord: 'G', onset_time: 0.05, notes: ['G3', 'B3', 'D4', 'G4'] },
        { chord: 'D', onset_time: 3.02, notes: ['D3', 'F#3', 'A3', 'D4'] },
        { chord: 'Am', onset_time: 6.04, notes: ['A2', 'E3', 'A3', 'C4'] },
        { chord: 'C', onset_time: 9.02, notes: ['C3', 'E3', 'G3', 'C4'] },
      ]
    } else if (presetType === 'lag') {
      // Significant latency entering transition (Am -> C +140ms)
      playedChords = [
        { chord: 'G', onset_time: 0.0, notes: ['G3', 'B3', 'D4'] },
        { chord: 'D', onset_time: 3.0, notes: ['D3', 'F#3', 'A3'] },
        { chord: 'Am', onset_time: 6.0, notes: ['A2', 'C4', 'E4'] },
        { chord: 'C', onset_time: 9.14, notes: ['C3', 'E3', 'G3'] },
      ]
    } else if (presetType === 'rushing') {
      // Negative onset errors (attacking downbeats early by -35ms)
      playedChords = [
        { chord: 'G', onset_time: -0.04, notes: ['G3', 'B3', 'D4'] },
        { chord: 'D', onset_time: 2.96, notes: ['D3', 'F#3', 'A3'] },
        { chord: 'Am', onset_time: 5.95, notes: ['A2', 'C4', 'E4'] },
        { chord: 'C', onset_time: 8.94, notes: ['C3', 'E3', 'G3'] },
      ]
    } else if (presetType === 'dragging') {
      // Systematic dragging behind the beat (+45ms)
      playedChords = [
        { chord: 'G', onset_time: 0.05, notes: ['G3', 'B3', 'D4'] },
        { chord: 'D', onset_time: 3.05, notes: ['D3', 'F#3', 'A3'] },
        { chord: 'Am', onset_time: 6.05, notes: ['A2', 'C4', 'E4'] },
        { chord: 'C', onset_time: 9.05, notes: ['C3', 'E3', 'G3'] },
      ]
    } else if (presetType === 'voicing_drop') {
      // Dropping the 3rd (E in C major) -> triggers high-severity harmonic role weighting
      playedChords = [
        { chord: 'G', onset_time: 0.0, notes: ['G3', 'B3', 'D4'] },
        { chord: 'D', onset_time: 3.0, notes: ['D3', 'A3'] }, // dropped F# (3rd)
        { chord: 'Am', onset_time: 6.0, notes: ['A2', 'E3'] }, // dropped C (3rd)
        { chord: 'C', onset_time: 9.0, notes: ['C3', 'G3'] }, // dropped E (3rd)
      ]
    }

    try {
      const result = await submitChordsTake(session.id, playedChords)
      setEvaluationResult(result)
      refreshProfile()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Preset submission failed')
    } finally {
      setIsEvaluating(false)
    }
  }

  // Generate Adaptive Drill for Current Session
  const handleGenerateDrill = async () => {
    if (!activeSession) return
    try {
      setIsGeneratingDrill(true)
      setErrorMessage(null)
      const drill = await createSessionDrill(activeSession.id)
      setGeneratedDrill(drill)
      refreshProfile()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate drill')
    } finally {
      setIsGeneratingDrill(false)
    }
  }

  // Practice the Generated Drill (Longitudinal Outcome Tracking Loop)
  const handlePracticeRemedialDrill = async () => {
    if (!generatedDrill || !selectedExercise) return
    try {
      setIsPracticingDrill(true)
      setErrorMessage(null)
      // 1. Create session linked to intervention_id
      const remedialSession = await createPracticeSession(selectedExercise.id, undefined, {
        tempoBpm: generatedDrill.target_tempo || 75,
        interventionId: generatedDrill.id,
      })
      setActiveSession(remedialSession)

      // 2. Simulate improved follow-up performance (improved latency / complete voicing)
      const improvedChords = [
        { chord: 'G', onset_time: 0.02, notes: ['G3', 'B3', 'D4'] },
        { chord: 'D', onset_time: 3.01, notes: ['D3', 'F#3', 'A3'] },
        { chord: 'Am', onset_time: 6.02, notes: ['A2', 'C4', 'E4'] },
        { chord: 'C', onset_time: 9.01, notes: ['C3', 'E3', 'G3'] },
      ]
      const result = await submitChordsTake(remedialSession.id, improvedChords)
      setEvaluationResult(result)
      refreshProfile()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed remedial practice')
    } finally {
      setIsPracticingDrill(false)
    }
  }

  const filteredExercises = exercises.filter((ex) => {
    if (instrumentFilter === 'all') return true
    return ex.instrument?.toLowerCase() === instrumentFilter
  })

  const progressionChords: ProgressionChordItem[] = (() => {
    if (!selectedExercise) return []
    try {
      if (selectedExercise.progression?.chords && selectedExercise.progression.chords.length > 0) {
        return selectedExercise.progression.chords.map((c) => ({
          ...c,
          duration_beats: c.duration_beats ?? 4,
        }))
      }
      if (selectedExercise.progression_json) {
        const parsed = JSON.parse(selectedExercise.progression_json)
        const list = Array.isArray(parsed) ? parsed : parsed.chords || []
        return list.map((c: any) => ({
          ...c,
          duration_beats: c.duration_beats ?? 4,
        }))
      }
    } catch {
      return []
    }
    return []
  })()

  const progressionMeta = (() => {
    if (!selectedExercise?.progression_json) return null
    try {
      const parsed = JSON.parse(selectedExercise.progression_json)
      return {
        key: parsed.key || 'Standard',
        timeSignature: parsed.time_signature || '4/4',
        strummingPattern: parsed.strumming_pattern,
        educationalFocus: parsed.educational_focus,
      }
    } catch {
      return null
    }
  })()

  // Convert progressionChords of selected exercise into rich FlowingChordItem array
  const flowingChords = useMemo<FlowingChordItem[]>(() => {
    if (!progressionChords || progressionChords.length === 0) {
      return [resolveChordVoicing('C')]
    }
    return progressionChords.map((c) => {
      const baseVoicing = resolveChordVoicing(c.name)
      return {
        ...baseVoicing,
        duration_beats: c.duration_beats ?? 4,
        melodyNotes: c.melody_notes,
        strumEvents: c.strum_events,
        guitarTab: c.guitar_tabs?.frets
          ? {
              ...baseVoicing.guitarTab,
              frets: c.guitar_tabs.frets,
              fingering: c.guitar_tabs.fingering || baseVoicing.guitarTab.fingering,
            }
          : baseVoicing.guitarTab,
        pianoVoicing: c.piano_voicings?.rh_notes
          ? {
              lhNotes: c.piano_voicings.lh_note ? [c.piano_voicings.lh_note] : baseVoicing.pianoVoicing.lhNotes,
              rhNotes: c.piano_voicings.rh_notes,
              lhPitches: c.piano_voicings.lh_pitches || baseVoicing.pianoVoicing.lhPitches,
              rhPitches: c.piano_voicings.rh_pitches || baseVoicing.pianoVoicing.rhPitches,
            }
          : baseVoicing.pianoVoicing,
      }
    })
  }, [progressionChords])

  // Continuous beat across the entire song
  const currentContinuousBeat = useMemo(() => {
    let beatSum = 0
    for (let i = 0; i < currentChordIdx; i++) {
      beatSum += progressionChords[i]?.duration_beats || 4
    }
    return beatSum + (currentChordBeat - 1)
  }, [currentChordIdx, currentChordBeat, progressionChords])

  const activeFlowingChord = flowingChords[currentChordIdx] || flowingChords[0]

  // Honest real-time telemetry state (null when silent, no false reports)
  const [liveTelemetry, setLiveTelemetry] = useState<{
    intonationAccuracy: number | null
    timingSyncMs: number | null
    voicingStringsCount: number
    livePitchText?: string
    liveRmsDb: number
  }>({
    intonationAccuracy: null,
    timingSyncMs: null,
    voicingStringsCount: 0,
    livePitchText: undefined,
    liveRmsDb: -45,
  })
  const [livePitchResult, setLivePitchResult] = useState<PitchDetectionResult | null>(null)
  const pitchTrackerRef = useRef<RealtimePitchTracker | null>(null)
  const activeFlowingChordRef = useRef(activeFlowingChord)
  useEffect(() => {
    activeFlowingChordRef.current = activeFlowingChord
  }, [activeFlowingChord])

  useEffect(() => {
    if (!isPlayingAlong) {
      if (pitchTrackerRef.current) {
        pitchTrackerRef.current.stop()
        pitchTrackerRef.current = null
        setLiveTelemetry({
          intonationAccuracy: null,
          timingSyncMs: null,
          voicingStringsCount: 0,
          livePitchText: undefined,
          liveRmsDb: -45,
        })
        setLivePitchResult(null)
      }
      return
    }

    let isMounted = true
    const tracker = new RealtimePitchTracker(44100, 70, 1200, -34, 0.35)
    pitchTrackerRef.current = tracker

    tracker.startMicrophoneStream(
      (timeData) => {
        if (!isMounted) return
        const rms = tracker.computeRmsDb(timeData)

        if (rms < tracker.noiseGateDb) {
          // Below noise gate: silence or ambient room noise
          setLiveTelemetry((prev) => ({
            ...prev,
            liveRmsDb: rms,
            voicingStringsCount: 0,
            livePitchText: undefined,
          }))
          return
        }

        const chord = activeFlowingChordRef.current || flowingChords[0]
        const match = tracker.evaluateChordMatch(timeData, chord, 0, 0)
        setLivePitchResult(match)

        if (match.isSoundDetected && match.detectedFreqHz && match.detectedFreqHz > 40) {
          const isMatched = match.matchedPitchClasses.length > 0
          const intonation = Math.max(0, Math.min(100, 100 - Math.abs(match.centsDeviation) * 1.5))
          const timingDelta = Math.round(match.timingDeltaMs)

          setLiveTelemetry({
            intonationAccuracy: isMatched ? intonation : 50.0,
            timingSyncMs: timingDelta,
            voicingStringsCount: isMatched ? Math.max(1, Math.round(match.voicingCompleteness * 6)) : 1,
            livePitchText: `${match.detectedNote} (${Math.round(match.detectedFreqHz)}Hz) - ${
              isMatched ? 'ON PITCH' : 'OFF CHORD'
            }`,
            liveRmsDb: rms,
          })
        }
      },
      () => {
        // Microphone permission declined or not accessible
      }
    )

    return () => {
      isMounted = false
      tracker.stop()
      pitchTrackerRef.current = null
    }
  }, [isPlayingAlong, flowingChords])

  // Start or resume live play-along accompaniment
  const startPlayAlong = useCallback(async () => {
    if (!selectedExercise || progressionChords.length === 0) return

    // Ensure audio engine is unlocked
    audioEngineRef.current?.unlock()

    // Ensure active session exists; start one automatically if needed
    if (!activeSession) {
      const created = await handleStartSession()
      if (!created) return
    }

    // Stop any existing timer
    if (playAlongTimerRef.current) {
      clearInterval(playAlongTimerRef.current)
      playAlongTimerRef.current = null
    }

    const beatsInMeasure =
      progressionMeta?.timeSignature === '3/4'
        ? 3
        : progressionMeta?.timeSignature === '6/8'
        ? 6
        : progressionChords[0]?.duration_beats || 4

    setIsPlayAlongComplete(false)
    setIsPlayingAlong(true)
    setIsCountingIn(true)
    setCountInBeat(beatsInMeasure)

    let localCountingIn = true
    let localCount = beatsInMeasure
    let localChordIdx = currentChordIdx >= progressionChords.length ? 0 : currentChordIdx
    let localChordBeat = 1

    setCurrentChordIdx(localChordIdx)
    setCurrentChordBeat(1)

    const bpm = playAlongTempo || selectedExercise.tempo_bpm || 70
    const beatIntervalMs = (60 / bpm) * 1000

    // Play first count-in click immediately
    if (isMetronomeEnabled) {
      audioEngineRef.current?.playClick(true)
    }

    playAlongTimerRef.current = window.setInterval(() => {
      if (localCountingIn) {
        localCount -= 1
        if (localCount > 0) {
          setCountInBeat(localCount)
          if (isMetronomeEnabled) {
            audioEngineRef.current?.playClick(localCount === 1)
          }
        } else {
          // Count-in finished! Start playing along on current chord
          localCountingIn = false
          setIsCountingIn(false)
          localChordBeat = 1
          setCurrentChordBeat(1)

          const chord = progressionChords[localChordIdx]
          if (chord) {
            if (isMetronomeEnabled) {
              audioEngineRef.current?.playClick(true) // Downbeat
            }
            if (isChordAudioEnabled) {
              audioEngineRef.current?.playChord(chord.name, chord.expected_pitches)
            }
          }
        }
      } else {
        // Normal Play-Along Tick
        const currentChord = progressionChords[localChordIdx]
        const chordDuration = currentChord?.duration_beats || 4

        if (localChordBeat < chordDuration) {
          // Still in current chord
          localChordBeat += 1
          setCurrentChordBeat(localChordBeat)
          if (isMetronomeEnabled) {
            audioEngineRef.current?.playClick(false) // Upbeat
          }
        } else {
          // Transition to next chord!
          if (localChordIdx + 1 < progressionChords.length) {
            localChordIdx += 1
            localChordBeat = 1
            setCurrentChordIdx(localChordIdx)
            setCurrentChordBeat(1)

            const nextChord = progressionChords[localChordIdx]
            if (nextChord) {
              if (isMetronomeEnabled) {
                audioEngineRef.current?.playClick(true) // Downbeat on chord change
              }
              if (isChordAudioEnabled) {
                audioEngineRef.current?.playChord(nextChord.name, nextChord.expected_pitches)
              }
            }
          } else {
            // Reached end of entire progression!
            if (playAlongTimerRef.current) {
              clearInterval(playAlongTimerRef.current)
              playAlongTimerRef.current = null
            }
            setIsPlayingAlong(false)
            setIsPlayAlongComplete(true)
            if (isMetronomeEnabled) {
              audioEngineRef.current?.playClick(true)
            }
          }
        }
      }
    }, beatIntervalMs)
  }, [
    selectedExercise,
    progressionChords,
    activeSession,
    handleStartSession,
    currentChordIdx,
    playAlongTempo,
    isMetronomeEnabled,
    isChordAudioEnabled,
  ])

  // Pause play-along
  const pausePlayAlong = useCallback(() => {
    if (playAlongTimerRef.current) {
      clearInterval(playAlongTimerRef.current)
      playAlongTimerRef.current = null
    }
    setIsPlayingAlong(false)
    setIsCountingIn(false)
  }, [])

  // Restart play-along from beginning
  const restartPlayAlong = useCallback(() => {
    setCurrentChordIdx(0)
    setCurrentChordBeat(1)
    setIsPlayAlongComplete(false)
    startPlayAlong()
  }, [startPlayAlong])

  // Scrub / Jump directly to any chord in progression
  const jumpToChord = (idx: number) => {
    if (idx < 0 || idx >= progressionChords.length) return
    setCurrentChordIdx(idx)
    setCurrentChordBeat(1)
    if (isChordAudioEnabled && audioEngineRef.current) {
      audioEngineRef.current.unlock()
      audioEngineRef.current.playChord(progressionChords[idx].name, progressionChords[idx].expected_pitches)
    }
  }

  return (
    <div className="flex flex-col gap-8 rounded-3xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-6 sm:p-8 shadow-sm font-serif text-[#242321] dark:text-[#EDE8DF]">
      {/* Studio Header & Tab Switcher */}
      <div className="flex flex-col gap-4 border-b border-[#E2DDD3] dark:border-[#38342E] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#242321] dark:text-[#EDE8DF] sm:text-3xl">
              Practice &amp; Drill Studio
            </h2>
            <span className="flex items-center gap-1.5 rounded-full bg-[#EFECE6] dark:bg-[#24221F] px-3 py-1 text-xs font-mono font-semibold text-[#736E65] dark:text-[#A39C8F] border border-[#D9D3C7] dark:border-[#38342E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9A2A2A] dark:bg-[#D9534F] animate-pulse" />
              SONUS Engine Active
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans">
            Complete practice cycle: Exercise Selection ➔ Audio &amp; Chord Sequence Alignment ➔ Statistical Motor-Habits ➔ Grounded AI Coach ➔ Remedial Drills.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex self-start sm:self-auto rounded-xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1A1816] p-1 text-xs font-sans">
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`rounded-lg px-4 py-2 font-semibold transition-all ${
              activeTab === 'practice'
                ? 'bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] shadow-2xs'
                : 'text-[#736E65] hover:bg-[#EFECE6] hover:text-[#242321] dark:text-[#A39C8F] dark:hover:bg-[#24221F] dark:hover:text-[#EDE8DF]'
            }`}
          >
            Practice Studio
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile')
              refreshProfile()
            }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] shadow-2xs'
                : 'text-[#736E65] hover:bg-[#EFECE6] hover:text-[#242321] dark:text-[#A39C8F] dark:hover:bg-[#24221F] dark:hover:text-[#EDE8DF]'
            }`}
          >
            <span>Habits &amp; Progress</span>
            <span className="rounded-full bg-[#EFECE6] dark:bg-[#2E2A24] px-1.5 py-0.2 text-[10px] font-bold text-[#242321] dark:text-[#EDE8DF]">
              {userHabits.length}
            </span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#9A2A2A]/30 bg-[#9A2A2A]/10 dark:bg-[#9A2A2A]/20 p-4 text-xs font-medium text-[#9A2A2A] dark:text-[#E57373]">
          <span className="text-base">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {activeTab === 'practice' ? (
        <div className="space-y-8">
          {/* STEP 1: Select Exercise */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EFECE6] dark:bg-[#24221F] text-[11px] font-mono font-bold text-[#9A2A2A] dark:text-[#D9534F]">
                  1
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                  Select Song or Exercise
                </span>
              </div>

              {/* Instrument Filter Buttons */}
              <div className="flex items-center gap-1.5 text-xs font-sans">
                {(['all', 'guitar', 'piano'] as const).map((inst) => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setInstrumentFilter(inst)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                      instrumentFilter === inst
                        ? 'bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] font-semibold border border-[#242321] dark:border-[#EDE8DF] shadow-2xs'
                        : 'border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
                    }`}
                  >
                    {inst === 'all' ? 'All Songs' : inst === 'guitar' ? '🎸 Guitar' : '🎹 Piano'}
                  </button>
                ))}
              </div>
            </div>

            {loadingExercises ? (
              <div className="py-8 text-center text-xs text-[#736E65] dark:text-[#A39C8F] animate-pulse rounded-2xl border border-dashed border-[#D9D3C7] dark:border-[#38342E]">
                Loading exercise catalog from local database...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExercises.map((ex) => {
                  const isSelected = selectedExercise?.id === ex.id
                  const isGuitar = ex.instrument?.toLowerCase() === 'guitar'
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleSelectExercise(ex)}
                      className={`group relative flex flex-col justify-between gap-3 rounded-2xl border p-5 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#9A2A2A] bg-[#FCFBF8] dark:bg-[#24221F] dark:border-[#B83232] shadow-md ring-2 ring-[#9A2A2A]/30 dark:ring-[#B83232]/30'
                          : 'border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] hover:border-[#9A2A2A]/50 dark:hover:border-[#B83232]/60 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex items-center gap-1 rounded-md bg-[#EFECE6] dark:bg-[#2A2723] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wide text-[#736E65] dark:text-[#A39C8F] border border-[#D9D3C7] dark:border-[#38342E]"
                          >
                            <span>{isGuitar ? '🎸' : '🎹'}</span>
                            <span>{ex.instrument}</span>
                          </span>

                          <span className="text-[11px] font-semibold text-[#A09A8F] dark:text-[#857F73]">
                            {'★'.repeat(Number(ex.difficulty) || 1)}
                            {'☆'.repeat(Math.max(0, 3 - (Number(ex.difficulty) || 1)))}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#242321] dark:text-[#EDE8DF] group-hover:text-[#9A2A2A] dark:group-hover:text-[#E57373] transition-colors">
                          {ex.title}
                        </h3>
                        {ex.description && (
                          <p className="line-clamp-2 text-xs text-[#736E65] dark:text-[#A39C8F] leading-relaxed font-sans">
                            {ex.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-[#E2DDD3] dark:border-[#38342E] pt-2.5 text-xs text-[#736E65] dark:text-[#A39C8F]">
                        <span className="font-mono text-xs font-semibold text-[#242321] dark:text-[#EDE8DF]">
                          {ex.tempo_bpm} BPM
                        </span>
                        <span className={`text-[11px] font-mono font-medium ${isSelected ? 'text-[#9A2A2A] dark:text-[#E57373] font-bold' : 'text-[#736E65] dark:text-[#A39C8F]'}`}>
                          {isSelected ? '✓ SELECTED' : 'SELECT'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* STEP 2: SONUS Precision Flowing Stand & Telemetry HUD */}
          <div className="rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] overflow-hidden shadow-sm flex flex-col font-serif">
            <PracticeTelemetryHUD
              instrument={selectedExercise?.instrument?.toLowerCase() === 'piano' ? 'piano' : 'guitar'}
              onInstrumentChange={(inst) => {
                if (selectedExercise) {
                  setSelectedExercise({
                    ...selectedExercise,
                    instrument: inst,
                  })
                }
              }}
              pieceTitle={selectedExercise?.title || 'Selected Song'}
              keySignature={progressionMeta?.key || 'Standard'}
              currentMeasure={currentChordIdx + 1}
              totalMeasures={flowingChords.length}
              tempoBpm={playAlongTempo}
              onTempoChange={(bpm) => setPlayAlongTempo(bpm)}
              activeChord={activeFlowingChord}
              intonationAccuracy={liveTelemetry.intonationAccuracy}
              timingSyncMs={liveTelemetry.timingSyncMs}
              voicingStringsCount={liveTelemetry.voicingStringsCount}
              isPlaying={isPlayingAlong}
              onTogglePlay={() => {
                if (isPlayingAlong) pausePlayAlong()
                else startPlayAlong()
              }}
              onRestart={restartPlayAlong}
              livePitchText={liveTelemetry.livePitchText}
              liveRmsDb={liveTelemetry.liveRmsDb}
              isBackingAudioEnabled={isChordAudioEnabled}
              onToggleBackingAudio={() => setIsChordAudioEnabled((v) => !v)}
            />

            <FlowingNotationStand
              instrument={selectedExercise?.instrument?.toLowerCase() === 'piano' ? 'piano' : 'guitar'}
              progression={flowingChords}
              currentBeat={currentContinuousBeat}
              tempoBpm={playAlongTempo}
              isPlaying={isPlayingAlong}
              isCountingIn={isCountingIn}
              countInBeat={countInBeat}
              activeHitResult={livePitchResult}
              timeSignature={progressionMeta?.timeSignature}
              beatsPerMeasure={
                progressionMeta?.timeSignature === '3/4'
                  ? 3
                  : progressionMeta?.timeSignature === '6/8'
                  ? 6
                  : (flowingChords[0]?.duration_beats ?? 4)
              }
              onSeekBeat={(beat) => {
                let accum = 0
                for (let i = 0; i < progressionChords.length; i++) {
                  const duration = progressionChords[i]?.duration_beats || 4
                  if (beat >= accum && beat < accum + duration) {
                    jumpToChord(i)
                    break
                  }
                  accum += duration
                }
              }}
            />

            {/* Song Navigation & Full Chord Sequence Strip */}
            <div className="bg-[#EFECE6]/90 dark:bg-[#1A1816]/95 border-t border-[#E2DDD3] dark:border-[#38342E] px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#736E65] dark:text-[#A39C8F] uppercase tracking-wider text-[11px] font-semibold">
                  FULL SONG CHORDS ({progressionChords.length}):
                </span>
                {isCountingIn && (
                  <span className="px-2 py-0.5 rounded bg-[#9A2A2A] dark:bg-[#B83232] text-[#FCFBF8] font-bold text-[10px] animate-pulse">
                    COUNT-IN: {countInBeat}
                  </span>
                )}
                {isPlayAlongComplete && (
                  <span className="px-2 py-0.5 rounded bg-[#242321] dark:bg-[#2E2A24] text-[#FCFBF8] dark:text-[#EDE8DF] font-bold text-[10px]">
                    SONG COMPLETE ✓
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  {progressionChords.map((chord, idx) => {
                    const isCurrent = idx === currentChordIdx && isPlayingAlong
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => jumpToChord(idx)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          isCurrent
                            ? 'bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] font-bold shadow-sm'
                            : 'bg-[#FCFBF8] text-[#242321] border border-[#D9D3C7] dark:bg-[#24221F] dark:text-[#EDE8DF] dark:border-[#38342E] hover:bg-[#E2DDD3] dark:hover:bg-[#2E2A24]'
                        }`}
                      >
                        <span>{chord.name}</span>
                        <span className="text-[10px] opacity-70 ml-1">({chord.duration_beats}b)</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-[#736E65] dark:text-[#A39C8F]">
                <span>KEY: {progressionMeta?.key || 'Standard'}</span>
                <span>•</span>
                <span>TIME: {progressionMeta?.timeSignature || '4/4'}</span>
                <span>•</span>
                <span>TOTAL: {flowingChords.reduce((acc, c) => acc + (c.duration_beats || 4), 0)} BEATS</span>
              </div>
            </div>
          </div>

          {/* STEP 3: Take Submission Console */}
          <div className="space-y-4 rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-6 shadow-2xs font-sans">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EFECE6] dark:bg-[#24221F] text-[11px] font-mono font-bold text-[#9A2A2A] dark:text-[#D9534F]">
                3
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                Record Performance Take or Trigger Calibration Presets
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Live Microphone Recorder */}
              <div className="flex flex-col justify-between rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] p-5 shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎙️</span>
                    <h4 className="text-sm font-bold text-[#242321] dark:text-[#EDE8DF] font-serif">
                      Live Microphone Audio Take
                    </h4>
                  </div>
                  <p className="text-xs text-[#736E65] dark:text-[#A39C8F] leading-relaxed">
                    Capture 16-bit mono WAV. Offloads Spotify Basic Pitch neural transcription to backend worker threadpool.
                  </p>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  {!isRecordingMic ? (
                    <button
                      type="button"
                      onClick={startMicRecording}
                      disabled={isEvaluating}
                      className="flex items-center justify-center gap-2.5 rounded-xl border border-[#9A2A2A] dark:border-[#D9534F] bg-[#9A2A2A]/10 dark:bg-[#9A2A2A]/20 px-5 py-3 text-xs font-bold font-mono text-[#9A2A2A] dark:text-[#E57373] hover:bg-[#9A2A2A]/20 dark:hover:bg-[#9A2A2A]/30 active:scale-98 transition-all disabled:opacity-50"
                    >
                      <span className="h-3 w-3 rounded-full bg-[#9A2A2A] dark:bg-[#D9534F]" />
                      <span>START RECORDING TAKE</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopMicAndSubmitTake}
                      disabled={isEvaluating}
                      className="flex items-center justify-center gap-2.5 rounded-xl bg-[#9A2A2A] dark:bg-[#B83232] px-6 py-3 text-xs font-bold font-mono text-[#FCFBF8] shadow-sm animate-pulse hover:bg-[#802222] active:scale-98 transition-all"
                    >
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#FCFBF8]" />
                      <span>STOP &amp; EVALUATE TAKE ({micSeconds}s)</span>
                    </button>
                  )}

                  {isRecordingMic && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[#9A2A2A] dark:text-[#E57373]">
                      <span className="flex h-2 w-2 rounded-full bg-[#9A2A2A] dark:bg-[#D9534F] animate-ping" />
                      <span>Listening (Noise gate -34dB)...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click Pedagogical Simulation Presets */}
              <div className="flex flex-col justify-between rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] p-5 shadow-2xs space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧪</span>
                    <h4 className="text-sm font-bold text-[#242321] dark:text-[#EDE8DF] font-serif">
                      Pedagogical Calibration Presets
                    </h4>
                  </div>
                  <p className="text-xs text-[#736E65] dark:text-[#A39C8F] leading-relaxed">
                    Instant synthetic evaluations to test Needleman-Wunsch DP alignment, CUSUM habit curves, and grounded coaching without mic.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => submitSimulatedPreset('clean')}
                    className="flex items-center gap-2 rounded-xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-2.5 text-left text-xs text-[#242321] dark:text-[#EDE8DF] hover:border-[#9A2A2A] dark:hover:border-[#B83232] transition-all disabled:opacity-50"
                  >
                    <span className="text-base">🎯</span>
                    <div>
                      <div className="font-bold text-[#242321] dark:text-[#EDE8DF]">Clean Performance</div>
                      <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F]">&lt;10ms error, all strings</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => submitSimulatedPreset('lag')}
                    className="flex items-center gap-2 rounded-xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-2.5 text-left text-xs text-[#242321] dark:text-[#EDE8DF] hover:border-[#9A2A2A] dark:hover:border-[#B83232] transition-all disabled:opacity-50"
                  >
                    <span className="text-base">⏱️</span>
                    <div>
                      <div className="font-bold text-[#242321] dark:text-[#EDE8DF]">Transition Lag</div>
                      <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F]">+140ms entry latency</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => submitSimulatedPreset('dragging')}
                    className="flex items-center gap-2 rounded-xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-2.5 text-left text-xs text-[#242321] dark:text-[#EDE8DF] hover:border-[#9A2A2A] dark:hover:border-[#B83232] transition-all disabled:opacity-50"
                  >
                    <span className="text-base">🐌</span>
                    <div>
                      <div className="font-bold text-[#242321] dark:text-[#EDE8DF]">Tempo Dragging</div>
                      <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F]">+45ms behind beat</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => submitSimulatedPreset('rushing')}
                    className="flex items-center gap-2 rounded-xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-2.5 text-left text-xs text-[#242321] dark:text-[#EDE8DF] hover:border-[#9A2A2A] dark:hover:border-[#B83232] transition-all disabled:opacity-50"
                  >
                    <span className="text-base">⚡</span>
                    <div>
                      <div className="font-bold text-[#242321] dark:text-[#EDE8DF]">Tempo Rushing</div>
                      <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F]">-35ms early attacks</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => submitSimulatedPreset('voicing_drop')}
                    className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-2.5 text-left text-xs text-[#242321] dark:text-[#EDE8DF] hover:border-[#9A2A2A] dark:hover:border-[#B83232] transition-all disabled:opacity-50"
                  >
                    <span className="text-base">🎵</span>
                    <div>
                      <div className="font-bold text-[#9A2A2A] dark:text-[#E57373]">Drop Harmonic 3rd</div>
                      <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F]">Drops essential chord quality tones (Harmonic Severity 4.5/5.0)</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isEvaluating && (
            <div className="rounded-2xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-8 text-center space-y-3 animate-pulse font-serif">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EFECE6] dark:bg-[#24221F] text-[#242321] dark:text-[#EDE8DF] text-lg font-mono">
                ⚙️
              </div>
              <h4 className="text-sm font-bold text-[#242321] dark:text-[#EDE8DF]">
                Analyzing Take &amp; Evaluating Motor-Habit Curves...
              </h4>
              <p className="text-xs text-[#736E65] dark:text-[#A39C8F] max-w-md mx-auto font-sans">
                Running Needleman-Wunsch DP alignment, Page&apos;s CUSUM change-point detection, and Grounded AI Coaching.
              </p>
            </div>
          )}

          {/* STEP 4: Precision Metrics & Grounded AI Coaching */}
          {evaluationResult && (
            <div className="space-y-8 font-serif">
              {/* Score Metric Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-sans">
                <div className="rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 text-center shadow-2xs">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                    Overall Accuracy
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[#242321] dark:text-[#EDE8DF]">
                    {(evaluationResult.overall_accuracy * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 text-center shadow-2xs">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                    Avg Timing Offset
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[#9A2A2A] dark:text-[#E57373]">
                    {evaluationResult.avg_timing_error_ms > 0 ? `+` : ``}
                    {evaluationResult.avg_timing_error_ms.toFixed(1)}ms
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 text-center shadow-2xs">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                    Voicing Score
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[#242321] dark:text-[#EDE8DF]">
                    {(evaluationResult.voicing_score * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 text-center shadow-2xs">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                    Grade
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[#242321] dark:text-[#EDE8DF]">
                    {evaluationResult.coaching_report?.letter_grade || 'A'}
                  </div>
                </div>
              </div>

              {/* Longitudinal Drill Outcome Banner */}
              {evaluationResult.drill_outcome && (
                <div className="rounded-2xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 shadow-2xs font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <span className="font-bold text-xs uppercase tracking-wider text-[#242321] dark:text-[#EDE8DF]">
                        Longitudinal Remedial Outcome Tracked
                      </span>
                    </div>
                    <span className="rounded-full bg-[#EFECE6] dark:bg-[#2A2723] px-3 py-1 text-xs font-mono font-bold text-[#242321] dark:text-[#EDE8DF] border border-[#D9D3C7] dark:border-[#38342E]">
                      {evaluationResult.drill_outcome.completed ? 'REMEDIATED ✓' : 'IN PROGRESS'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F]">
                    Status: <span className="font-bold uppercase text-[#242321] dark:text-[#EDE8DF]">{evaluationResult.drill_outcome.outcome}</span>
                    {evaluationResult.drill_outcome.measured_improvement_pct !== undefined && (
                      <span className="ml-2 font-bold text-[#9A2A2A] dark:text-[#E57373]">
                        (+{evaluationResult.drill_outcome.measured_improvement_pct}% Improvement Delta)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Chord-by-Chord Alignment HUD */}
              <div className="space-y-4 rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-6 shadow-2xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                    Sequence Alignment HUD ({evaluationResult.chord_metrics.length} events)
                  </span>
                  <span className="text-xs font-mono text-[#A09A8F] dark:text-[#857F73]">
                    Needleman-Wunsch Harmonic Matrix
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {evaluationResult.chord_metrics.map((metric, i) => (
                    <div
                      key={i}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] p-4 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-[#242321] dark:text-[#EDE8DF] text-sm">
                          {metric.expected_chord}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold border ${
                            metric.is_matched
                              ? 'bg-[#EFECE6] dark:bg-[#2A2723] text-[#242321] dark:text-[#EDE8DF] border-[#D9D3C7] dark:border-[#38342E]'
                              : 'bg-[#9A2A2A]/10 dark:bg-[#9A2A2A]/20 text-[#9A2A2A] dark:text-[#E57373] border-[#9A2A2A]/30 dark:border-[#9A2A2A]/40'
                          }`}
                        >
                          {metric.is_matched ? 'MATCH' : 'MISS'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#736E65] dark:text-[#A39C8F] border-t border-[#E2DDD3] dark:border-[#38342E] pt-2">
                        <div className="flex items-center justify-between">
                          <span>Detected:</span>
                          <span className="font-semibold text-[#242321] dark:text-[#EDE8DF]">
                            {metric.detected_chord || 'None'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Timing:</span>
                          <span className="font-mono font-semibold text-[#242321] dark:text-[#EDE8DF]">
                            {metric.onset_error_ms > 0 ? `+${metric.onset_error_ms.toFixed(0)}` : metric.onset_error_ms.toFixed(0)}ms
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Voicing:</span>
                          <span className="font-medium text-[#242321] dark:text-[#EDE8DF]">
                            {(metric.voicing_completeness * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounded AI Coaching Card & Remedial Drill Generator */}
              <div className="space-y-6 rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-6 shadow-2xs font-sans">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2DDD3] dark:border-[#38342E] pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧠</span>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                        Pedagogical Coaching Assessment
                      </span>
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#242321] dark:text-[#EDE8DF]">
                      {evaluationResult.coaching_report.headline}
                    </h3>
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingDrill}
                    onClick={handleGenerateDrill}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#242321] dark:bg-[#EDE8DF] px-5 py-2.5 text-xs font-mono font-bold text-[#FCFBF8] dark:text-[#141312] shadow-2xs hover:bg-[#383633] dark:hover:bg-[#FFFFFF] active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isGeneratingDrill ? 'GENERATING DRILL...' : '⚡ GENERATE REMEDIAL DRILL'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs font-sans">
                  {/* Left Column: Bottlenecks & Advice */}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-[#9A2A2A] dark:text-[#E57373] font-mono font-bold text-xs uppercase tracking-wide">
                        <span>⚠️</span>
                        <span>Primary Bottleneck</span>
                      </div>
                      <p className="text-xs text-[#242321] dark:text-[#EDE8DF] font-medium leading-relaxed font-serif">
                        {evaluationResult.coaching_report.primary_bottleneck}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-[#242321] dark:text-[#EDE8DF] font-mono font-bold text-xs uppercase tracking-wide">
                        <span>💡</span>
                        <span>Ergonomic Advice</span>
                      </div>
                      <p className="text-xs text-[#736E65] dark:text-[#A39C8F] leading-relaxed">
                        {evaluationResult.coaching_report.ergonomic_advice}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Strengths & Habits */}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-[#242321] dark:text-[#EDE8DF] font-mono font-bold text-xs uppercase tracking-wide">
                        <span>✓</span>
                        <span>Key Strengths</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#736E65] dark:text-[#A39C8F]">
                        {evaluationResult.coaching_report.key_strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#9A2A2A] dark:text-[#E57373]">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-[#242321] dark:text-[#EDE8DF] font-mono font-bold text-xs uppercase tracking-wide">
                        <span>📊</span>
                        <span>Habit Alerts</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#736E65] dark:text-[#A39C8F]">
                        {evaluationResult.coaching_report.habit_alerts.length > 0 ? (
                          evaluationResult.coaching_report.habit_alerts.map((h, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[#9A2A2A] dark:text-[#E57373]">•</span>
                              <span>{h}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-[#736E65] dark:text-[#A39C8F]">No acute negative habit patterns detected.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Render Generated Drill if created */}
                {generatedDrill && (
                  <div className="rounded-2xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] p-6 space-y-4 shadow-2xs font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E2DDD3] dark:border-[#38342E] pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9A2A2A] dark:text-[#E57373]">
                          Adaptive Remedial Drill Generated
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#242321] dark:text-[#EDE8DF] capitalize mt-0.5">
                          {generatedDrill.drill_type.replace(/_/g, ' ')}
                        </h4>
                      </div>

                      <span className="self-start sm:self-auto rounded-full bg-[#EFECE6] dark:bg-[#2A2723] px-3 py-1 text-xs font-mono font-bold text-[#242321] dark:text-[#EDE8DF] border border-[#D9D3C7] dark:border-[#38342E]">
                        Target {generatedDrill.target_tempo} BPM ({generatedDrill.target_repetitions}x)
                      </span>
                    </div>

                    <p className="text-xs text-[#736E65] dark:text-[#A39C8F] leading-relaxed">
                      {generatedDrill.description || 'Targeted remediation drill generated based on statistical habit patterns.'}
                    </p>

                    {/* Multi-stage tempo ramp display */}
                    {generatedDrill.tempo_stages && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs font-mono">
                        <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-3">
                          <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F] uppercase">1. Isolation</div>
                          <div className="text-base font-bold text-[#242321] dark:text-[#EDE8DF] mt-0.5">
                            {generatedDrill.tempo_stages.isolation_bpm} BPM
                          </div>
                        </div>
                        <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-3">
                          <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F] uppercase">2. Step Ramp</div>
                          <div className="text-base font-bold text-[#242321] dark:text-[#EDE8DF] mt-0.5">
                            +{generatedDrill.tempo_stages.step_bpm} BPM
                          </div>
                        </div>
                        <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-3">
                          <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F] uppercase">3. Target</div>
                          <div className="text-base font-bold text-[#242321] dark:text-[#EDE8DF] mt-0.5">
                            {generatedDrill.tempo_stages.target_bpm} BPM
                          </div>
                        </div>
                        <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-3">
                          <div className="text-[10px] text-[#736E65] dark:text-[#A39C8F] uppercase">4. Goal Mastery</div>
                          <div className="text-base font-bold text-[#9A2A2A] dark:text-[#E57373] mt-0.5">
                            {generatedDrill.tempo_stages.goal_bpm} BPM
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isPracticingDrill}
                        onClick={handlePracticeRemedialDrill}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#242321] dark:bg-[#EDE8DF] px-6 py-3 text-xs font-mono font-bold text-[#FCFBF8] dark:text-[#141312] shadow-2xs hover:bg-[#383633] dark:hover:bg-[#FFFFFF] active:scale-98 transition-all disabled:opacity-50"
                      >
                        {isPracticingDrill ? 'EVALUATING REMEDIAL TAKE...' : '🚀 PRACTICE THIS DRILL (TEST OUTCOME TRACKING)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: User Habit Profile & Statistics */
        <div className="space-y-8">
          {userStats && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-border/80 dark:border-[#38342E] bg-card dark:bg-[#1E1C1A] p-5 text-center shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-[#A39C8F]">
                  Sessions Completed
                </div>
                <div className="mt-2 font-display text-3xl font-extrabold text-foreground dark:text-[#EDE8DF]">
                  {userStats.total_sessions_completed}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 text-center shadow-2xs">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                  Overall Accuracy
                </div>
                <div className="mt-2 text-3xl font-extrabold text-[#242321] dark:text-[#EDE8DF]">
                  {userStats.overall_accuracy_pct}%
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 text-center shadow-2xs">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                  Interventions Done
                </div>
                <div className="mt-2 text-3xl font-extrabold text-[#242321] dark:text-[#EDE8DF]">
                  {userStats.interventions_completed}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 text-center shadow-2xs">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                  Streak Days
                </div>
                <div className="mt-2 text-3xl font-extrabold text-[#9A2A2A] dark:text-[#E57373]">
                  {userStats.streak_days} 🔥
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                Statistical Motor-Habit Portfolio ({userHabits.length} Patterns Tracked)
              </span>
              <span className="text-xs font-mono text-[#A09A8F] dark:text-[#857F73]">
                Page&apos;s CUSUM + EWMA α=0.40
              </span>
            </div>

            {userHabits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-8 text-center text-xs text-[#736E65] dark:text-[#A39C8F] space-y-1">
                <p className="font-semibold text-[#242321] dark:text-[#EDE8DF] font-serif">No motor habits recorded yet.</p>
                <p>Practice an exercise and submit takes with intentional lag, rushing, or missing notes to build your habit profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] p-5 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold uppercase text-[#9A2A2A] dark:text-[#E57373] text-xs">
                        {habit.pattern_type.replace(/_/g, ' ')}
                      </span>
                      <span className="rounded-full bg-[#EFECE6] dark:bg-[#2A2723] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#736E65] dark:text-[#A39C8F] border border-[#D9D3C7] dark:border-[#38342E]">
                        {habit.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-[#E2DDD3] dark:border-[#38342E] pt-3 text-xs">
                      <div className="text-[#736E65] dark:text-[#A39C8F]">
                        Trigger Context:{' '}
                        <span className="font-semibold text-[#242321] dark:text-[#EDE8DF] font-mono">
                          {habit.trigger_context}
                        </span>
                      </div>
                      <div className="text-[#736E65] dark:text-[#A39C8F]">
                        Evidence Recorded:{' '}
                        <span className="font-semibold text-[#242321] dark:text-[#EDE8DF]">
                          {habit.evidence_count} takes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
