import { useState, useEffect, useRef, useCallback } from 'react'
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
  common_mistakes?: string[]
}

export function PracticeTestingStudio() {
  const [exercises, setExercises] = useState<ExerciseDto[]>([])
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDto | null>(null)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [activeSession, setActiveSession] = useState<PracticeSessionDto | null>(null)
  const [isStartingSession, setIsStartingSession] = useState(false)

  // Live Play-Along & Pacing Engine State
  const [isPlayingAlong, setIsPlayingAlong] = useState(false)
  const [isCountingIn, setIsCountingIn] = useState(false)
  const [countInBeat, setCountInBeat] = useState(4)
  const [playAlongTempo, setPlayAlongTempo] = useState<number>(70)
  const [currentChordIdx, setCurrentChordIdx] = useState<number>(0)
  const [currentChordBeat, setCurrentChordBeat] = useState<number>(1)
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(true)
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
      const data = await fetchExercises()
      setExercises(data)
      if (data.length > 0 && !selectedExercise) {
        setSelectedExercise(data[0])
        setPlayAlongTempo(data[0].tempo_bpm || 70)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch exercises')
    } finally {
      setLoadingExercises(false)
    }
  }, [selectedExercise])

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
      setIsStartingSession(true)
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
    } finally {
      setIsStartingSession(false)
    }
  }, [selectedExercise, playAlongTempo, stopPlayAlong, cleanupMic])

  // Restart active session cleanly
  const handleRestartSession = async () => {
    stopPlayAlong()
    cleanupMic()
    setEvaluationResult(null)
    setIsPlayAlongComplete(false)
    setCurrentChordIdx(0)
    setCurrentChordBeat(1)
    await handleStartSession()
  }

  // Reset/Exit session cleanly
  const handleResetSession = () => {
    stopPlayAlong()
    cleanupMic()
    setActiveSession(null)
    setEvaluationResult(null)
    setErrorMessage(null)
    setIsPlayAlongComplete(false)
    setCurrentChordIdx(0)
    setCurrentChordBeat(1)
  }

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

    if (!activeSession) {
      setErrorMessage('No active practice session found.')
      return
    }

    try {
      setIsEvaluating(true)
      const wavBlob = encodeMonoWav(flatSamples, sampleRate)
      const result = await uploadSessionTake(activeSession.id, wavBlob)
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
    if (!activeSession) return
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
      const result = await submitChordsTake(activeSession.id, playedChords)
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

    setIsPlayAlongComplete(false)
    setIsPlayingAlong(true)
    setIsCountingIn(true)
    setCountInBeat(4)

    let localCountingIn = true
    let localCount = 4
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
    <div className="flex flex-col gap-8 rounded-3xl border border-border/80 bg-card/75 p-6 sm:p-8 shadow-sm backdrop-blur-md">
      {/* Studio Header & Tab Switcher */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Practice &amp; Drill Studio
            </h2>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              API Connected
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Complete practice cycle: Exercise Selection ➔ Audio &amp; Chord Sequence Alignment ➔ Statistical Motor-Habits ➔ Grounded AI Coach ➔ Remedial Drills.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex self-start sm:self-auto rounded-xl border border-border bg-background/80 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`rounded-lg px-4 py-2 font-semibold transition-all ${
              activeTab === 'practice'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
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
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <span>Habits &amp; Progress</span>
            <span className="rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] font-bold">
              {userHabits.length}
            </span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
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
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  1
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Practice Exercise
                </span>
              </div>

              {/* Instrument Filter Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                {(['all', 'guitar', 'piano'] as const).map((inst) => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setInstrumentFilter(inst)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                      instrumentFilter === inst
                        ? 'bg-secondary text-secondary-foreground font-semibold border border-border shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {inst === 'all' ? 'All' : inst === 'guitar' ? '🎸 Guitar' : '🎹 Piano'}
                  </button>
                ))}
              </div>
            </div>

            {loadingExercises ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse rounded-2xl border border-dashed border-border">
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
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary'
                          : 'border-border/80 bg-card/60 hover:border-primary/40 hover:bg-card hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              isGuitar
                                ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            <span>{isGuitar ? '🎸' : '🎹'}</span>
                            <span>{ex.instrument}</span>
                          </span>

                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {'★'.repeat(Number(ex.difficulty) || 1)}
                            {'☆'.repeat(Math.max(0, 3 - (Number(ex.difficulty) || 1)))}
                          </span>
                        </div>

                        <h3 className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {ex.title}
                        </h3>
                        {ex.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                            {ex.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {ex.tempo_bpm} BPM
                        </span>
                        <span className="text-[11px] text-primary font-medium">
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* STEP 2: Live Play-Along & Chord Pacing Engine */}
          <div className="rounded-2xl border border-border/80 bg-background/60 p-6 space-y-6 shadow-xs">
            {/* Header with Exercise Info, Pacing Settings & Session Actions */}
            <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    2
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Live Chord Play-Along &amp; Practice Engine
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-foreground text-sm">
                    {selectedExercise?.title || 'Select a Song'}
                  </span>
                  {progressionMeta?.key && (
                    <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                      Key of {progressionMeta.key}
                    </span>
                  )}
                  {progressionMeta?.timeSignature && (
                    <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground font-mono">
                      {progressionMeta.timeSignature}
                    </span>
                  )}
                  {activeSession && (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
                      Session Active
                    </span>
                  )}
                </div>
              </div>

              {/* Tempo & Audio Controls Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Tempo Stepper */}
                <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-2xs">
                  <button
                    type="button"
                    title="Decrease Tempo by 5 BPM"
                    onClick={() => setPlayAlongTempo((t) => Math.max(40, t - 5))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground font-mono font-bold"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono text-xs font-bold text-foreground min-w-[62px] text-center">
                    {playAlongTempo} BPM
                  </span>
                  <button
                    type="button"
                    title="Increase Tempo by 5 BPM"
                    onClick={() => setPlayAlongTempo((t) => Math.min(200, t + 5))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground font-mono font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Metronome Click Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMetronomeEnabled((v) => !v)}
                  title={isMetronomeEnabled ? 'Metronome click is ON' : 'Metronome click is MUTED'}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                    isMetronomeEnabled
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-semibold shadow-2xs'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <span>{isMetronomeEnabled ? '🔊' : '🔇'}</span>
                  <span>Click {isMetronomeEnabled ? 'ON' : 'OFF'}</span>
                </button>

                {/* Chord Audio Guide Toggle */}
                <button
                  type="button"
                  onClick={() => setIsChordAudioEnabled((v) => !v)}
                  title={isChordAudioEnabled ? 'Chord guide audio is ON' : 'Chord guide audio is MUTED'}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                    isChordAudioEnabled
                      ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-semibold shadow-2xs'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <span>{isChordAudioEnabled ? '🎹' : '🔈'}</span>
                  <span>Audio {isChordAudioEnabled ? 'ON' : 'OFF'}</span>
                </button>

                {/* Restart Session Cleanly */}
                {activeSession && (
                  <button
                    type="button"
                    disabled={isStartingSession}
                    onClick={handleRestartSession}
                    title="Reset playback and session state cleanly"
                    className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-amber-500/40 hover:text-amber-500 transition-all disabled:opacity-50"
                  >
                    <span>↺</span>
                    <span>Restart Session</span>
                  </button>
                )}

                {/* Reset / Exit Session */}
                {activeSession && (
                  <button
                    type="button"
                    onClick={handleResetSession}
                    title="Exit active session"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-xs text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* HERO BILLBOARD: Live Play-Along Pacing HUD */}
            {selectedExercise && progressionChords.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-card/90 via-card/60 to-background/80 p-6 shadow-md backdrop-blur-md">
                {isCountingIn ? (
                  // COUNT-IN ANIMATION HUD
                  <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500 animate-pulse">
                      Get Ready to Play
                    </span>
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/10 border-4 border-emerald-500/40 text-emerald-400 font-display text-6xl font-black shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-bounce">
                      {countInBeat}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Place fingers on chord 1:{' '}
                      <span className="font-bold text-foreground text-sm">
                        {progressionChords[0]?.name}
                      </span>{' '}
                      at <span className="font-mono font-bold text-foreground">{playAlongTempo} BPM</span>
                    </p>
                  </div>
                ) : isPlayAlongComplete ? (
                  // TRACK COMPLETE CELEBRATION HUD
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                    <span className="text-4xl animate-bounce">🎉</span>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      Progression Complete!
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                      You followed all {progressionChords.length} chords at {playAlongTempo} BPM.
                      Ready to evaluate your motor-habits and timing accuracy?
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={startPlayAlong}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
                      >
                        <span>▶</span>
                        <span>Play Along Again</span>
                      </button>
                      <button
                        type="button"
                        disabled={isEvaluating}
                        onClick={() => submitSimulatedPreset('clean')}
                        className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        <span>🎯</span>
                        <span>Evaluate Clean Performance</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // ACTIVE PLAY-ALONG PACING HUD (PLAY NOW + NEXT UP)
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
                    {/* Active Chord Marquee (PLAY NOW) */}
                    <div className="lg:col-span-2 flex flex-col justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-6 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black uppercase tracking-wider text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                              <span className="h-2 w-2 rounded-full bg-black animate-ping" />
                              PLAY NOW
                            </span>
                            <span className="font-mono text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                              Chord {currentChordIdx + 1} of {progressionChords.length}
                            </span>
                          </div>

                          <div className="text-xs font-mono font-bold text-muted-foreground">
                            Beat {currentChordBeat} / {progressionChords[currentChordIdx]?.duration_beats || 4}
                          </div>
                        </div>

                        {/* Huge Chord Display */}
                        <div className="my-4 flex items-baseline gap-4">
                          <div className="font-display text-6xl sm:text-7xl font-black text-foreground tracking-tight drop-shadow-sm">
                            {progressionChords[currentChordIdx]?.name || '—'}
                          </div>

                          {/* Instrument Finger / Fret Info */}
                          {progressionChords[currentChordIdx]?.guitar_tabs && (
                            <div className="space-y-1">
                              <div className="text-[11px] font-semibold text-muted-foreground">
                                Strings: {progressionChords[currentChordIdx]?.guitar_tabs?.strings}
                              </div>
                              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-mono font-bold text-foreground shadow-2xs">
                                <span>Frets:</span>
                                <span>
                                  {progressionChords[currentChordIdx]?.guitar_tabs?.frets
                                    ?.map((f) => (f === null ? 'x' : f))
                                    .join(' ')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Smooth Beat Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Chord Progress</span>
                          <span className="font-mono font-bold">
                            {Math.round(
                              (currentChordBeat / (progressionChords[currentChordIdx]?.duration_beats || 4)) * 100
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-border/60 p-0.5">
                          <div
                            className="h-full rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-all duration-150"
                            style={{
                              width: `${
                                (currentChordBeat / (progressionChords[currentChordIdx]?.duration_beats || 4)) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Next Chord Alert Card */}
                    <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/50 p-5">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            👉 Next Up
                          </span>
                          {progressionChords[currentChordIdx + 1] && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-500 border border-amber-500/20">
                              in{' '}
                              {(progressionChords[currentChordIdx]?.duration_beats || 4) -
                                currentChordBeat +
                                1}{' '}
                              beat(s)
                            </span>
                          )}
                        </div>

                        {progressionChords[currentChordIdx + 1] ? (
                          <div className="mt-4 space-y-2">
                            <div className="font-display text-4xl sm:text-5xl font-black text-primary tracking-tight">
                              {progressionChords[currentChordIdx + 1].name}
                            </div>
                            {progressionChords[currentChordIdx + 1].guitar_tabs?.frets && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Frets:{' '}
                                {progressionChords[currentChordIdx + 1].guitar_tabs?.frets
                                  ?.map((f) => (f === null ? 'x' : f))
                                  .join('-')}
                              </p>
                            )}
                            {progressionChords[currentChordIdx + 1].common_mistakes?.[0] && (
                              <p className="text-[11px] text-amber-500/90 leading-normal pt-1">
                                💡 Tip: {progressionChords[currentChordIdx + 1].common_mistakes?.[0]}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-6 text-center space-y-1">
                            <span className="text-2xl">🏁</span>
                            <div className="text-xs font-bold text-foreground">Final Chord!</div>
                            <p className="text-[11px] text-muted-foreground">
                              Progression wraps up after this chord.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Educational Focus Note */}
                      {progressionMeta?.educationalFocus && (
                        <div className="border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Focus:</span>{' '}
                          {progressionMeta.educationalFocus}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary Play-Along Controls Bar */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <div className="flex items-center gap-3">
                    {!isPlayingAlong ? (
                      <button
                        type="button"
                        onClick={startPlayAlong}
                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-98 transition-all"
                      >
                        <span>▶</span>
                        <span>{currentChordIdx > 0 ? 'Resume Play Along' : 'Start Play Along (70 BPM)'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={pausePlayAlong}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-black shadow-sm hover:bg-amber-400 active:scale-98 transition-all"
                      >
                        <span>⏸</span>
                        <span>Pause Play Along</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={restartPlayAlong}
                      className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-all"
                    >
                      ↺ Restart from Beginning
                    </button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Click any chord in sequence below to scrub directly to it.
                  </div>
                </div>
              </div>
            )}

            {/* Chord Progression HUD Ribbon (Interactive Timeline) */}
            {selectedExercise && progressionChords.length > 0 && (
              <div className="space-y-2.5 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Progression Sequence Timeline ({progressionChords.length} chords):
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Current tempo: <span className="font-mono font-bold text-foreground">{playAlongTempo} BPM</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {progressionChords.map((chord, idx) => {
                    const isCurrent = idx === currentChordIdx && !isPlayAlongComplete
                    const isPassed = idx < currentChordIdx || isPlayAlongComplete
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => jumpToChord(idx)}
                        className={`group flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs transition-all ${
                          isCurrent
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/10 scale-105'
                            : isPassed
                            ? 'border-border/60 bg-card/40 text-muted-foreground'
                            : 'border-border/90 bg-card hover:border-primary/50 text-foreground'
                        }`}
                      >
                        <span className="font-display font-extrabold text-sm">
                          {chord.name}
                        </span>

                        <span className="font-mono text-[10px] text-muted-foreground">
                          {chord.duration_beats}b
                        </span>

                        {isCurrent && (
                          <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[9px] font-black text-black">
                            NOW
                          </span>
                        )}
                        {isPassed && <span className="text-[10px] text-emerald-500">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Take Submission Console */}
          {activeSession && (
            <div className="space-y-4 rounded-2xl border border-border/80 bg-background/60 p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  3
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Record Take or Trigger Pedagogical Simulation
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Live Microphone Recorder */}
                <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎙️</span>
                      <h4 className="text-sm font-bold text-foreground">
                        Live Microphone Audio Recording
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Capture 16-bit mono WAV. Offloads Spotify Basic Pitch neural transcription to a worker threadpool.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    {!isRecordingMic ? (
                      <button
                        type="button"
                        onClick={startMicRecording}
                        disabled={isEvaluating}
                        className="flex items-center justify-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-xs font-bold text-rose-500 hover:bg-rose-500/20 active:scale-98 transition-all disabled:opacity-50"
                      >
                        <span className="h-3 w-3 rounded-full bg-rose-500" />
                        <span>Start Microphone Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopMicAndSubmitTake}
                        disabled={isEvaluating}
                        className="flex items-center justify-center gap-2.5 rounded-xl bg-rose-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-rose-600/20 animate-pulse hover:bg-rose-700 active:scale-98 transition-all"
                      >
                        <span className="h-2.5 w-2.5 rounded-sm bg-white" />
                        <span>Stop &amp; Evaluate Take ({micSeconds}s)</span>
                      </button>
                    )}

                    {isRecordingMic && (
                      <div className="flex items-center gap-2 text-xs text-emerald-500 dark:text-emerald-400 font-medium">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Listening at 22,050 Hz...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1-Click Pedagogical Simulation Presets */}
                <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧪</span>
                      <h4 className="text-sm font-bold text-foreground">
                        1-Click Pedagogical Simulation Presets
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Instant evaluation presets to stress-test Needleman-Wunsch DP alignment, CUSUM habit curves, and AI coaching without mic input.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('clean')}
                      className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-left text-xs font-medium text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all disabled:opacity-50"
                    >
                      <span className="text-base">🎯</span>
                      <div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">Clean Take</div>
                        <div className="text-[10px] text-muted-foreground">&lt;10ms timing error</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('lag')}
                      className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-left text-xs font-medium text-foreground hover:bg-amber-500/10 hover:border-amber-500/40 transition-all disabled:opacity-50"
                    >
                      <span className="text-base">⏱️</span>
                      <div>
                        <div className="font-bold text-amber-600 dark:text-amber-400">Transition Lag</div>
                        <div className="text-[10px] text-muted-foreground">+140ms entry latency</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('dragging')}
                      className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5 text-left text-xs font-medium text-foreground hover:bg-blue-500/10 hover:border-blue-500/40 transition-all disabled:opacity-50"
                    >
                      <span className="text-base">🐌</span>
                      <div>
                        <div className="font-bold text-blue-600 dark:text-blue-400">Tempo Dragging</div>
                        <div className="text-[10px] text-muted-foreground">+45ms behind beat</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('rushing')}
                      className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-2.5 text-left text-xs font-medium text-foreground hover:bg-purple-500/10 hover:border-purple-500/40 transition-all disabled:opacity-50"
                    >
                      <span className="text-base">⚡</span>
                      <div>
                        <div className="font-bold text-purple-600 dark:text-purple-400">Tempo Rushing</div>
                        <div className="text-[10px] text-muted-foreground">-35ms early attacks</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('voicing_drop')}
                      className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 text-left text-xs font-medium text-foreground hover:bg-rose-500/10 hover:border-rose-500/40 transition-all disabled:opacity-50"
                    >
                      <span className="text-base">🎵</span>
                      <div>
                        <div className="font-bold text-rose-600 dark:text-rose-400">Drop Harmonic 3rd</div>
                        <div className="text-[10px] text-muted-foreground">Drops essential chord quality tones (Harmonic Role Severity 4.5/5.0)</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEvaluating && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center space-y-3 animate-pulse">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary text-lg">
                ⚙️
              </div>
              <h4 className="font-display text-sm font-bold text-foreground">
                Analyzing Take &amp; Evaluating Motor-Habit Curves...
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Running Needleman-Wunsch DP alignment, Page&apos;s CUSUM change-point detection, and Grounded AI Coaching.
              </p>
            </div>
          )}

          {/* STEP 4: Precision Metrics & Grounded AI Coaching */}
          {evaluationResult && (
            <div className="space-y-8">
              {/* Score Metric Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-border/80 bg-card p-5 text-center shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Overall Accuracy
                  </div>
                  <div className="mt-2 font-display text-3xl font-extrabold text-foreground">
                    {(evaluationResult.overall_accuracy * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-5 text-center shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Avg Timing Offset
                  </div>
                  <div className={`mt-2 font-display text-3xl font-extrabold ${
                    Math.abs(evaluationResult.avg_timing_error_ms) < 25
                      ? 'text-emerald-500'
                      : Math.abs(evaluationResult.avg_timing_error_ms) < 50
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }`}>
                    {evaluationResult.avg_timing_error_ms > 0 ? `+` : ``}
                    {evaluationResult.avg_timing_error_ms.toFixed(1)}ms
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-5 text-center shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Voicing Score
                  </div>
                  <div className="mt-2 font-display text-3xl font-extrabold text-foreground">
                    {(evaluationResult.voicing_score * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-5 text-center shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Grade
                  </div>
                  <div className="mt-2 font-display text-3xl font-extrabold text-emerald-500 dark:text-emerald-400">
                    {evaluationResult.coaching_report?.letter_grade || 'A'}
                  </div>
                </div>
              </div>

              {/* Longitudinal Drill Outcome Banner */}
              {evaluationResult.drill_outcome && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Longitudinal Remedial Outcome Tracked
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {evaluationResult.drill_outcome.completed ? 'REMEDIATED ✓' : 'IN PROGRESS'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-foreground">
                    Status: <span className="font-bold uppercase">{evaluationResult.drill_outcome.outcome}</span>
                    {evaluationResult.drill_outcome.measured_improvement_pct !== undefined && (
                      <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                        (+{evaluationResult.drill_outcome.measured_improvement_pct}% Improvement Delta)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Chord-by-Chord Alignment HUD */}
              <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Sequence Alignment HUD ({evaluationResult.chord_metrics.length} events)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Needleman-Wunsch Harmonic Jaccard Matrix
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {evaluationResult.chord_metrics.map((metric, i) => (
                    <div
                      key={i}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/50 p-4 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-foreground text-sm">
                          {metric.expected_chord}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            metric.is_matched
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-destructive/15 text-destructive border border-destructive/20'
                          }`}
                        >
                          {metric.is_matched ? 'MATCH' : 'MISS'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-2">
                        <div className="flex items-center justify-between">
                          <span>Detected:</span>
                          <span className="font-semibold text-foreground">
                            {metric.detected_chord || 'None'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Timing:</span>
                          <span className={`font-mono font-semibold ${
                            Math.abs(metric.onset_error_ms) < 25
                              ? 'text-emerald-500'
                              : Math.abs(metric.onset_error_ms) < 50
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`}>
                            {metric.onset_error_ms > 0 ? `+${metric.onset_error_ms.toFixed(0)}` : metric.onset_error_ms.toFixed(0)}ms
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Voicing:</span>
                          <span className="font-medium text-foreground">
                            {(metric.voicing_completeness * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounded AI Coaching Card & Remedial Drill Generator */}
              <div className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧠</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Grounded AI Coaching Report
                      </span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                      {evaluationResult.coaching_report.headline}
                    </h3>
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingDrill}
                    onClick={handleGenerateDrill}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isGeneratingDrill ? 'Generating Drill...' : '⚡ Generate Remedial Drill'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
                  {/* Left Column: Bottlenecks & Advice */}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wide">
                        <span>⚠️</span>
                        <span>Primary Bottleneck</span>
                      </div>
                      <p className="text-xs text-foreground font-medium">
                        {evaluationResult.coaching_report.primary_bottleneck}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                        <span>💡</span>
                        <span>Ergonomic Advice</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {evaluationResult.coaching_report.ergonomic_advice}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Strengths & Habits */}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wide">
                        <span>✓</span>
                        <span>Key Strengths</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        {evaluationResult.coaching_report.key_strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wide">
                        <span>📊</span>
                        <span>Habit Alerts</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        {evaluationResult.coaching_report.habit_alerts.length > 0 ? (
                          evaluationResult.coaching_report.habit_alerts.map((h, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-500">•</span>
                              <span>{h}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-emerald-500">No acute negative habit patterns detected!</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Render Generated Drill if created */}
                {generatedDrill && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-primary/20 pb-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Adaptive Remedial Drill Generated
                        </span>
                        <h4 className="font-display text-base font-bold text-foreground capitalize mt-0.5">
                          {generatedDrill.drill_type.replace(/_/g, ' ')}
                        </h4>
                      </div>

                      <span className="self-start sm:self-auto rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary border border-primary/30">
                        Target {generatedDrill.target_tempo} BPM ({generatedDrill.target_repetitions}x)
                      </span>
                    </div>

                    <p className="text-xs text-foreground leading-relaxed">
                      {generatedDrill.description || 'Targeted remediation drill generated based on statistical habit patterns.'}
                    </p>

                    {/* Multi-stage tempo ramp display */}
                    {generatedDrill.tempo_stages && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                        <div className="rounded-xl border border-border/80 bg-card p-3">
                          <div className="text-[10px] text-muted-foreground uppercase">1. Isolation</div>
                          <div className="font-display text-base font-bold text-foreground mt-0.5">
                            {generatedDrill.tempo_stages.isolation_bpm} BPM
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/80 bg-card p-3">
                          <div className="text-[10px] text-muted-foreground uppercase">2. Step Ramp</div>
                          <div className="font-display text-base font-bold text-foreground mt-0.5">
                            +{generatedDrill.tempo_stages.step_bpm} BPM
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/80 bg-card p-3">
                          <div className="text-[10px] text-muted-foreground uppercase">3. Target</div>
                          <div className="font-display text-base font-bold text-foreground mt-0.5">
                            {generatedDrill.tempo_stages.target_bpm} BPM
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/80 bg-card p-3">
                          <div className="text-[10px] text-muted-foreground uppercase">4. Goal Mastery</div>
                          <div className="font-display text-base font-bold text-emerald-500 mt-0.5">
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
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50"
                      >
                        {isPracticingDrill ? 'Evaluating Remedial Take...' : '🚀 Practice This Drill (Test Outcome Tracking)'}
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
              <div className="rounded-2xl border border-border/80 bg-card p-5 text-center shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Sessions Completed
                </div>
                <div className="mt-2 font-display text-3xl font-extrabold text-foreground">
                  {userStats.total_sessions_completed}
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 text-center shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Overall Accuracy
                </div>
                <div className="mt-2 font-display text-3xl font-extrabold text-foreground">
                  {userStats.overall_accuracy_pct}%
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 text-center shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Interventions Done
                </div>
                <div className="mt-2 font-display text-3xl font-extrabold text-emerald-500 dark:text-emerald-400">
                  {userStats.interventions_completed}
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 text-center shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Streak Days
                </div>
                <div className="mt-2 font-display text-3xl font-extrabold text-primary">
                  {userStats.streak_days} 🔥
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Statistical Motor-Habit Portfolio ({userHabits.length} Patterns Tracked)
              </span>
              <span className="text-xs text-muted-foreground">
                Page&apos;s CUSUM + EWMA α=0.40
              </span>
            </div>

            {userHabits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-background/50 p-8 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No motor habits recorded yet.</p>
                <p>Practice an exercise and submit takes with intentional lag, rushing, or missing notes to build your habit profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-card p-5 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold uppercase text-primary text-xs">
                        {habit.pattern_type.replace(/_/g, ' ')}
                      </span>
                      <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground border border-border/60">
                        {habit.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-border/50 pt-3">
                      <div className="text-muted-foreground">
                        Trigger Context:{' '}
                        <span className="font-semibold text-foreground font-mono">
                          {habit.trigger_context}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Evidence Recorded:{' '}
                        <span className="font-semibold text-foreground">
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
