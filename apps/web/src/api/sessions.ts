import { apiBaseUrl } from '@/lib/api/config'

export type ExerciseDto = {
  id: string
  title: string
  instrument: string
  tempo_bpm: number
  chords_json?: string
  difficulty_level?: string
}

export type PracticeSessionDto = {
  id: string
  user_id: string
  exercise_id: string
  status?: string
  created_at?: string
  completed_at?: string
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

export type SessionAnalysisDto = {
  session_id: string
  exercise_id: string
  total_chords: number
  matched_chords: number
  accuracy_pct: number
  metrics: ChordMetricDto[]
  report?: {
    summary: string
    facts: Record<string, unknown>
    grounded_facts: Array<Record<string, unknown>>
  }
}

/**
 * Fetch list of all available practice exercises.
 */
export async function fetchExercises(token: string): Promise<ExerciseDto[]> {
  const res = await fetch(`${apiBaseUrl()}/api/exercises`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`GET /api/exercises failed: ${res.status}`)
  }
  return res.json() as Promise<ExerciseDto[]>
}

/**
 * Create a new practice session for a given exercise.
 */
export async function createPracticeSession(
  exerciseId: string,
  token: string
): Promise<PracticeSessionDto> {
  const res = await fetch(`${apiBaseUrl()}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ exercise_id: exerciseId }),
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
  token: string
): Promise<{ message: string; session_id: string; [key: string]: unknown }> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'take.wav')

  const res = await fetch(`${apiBaseUrl()}/api/sessions/${sessionId}/take`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  if (!res.ok) {
    throw new Error(`POST /api/sessions/${sessionId}/take failed: ${res.status}`)
  }
  return res.json() as Promise<{ message: string; session_id: string; [key: string]: unknown }>
}

/**
 * Fetch detailed chord alignment, timing, and voicing analysis for a session.
 */
export async function fetchSessionAnalysis(
  sessionId: string,
  token: string
): Promise<SessionAnalysisDto> {
  const res = await fetch(`${apiBaseUrl()}/api/sessions/${sessionId}/analysis`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`GET /api/sessions/${sessionId}/analysis failed: ${res.status}`)
  }
  return res.json() as Promise<SessionAnalysisDto>
}
