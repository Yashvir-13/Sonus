import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAudioWorkletNode, createPcmCaptureHandle } from '@/lib/audio/worklet-loader'
import { PracticeAudioEngine, midiToFreq } from '@/lib/audio/practice-audio-engine'
import { GuitarTunerPage } from '@/components/tuner/guitar-tuner-page'
import { ProgressDashboardPage } from '@/components/progress/progress-dashboard-page'
import { MastheadNav } from '@/components/landing/masthead-nav'
import { PianoWaterfallStand } from '@/components/practice/piano-waterfall-stand'
import { TakeEvaluationDrawer } from '@/components/practice/take-evaluation-drawer'
import { SettingsModal } from '@/components/settings/settings-modal'
import { INITIAL_TRANSITION_MASTERY } from '@/lib/adaptive/recommendation-engine'
import { resolveChordVoicing } from '@/lib/music/chord-voicings'

const apiMocks = vi.hoisted(() => ({
  fetchExercises: vi.fn().mockResolvedValue([]),
  createPracticeSession: vi.fn().mockResolvedValue({ id: 'sess_life_1' }),
  uploadSessionTake: vi.fn(),
  submitChordsTake: vi.fn(),
  createSessionDrill: vi.fn(),
  fetchUserHabits: vi.fn().mockResolvedValue([]),
  fetchUserMastery: vi.fn().mockResolvedValue({ records: [], recommendations: [] }),
}))

vi.mock('@/api/sessions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/sessions')>()
  return {
    ...actual,
    fetchExercises: apiMocks.fetchExercises,
    createPracticeSession: apiMocks.createPracticeSession,
    uploadSessionTake: apiMocks.uploadSessionTake,
    submitChordsTake: apiMocks.submitChordsTake,
    createSessionDrill: apiMocks.createSessionDrill,
    fetchUserHabits: apiMocks.fetchUserHabits,
    fetchUserMastery: apiMocks.fetchUserMastery,
  }
})

import { PracticeStudioCockpit } from '../practice-studio-cockpit'

