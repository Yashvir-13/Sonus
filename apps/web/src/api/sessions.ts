import { apiBaseUrl } from '@/lib/api/config'

export type ExerciseDto = {
  id: string
  title: string
  instrument: string
  tempo_bpm: number
  progression_json?: string
  difficulty?: number | string
  progression?: {
    key?: string
    tempo_range?: {
      min_bpm: number
      default_bpm: number
      max_bpm: number
      gradual_step_bpm: number
    }
    chords?: Array<{
      name: string
      beat: number
      expected_pitches?: number[]
    }>
  }
}

export type PracticeSessionDto = {
  id: string
  user_id: string
  exercise_id: string
  tempo_bpm: number
  state: string
  overall_accuracy?: number | null
  avg_timing_error_ms?: number | null
  voicing_score?: number | null
  intervention_id?: string | null
  created_at?: string
  updated_at?: string
}

export type ChordMetricDto = {
  chord_index: number
  expected_chord: string
  detected_chord: string | null
  onset_error_ms: number
  voicing_completeness: number
  missed_notes: string[]
  extra_notes: string[]
  is_matched: boolean
}

export type CoachingReportDto = {
  session_id: string
  headline: string
  score: number
  letter_grade: string
  status: string
  summary: string
  primary_bottleneck: string
  ergonomic_advice: string
  key_strengths: string[]
  growth_areas: string[]
  habit_alerts: string[]
  recommended_tempo_adjustment_bpm: number
  tailored_drills: Array<{
    drill_type: string
    target_tempo: number
    target_repetitions: number
    description: string
  }>
}

export type DrillOutcomeDto = {
  drill_type: string
  outcome: 'improved' | 'steady' | 'worsened' | 'inconclusive'
  measured_improvement?: number
  measured_improvement_pct?: number
  completed: boolean
  baseline_value?: number
  follow_up_value?: number
  message?: string
}

export type TakeEvaluationResponse = {
  session_id: string
  state: string
  analysis_status: string
  overall_accuracy: number
  avg_timing_error_ms: number
  voicing_score: number
  chord_metrics: ChordMetricDto[]
  coaching_report: CoachingReportDto
  drill_outcome?: DrillOutcomeDto
}

export type SessionAnalysisDto = {
  session: PracticeSessionDto
  chord_metrics: ChordMetricDto[]
  overall_accuracy: number
  avg_timing_error_ms: number
  voicing_score: number
}

export type AdaptiveInterventionDto = {
  id: string
  pattern_id: string
  user_id: string
  drill_type: string
  target_tempo: number
  target_repetitions: number
  completed: boolean
  measured_improvement: number | null
  progression?: Array<{ name: string; beats: number; root?: string }>
  tempo_stages?: {
    isolation_bpm: number
    step_bpm: number
    target_bpm: number
    goal_bpm: number
  }
  spaced_repetition?: {
    priority: number
    review_interval_days: number
    mastery_level: string
  }
  description?: string
}

export type HabitPatternDto = {
  id: string
  user_id: string
  pattern_type: string
  trigger_context: string
  evidence_count: number
  status: string
  severity?: number
  confidence?: number
}

export type UserStatsDto = {
  user_id: string
  total_sessions_completed: number
  overall_accuracy_pct: number
  avg_timing_error_ms: number
  avg_voicing_score: number
  active_habits_count: number
  interventions_completed: number
  streak_days: number
}

function getAuthHeader(token?: string): Record<string, string> {
  const effectiveToken = token || (import.meta.env.DEV ? 'dev_token' : '')
  return effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}
}

/**
 * Fetch list of all available practice exercises.
 */
export async function fetchExercises(
  token?: string,
  params?: { instrument?: string; difficulty?: string | number }
): Promise<ExerciseDto[]> {
  const query = new URLSearchParams()
  if (params?.instrument) query.set('instrument', params.instrument)
  if (params?.difficulty !== undefined) query.set('difficulty', String(params.difficulty))

  const queryString = query.toString() ? `?${query.toString()}` : ''
  const res = await fetch(`${apiBaseUrl()}/api/exercises${queryString}`, {
    headers: { ...getAuthHeader(token) },
  })
  if (!res.ok) {
    throw new Error(`GET /api/exercises failed: ${res.status}`)
  }
  return res.json() as Promise<ExerciseDto[]>
}

/**
 * Fetch detail for an individual exercise.
 */
export async function fetchExerciseDetail(exerciseId: string, token?: string): Promise<ExerciseDto> {
  const res = await fetch(`${apiBaseUrl()}/api/exercises/${exerciseId}`, {
    headers: { ...getAuthHeader(token) },
  })
  if (!res.ok) {
    throw new Error(`GET /api/exercises/${exerciseId} failed: ${res.status}`)
  }
  return res.json() as Promise<ExerciseDto>
}

/**
 * Create a new practice session for a given exercise.
 */
