import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeAll } from 'vitest'
import { MusicianLoadingScreen, AudioProcessingHud } from '../loading-screen'

describe('MusicianLoadingScreen & AudioProcessingHud', () => {
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

  it('renders MusicianLoadingScreen with accessible ARIA status attributes and custom headline', () => {
    render(
      <MusicianLoadingScreen
        headline="Loading Repertoire"
        subtext="Fetching exercises and scores from the studio backend..."
      />
    )

    const loadingElem = screen.getByTestId('musician-loading-screen')
    expect(loadingElem).toBeDefined()
    expect(loadingElem.getAttribute('role')).toBe('status')
    expect(loadingElem.getAttribute('aria-live')).toBe('polite')
    expect(loadingElem.getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText('Loading Repertoire')).toBeDefined()
    expect(screen.getByText('Fetching exercises and scores from the studio backend...')).toBeDefined()
  })

  it('renders AudioProcessingHud when isProcessing is true and hides when false', () => {
    const { rerender } = render(
      <AudioProcessingHud
        isProcessing={true}
        statusMessage="Aligning onsets and transcribing voicings..."
        timingStage="aligning"
      />
    )

    expect(screen.getByText('Aligning onsets and transcribing voicings...')).toBeDefined()
    expect(screen.getByText('Basic Pitch ONNX')).toBeDefined()

    rerender(
      <AudioProcessingHud
        isProcessing={false}
        statusMessage="Aligning onsets and transcribing voicings..."
        timingStage="aligning"
      />
    )

    expect(screen.queryByText('Aligning onsets and transcribing voicings...')).toBeNull()
  })
})
