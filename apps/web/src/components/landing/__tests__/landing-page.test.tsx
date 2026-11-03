import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { LandingPage } from '../landing-page'
import { VolumetricSmokeCanvas } from '../volumetric-smoke-canvas'

class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
    }
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
  }

  resume() {
    return Promise.resolve()
  }

  close() {
    return Promise.resolve()
  }
}

describe('Landing Page & Volumetric Smoke Stage', () => {
  beforeAll(() => {
    if (typeof Element !== 'undefined' && Element.prototype.animate) {
      const originalAnimate = Element.prototype.animate
      Element.prototype.animate = function (keyframes, options) {
        const anim = originalAnimate.call(this, keyframes, options)
        if (anim?.finished?.catch) {
          anim.finished.catch(() => {})
        }
        return anim
      }
    }
  })

  beforeEach(() => {
    window.AudioContext = MockAudioContext as any
    ;(window as any).webkitAudioContext = MockAudioContext
    window.scrollTo = vi.fn()
  })

  it('renders LandingPage masthead, volumetric smoke canvas, and primary CTAs without fake camera jargon', () => {
    const onEnterStudio = vi.fn()
    render(<LandingPage onEnterStudio={onEnterStudio} />)

    expect(screen.getAllByText(/SONUS/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Adaptive Musical Practice System/i).length).toBeGreaterThan(0)

    // Volumetric smoke canvas is mounted
    expect(screen.getByTestId('volumetric-smoke-canvas')).toBeDefined()

    // Ensure no fake camera telemetry strings exist
    expect(screen.queryByText(/CAM 07/i)).toBeNull()
    expect(screen.queryByText(/SPLINE/i)).toBeNull()
    expect(screen.queryByText(/DOCKED 1\.0x/i)).toBeNull()

    // Grounded technical telemetry
    expect(screen.getAllByText(/Needleman-Wunsch/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/EWMA/i).length).toBeGreaterThan(0)

    // Primary CTA
    const enterBtns = screen.getAllByRole('button', { name: /Enter Practice Studio/i })
    expect(enterBtns.length).toBeGreaterThan(0)
    fireEvent.click(enterBtns[0])
    expect(onEnterStudio).toHaveBeenCalled()
  })

  it('renders the kinetic expanding wordmark and DSP mechanics cards', () => {
    render(<LandingPage />)
    expect(screen.queryByTestId('cinematic-archival-canvas')).toBeNull()

    expect(screen.getByTestId('expanding-wordmark')).toBeDefined()
    expect(screen.getByTestId('mechanics-needleman-wunsch')).toBeDefined()
    expect(screen.getByTestId('mechanics-karplus-strong')).toBeDefined()
    expect(screen.getByTestId('mechanics-piano-partials')).toBeDefined()
  })

  it('mounts VolumetricSmokeCanvas cleanly', () => {
    const { getByTestId } = render(<VolumetricSmokeCanvas className="opacity-90" />)
    const canvas = getByTestId('volumetric-smoke-canvas')
    expect(canvas.tagName).toBe('CANVAS')
  })

  it('navigates to Progress & Coach and Peer Benchmarks from landing navigation and stage cards', () => {
    const onOpenProgress = vi.fn()
    const onOpenCommunity = vi.fn()

    render(
      <LandingPage
        onOpenProgress={onOpenProgress}
        onOpenCommunity={onOpenCommunity}
      />
    )

    const progressBtn = screen.getAllByRole('button', { name: /Progress & Coach/i })[0]
    fireEvent.click(progressBtn)
    expect(onOpenProgress).toHaveBeenCalled()

    const communityBtn = screen.getAllByRole('button', { name: /Peer Benchmarks/i })[0]
    fireEvent.click(communityBtn)
    expect(onOpenCommunity).toHaveBeenCalled()
  })

  it('updates repertoire deck selection when a piece is clicked', () => {
    render(<LandingPage />)

    expect(screen.getAllByText(/Waltz No\. 2/i).length).toBeGreaterThan(0)

    const canonBtn = screen.getAllByText(/Pachelbel's Canon/i)[0]
    fireEvent.click(canonBtn)

    expect(screen.getAllByText(/Pachelbel's Canon/i).length).toBeGreaterThan(1)
  })
})