export async function createPracticeSession(
  exerciseId: string,
  token?: string,
  options?: { tempoBpm?: number; interventionId?: string }
): Promise<PracticeSessionDto> {
  const body: Record<string, unknown> = { exercise_id: exerciseId }
  if (options?.tempoBpm) body.tempo_bpm = options.tempoBpm
  if (options?.interventionId) body.intervention_id = options.interventionId

  const res = await fetch(`${apiBaseUrl()}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`POST /api/sessions failed: ${res.status}`)
  }
  return res.json() as Promise<PracticeSessionDto>
}

/**
 * Upload a recorded WAV take for polyphonic chord analysis.
 */
export async function uploadSessionTake(
  sessionId: string,
  audioBlob: Blob,
  token?: string
): Promise<TakeEvaluationResponse> {
  const formData = new FormData()
  formData.append('audio_file', audioBlob, 'take.wav')
  formData.append('file', audioBlob, 'take.wav')

  const res = await fetch(`${apiBaseUrl()}/api/sessions/${sessionId}/take`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(token),
    },
    body: formData,
  })
  if (!res.ok) {
    throw new Error(`POST /api/sessions/${sessionId}/take failed: ${res.status}`)
  }
  return res.json() as Promise<TakeEvaluationResponse>
}

/**
 * Submit simulated or pre-detected chord events as JSON.
 */
export async function submitChordsTake(
  sessionId: string,
  playedChords: Array<Record<string, unknown>>,
  token?: string
): Promise<TakeEvaluationResponse> {
  const res = await fetch(`${apiBaseUrl()}/api/sessions/${sessionId}/take`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: JSON.stringify({ played_chords: playedChords }),
  })
  if (!res.ok) {
    throw new Error(`POST /api/sessions/${sessionId}/take failed: ${res.status}`)
  }
  return res.json() as Promise<TakeEvaluationResponse>
}

/**
 * Fetch detailed chord alignment, timing, and voicing analysis for a session.
 */
export async function fetchSessionAnalysis(
  sessionId: string,
  token?: string
): Promise<SessionAnalysisDto> {
  const res = await fetch(`${apiBaseUrl()}/api/sessions/${sessionId}/analysis`, {
    headers: { ...getAuthHeader(token) },
  })
  if (!res.ok) {
    throw new Error(`GET /api/sessions/${sessionId}/analysis failed: ${res.status}`)
  }
  return res.json() as Promise<SessionAnalysisDto>
}

/**
 * Fetch grounded AI coaching feedback for a session.
 */
export async function fetchSessionCoaching(
  sessionId: string,
  token?: string
): Promise<CoachingReportDto> {
  const res = await fetch(`${apiBaseUrl()}/api/sessions/${sessionId}/coaching`, {
    headers: { ...getAuthHeader(token) },
  })
  if (!res.ok) {
    throw new Error(`GET /api/sessions/${sessionId}/coaching failed: ${res.status}`)
  }
  return res.json() as Promise<CoachingReportDto>
}

/**
 * Request dynamic adaptive remedial drill generation for a session.
 */
export async function createSessionDrill(
  sessionId: string,
  token?: string
): Promise<AdaptiveInterventionDto> {
  const res = await fetch(`${apiBaseUrl()}/api/sessions/${sessionId}/drill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    throw new Error(`POST /api/sessions/${sessionId}/drill failed: ${res.status}`)
  }
  return res.json() as Promise<AdaptiveInterventionDto>
}

/**
 * Fetch detected habit patterns for authenticated user.
 */
export async function fetchUserHabits(token?: string): Promise<HabitPatternDto[]> {
  const res = await fetch(`${apiBaseUrl()}/api/me/habits`, {
    headers: { ...getAuthHeader(token) },
  })
  if (!res.ok) {
    throw new Error(`GET /api/me/habits failed: ${res.status}`)
  }
  return res.json() as Promise<HabitPatternDto[]>
}

/**
 * Fetch longitudinal practice statistics for authenticated user.
 */
export async function fetchUserStats(token?: string): Promise<UserStatsDto> {
  const res = await fetch(`${apiBaseUrl()}/api/me/stats`, {
    headers: { ...getAuthHeader(token) },
  })
  if (!res.ok) {
    throw new Error(`GET /api/me/stats failed: ${res.status}`)
  }
  return res.json() as Promise<UserStatsDto>
}

/**
 * Fetch remedial drills and interventions generated for authenticated user.
 */
export async function fetchUserInterventions(token?: string): Promise<AdaptiveInterventionDto[]> {
  const res = await fetch(`${apiBaseUrl()}/api/me/interventions`, {
    headers: { ...getAuthHeader(token) },
  })
  if (!res.ok) {
    throw new Error(`GET /api/me/interventions failed: ${res.status}`)
  }
  return res.json() as Promise<AdaptiveInterventionDto[]>
}
