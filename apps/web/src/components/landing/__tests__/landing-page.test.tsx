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

describe('Landing Page & Single-Room Camera Stage', () => {
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

  it('renders LandingPage masthead, smoke canvas, and primary CTAs without hardware specs or jargon', () => {
    const onEnterStudio = vi.fn()
    render(<LandingPage onEnterStudio={onEnterStudio} />)

    expect(screen.getAllByText(/SONUS/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Piano & Guitar Practice Studio/i).length).toBeGreaterThan(0)

    // Volumetric smoke canvas is mounted
    expect(screen.getByTestId('volumetric-smoke-canvas')).toBeDefined()

    // Ensure no fake camera telemetry or low-level DSP/research jargon exists
    expect(screen.queryByText(/CAM 07/i)).toBeNull()
    expect(screen.queryByText(/SPLINE/i)).toBeNull()
    expect(screen.queryByText(/22\.05 kHz/i)).toBeNull()
    expect(screen.queryByText(/Needleman-Wunsch/i)).toBeNull()
    expect(screen.queryByText(/EWMA/i)).toBeNull()
    expect(screen.queryByText(/CUSUM/i)).toBeNull()
    expect(screen.queryByText(/B=0\.0004/i)).toBeNull()
    expect(screen.queryByText(/4096 Samples/i)).toBeNull()

    // Primary CTA
    const enterBtns = screen.getAllByRole('button', { name: /Enter Practice Studio/i })
    expect(enterBtns.length).toBeGreaterThan(0)
    fireEvent.click(enterBtns[0])
    expect(onEnterStudio).toHaveBeenCalled()
  })

  it('renders single studio room camera and interactive Act 2 Piano/Guitar switcher', () => {
    render(<LandingPage />)
    expect(screen.queryByTestId('cinematic-archival-canvas')).toBeNull()

    expect(screen.getByTestId('expanding-wordmark')).toBeDefined()
    expect(screen.getByTestId('studio-room-camera')).toBeDefined()
    expect(screen.getByTestId('act2-voicing-preview')).toBeDefined()
    expect(screen.getByTestId('act3-bar-feedback')).toBeDefined()
    expect(screen.getByTestId('act4-tempo-ladder')).toBeDefined()

    const guitarSwitch = screen.getByTestId('act2-instrument-guitar')
    fireEvent.click(guitarSwitch)
    expect(screen.getByTestId('active-voicing-display')).toBeDefined()
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
