import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchExercises, createPracticeSession, uploadSessionTake, fetchSessionAnalysis } from '../sessions'

describe('sessions API client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetchExercises sends GET request with Authorization header', async () => {
    const mockExercises = [{ id: 'ex_1', title: 'Pop Cadence', instrument: 'guitar', tempo_bpm: 80 }]
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockExercises,
    } as Response)
    vi.stubGlobal('fetch', mockFetch)

    const result = await fetchExercises('test_token')
    expect(result).toEqual(mockExercises)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/exercises', {
      headers: { Authorization: 'Bearer test_token' },
    })
  })

  it('createPracticeSession sends POST request with exercise_id', async () => {
    const mockSession = { id: 'sess_123', exercise_id: 'ex_1', user_id: 'user_1' }
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSession,
    } as Response)
    vi.stubGlobal('fetch', mockFetch)

    const result = await createPracticeSession('ex_1', 'test_token')
    expect(result).toEqual(mockSession)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test_token',
      },
      body: JSON.stringify({ exercise_id: 'ex_1' }),
    })
  })

  it('uploadSessionTake sends multipart FormData with audio blob', async () => {
    const mockRes = { message: 'Take submitted successfully', session_id: 'sess_123' }
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRes,
    } as Response)
    vi.stubGlobal('fetch', mockFetch)

    const blob = new Blob(['mock-audio'], { type: 'audio/wav' })
    const result = await uploadSessionTake('sess_123', blob, 'test_token')
    expect(result).toEqual(mockRes)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/sessions/sess_123/take',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test_token' },
      })
    )
  })

  it('fetchSessionAnalysis retrieves analysis metrics', async () => {
    const mockAnalysis = {
      session_id: 'sess_123',
      exercise_id: 'ex_1',
      total_chords: 4,
      matched_chords: 4,
      accuracy_pct: 100,
      metrics: [],
    }
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAnalysis,
    } as Response)
    vi.stubGlobal('fetch', mockFetch)

    const result = await fetchSessionAnalysis('sess_123', 'test_token')
    expect(result).toEqual(mockAnalysis)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/sessions/sess_123/analysis', {
      headers: { Authorization: 'Bearer test_token' },
    })
  })
})
