import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PeerComparisonPage } from '../peer-comparison-page'

describe('PeerComparisonPage — Percentile Distributions & Piece Leaderboards', () => {
  it('renders percentile distribution bell curves and piece leaderboards', () => {
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

    // Highlight current user row in leaderboard
    expect(screen.getByTestId('leaderboard-current-user-row')).toBeDefined()

    // Challenge score button triggers callback
    const challengeBtns = screen.getAllByRole('button', { name: /Challenge Score/i })
    expect(challengeBtns.length).toBeGreaterThan(0)
    fireEvent.click(challengeBtns[0])
    expect(onPracticePiece).toHaveBeenCalled()
  })
})
