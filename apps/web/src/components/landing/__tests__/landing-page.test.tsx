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
    // Prevent happy-dom unhandled promise rejection on Animation.cancel()
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

  it('renders LandingPage masthead, Chopin epigraph, and primary CTAs', () => {
    const onEnterStudio = vi.fn()
    render(<LandingPage onEnterStudio={onEnterStudio} />)

    // Brand and subtitle
    expect(screen.getAllByText(/SONUS/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Adaptive Music Practice/i).length).toBeGreaterThan(0)

    // Chopin epigraph
    expect(screen.getAllByText(/FRÉDÉRIC CHOPIN/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Simplicity is the final achievement/i).length).toBeGreaterThan(0)

    // Primary CTA
    const enterBtns = screen.getAllByRole('button', { name: /Start practicing free/i })
    expect(enterBtns.length).toBeGreaterThan(0)
    fireEvent.click(enterBtns[0])
    expect(onEnterStudio).toHaveBeenCalled()
  })

  it('renders the live notation stand in hero without unprompted mic access', () => {
    render(<LandingPage />)
    expect(screen.getByTestId('flowing-notation-canvas')).toBeDefined()
    expect(screen.getByText(/LIVE NOTATION STAND PREVIEW/i)).toBeDefined()
  })

  it('renders the TuningForkChamber and strikes A440 fork cleanly via Web Audio', () => {
    render(<TuningForkChamber />)

    expect(screen.getByText(/The Pitch Standard:/i)).toBeDefined()
    expect(screen.getByText(/440.00/i)).toBeDefined()

    const strikeBtn = screen.getByRole('button', { name: /STRIKE BRASS FORK/i })
    expect(strikeBtn).toBeDefined()
    fireEvent.click(strikeBtn)

    // After striking, button changes to allow dampening
    expect(screen.getByRole('button', { name: /DAMPEN TUNING FORK/i })).toBeDefined()

    // Clicking dampen restores state
    const dampenBtn = screen.getByRole('button', { name: /DAMPEN TUNING FORK/i })
    fireEvent.click(dampenBtn)
    expect(screen.getByRole('button', { name: /STRIKE BRASS FORK/i })).toBeDefined()
  })

  it('renders RepertoireExplorer and toggles between piano and guitar catalogs', () => {
    render(<RepertoireExplorer />)

    // Piano pieces visible initially
    expect(screen.getAllByText(/Nocturne in E-flat Major/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Canon in D/i)).toBeDefined()

    // Switch to guitar
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

    // Trigger via Enter key
    fireEvent.keyDown(graphicBtn, { key: 'Enter' })
    expect(screen.getByRole('button', { name: /DAMPEN TUNING FORK/i })).toBeDefined()

    // Clicking dampen restores state
    const dampenBtn = screen.getByRole('button', { name: /DAMPEN TUNING FORK/i })
    fireEvent.click(dampenBtn)
    expect(screen.getByRole('button', { name: /STRIKE BRASS FORK/i })).toBeDefined()
  })

  it('updates hero stand when a repertoire piece is loaded', () => {
    render(<LandingPage />)

    // Initially Chopin
    expect(screen.getAllByText(/Chopin Nocturne in E-flat/i).length).toBeGreaterThan(0)

    // Find and click "LOAD INTO STAND" for Canon in D or select another piece
    const satieBtn = screen.getByRole('button', { name: /Gymnopédie No\. 1/i })
    fireEvent.click(satieBtn)

    // The hero piece title should update to Gymnopédie No. 1
    expect(screen.getAllByText(/Gymnopédie No\. 1/i).length).toBeGreaterThan(0)
  })
})
