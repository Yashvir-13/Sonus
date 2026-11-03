import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProgressDashboardPage } from '../progress-dashboard-page'
import {
  INITIAL_TRANSITION_MASTERY,
  INITIAL_SESSION_HISTORY,
  updateBktMastery,
  updateSm2State,
  rankAdaptiveRecommendations,
} from '@/lib/adaptive/recommendation-engine'

describe('ProgressDashboardPage & Adaptive Recommendation Engine', () => {
  it('computes Corbett-Anderson BKT posterior mastery updates monotonically', () => {
    const afterSuccess = updateBktMastery(0.32, true)
    expect(afterSuccess.pKnown).toBeGreaterThan(0.32)

    const afterSlip = updateBktMastery(0.75, false)
    expect(afterSlip.pKnown).toBeLessThan(0.75)
  })

  it('computes SuperMemo SM-2 intervals and ease factors with >=1.3 floor', () => {
    const failed = updateSm2State(6, 1.35, 3, 1)
    expect(failed.intervalDays).toBe(1)
    expect(failed.repetitions).toBe(0)
    expect(failed.easeFactor).toBeGreaterThanOrEqual(1.3)

    const passed = updateSm2State(1, 2.5, 1, 5)
    expect(passed.intervalDays).toBe(6)
    expect(passed.repetitions).toBe(2)
  })

  it('ranks adaptive exercise recommendations combining BKT deficit, SM-2 urgency, and Thompson Sampling bandit', () => {
    const recs = rankAdaptiveRecommendations(INITIAL_TRANSITION_MASTERY)
    expect(recs.length).toBe(INITIAL_TRANSITION_MASTERY.length)
    expect(recs[0].rank).toBe(1)
    expect(recs[0].priorityScore).toBeGreaterThanOrEqual(recs[1].priorityScore)
    expect(recs[0].strategyDisplayName.length).toBeGreaterThan(0)
  })

  it('renders ProgressDashboardPage with Ranked Exercise Prescription Queue, CUSUM trajectory chart, and Transition Matrix', () => {
    const onOpenStudioWithRecommendation = vi.fn()
    render(
      <ProgressDashboardPage
        transitions={INITIAL_TRANSITION_MASTERY}
        sessionHistory={INITIAL_SESSION_HISTORY}
        onBackToLanding={vi.fn()}
        onOpenStudioWithRecommendation={onOpenStudioWithRecommendation}
        onOpenCommunity={vi.fn()}
      />
    )

    expect(screen.getByTestId('progress-dashboard-page')).toBeDefined()
    expect(screen.getByTestId('recommendation-card-1')).toBeDefined()
    expect(screen.getAllByText(/Page’s CUSUM Change-Points/i).length).toBeGreaterThan(0)

    // Launch top prescribed drill
    const launchBtn = screen.getByTestId('launch-recommended-drill-1')
    fireEvent.click(launchBtn)
    expect(onOpenStudioWithRecommendation).toHaveBeenCalledTimes(1)
  })
})
