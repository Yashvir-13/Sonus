import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PeerComparisonPage } from '../peer-comparison-page'
import * as sessionsApi from '@/api/sessions'

vi.mock('@/api/sessions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/sessions')>()
  return {
    ...actual,
    fetchCommunityBenchmarks: vi.fn(),
  }
})

const mockedFetchBenchmarks = vi.mocked(
  (sessionsApi as unknown as { fetchCommunityBenchmarks: ReturnType<typeof vi.fn> }).fetchCommunityBenchmarks
)

describe('PeerComparisonPage — Percentile Distributions & Piece Leaderboards', () => {
  beforeEach(() => {
    mockedFetchBenchmarks.mockReset()
    mockedFetchBenchmarks.mockResolvedValue({
      is_baseline_fallback: true,
      baseline_label: 'Simulated Reference Baseline',
      cohort_size: 2,
      total_completed_sessions: 4,
      min_cohort_sessions: 10,
      distributions: {
        timing_ms: { median: 45, top_10_pct: 15, p25: 25, p75: 70, user_percentile: 74 },
        voicing_pct: { median: 84, top_10_pct: 96, p25: 75, p75: 92, user_percentile: 88 },
        accuracy_pct: { median: 82, top_10_pct: 95, p25: 74, p75: 91, user_percentile: 85 },
      },
      leaderboard: [],
    })
  })

  it('renders percentile distribution bell curves and piece leaderboards in baseline fallback mode', async () => {
    const onPracticePiece = vi.fn()
    render(
      <PeerComparisonPage
        userAccuracyPct={92.4}
        userMeanLatencyMs={28.0}
        userVoicingPct={95.0}
        onBackToLanding={vi.fn()}
        onOpenProgress={vi.fn()}
        onPracticePiece={onPracticePiece}
      />
    )

    expect(screen.getByTestId('peer-comparison-page')).toBeDefined()
    expect(screen.getByTestId('dist-timing')).toBeDefined()
    expect(screen.getByTestId('dist-voicing')).toBeDefined()
    expect(screen.getByTestId('dist-alignment')).toBeDefined()

    // Never claim fake 1,420 active musicians
    expect(screen.queryByText(/N = 1,420 Active Musicians/i)).toBeNull()

    await waitFor(() => {
      expect(screen.getByText(/Simulated Reference Baseline & Accuracy Percentiles/i)).toBeDefined()
      expect(screen.getByText(/Simulated Reference Baseline · 2 Active Musicians/i)).toBeDefined()
    })

    // Never show fictional Aria S. / Marcus T. personas on the leaderboard
    expect(screen.queryByText(/Aria S\./i)).toBeNull()
    expect(screen.queryByText(/Marcus T\./i)).toBeNull()
    expect(screen.getByTestId('leaderboard-empty-state')).toBeDefined()
  })

  it('renders live PostgreSQL cohort distributions and anonymized leaderboard when >= 10 sessions exist', async () => {
    mockedFetchBenchmarks.mockResolvedValueOnce({
      is_baseline_fallback: false,
      baseline_label: null,
      cohort_size: 14,
      total_completed_sessions: 29,
      min_cohort_sessions: 10,
      distributions: {
        timing_ms: { median: 31.5, top_10_pct: 11.2, p25: 19.0, p75: 48.0, user_percentile: 81 },
        voicing_pct: { median: 89.4, top_10_pct: 98.5, p25: 80.0, p75: 95.0, user_percentile: 87 },
        accuracy_pct: { median: 87.2, top_10_pct: 97.4, p25: 79.0, p75: 94.0, user_percentile: 84 },
      },
      leaderboard: [
        {
          rank: 1,
          performer_name: 'Elena R.',
          handle: '@elenar',
          is_current_user: false,
          instrument: 'guitar',
          exercise_id: 'ex_guitar_rising_sun',
          exercise_title: 'The House of the Rising Sun',
          tempo_tier: '100%',
          tempo_bpm: 100,
          accuracy_pct: 97.4,
          abs_timing_error_ms: 11.2,
          voicing_pct: 98.5,
          bkt_mastered_count: 6,
          verified_takes_count: 9,
          challenge_score: 97.2,
        },
        {
          rank: 2,
          performer_name: 'You',
          handle: '@tester',
          is_current_user: true,
          instrument: 'piano',
          exercise_id: 'ex_piano_canon',
          exercise_title: "Pachelbel's Canon in D",
          tempo_tier: '100%',
          tempo_bpm: 80,
          accuracy_pct: 91.0,
          abs_timing_error_ms: 21.0,
          voicing_pct: 93.0,
          bkt_mastered_count: 3,
          verified_takes_count: 4,
          challenge_score: 91.5,
        },
      ],
    })

    render(
      <PeerComparisonPage
        userAccuracyPct={91.0}
        userMeanLatencyMs={21.0}
        userVoicingPct={93.0}
        hasRecordedTakes={true}
        isSignedIn={true}
        onPracticePiece={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/N = 14 Active Musicians/i)).toBeDefined()
    })

    expect(screen.queryByText(/Simulated Reference Baseline/i)).toBeNull()
    expect(screen.getByText(/Peer Median: ±31\.5ms/i)).toBeDefined()
    expect(screen.getByText(/Peer Median: 89\.4%/i)).toBeDefined()
    expect(screen.getByText(/Peer Median: 87\.2%/i)).toBeDefined()
    expect(screen.getByText('Elena R.')).toBeDefined()
    expect(screen.getByText('@elenar')).toBeDefined()
    expect(screen.getByTestId('leaderboard-current-user-row')).toBeDefined()
  })

  it('shows Sign in to rank your own takes CTA for signed-out guests', async () => {
    const onRequestSignIn = vi.fn()
    render(
      <PeerComparisonPage
        hasRecordedTakes={false}
        isSignedIn={false}
        onRequestSignIn={onRequestSignIn}
        onPracticePiece={vi.fn()}
      />
    )

    const signInCta = await screen.findByRole('button', { name: /Sign in to rank your own takes/i })
    fireEvent.click(signInCta)
    expect(onRequestSignIn).toHaveBeenCalled()
  })

  it('shows loading state while benchmarks request is pending and hides Simulated Reference Baseline until resolved', async () => {
    let resolveBenchmarks!: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolveBenchmarks = resolve
    })
    mockedFetchBenchmarks.mockReturnValue(pendingPromise)

    render(
      <PeerComparisonPage
        hasRecordedTakes={false}
        isSignedIn={true}
        onPracticePiece={vi.fn()}
      />
    )

    expect(screen.getByTestId('leaderboard-loading-state')).toBeDefined()
    expect(screen.getByTestId('benchmarks-status-label').textContent).toContain(
      'Loading Live Cohort Benchmarks...'
    )
    expect(screen.queryByText(/Simulated Reference Baseline/i)).toBeNull()
    expect(screen.queryByTestId('leaderboard-empty-state')).toBeNull()

    resolveBenchmarks({
      is_baseline_fallback: true,
      baseline_label: 'Simulated Reference Baseline',
      cohort_size: 0,
      total_completed_sessions: 0,
      min_cohort_sessions: 10,
      distributions: {
        timing_ms: { median: null, top_10_pct: null, p25: null, p75: null, user_percentile: null },
        voicing_pct: { median: null, top_10_pct: null, p25: null, p75: null, user_percentile: null },
        accuracy_pct: { median: null, top_10_pct: null, p25: null, p75: null, user_percentile: null },
      },
      leaderboard: [],
    })

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-empty-state')).toBeDefined()
    })
  })
})
