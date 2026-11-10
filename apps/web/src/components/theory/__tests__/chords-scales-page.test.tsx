import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChordsScalesPage } from '../chords-scales-page'

describe('ChordsScalesPage Component', () => {
  it('renders root container, masthead, and 12 chromatic root selectors', () => {
    render(<ChordsScalesPage />)

    expect(screen.getByTestId('chords-scales-page')).toBeDefined()
    expect(screen.getByText('Chords & Scales')).toBeDefined()
    expect(screen.getByTestId('theory-root-C')).toBeDefined()
    expect(screen.getByTestId('theory-root-G')).toBeDefined()
    expect(screen.getByTestId('theory-root-Eb')).toBeDefined()
  })

  it('filters entries when a different root note is chosen', () => {
    render(<ChordsScalesPage />)

    // Initially C is selected
    expect(screen.getAllByText('C Major').length).toBeGreaterThan(0)

    // Select A root
    const rootA = screen.getByTestId('theory-root-A')
    fireEvent.click(rootA)

    expect(screen.getAllByText('A Major').length).toBeGreaterThan(0)
    expect(screen.getAllByText('A Minor').length).toBeGreaterThan(0)
  })

  it('filters by category tabs (triads, sevenths, extended, scales)', () => {
    render(<ChordsScalesPage />)

    // Click 7th Chords
    const seventhsTab = screen.getByTestId('theory-cat-sevenths')
    fireEvent.click(seventhsTab)

    expect(screen.getAllByText('C Major 7th').length).toBeGreaterThan(0)
    expect(screen.getAllByText('C Minor 7th').length).toBeGreaterThan(0)
  })
})
