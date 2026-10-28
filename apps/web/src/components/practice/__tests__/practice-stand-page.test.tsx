import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PracticeStandPage } from '../practice-stand-page'

describe('PracticeStandPage', () => {
  it('renders the complete SONUS practice stand interface', () => {
    render(<PracticeStandPage />)
    expect(screen.getAllByText(/SONUS/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('flowing-notation-canvas')).toBeDefined()
    expect(screen.getByTestId('fretboard-diagram')).toBeDefined()
  })

  it('allows custom chord progression entry and parses chords cleanly', () => {
    render(<PracticeStandPage />)
    const input = screen.getByPlaceholderText(/enter chords/i)
    fireEvent.change(input, { target: { value: 'D - A - Em - G' } })
    expect(screen.getByDisplayValue('D - A - Em - G')).toBeDefined()
    expect(screen.getByText(/D · A · Em · G/i)).toBeDefined()
  })

  it('toggles playback when start practice button is clicked', () => {
    render(<PracticeStandPage />)
    const playBtn = screen.getByRole('button', { name: /start practice/i })
    fireEvent.click(playBtn)
    expect(screen.getByRole('button', { name: /pause/i })).toBeDefined()
  })
})
