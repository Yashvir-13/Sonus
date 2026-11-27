import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PracticeStudioCockpit } from '../practice-studio-cockpit'
import { FlowingNotationStand, type FlowingChordItem } from '../flowing-notation-stand'
import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'
import { resolveChordVoicing, parseProgressionSequence } from '@/lib/music/chord-voicings'

vi.mock('@/api/sessions', () => ({
  fetchExercises: vi.fn().mockResolvedValue([]),
  createPracticeSession: vi.fn().mockResolvedValue({ id: 'sess_test_123' }),
  uploadSessionTake: vi.fn().mockResolvedValue({}),
  submitChordsTake: vi.fn().mockResolvedValue({}),
  fetchUserMastery: vi.fn().mockResolvedValue({ records: [], recommendations: [] }),
}))

describe('Playback Audio Scheduler & Web Audio Clock Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('FlowingNotationStand Precise Caliper Notehead Alignment', () => {
    it('engraves pitched Bravura noteheads monotonically clear of barlines and aligns playhead dynamically', () => {
      const baseCm = resolveChordVoicing('Cm')
      const waltzProg: FlowingChordItem[] = [
        {
          ...baseCm,
          duration_beats: 3.0,
          melodyNotes: [
            { pitch: 'C5', beatOffset: 0, duration: 1, clef: 'treble' as const },
            { pitch: 'D5', beatOffset: 1, duration: 1, clef: 'treble' as const },
            { pitch: 'Eb5', beatOffset: 2, duration: 1, clef: 'treble' as const },
          ],
        },
      ]

      const { rerender, container } = render(
        <FlowingNotationStand
          instrument="piano"
          progression={waltzProg}
          currentBeat={0}
          tempoBpm={160}
          isPlaying={true}
          timeSignature="3/4"
          keySignature="C Minor"
        />
      )

      const noteheads = screen.getAllByTestId('grand-staff-notehead')
      expect(noteheads.length).toBe(3)
      expect(screen.getByTestId('vexflow-grand-staff-svg')).toBeDefined()

      const track0 = container.querySelector('.will-change-transform') as HTMLElement
      const tx0 = parseFloat(track0.style.transform.match(/translate3d\(([-\d.]+)px/)?.[1] ?? 'NaN')
      expect(Number.isFinite(tx0)).toBe(true)

      // Advancing to beat 1 and beat 2 must smoothly shift the engraved score strictly leftward
      rerender(
        <FlowingNotationStand
          instrument="piano"
          progression={waltzProg}
          currentBeat={1}
          tempoBpm={160}
          isPlaying={true}
          timeSignature="3/4"
          keySignature="C Minor"
        />
      )
      const tx1 = parseFloat(track0.style.transform.match(/translate3d\(([-\d.]+)px/)?.[1] ?? 'NaN')
      expect(tx1).toBeLessThan(tx0)

      rerender(
        <FlowingNotationStand
          instrument="piano"
          progression={waltzProg}
          currentBeat={2}
          tempoBpm={160}
          isPlaying={true}
          timeSignature="3/4"
          keySignature="C Minor"
        />
      )
      const tx2 = parseFloat(track0.style.transform.match(/translate3d\(([-\d.]+)px/)?.[1] ?? 'NaN')
      expect(tx2).toBeLessThan(tx1)
    })

    it('centers guitar strum arrows directly over engraved VexFlow TabNote X positions clear of barlines', () => {
      const baseAm = resolveChordVoicing('Am')
      const guitarProg: FlowingChordItem[] = [
        {
          ...baseAm,
          duration_beats: 4.0,
          strumEvents: [
            { beatOffset: 0, direction: 'down' as const, accent: true, label: 'D' },
            { beatOffset: 1, direction: 'down' as const, accent: false, label: 'D' },
            { beatOffset: 2, direction: 'down' as const, accent: true, label: 'D' },
          ],
        },
      ]

      render(
        <FlowingNotationStand
          instrument="guitar"
          progression={guitarProg}
          currentBeat={0}
          tempoBpm={100}
          isPlaying={true}
        />
      )

      const strumBadges = screen.getAllByTestId('strum-arrow-badge')
      expect(strumBadges.length).toBe(3)

      const x0 = parseFloat(strumBadges[0].style.left)
      const x1 = parseFloat(strumBadges[1].style.left)
      const x2 = parseFloat(strumBadges[2].style.left)

      // Beat 0 sits safely to the right of the TAB clef & time signature (never colliding with barline)
      expect(x0).toBeGreaterThan(20)
      expect(x1).toBeGreaterThan(x0)
      expect(x2).toBeGreaterThan(x1)
      expect(strumBadges[0].className).toContain('-translate-x-1/2')
      expect(strumBadges[1].className).toContain('-translate-x-1/2')
      expect(strumBadges[2].className).toContain('-translate-x-1/2')
    })

    it('uses hardware-accelerated translate3d on the sliding engraved track', () => {
      const prog = parseProgressionSequence(['C'])

      const { container } = render(
        <FlowingNotationStand
          instrument="piano"
          progression={prog}
          currentBeat={2}
          tempoBpm={120}
          isPlaying={true}
        />
      )

      const slidingTrack = container.querySelector('.will-change-transform') as HTMLElement
      expect(slidingTrack).not.toBeNull()
      expect(slidingTrack.style.transform).toMatch(/^translate3d\([-\d.]+px, 0(?:px)?, 0(?:px)?\)$/)
    })
  })

  describe('Multi-Measure Playback & Lookahead Scheduling', () => {
    it('schedules all measures of 32-measure Shostakovich Waltz without dropping after measure 2', async () => {
      let mockCurrentTime = 10.0
      const scheduleAccompanimentSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'schedulePianoAccompaniment')
        .mockImplementation(() => {})
      const scheduleMelodySpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'schedulePianoNotes')
        .mockImplementation(() => {})
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_piano_shostakovich_waltz_2"
          studioMode="listen"
        />
      )

      // Start playback (click stand play toggle in listen mode = immediate play)
      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // Initial tick at t=10.0s (schedules initial measures within 2.5s horizon)
      act(() => {
        vi.advanceTimersByTime(25)
      })

      // Advance mock Web Audio clock incrementally through multiple measures (at 160 BPM, 3 beats = 1.125s/bar)
      // Advance by 12 seconds in 500ms steps to simulate continuous playback across many measures
      for (let sec = 0.5; sec <= 12; sec += 0.5) {
        mockCurrentTime = 10.05 + sec
        act(() => {
          vi.advanceTimersByTime(25)
        })
      }

      // With our fixed lookahead scheduler, schedulePianoNotes continues scheduling every measure,
      // and unnotated block-chord accompaniment is NOT layered on top of written staff notes.
      expect(scheduleAccompanimentSpy).not.toHaveBeenCalled()
      expect(scheduleMelodySpy.mock.calls.length).toBeGreaterThanOrEqual(8)

      // Verify that timestamps passed to schedulePianoNotes are strictly ascending
      const scheduledTimestamps = scheduleMelodySpy.mock.calls.map((call) => call[1])
      for (let i = 1; i < scheduledTimestamps.length; i++) {
        expect(scheduledTimestamps[i]).toBeGreaterThan(scheduledTimestamps[i - 1])
      }

      vi.useRealTimers()
    }, 35000)

    it('schedules full 24-measure guitar song (House of the Rising Sun in 6/8) continuously', async () => {
      let mockCurrentTime = 20.0
      const scheduleStrumPatternSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'scheduleStrumPattern')
        .mockImplementation(() => {})
      const schedulePluckedSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'schedulePluckedNotes')
        .mockImplementation(() => {})
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_guitar_rising_sun"
          studioMode="listen"
        />
      )

      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // Simulate 16 seconds of playback across 4+ measures (at 76 BPM in 6/8, ~4.74s per bar)
      for (let sec = 0; sec <= 16; sec += 0.5) {
        mockCurrentTime = 20.05 + sec
        act(() => {
          vi.advanceTimersByTime(25)
        })
      }

      expect(
        schedulePluckedSpy.mock.calls.length + scheduleStrumPatternSpy.mock.calls.length
      ).toBeGreaterThanOrEqual(4)

      vi.useRealTimers()
    }, 35000)

    it('tolerates execution jitter without dropping delayed measures', async () => {
      let mockCurrentTime = 100.0
      const scheduleNotesSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'schedulePianoNotes')
        .mockImplementation(() => {})
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_piano_shostakovich_waltz_2"
          studioMode="listen"
        />
      )

      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // Simulate initial schedule
      act(() => {
        vi.advanceTimersByTime(25)
      })
      const initialCount = scheduleNotesSpy.mock.calls.length

      // Simulate a severe main-thread lag spike: audio clock jumped ahead by 1.8 seconds while no ticks ran
      mockCurrentTime = 100.05 + 1.8
      act(() => {
        vi.advanceTimersByTime(25)
      })

      // The scheduler must NOT drop the measure whose scheduledAudioTime was in the past;
      // it must schedule it at Math.max(currentAudioTime, scheduledAudioTime)
      expect(scheduleNotesSpy.mock.calls.length).toBeGreaterThan(initialCount)

      vi.useRealTimers()
    }, 35000)

    it('re-anchors cleanly when seeked to another measure', () => {
      let mockCurrentTime = 5.0
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      const stopAllSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'stopAllSounds')
        .mockImplementation(() => {})

      const { container } = render(
        <PracticeStudioCockpit initialSongId="ex_piano_shostakovich_waltz_2" />
      )

      // Click measure 4 to seek
      const measures = container.querySelectorAll('[data-testid="score-measure-overlay"]')
      expect(measures.length).toBeGreaterThan(4)

      act(() => {
        fireEvent.click(measures[3])
      })

      // Sound should stop and be re-anchored
      expect(stopAllSpy).toHaveBeenCalled()
    })

    it('loops seamlessly on short 2-bar drills without audio dropouts', async () => {
      let mockCurrentTime = 50.0
      const scheduleNotesSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'schedulePianoNotes')
        .mockImplementation(() => {})
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_piano_shostakovich_waltz_2"
          studioMode="listen"
        />
      )

      // Activate 2-bar drill loop
      const loopBtn = screen.getByTestId('toggle-loop-pair-btn')
      act(() => {
        fireEvent.click(loopBtn)
      })

      // Start playback
      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // In 2-bar loop of 3/4 waltz (6 beats total at 160 BPM = 2.25s per loop):
      // Advance by 8 seconds to loop 3+ times
      for (let sec = 0; sec <= 8; sec += 0.5) {
        mockCurrentTime = 50.05 + sec
        act(() => {
          vi.advanceTimersByTime(25)
        })
      }

      // Verifies that across multiple loop wraps, scheduling continues for every loop pass
      expect(scheduleNotesSpy.mock.calls.length).toBeGreaterThanOrEqual(6)

      vi.useRealTimers()
    }, 35000)

    it('schedules all 32 measures of Shostakovich Waltz No. 2 over the full 36-second duration', async () => {
      let mockCurrentTime = 100.0
      const scheduleNotesSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'schedulePianoNotes')
        .mockImplementation(() => {})
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_piano_shostakovich_waltz_2"
          studioMode="listen"
        />
      )

      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // Simulate full 38 seconds of playback (32 measures * 3 beats / (160 / 60) = 36.0s)
      for (let sec = 0.5; sec <= 38; sec += 0.5) {
        mockCurrentTime = 100.05 + sec
        act(() => {
          vi.advanceTimersByTime(25)
        })
      }

      // Must have scheduled all 32 distinct measures in loop 0
      expect(scheduleNotesSpy.mock.calls.length).toBeGreaterThanOrEqual(32)

      vi.useRealTimers()
    }, 35000)

    it('preserves visual position and seamlessly updates scheduling when tempo changes dynamically mid-playback', async () => {
      let mockCurrentTime = 10.0
      const scheduleNotesSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'schedulePianoNotes')
        .mockImplementation(() => {})
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})
      const stopAllSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'stopAllSounds')
        .mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_piano_shostakovich_waltz_2"
          studioMode="listen"
        />
      )

      // Start playback at default 160 BPM
      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // Advance by 2.25s (exactly 6 beats = 2 measures at 160 BPM, landing on Bar 3)
      for (let sec = 0.25; sec <= 2.25; sec += 0.25) {
        mockCurrentTime = 10.05 + sec
        act(() => {
          vi.advanceTimersByTime(25)
        })
      }

      // Check current measure before tempo change (at beat 6.0 in 3/4 waltz, Bar 3 of 32 is active)
      expect(screen.getByText(/Bar 3 of 32/i)).toBeDefined()

      // Click "70% Slow" speed preset (112 BPM) while actively playing
      const slowBtn = screen.getByRole('button', { name: /70% Slow/i })
      act(() => {
        fireEvent.click(slowBtn)
      })

      // Audio engine must cancel old tempo nodes and re-anchor without jumping backwards
      expect(stopAllSpy).toHaveBeenCalled()

      // On next tick after tempo change, measure must NOT jump backwards to Bar 2!
      mockCurrentTime += 0.05
      act(() => {
        vi.advanceTimersByTime(25)
      })

      expect(screen.getByText(/Bar 3 of 32/i)).toBeDefined()

      // Playback continues at 112 BPM without audio dropouts
      for (let sec = 0.5; sec <= 5; sec += 0.5) {
        mockCurrentTime += 0.5
        act(() => {
          vi.advanceTimersByTime(25)
        })
      }
      expect(scheduleNotesSpy.mock.calls.length).toBeGreaterThan(6)

      vi.useRealTimers()
    }, 35000)

    it('re-anchors cleanly and stops previous song audio when launching a drill loop while actively playing', async () => {
      let mockCurrentTime = 200.0
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})
      const stopAllSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'stopAllSounds')
        .mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_piano_shostakovich_waltz_2"
          studioMode="listen"
        />
      )

      // Start playing song
      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // Advance 3 seconds
      mockCurrentTime = 203.0
      act(() => {
        vi.advanceTimersByTime(25)
      })

      // While playing, toggle quick loop for current pair
      const loopBtn = screen.getByTestId('toggle-loop-pair-btn')
      act(() => {
        fireEvent.click(loopBtn)
      })

      // Old sounds must have been stopped
      expect(stopAllSpy).toHaveBeenCalled()

      // The loop banner should now be visible and playhead reset to Bar 1 of 2
      expect(screen.getByText(/TRANSITION LOOP ACTIVE/i)).toBeDefined()
      expect(screen.getByText(/Bar 1 of 2/i)).toBeDefined()

      vi.useRealTimers()
    }, 35000)

    it('schedules metronome clicks with precise Web Audio timestamps when metronome is enabled', async () => {
      let mockCurrentTime = 300.0
      const playClickSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'playClick')
        .mockImplementation(() => {})
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_piano_shostakovich_waltz_2"
          studioMode="listen"
        />
      )

      // Metronome is enabled by default (toggle-metronome)
      const metronomeBtn = screen.getByTestId('toggle-metronome')
      expect(metronomeBtn).toBeDefined()

      // Start playback
      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // Advance by 3 whole beats (1.125 seconds at 160 BPM in 3/4 time)
      for (let sec = 0.1; sec <= 1.2; sec += 0.1) {
        mockCurrentTime = 300.05 + sec
        act(() => {
          vi.advanceTimersByTime(25)
        })
      }

      // Verify that playClick was called with explicit non-null timestamps
      expect(playClickSpy).toHaveBeenCalled()
      const clickCalls = playClickSpy.mock.calls
      expect(clickCalls.length).toBeGreaterThanOrEqual(3)

      // Downbeat must be true on beat 0 (call 0)
      expect(clickCalls[0][0]).toBe(true)
      // Timestamp parameter (second argument) must be defined and strictly positive
      expect(clickCalls[0][1]).toBeGreaterThanOrEqual(300.0)

      vi.useRealTimers()
    }, 35000)

    it('schedules full multi-measure Pachelbel Canon in D (16 measures in 4/4) without dropouts', async () => {
      let mockCurrentTime = 400.0
      const scheduleNotesSpy = vi
        .spyOn(PracticeAudioEngine.prototype, 'schedulePianoNotes')
        .mockImplementation(() => {})
      vi.spyOn(PracticeAudioEngine.prototype, 'getCurrentTime').mockImplementation(
        () => mockCurrentTime
      )
      vi.spyOn(PracticeAudioEngine.prototype, 'unlock').mockImplementation(() => {})

      vi.useFakeTimers()

      render(
        <PracticeStudioCockpit
          initialSongId="ex_piano_canon"
          studioMode="listen"
        />
      )

      const playToggle = screen.getByTestId('stand-play-toggle')
      act(() => {
        fireEvent.click(playToggle)
      })

      // Simulate 20 seconds of playback across 8+ measures (at 72 BPM, 4 beats = 3.33s per measure)
      for (let sec = 0.5; sec <= 20; sec += 0.5) {
        mockCurrentTime = 400.05 + sec
        act(() => {
          vi.advanceTimersByTime(25)
        })
      }

      // Verifies all upcoming measures continue scheduling smoothly
      expect(scheduleNotesSpy.mock.calls.length).toBeGreaterThanOrEqual(6)

      vi.useRealTimers()
    }, 35000)
  })
})
