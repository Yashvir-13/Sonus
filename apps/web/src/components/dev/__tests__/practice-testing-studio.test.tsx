import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PracticeTestingStudio } from '../practice-testing-studio'

// Mock sessions API
vi.mock('@/api/sessions', () => ({
  fetchExercises: vi.fn().mockResolvedValue([]),
  createPracticeSession: vi.fn().mockResolvedValue({ id: 'test-session-123' }),
  uploadSessionTake: vi.fn().mockResolvedValue({}),
  submitChordsTake: vi.fn().mockResolvedValue({}),
  createSessionDrill: vi.fn().mockResolvedValue(null),
  fetchUserHabits: vi.fn().mockResolvedValue([]),
  fetchUserStats: vi.fn().mockResolvedValue(null),
}))

describe('PracticeTestingStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the studio with exercise catalog and telemetry HUD', async () => {
    render(<PracticeTestingStudio />)

    expect(screen.getByText(/Practice & Drill Studio/i)).toBeDefined()
    expect(screen.getByText(/Select Song or Exercise/i)).toBeDefined()

    await waitFor(() => {
      // Default builtin song should be selected
      expect(screen.getAllByText(/Knockin' Cadence/i).length).toBeGreaterThan(0)
    })
  })

  it('toggles metronome beat ticks on and off', async () => {
    render(<PracticeTestingStudio />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /TICKS ON/i })).toBeDefined()
    })

    const ticksBtn = screen.getByRole('button', { name: /TICKS ON/i })
    fireEvent.click(ticksBtn)

    expect(screen.getByRole('button', { name: /TICKS OFF/i })).toBeDefined()

    // Toggle back on
    fireEvent.click(screen.getByRole('button', { name: /TICKS OFF/i }))
    expect(screen.getByRole('button', { name: /TICKS ON/i })).toBeDefined()
  })

  it('toggles backing audio guide on and off', async () => {
    render(<PracticeTestingStudio />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /AUDIO ON/i })).toBeDefined()
    })

    const audioBtn = screen.getByRole('button', { name: /AUDIO ON/i })
    fireEvent.click(audioBtn)

    expect(screen.getByRole('button', { name: /AUDIO OFF/i })).toBeDefined()
  })
})

