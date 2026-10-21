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

export function PracticeTestingStudio() {
  const [exercises, setExercises] = useState<ExerciseDto[]>([])
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDto | null>(null)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [activeSession, setActiveSession] = useState<PracticeSessionDto | null>(null)
  const [isStartingSession, setIsStartingSession] = useState(false)

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

  // Microphone recording refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const recordedSamplesRef = useRef<Float32Array[]>([])
  const timerIntervalRef = useRef<number | null>(null)

  // Load exercises and user profile on mount
  const refreshExercises = useCallback(async () => {
    try {
      setLoadingExercises(true)
      const data = await fetchExercises()
      setExercises(data)
      if (data.length > 0 && !selectedExercise) {
        setSelectedExercise(data[0])
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

  // Handle starting a practice session
  const handleStartSession = async (interventionId?: string) => {
    if (!selectedExercise) return
    try {
      setIsStartingSession(true)
      setErrorMessage(null)
      setEvaluationResult(null)
      const newSession = await createPracticeSession(selectedExercise.id, undefined, {
        tempoBpm: selectedExercise.tempo_bpm || 80,
        interventionId,
      })
      setActiveSession(newSession)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setIsStartingSession(false)
    }
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

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {/* Studio Header & Tab Switcher */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Adaptive Practice & Engine Studio
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              API Live
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Test the entire conservatory loop: Exercise Catalog → Precision Audio/Chord Alignment → Statistical Habits → Grounded AI Coaching → Remedial Drill Generation.
          </p>
        </div>

        <div className="flex rounded-lg border border-border bg-background p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`rounded-md px-3 py-1.5 font-semibold transition-all ${
              activeTab === 'practice'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
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
            className={`rounded-md px-3 py-1.5 font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Habits & Progress ({userHabits.length})
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          {errorMessage}
        </div>
      )}

      {activeTab === 'practice' ? (
        <div className="space-y-6">
          {/* STEP 1: Select Exercise */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step 1: Choose Practice Exercise
              </span>
              <span className="text-xs text-muted-foreground">
                {exercises.length} available in catalog
              </span>
            </div>

            {loadingExercises ? (
              <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
                Loading exercises catalog from database...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {exercises.map((ex) => {
                  const isSelected = selectedExercise?.id === ex.id
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setSelectedExercise(ex)}
                      className={`flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background/50 hover:bg-accent'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">{ex.title}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          {ex.instrument}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{ex.tempo_bpm} BPM</span>
                        <span>•</span>
                        <span>Difficulty {ex.difficulty || 1}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* STEP 2: Session Starter */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step 2: Active Practice Session
              </span>
              <div className="mt-1 text-xs">
                {activeSession ? (
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    Session Active: {activeSession.id} ({activeSession.tempo_bpm} BPM)
                    {activeSession.intervention_id && ' [Linked to Intervention Drill]'}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    No active session. Click &quot;Start Practice Session&quot; to begin.
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={isStartingSession || !selectedExercise}
              onClick={() => handleStartSession()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isStartingSession ? 'Starting Session...' : activeSession ? 'Restart Session' : 'Start Practice Session'}
            </button>
          </div>

          {/* STEP 3: Take Submission Console */}
          {activeSession && (
            <div className="space-y-4 rounded-xl border border-border bg-background/60 p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step 3: Record or Simulate Take
              </span>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Microhone Recorder */}
                <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Acoustic Microphone Take</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Records real-time 16-bit mono WAV, validates audio, and runs deep polyphonic multipitch transcription.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    {!isRecordingMic ? (
                      <button
                        type="button"
                        onClick={startMicRecording}
                        disabled={isEvaluating}
                        className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
                      >
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Start Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopMicAndSubmitTake}
                        disabled={isEvaluating}
                        className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white animate-pulse"
                      >
                        <span>Stop & Analyze Take ({micSeconds}s)</span>
                      </button>
                    )}
                    {isRecordingMic && (
                      <span className="text-[11px] text-muted-foreground animate-pulse">
                        Listening to audio input...
                      </span>
                    )}
                  </div>
                </div>

                {/* Simulation Presets */}
                <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">One-Click Pedagogical Presets</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Trigger deterministic musical bottlenecks to stress-test statistical habit detection and AI coaching.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('clean')}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                    >
                      🎯 Clean Take
                    </button>
                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('lag')}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      ⏱️ Transition Lag (+140ms)
                    </button>
                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('dragging')}
                      className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      🐌 Dragging (+45ms)
                    </button>
                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('rushing')}
                      className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
                    >
                      ⚡ Rushing (-35ms)
                    </button>
                    <button
                      type="button"
                      disabled={isEvaluating}
                      onClick={() => submitSimulatedPreset('voicing_drop')}
                      className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      🎵 Drop 3rd (Harmonic Weight)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEvaluating && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center text-xs font-semibold text-primary animate-pulse">
              Running Needleman-Wunsch Alignment, Statistical EWMA Habits, and AI Coaching Generation...
            </div>
          )}

          {/* STEP 4: Alignment Results & Precision Metrics */}
          {evaluationResult && (
            <div className="space-y-6">
              {/* Score Banners */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Accuracy</div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {(evaluationResult.overall_accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg Timing Offset</div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {evaluationResult.avg_timing_error_ms.toFixed(1)}ms
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Voicing Score</div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {(evaluationResult.voicing_score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Grade</div>
                  <div className="font-display text-2xl font-bold text-primary">
                    {evaluationResult.coaching_report?.letter_grade || 'A'}
                  </div>
                </div>
              </div>

              {/* Longitudinal Drill Outcome Banner (if this was a remedial drill take) */}
              {evaluationResult.drill_outcome && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      🏆 Longitudinal Drill Outcome
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {evaluationResult.drill_outcome.completed ? 'REMEDIATED' : 'IN PROGRESS'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground">
                    Outcome: <span className="font-bold uppercase">{evaluationResult.drill_outcome.outcome}</span>
                    {evaluationResult.drill_outcome.measured_improvement_pct !== undefined && (
                      <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                        (+{evaluationResult.drill_outcome.measured_improvement_pct}% Improvement)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Chord-by-Chord Alignment HUD */}
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sequence Alignment HUD ({evaluationResult.chord_metrics.length} events)
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {evaluationResult.chord_metrics.map((metric, i) => (
                    <div
                      key={i}
                      className="flex flex-col justify-between rounded-lg border border-border bg-background/50 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          Chord {metric.chord_index + 1}: {metric.expected_chord}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            metric.is_matched
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-destructive/15 text-destructive'
                          }`}
                        >
                          {metric.is_matched ? 'MATCH' : 'MISS'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                        <div>Detected: <span className="font-semibold text-foreground">{metric.detected_chord || 'None'}</span></div>
                        <div>Timing: <span className="font-mono">{metric.onset_error_ms > 0 ? `+${metric.onset_error_ms.toFixed(0)}` : metric.onset_error_ms.toFixed(0)}ms</span></div>
                        <div>Voicing: {(metric.voicing_completeness * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Coaching Letter & Remedial Drill Generator */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Grounded AI Coaching Report
                    </span>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {evaluationResult.coaching_report.headline}
                    </h3>
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingDrill}
                    onClick={handleGenerateDrill}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 disabled:opacity-50"
                  >
                    {isGeneratingDrill ? 'Generating Drill...' : 'Generate Remedial Drill'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
                  <div className="rounded-lg border border-border bg-background/40 p-3.5 space-y-2">
                    <span className="font-bold text-foreground">Primary Bottleneck:</span>
                    <p className="text-muted-foreground">{evaluationResult.coaching_report.primary_bottleneck}</p>
                    <span className="font-bold text-foreground mt-2 block">Ergonomic Advice:</span>
                    <p className="text-muted-foreground">{evaluationResult.coaching_report.ergonomic_advice}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-background/40 p-3.5 space-y-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Key Strengths:</span>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                      {evaluationResult.coaching_report.key_strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                    <span className="font-bold text-amber-600 dark:text-amber-400 mt-2 block">Habit Alerts:</span>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                      {evaluationResult.coaching_report.habit_alerts.length > 0 ? (
                        evaluationResult.coaching_report.habit_alerts.map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))
                      ) : (
                        <li>No acute negative habit patterns detected!</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Render Generated Drill if created */}
                {generatedDrill && (
                  <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Dynamic Remedial Drill: {generatedDrill.drill_type}
                      </span>
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                        Target {generatedDrill.target_tempo} BPM ({generatedDrill.target_repetitions}x)
                      </span>
                    </div>

                    <p className="text-xs text-foreground">
                      {generatedDrill.description || 'Targeted remediation drill generated based on statistical habit patterns.'}
                    </p>

                    {/* Multi-stage tempo ramp display */}
                    {generatedDrill.tempo_stages && (
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="rounded border border-border bg-card p-2">
                          <div className="text-[10px] text-muted-foreground">Isolation</div>
                          <div className="font-bold text-foreground">{generatedDrill.tempo_stages.isolation_bpm} BPM</div>
                        </div>
                        <div className="rounded border border-border bg-card p-2">
                          <div className="text-[10px] text-muted-foreground">Step Ramp</div>
                          <div className="font-bold text-foreground">+{generatedDrill.tempo_stages.step_bpm} BPM</div>
                        </div>
                        <div className="rounded border border-border bg-card p-2">
                          <div className="text-[10px] text-muted-foreground">Target</div>
                          <div className="font-bold text-foreground">{generatedDrill.tempo_stages.target_bpm} BPM</div>
                        </div>
                        <div className="rounded border border-border bg-card p-2">
                          <div className="text-[10px] text-muted-foreground">Goal Mastery</div>
                          <div className="font-bold text-foreground">{generatedDrill.tempo_stages.goal_bpm} BPM</div>
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isPracticingDrill}
                        onClick={handlePracticeRemedialDrill}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isPracticingDrill ? 'Evaluating Remedial Take...' : 'Practice This Drill (Test Outcome Tracking)'}
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
        <div className="space-y-6">
          {userStats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">Sessions Completed</div>
                <div className="font-display text-2xl font-bold text-foreground">{userStats.total_sessions_completed}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">Overall Accuracy</div>
                <div className="font-display text-2xl font-bold text-foreground">{userStats.overall_accuracy_pct}%</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">Interventions Completed</div>
                <div className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">{userStats.interventions_completed}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">Streak Days</div>
                <div className="font-display text-2xl font-bold text-primary">{userStats.streak_days} 🔥</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Statistical Habit Portfolio ({userHabits.length} Patterns Tracked)
            </span>

            {userHabits.length === 0 ? (
              <div className="rounded-xl border border-border bg-background/50 p-6 text-center text-xs text-muted-foreground">
                No habit patterns recorded yet. Practice an exercise and submit takes with intentional hesitation or rushing to populate habits.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {userHabits.map((habit) => (
                  <div key={habit.id} className="rounded-xl border border-border bg-background/60 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-primary text-[11px]">{habit.pattern_type}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {habit.status}
                      </span>
                    </div>
                    <div className="mt-2 text-foreground">
                      Context: <span className="font-semibold">{habit.trigger_context}</span>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      Evidence Count: <span className="font-semibold text-foreground">{habit.evidence_count} takes</span>
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
