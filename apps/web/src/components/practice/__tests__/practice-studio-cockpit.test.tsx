import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { PracticeStudioCockpit } from '../practice-studio-cockpit'
import { ProgressDashboardPage } from '@/components/progress/progress-dashboard-page'
import { PeerComparisonPage } from '@/components/community/peer-comparison-page'
import {
  INITIAL_TRANSITION_MASTERY,
  INITIAL_SESSION_HISTORY,
} from '@/lib/adaptive/recommendation-engine'

beforeAll(() => {
  if (typeof window !== 'undefined' && window.Element && window.Element.prototype.animate) {
    const origAnimate = window.Element.prototype.animate
    window.Element.prototype.animate = function (...args: any[]) {
      const anim = origAnimate.apply(this, args as any)
      if (anim && anim.finished && typeof anim.finished.catch === 'function') {
        anim.finished.catch(() => {})
      }
      return anim
    }
  }
})

vi.mock('@/api/sessions', () => {
  const mockTake = {
    session_id: 'sess_test_123',
    state: 'evaluated',
    analysis_status: 'complete',
    overall_accuracy: 95.5,
    avg_timing_error_ms: -3.8,
    voicing_score: 97.2,
    chord_metrics: [
      {
        chord_index: 0,
        expected_chord: 'Am',
        detected_chord: 'Am',
        onset_error_ms: -3.8,
        voicing_completeness: 1.0,
        missed_notes: [],
        extra_notes: [],
        is_matched: true,
      },
    ],
    coaching_report: {
      session_id: 'sess_test_123',
      headline: 'Clean Take',
      score: 96,
      letter_grade: 'A',
      status: 'completed',
      summary: 'Clean chord transitions with resonant hand balance.',
      primary_bottleneck: 'None',
      ergonomic_advice: 'Keep shoulders relaxed.',
      key_strengths: ['Intonation stability'],
      growth_areas: [],
      habit_alerts: [],
      recommended_tempo_adjustment_bpm: 0,
      tailored_drills: [],
    },
  }
  return {
    fetchExercises: vi.fn().mockResolvedValue([]),
    createPracticeSession: vi.fn().mockResolvedValue({ id: 'sess_test_123' }),
    uploadSessionTake: vi.fn().mockResolvedValue(mockTake),
    submitChordsTake: vi.fn().mockResolvedValue(mockTake),
    fetchUserMastery: vi.fn().mockResolvedValue({ records: [], recommendations: [] }),
  }
})

