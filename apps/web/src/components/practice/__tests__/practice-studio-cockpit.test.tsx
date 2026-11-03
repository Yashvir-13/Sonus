import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { PracticeStudioCockpit } from '../practice-studio-cockpit'

beforeAll(() => {
  // Prevent Happy-DOM unhandled animation cancel abort errors
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

vi.mock('@/api/sessions', () => ({
  fetchExercises: vi.fn().mockResolvedValue([]),
  createPracticeSession: vi.fn().mockResolvedValue({ id: 'sess_test_123' }),
  uploadSessionTake: vi.fn().mockResolvedValue({
    session_id: 'sess_test_123',
    state: 'evaluated',
    analysis_status: 'complete',
    overall_accuracy: 95.5,
    avg_timing_error_ms: -3.8,
    voicing_score: 97.2,
    chord_metrics: [],
    coaching_report: {
      session_id: 'sess_test_123',
      headline: 'Virtuosic Synchrony',
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
  }),
}))

describe('PracticeStudioCockpit Component', () => {
  it('renders root cockpit container, header, stand, and bottom deck', () => {
    render(<PracticeStudioCockpit />)

    expect(screen.getByTestId('practice-studio-cockpit')).toBeDefined()
    expect(screen.getByText('§ SONUS')).toBeDefined()
    expect(screen.getByTestId('toggle-inst-guitar')).toBeDefined()
    expect(screen.getByTestId('toggle-inst-piano')).toBeDefined()
    expect(screen.getByTestId('stand-play-toggle')).toBeDefined()
  })

  it('switches between guitar and piano modes', () => {
    render(<PracticeStudioCockpit />)

    // Switch to guitar
    const guitarBtn = screen.getByTestId('toggle-inst-guitar')
    fireEvent.click(guitarBtn)
    expect(screen.getByText(/GUITAR • 6-STRING/i)).toBeDefined()

    // Switch back to piano
    const pianoBtn = screen.getByTestId('toggle-inst-piano')
    fireEvent.click(pianoBtn)
    expect(screen.getByText(/PIANO •/i)).toBeDefined()
  })

  it('opens and closes Codex Repertoire Drawer with proper accessibility attributes', () => {
    render(<PracticeStudioCockpit />)

    const drawer = screen.getByTestId('codex-repertoire-drawer')

    // Initially drawer is closed: must have pointer-events-none and aria-hidden="true"
    expect(drawer.className).toContain('-translate-x-full')
    expect(drawer.className).toContain('pointer-events-none')
    expect(drawer.getAttribute('aria-hidden')).toBe('true')

    // Click open drawer
    const openBtn = screen.getByTestId('open-repertoire-drawer')
    fireEvent.click(openBtn)

    // Drawer is now open: aria-hidden="false" and no pointer-events-none
    expect(drawer.className).toContain('translate-x-0')
    expect(drawer.className).not.toContain('pointer-events-none')
    expect(drawer.getAttribute('aria-hidden')).toBe('false')

    // Click close button
    const closeBtn = screen.getByTestId('repertoire-drawer-close')
    fireEvent.click(closeBtn)

    // Drawer is closed again
    expect(drawer.className).toContain('-translate-x-full')
    expect(drawer.className).toContain('pointer-events-none')
    expect(drawer.getAttribute('aria-hidden')).toBe('true')
  })

  it('triggers simulated clean take and opens Take Evaluation Drawer with accessibility', async () => {
    vi.useFakeTimers()
    render(<PracticeStudioCockpit />)

    const cleanBtn = screen.getByTestId('simulate-clean-take')
    fireEvent.click(cleanBtn)

    // Fast-forward simulation timer
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Take evaluation drawer should be visible and accessible
    const takeDrawer = screen.getByTestId('take-evaluation-drawer')
    expect(takeDrawer).toBeDefined()
    expect(takeDrawer.getAttribute('aria-hidden')).toBe('false')
    expect(takeDrawer.className).not.toContain('pointer-events-none')
    expect(screen.getByText(/TAKE EVALUATION COMPLETE/i)).toBeDefined()

    vi.useRealTimers()
  })

  it('enforces cockpit deck height of h-44 and burnished brass console button styling', () => {
    render(<PracticeStudioCockpit />)

    const recordBtn = screen.getByTestId('record-take-btn')
    expect(recordBtn.className).toContain('bg-[#C5A059]')
    expect(recordBtn.className).toContain('text-[#141312]')

    const footer = screen.getByRole('contentinfo')
    expect(footer.className).toContain('h-44')
  })
})
