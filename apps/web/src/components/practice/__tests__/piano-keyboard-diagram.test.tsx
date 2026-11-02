import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PianoKeyboardDiagram } from '../piano-keyboard-diagram'

describe('PianoKeyboardDiagram', () => {
  it('renders root container with data-testid="piano-keyboard-diagram" and valid SVG viewport', () => {
    const { container } = render(<PianoKeyboardDiagram />)
    const root = screen.getByTestId('piano-keyboard-diagram')
    expect(root).toBeDefined()
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 300 80')
    expect(svg?.getAttribute('role')).toBe('group')
  })

  it('renders exactly 15 white keys and 10 black keys (total 25 keys C3 to C5)', () => {
    const { container } = render(<PianoKeyboardDiagram />)
    const whiteKeys = container.querySelectorAll('[data-testid="piano-white-key"]')
    const blackKeys = container.querySelectorAll('[data-testid="piano-black-key"]')
    expect(whiteKeys.length).toBe(15)
    expect(blackKeys.length).toBe(10)
    const allKeyButtons = screen.getAllByRole('button')
    expect(allKeyButtons.length).toBe(25)
  })

  it('verifies white keys have width=20, height=80, and correct sequential X positions', () => {
    const { container } = render(<PianoKeyboardDiagram />)
    const whiteKeys = container.querySelectorAll('[data-testid="piano-white-key"]')
    whiteKeys.forEach((key, idx) => {
      expect(Number(key.getAttribute('x'))).toBe(idx * 20)
      expect(Number(key.getAttribute('width'))).toBe(20)
      expect(Number(key.getAttribute('height'))).toBe(80)
    })
  })

  it('verifies black keys have width=12, height=48, and proper X positions', () => {
    const { container } = render(<PianoKeyboardDiagram />)
    const blackKeys = container.querySelectorAll('[data-testid="piano-black-key"]')
    const expectedXs = [14, 34, 74, 94, 114, 154, 174, 214, 234, 254]
    blackKeys.forEach((key, idx) => {
      expect(Number(key.getAttribute('x'))).toBe(expectedXs[idx])
      expect(Number(key.getAttribute('width'))).toBe(12)
      expect(Number(key.getAttribute('height'))).toBe(48)
    })
  })

  it('displays octave markers C3, C4, C5 on unpressed keyboard with Middle C indicator', () => {
    render(<PianoKeyboardDiagram />)
    expect(screen.getByText('C3')).toBeDefined()
    expect(screen.getByText('C4')).toBeDefined()
    expect(screen.getByText('C5')).toBeDefined()
  })

  it('highlights Left-Hand notes in Terracotta (#9A2A2A) with note label and LH badge', () => {
    const { container } = render(
      <PianoKeyboardDiagram lhPitches={[48]} rhPitches={[]} />
    )
    const c3Key = container.querySelector('[data-midi="48"]')
    expect(c3Key?.getAttribute('class')).toContain('#9A2A2A')
    expect(c3Key?.getAttribute('data-hand')).toBe('lh')
    expect(screen.getByText('LH')).toBeDefined()
    expect(screen.getByText('C3')).toBeDefined()
  })

  it('highlights Right-Hand notes in Patina Jade (#3B6E57) with note labels', () => {
    const { container } = render(
      <PianoKeyboardDiagram lhPitches={[]} rhPitches={[64, 67, 72]} />
    )
    const e4Key = container.querySelector('[data-midi="64"]')
    const g4Key = container.querySelector('[data-midi="67"]')
    const c5Key = container.querySelector('[data-midi="72"]')

    expect(e4Key?.getAttribute('class')).toContain('#3B6E57')
    expect(e4Key?.getAttribute('data-hand')).toBe('rh')
    expect(g4Key?.getAttribute('class')).toContain('#3B6E57')
    expect(g4Key?.getAttribute('data-hand')).toBe('rh')
    expect(c5Key?.getAttribute('class')).toContain('#3B6E57')
    expect(c5Key?.getAttribute('data-hand')).toBe('rh')
  })

  it('triggers onKeyClick callback when a white key is clicked', () => {
    const onKeyClick = vi.fn()
    const { container } = render(<PianoKeyboardDiagram onKeyClick={onKeyClick} />)
    const middleC = container.querySelector('[data-midi="60"]')
    expect(middleC).not.toBeNull()
    fireEvent.click(middleC!)
    expect(onKeyClick).toHaveBeenCalledWith(60)
  })

  it('triggers onKeyClick callback when a black key is clicked', () => {
    const onKeyClick = vi.fn()
    const { container } = render(<PianoKeyboardDiagram onKeyClick={onKeyClick} />)
    const fSharp4 = container.querySelector('[data-midi="66"]')
    expect(fSharp4).not.toBeNull()
    fireEvent.click(fSharp4!)
    expect(onKeyClick).toHaveBeenCalledWith(66)
  })

  it('supports keyboard accessibility via Enter and Space keydown events', () => {
    const onKeyClick = vi.fn()
    const { container } = render(<PianoKeyboardDiagram onKeyClick={onKeyClick} />)
    const key = container.querySelector('[data-midi="55"]') // G3
    expect(key).not.toBeNull()
    fireEvent.keyDown(key!, { key: 'Enter' })
    expect(onKeyClick).toHaveBeenCalledWith(55)
    fireEvent.keyDown(key!, { key: ' ' })
    expect(onKeyClick).toHaveBeenCalledTimes(2)
  })

  it('provides descriptive aria-label and aria-pressed attributes', () => {
    const { container } = render(
      <PianoKeyboardDiagram lhPitches={[48]} rhPitches={[60]} />
    )
    const c3 = container.querySelector('[data-midi="48"]')
    const d3 = container.querySelector('[data-midi="50"]')
    expect(c3?.getAttribute('aria-pressed')).toBe('true')
    expect(c3?.getAttribute('aria-label')).toContain('C3')
    expect(d3?.getAttribute('aria-pressed')).toBe('false')
  })

  it('supports custom pitch range via startMidi and endMidi', () => {
    // 1-octave C4 to C5 (MIDI 60 to 72 = 13 keys: 8 white, 5 black)
    render(<PianoKeyboardDiagram startMidi={60} endMidi={72} />)
    const allKeys = screen.getAllByRole('button')
    expect(allKeys.length).toBe(13)
  })
})
