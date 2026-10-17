import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AudioTestBench } from '../audio-test-bench'

describe('AudioTestBench', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders chord selection dropdown and recording controls', () => {
    render(<AudioTestBench />)
    expect(screen.getByText(/Audio Test Bench/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Start Listening/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Record 5s Take/i })).toBeDefined()
    expect(screen.getByLabelText(/Target Chord/i)).toBeDefined()
  })

  it('allows user to select a target chord for accuracy checking', () => {
    render(<AudioTestBench />)
    const select = screen.getByLabelText(/Target Chord/i) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'G' } })
    expect(select.value).toBe('G')
  })
})