describe('Wave 2 AudioWorklet, Cockpit Lifecycle & Regression Verification', () => {
  const origAudioContext = window.AudioContext
  const origAudioWorkletNode = (window as unknown as { AudioWorkletNode?: unknown }).AudioWorkletNode
  const origMediaDevices = navigator.mediaDevices

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    window.AudioContext = origAudioContext
    if (origAudioWorkletNode !== undefined) {
      ;(window as unknown as { AudioWorkletNode?: unknown }).AudioWorkletNode = origAudioWorkletNode
    } else {
      delete (window as unknown as { AudioWorkletNode?: unknown }).AudioWorkletNode
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: origMediaDevices,
    })
  })

  it('loads static /worklets/chroma-audio-processor.js without blob: URLs and falls back cleanly', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL')
    const addModule = vi.fn().mockResolvedValue(undefined)
    const mockCtxWithWorklet = {
      audioWorklet: { addModule },
    } as unknown as AudioContext

    class FakeWorkletNode {
      port = { onmessage: null as ((ev: MessageEvent) => void) | null }
      connect = vi.fn()
      disconnect = vi.fn()
    }
    ;(window as unknown as { AudioWorkletNode: unknown }).AudioWorkletNode = FakeWorkletNode

    const node = await createAudioWorkletNode(mockCtxWithWorklet)
    expect(node).toBeInstanceOf(FakeWorkletNode)
    expect(addModule).toHaveBeenCalledTimes(1)
    expect(addModule.mock.calls[0]?.[0]).toMatch(/\/worklets\/chroma-audio-processor\.js$/)
    expect(createObjectUrlSpy).not.toHaveBeenCalled()

    // Fallback when AudioWorklet is unavailable (ScriptProcessorNode path)
    const mockProcessor = {
      onaudioprocess: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
    const mockCtxFallback = {
      currentTime: 0,
      destination: {},
      createScriptProcessor: vi.fn(() => mockProcessor),
      createGain: vi.fn(() => ({ gain: { setValueAtTime: vi.fn(), value: 0 }, connect: vi.fn() })),
    } as unknown as AudioContext

    const handle = await createPcmCaptureHandle(mockCtxFallback, vi.fn(), 4096)
    expect(handle.mode).toBe('script-processor')
    expect(createObjectUrlSpy).not.toHaveBeenCalled()
    handle.disconnect()
    expect(mockProcessor.disconnect).toHaveBeenCalledOnce()
  })

  it('aborts count-in when startMicRecording fails on denied microphone permission', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    })

    render(<PracticeStudioCockpit isSignedIn={true} />)
    const recordBtn = screen.getByTestId('record-take-btn')

    await act(async () => {
      fireEvent.click(recordBtn)
    })

    expect(screen.getByText(/Microphone permission denied or audio device unavailable/i)).toBeDefined()
    expect(screen.queryByText(/COUNT-IN/i)).toBeNull()
  })

  it('closes AudioContext on unmount/stop and clears countInTimerRef when paused', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const closeMock = vi.fn().mockResolvedValue(undefined)
    const trackStopMock = vi.fn()
    const mockProcessor = {
      onaudioprocess: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    }

    class FakeAudioCtx {
      state = 'running'
      sampleRate = 44100
      currentTime = 0
      destination = {}
      createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }))
      createAnalyser = vi.fn(() => ({
        fftSize: 2048,
        frequencyBinCount: 1024,
        connect: vi.fn(),
        getFloatFrequencyData: vi.fn(),
      }))
      createScriptProcessor = vi.fn(() => mockProcessor)
      createGain = vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), value: 0 },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }))
      createBuffer = vi.fn(() => ({ getChannelData: () => new Float32Array(128) }))
      createBufferSource = vi.fn(() => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn(),
      }))
      createBiquadFilter = vi.fn(() => ({
        type: 'lowpass',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        gain: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      }))
      resume = vi.fn().mockResolvedValue(undefined)
      close = closeMock
    }

    window.AudioContext = FakeAudioCtx as unknown as typeof AudioContext
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: trackStopMock }],
        }),
      },
    })

    const { unmount } = render(<PracticeStudioCockpit isSignedIn={true} />)

    const recordBtn = screen.getByTestId('record-take-btn')
    await act(async () => {
      fireEvent.click(recordBtn)
    })
    await screen.findByText(/COUNT-IN: 1/i)

    const playToggle = screen.getByTestId('stand-play-toggle')
    act(() => {
      fireEvent.click(playToggle)
    })
    expect(screen.queryByText(/COUNT-IN/i)).toBeNull()

    // Ensure cleared interval never fires later and flips back into playback
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByText(/Pause Score/i)).toBeNull()

    // Unmount must stop tracks and close AudioContext cleanly
    unmount()
    expect(trackStopMock).toHaveBeenCalled()
    expect(closeMock).toHaveBeenCalled()
  })

  it('calls POST /api/sessions/{id}/drill via createSessionDrill when take report includes tailored drills', async () => {
    const evalWithDrill = {
      session_id: 'sess_life_1',
      state: 'evaluated',
      analysis_status: 'complete',
      overall_accuracy: 78.4,
      avg_timing_error_ms: 88.2,
      voicing_score: 91.0,
      chord_metrics: [],
      coaching_report: {
        session_id: 'sess_life_1',
        headline: 'Transition Lag Detected',
        score: 78,
        letter_grade: 'C',
        status: 'completed',
        summary: 'Smooth out bar 3 transition.',
        primary_bottleneck: 'G -> C transition',
        ergonomic_advice: 'Pre-shape index finger.',
        key_strengths: [],
        growth_areas: ['Transition latency'],
        habit_alerts: [],
        recommended_tempo_adjustment_bpm: -12,
        tailored_drills: [
          {
            drill_type: 'isolated_transition',
            target_tempo: 68,
            target_repetitions: 6,
            description: 'Isolate G to C switch.',
          },
        ],
      },
    }
    apiMocks.submitChordsTake.mockResolvedValueOnce(evalWithDrill)
    apiMocks.createSessionDrill.mockResolvedValueOnce({
      id: 'drill_backend_42',
      user_id: 'u1',
      pattern_id: 'pat_42',
      drill_type: 'isolated_transition',
      target_tempo: 68,
      target_repetitions: 6,
      completed: false,
      measured_improvement: null,
      description: 'Backend generated G to C transition loop',
    })

    render(<PracticeStudioCockpit isSignedIn={true} />)
    const simBtn = screen.getByTestId('inject-transition-lag')

    await act(async () => {
      fireEvent.click(simBtn)
    })

    expect(apiMocks.createSessionDrill).toHaveBeenCalledWith('sess_life_1')
    expect(screen.getAllByText(/Smooth out bar 3 transition\./i).length).toBeGreaterThanOrEqual(1)
  })

  it('honors StudioPreferences (432 Hz, digital metronome, keys defaultNotation)', () => {
    expect(midiToFreq(69, 432)).toBe(432)
    const engine = new PracticeAudioEngine()
    engine.setConcertPitchHz(432)
    expect(engine.getConcertPitchHz()).toBe(432)
    engine.setMetronomeSound('digital')

    render(
      <PracticeStudioCockpit
        initialSongId="ex_piano_shostakovich_waltz_2"
        studioPrefs={{
          defaultInstrument: 'piano',
          defaultNotation: 'keys',
          metronomeSound: 'digital',
          concertPitchHz: 432,
          micSensitivityDb: -32,
        }}
      />
    )

    expect(screen.getByTestId('piano-waterfall-stand')).toBeDefined()
  })

  it('adjusts GuitarTunerPage string target frequencies when concertPitchHz is 432 Hz', () => {
    render(<GuitarTunerPage concertPitchHz={432} />)
    expect(screen.getByText(/Standard E-A-D-G-B-E \(432 Hz\)/i)).toBeDefined()
    expect(screen.getByText(/\(108\.0 Hz\)/)).toBeDefined()
  })

  it('guards fetchUserMastery in guest mode and displays filtered transition denominators', async () => {
    const { rerender } = render(
      <ProgressDashboardPage isSignedIn={false} transitions={INITIAL_TRANSITION_MASTERY} />
    )
    expect(apiMocks.fetchUserMastery).not.toHaveBeenCalled()

    rerender(<ProgressDashboardPage isSignedIn={true} transitions={INITIAL_TRANSITION_MASTERY} />)
    await waitFor(() => {
      expect(apiMocks.fetchUserMastery).toHaveBeenCalledTimes(1)
    })

    const pianoCount = INITIAL_TRANSITION_MASTERY.filter((t) => t.instrument === 'piano').length
    const pianoBtn = screen.getByRole('button', { name: /piano/i })
    fireEvent.click(pianoBtn)

    expect(screen.getByText(new RegExp(`\\d+ / ${pianoCount}`))).toBeDefined()
  })

  it('allows MastheadNav Enter Practice Studio CTA to enter studio directly in guest mode', () => {
    const onEnterStudio = vi.fn()
    const onSignIn = vi.fn()
    render(<MastheadNav isSignedIn={false} onEnterStudio={onEnterStudio} onSignIn={onSignIn} />)

    fireEvent.click(screen.getByText('Enter Practice Studio'))
    expect(onEnterStudio).toHaveBeenCalledOnce()
    expect(onSignIn).not.toHaveBeenCalled()
  })

  it('pauses PianoWaterfallStand requestAnimationFrame loop when not playing and no particles remain', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    const progression = [{ ...resolveChordVoicing('Cm'), duration_beats: 4 }]

    render(
      <PianoWaterfallStand
        progression={progression}
        currentBeat={0}
        tempoBpm={80}
        isPlaying={false}
      />
    )
    expect(rafSpy).not.toHaveBeenCalled()
  })

  it('computes honest letter grades from overallScore when backend letter_grade is absent', () => {
    render(
      <TakeEvaluationDrawer
        isOpen={true}
        onClose={vi.fn()}
        evaluation={{
          session_id: 's1',
          state: 'evaluated',
          analysis_status: 'complete',
          overall_accuracy: 58.2,
          avg_timing_error_ms: 140,
          voicing_score: 62,
          chord_metrics: [],
          coaching_report: {
            session_id: 's1',
            headline: 'Needs Slow Tempo Drill',
            score: 58,
            letter_grade: '',
            status: 'completed',
            summary: 'Practice slowly.',
            primary_bottleneck: 'C -> G',
            ergonomic_advice: 'Relax wrist.',
            key_strengths: [],
            growth_areas: [],
            habit_alerts: [],
            recommended_tempo_adjustment_bpm: -20,
            tailored_drills: [],
          },
        }}
      />
    )
    expect(screen.getByText(/\(Grade F\)/)).toBeDefined()
  })

  it('closes AudioContext created by SettingsModal microphone test on stop and unmount', async () => {
    const closeMock = vi.fn().mockResolvedValue(undefined)
    const trackStopMock = vi.fn()
    class FakeSettingsAudioCtx {
      state = 'running'
      createMediaStreamSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }))
      createAnalyser = vi.fn(() => ({
        fftSize: 512,
        getFloatTimeDomainData: vi.fn(),
      }))
      close = closeMock
    }
    window.AudioContext = FakeSettingsAudioCtx as unknown as typeof AudioContext
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: trackStopMock }],
        }),
      },
    })

    const { unmount } = render(<SettingsModal isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('settings-tab-audio'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Test Microphone/i }))
    })
    fireEvent.click(screen.getByRole('button', { name: /Stop Test/i }))
    expect(trackStopMock).toHaveBeenCalled()
    expect(closeMock).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('renders ProgressDashboardPage loading screen instead of false empty states while hydrating', () => {
    render(
      <ProgressDashboardPage
        isSignedIn={true}
        isLoading={true}
        transitions={[]}
        sessionHistory={[]}
      />
    )

    expect(screen.getByTestId('progress-loading-screen')).toBeDefined()
    expect(screen.queryByText(/No recorded practice sessions yet/i)).toBeNull()
    expect(screen.queryByText(/No Motor Bottlenecks Identified Yet/i)).toBeNull()
  })
})