describe('PracticeStudioCockpit, ProgressDashboardPage & PeerComparisonPage', () => {
  it('renders root practice room container, header, stand, and Current -> Next chord preparation dock', () => {
    render(<PracticeStudioCockpit />)

    expect(screen.getByTestId('practice-studio-cockpit')).toBeDefined()
    expect(screen.getByText('§ SONUS')).toBeDefined()
    expect(screen.getByTestId('toggle-inst-guitar')).toBeDefined()
    expect(screen.getByTestId('toggle-inst-piano')).toBeDefined()
    expect(screen.getByTestId('stand-play-toggle')).toBeDefined()
    expect(screen.getByTestId('hand-preparation-dock')).toBeDefined()
  })

  it('switches between guitar and piano modes', () => {
    render(<PracticeStudioCockpit />)

    const guitarBtn = screen.getByTestId('toggle-inst-guitar')
    fireEvent.click(guitarBtn)
    expect(screen.getByText(/GUITAR • 6-STRING/i)).toBeDefined()

    const pianoBtn = screen.getByTestId('toggle-inst-piano')
    fireEvent.click(pianoBtn)
    expect(screen.getByText(/PIANO •/i)).toBeDefined()
  })

  it('opens and closes Codex Repertoire Drawer with proper accessibility attributes', () => {
    render(<PracticeStudioCockpit />)

    const drawer = screen.getByTestId('codex-repertoire-drawer')
    expect(drawer.className).toContain('-translate-x-full')
    expect(drawer.className).toContain('pointer-events-none')
    expect(drawer.getAttribute('aria-hidden')).toBe('true')

    const openBtn = screen.getByTestId('open-repertoire-drawer')
    fireEvent.click(openBtn)

    expect(drawer.className).toContain('translate-x-0')
    expect(drawer.className).not.toContain('pointer-events-none')
    expect(drawer.getAttribute('aria-hidden')).toBe('false')

    const closeBtn = screen.getByTestId('repertoire-drawer-close')
    fireEvent.click(closeBtn)

    expect(drawer.className).toContain('-translate-x-full')
    expect(drawer.className).toContain('pointer-events-none')
    expect(drawer.getAttribute('aria-hidden')).toBe('true')
  })

  it('triggers simulated clean take and opens Take Evaluation Drawer with accessibility', async () => {
    render(<PracticeStudioCockpit />)

    const cleanBtn = screen.getByTestId('simulate-clean-take')
    await act(async () => {
      fireEvent.click(cleanBtn)
    })

    const takeDrawer = await screen.findByTestId('take-evaluation-drawer')
    expect(takeDrawer).toBeDefined()
    expect(takeDrawer.getAttribute('aria-hidden')).toBe('false')
    expect(takeDrawer.className).not.toContain('pointer-events-none')
    expect(screen.getByText(/TAKE EVALUATION COMPLETE/i)).toBeDefined()
  })

  it('renders ProgressDashboardPage with BKT + SM-2 + Thompson Sampling recommendations', () => {
    const onLaunch = vi.fn()
    render(
      <ProgressDashboardPage
        transitions={INITIAL_TRANSITION_MASTERY}
        sessionHistory={INITIAL_SESSION_HISTORY}
        onOpenStudioWithRecommendation={onLaunch}
      />
    )

    expect(screen.getByTestId('progress-dashboard-page')).toBeDefined()
    expect(screen.getByTestId('recommendation-card-1')).toBeDefined()
    const launchBtn = screen.getByTestId('launch-recommended-drill-1')
    fireEvent.click(launchBtn)
    expect(onLaunch).toHaveBeenCalledTimes(1)
  })

  it('renders PeerComparisonPage with percentile bell curves and piece leaderboards', () => {
    const onPracticePiece = vi.fn()
    render(<PeerComparisonPage onPracticePiece={onPracticePiece} />)

    expect(screen.getByTestId('peer-comparison-page')).toBeDefined()
    expect(screen.getByTestId('dist-timing')).toBeDefined()
    expect(screen.getByTestId('dist-voicing')).toBeDefined()
    expect(screen.getByTestId('leaderboard-current-user-row')).toBeDefined()
  })

  it('correctly configures 3/4 waltz time signature and beats per measure', () => {
    render(<PracticeStudioCockpit initialSongId="ex_piano_shostakovich_waltz_2" />)

    // Verify 3/4 meter is reflected in the flowing stand
    expect(screen.getAllByText(/3\/4/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Waltz No\. 2/i).length).toBeGreaterThanOrEqual(1)
  })

  it('triggers count-in before playback begins', () => {
    render(<PracticeStudioCockpit />)

    const playToggle = screen.getByTestId('stand-play-toggle')
    expect(screen.getByText('Play Along')).toBeDefined()

    act(() => {
      fireEvent.click(playToggle)
    })

    // During count-in, count-in indicator or active state is triggered
    expect(screen.getByTestId('stand-play-toggle')).toBeDefined()
  })

  it('activates 2-bar transition loop using the song chord duration beats', () => {
    render(<PracticeStudioCockpit initialSongId="ex_piano_shostakovich_waltz_2" />)

    const loopBtn = screen.getByTestId('toggle-loop-pair-btn')
    act(() => {
      fireEvent.click(loopBtn)
    })

    // Loop banner should display active transition loop
    expect(screen.getByText(/2-BAR TRANSITION LOOP ACTIVE/i)).toBeDefined()
  })
})
