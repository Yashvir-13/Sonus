import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SettingsModal } from '../settings-modal'

describe('SettingsModal Component', () => {
  it('renders modal with account, studio, and audio tabs when open', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByTestId('settings-modal-backdrop')).toBeDefined()
    expect(screen.getByTestId('settings-tab-account')).toBeDefined()
    expect(screen.getByTestId('settings-tab-studio')).toBeDefined()
    expect(screen.getByTestId('settings-tab-audio')).toBeDefined()
  })

  it('switches between tabs and updates studio preferences', () => {
    const handleSavePrefs = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onSavePreferences={handleSavePrefs}
      />
    )

    // Switch to Studio Preferences
    const studioTab = screen.getByTestId('settings-tab-studio')
    fireEvent.click(studioTab)

    expect(screen.getByText('DEFAULT PRACTICE INSTRUMENT')).toBeDefined()
    expect(screen.getByText('DEFAULT PIANO VISUALIZATION')).toBeDefined()

    // Click 6-String Guitar
    const guitarBtn = screen.getByText('6-String Guitar')
    fireEvent.click(guitarBtn)

    expect(handleSavePrefs).toHaveBeenCalledWith(
      expect.objectContaining({ defaultInstrument: 'guitar' })
    )
  })

  it('invokes onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(<SettingsModal isOpen={true} onClose={handleClose} />)

    const closeBtn = screen.getByTestId('close-settings-modal-btn')
    fireEvent.click(closeBtn)

    expect(handleClose).toHaveBeenCalledOnce()
  })
})
