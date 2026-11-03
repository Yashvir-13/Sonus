import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { LandingPage } from '../landing-page'
import { TuningForkChamber } from '../tuning-fork-chamber'
import { RepertoireExplorer } from '../repertoire-explorer'
import { StaffScrollProgress } from '../staff-scroll-progress'
import { MagneticCaliperButton } from '../magnetic-caliper-button'
import { KineticRevealText } from '../kinetic-reveal-text'

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

describe('Landing Page Components', () => {
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

  it('renders the TuningForkChamber and strikes A440 fork cleanly via Web Audio', () => {
    render(<TuningForkChamber />)

    expect(screen.getByText(/The Pitch Standard:/i)).toBeDefined()
    expect(screen.getByText(/440.00/i)).toBeDefined()

    const strikeBtn = screen.getByRole('button', { name: /STRIKE BRASS FORK/i })
    expect(strikeBtn).toBeDefined()
    fireEvent.click(strikeBtn)

    expect(screen.getByRole('button', { name: /DAMPEN TUNING FORK/i })).toBeDefined()

    const dampenBtn = screen.getByRole('button', { name: /DAMPEN TUNING FORK/i })
    fireEvent.click(dampenBtn)
    expect(screen.getByRole('button', { name: /STRIKE BRASS FORK/i })).toBeDefined()
  })

  it('renders RepertoireExplorer and toggles between piano and guitar catalogs', () => {
    render(<RepertoireExplorer />)

    expect(screen.getAllByText(/Nocturne in E-flat Major/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Canon in D/i)).toBeDefined()

    const guitarTab = screen.getByRole('button', { name: /GUITAR STANDARDS/i })
    fireEvent.click(guitarTab)

    expect(screen.getAllByText(/Knockin' Cadence/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Romance Anónimo/i)).toBeDefined()
  })

  it('renders StaffScrollProgress and KineticRevealText without crashing', () => {
    render(<StaffScrollProgress />)
    render(<KineticRevealText text="Deliberate Practice" as="h2" />)
    expect(screen.getByText(/Deliberate/i)).toBeDefined()
    expect(screen.getByText(/Practice/i)).toBeDefined()
  })

  it('renders MagneticCaliperButton with hover physics and click event', () => {
    const onClick = vi.fn()
    render(
      <MagneticCaliperButton onClick={onClick}>
        Click Me
      </MagneticCaliperButton>
    )

    const btn = screen.getByRole('button', { name: /Click Me/i })
    fireEvent.mouseMove(btn, { clientX: 100, clientY: 50 })
    fireEvent.mouseLeave(btn)
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('supports striking tuning fork via accessible vector graphic and keyboard', () => {
    render(<TuningForkChamber />)

    const graphicBtn = screen.getByRole('button', { name: /Strike brass tuning fork graphic/i })
    expect(graphicBtn).toBeDefined()

    fireEvent.keyDown(graphicBtn, { key: 'Enter' })
    expect(screen.getByRole('button', { name: /DAMPEN TUNING FORK/i })).toBeDefined()

    const dampenBtn = screen.getByRole('button', { name: /DAMPEN TUNING FORK/i })
    fireEvent.click(dampenBtn)
    expect(screen.getByRole('button', { name: /STRIKE BRASS FORK/i })).toBeDefined()
  })

  it('updates repertoire deck selection when a piece is clicked', () => {
    render(<LandingPage />)

    expect(screen.getAllByText(/Waltz No\. 2/i).length).toBeGreaterThan(0)

    const canonBtn = screen.getAllByText(/Pachelbel's Canon/i)[0]
    fireEvent.click(canonBtn)

    expect(screen.getAllByText(/Pachelbel's Canon/i).length).toBeGreaterThan(1)
  })
})
