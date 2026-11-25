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

  it('renders guest mode cleanly when isSignedIn is false', () => {
    const handleSignIn = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isSignedIn={false}
        onRequestSignIn={handleSignIn}
      />
    )

    // Defaults to studio tab
    expect(screen.getByText('DEFAULT PRACTICE INSTRUMENT')).toBeDefined()

    // Switch to account tab
    const accountTab = screen.getByTestId('settings-tab-account')
    fireEvent.click(accountTab)

    expect(screen.getByTestId('guest-settings-callout')).toBeDefined()
    expect(screen.getByText('Guest Musician Mode')).toBeDefined()

    const signInBtn = screen.getByTestId('guest-settings-signin-btn')
    fireEvent.click(signInBtn)
    expect(handleSignIn).toHaveBeenCalledOnce()
  })

  it('shows profile loading indicator instead of hardcoded Studio Musician defaults while loading', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isSignedIn={true}
        isLoadingProfile={true}
      />
    )

    expect(screen.getByTestId('settings-profile-loading')).toBeDefined()
    expect(screen.queryByDisplayValue('Studio Musician')).toBeNull()
    expect(screen.queryByDisplayValue('musician@sonus.studio')).toBeNull()
  })

  it('surfaces backend profile sync errors honestly with a retry trigger', () => {
    const onRetry = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isSignedIn={true}
        currentName="Yash"
        currentUsername="yash_dev"
        currentEmail="yash@example.com"
        profileLoadError="HTTP 503"
        onRetryLoadProfile={onRetry}
      />
    )

    expect(screen.getByTestId('settings-profile-sync-warning')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
