import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GuitarTunerPage } from '../guitar-tuner-page'

describe('GuitarTunerPage Component', () => {
  it('renders root container, masthead, and all 6 standard tuning strings', () => {
    render(<GuitarTunerPage />)

    expect(screen.getByTestId('guitar-tuner-page')).toBeDefined()
    expect(screen.getByText('Guitar Tuner')).toBeDefined()
    expect(screen.getByTestId('tuner-peg-6')).toBeDefined() // Low E
    expect(screen.getByTestId('tuner-peg-5')).toBeDefined() // A
    expect(screen.getByTestId('tuner-peg-4')).toBeDefined() // D
    expect(screen.getByTestId('tuner-peg-3')).toBeDefined() // G
    expect(screen.getByTestId('tuner-peg-2')).toBeDefined() // B
    expect(screen.getByTestId('tuner-peg-1')).toBeDefined() // High E
  })

  it('selects a target string when a peg is clicked', () => {
    render(<GuitarTunerPage />)

    // Select String 3 (G3)
    const peg3 = screen.getByTestId('tuner-peg-3')
    fireEvent.click(peg3)

    expect(screen.getByText('3rd • G')).toBeDefined()
    expect(screen.getAllByText(/196.00 Hz/).length).toBeGreaterThan(0)
  })

  it('toggles auto-detect string mode', () => {
    render(<GuitarTunerPage />)

    const toggleBtn = screen.getByTestId('toggle-auto-detect-btn')
    expect(toggleBtn.textContent).toContain('ON')

    fireEvent.click(toggleBtn)
    expect(toggleBtn.textContent).toContain('MANUAL')
  })
})
