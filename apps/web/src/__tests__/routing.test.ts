import { describe, it, expect } from 'vitest'
import {
  exerciseIdToSlug,
  slugToExerciseId,
  parseRouteFromPath,
  viewToPath,
} from '@/app'

describe('Application URL Routing & Slugs', () => {
  describe('exerciseIdToSlug', () => {
    it('maps known exercise IDs to canonical hyphenated slugs', () => {
      expect(exerciseIdToSlug('ex_guitar_rising_sun')).toBe('house-of-the-rising-sun')
      expect(exerciseIdToSlug('ex_piano_shostakovich_waltz_2')).toBe('waltz-no-2')
      expect(exerciseIdToSlug('ex_piano_canon')).toBe('pachelbels-canon')
      expect(exerciseIdToSlug('ex_guitar_four_chord')).toBe('four-chord-anthem')
      expect(exerciseIdToSlug('ex_guitar_knockin')).toBe('knockin-cadence')
    })

    it('falls back to stripping ex_ and converting underscores to hyphens', () => {
      expect(exerciseIdToSlug('ex_custom_exercise_123')).toBe('custom-exercise-123')
    })
  })

  describe('slugToExerciseId', () => {
    it('resolves canonical song slugs to internal exercise IDs', () => {
      expect(slugToExerciseId('house-of-the-rising-sun')).toBe('ex_guitar_rising_sun')
      expect(slugToExerciseId('rising-sun')).toBe('ex_guitar_rising_sun')
      expect(slugToExerciseId('waltz-no-2')).toBe('ex_piano_shostakovich_waltz_2')
      expect(slugToExerciseId('shostakovich-waltz')).toBe('ex_piano_shostakovich_waltz_2')
      expect(slugToExerciseId('pachelbels-canon')).toBe('ex_piano_canon')
      expect(slugToExerciseId('pachelbel')).toBe('ex_piano_canon')
      expect(slugToExerciseId('four-chord-anthem')).toBe('ex_guitar_four_chord')
      expect(slugToExerciseId('knockin-cadence')).toBe('ex_guitar_knockin')
      expect(slugToExerciseId('knockin')).toBe('ex_guitar_knockin')
    })
  })

  describe('parseRouteFromPath', () => {
    it('resolves root paths to landing view', () => {
      expect(parseRouteFromPath('/')).toEqual({ view: 'landing' })
      expect(parseRouteFromPath('')).toEqual({ view: 'landing' })
      expect(parseRouteFromPath('/home')).toEqual({ view: 'landing' })
    })

    it('resolves /practice without slug to practice view', () => {
      expect(parseRouteFromPath('/practice')).toEqual({ view: 'practice' })
    })

    it('resolves /practice/:songSlug to practice view with matched song ID', () => {
      expect(parseRouteFromPath('/practice/house-of-the-rising-sun')).toEqual({
        view: 'practice',
        songId: 'ex_guitar_rising_sun',
      })
      expect(parseRouteFromPath('/practice/waltz-no-2')).toEqual({
        view: 'practice',
        songId: 'ex_piano_shostakovich_waltz_2',
      })
      expect(parseRouteFromPath('/practice/pachelbel')).toEqual({
        view: 'practice',
        songId: 'ex_piano_canon',
      })
    })

    it('resolves /progress, /dashboard, /coach to progress view', () => {
      expect(parseRouteFromPath('/progress')).toEqual({ view: 'progress' })
      expect(parseRouteFromPath('/dashboard')).toEqual({ view: 'progress' })
      expect(parseRouteFromPath('/coach')).toEqual({ view: 'progress' })
    })

    it('resolves /leaderboard, /peers, /community to community view', () => {
      expect(parseRouteFromPath('/leaderboard')).toEqual({ view: 'community' })
      expect(parseRouteFromPath('/peers')).toEqual({ view: 'community' })
      expect(parseRouteFromPath('/community')).toEqual({ view: 'community' })
    })

    it('resolves /chords-and-scales and /theory to theory view', () => {
      expect(parseRouteFromPath('/chords-and-scales')).toEqual({ view: 'theory' })
      expect(parseRouteFromPath('/theory')).toEqual({ view: 'theory' })
      expect(parseRouteFromPath('/chords')).toEqual({ view: 'theory' })
    })

    it('resolves /tuner and /guitar-tuner to tuner view', () => {
      expect(parseRouteFromPath('/tuner')).toEqual({ view: 'tuner' })
      expect(parseRouteFromPath('/guitar-tuner')).toEqual({ view: 'tuner' })
    })

    it('resolves /audio and /bench to audio test bench', () => {
      expect(parseRouteFromPath('/audio')).toEqual({ view: 'audio' })
      expect(parseRouteFromPath('/bench')).toEqual({ view: 'audio' })
    })
  })

  describe('viewToPath', () => {
    it('generates correct paths for each view', () => {
      expect(viewToPath('landing')).toBe('/')
      expect(viewToPath('theory')).toBe('/chords-and-scales')
      expect(viewToPath('tuner')).toBe('/tuner')
      expect(viewToPath('progress')).toBe('/progress')
      expect(viewToPath('community')).toBe('/leaderboard')
      expect(viewToPath('audio')).toBe('/audio')
      expect(viewToPath('practice')).toBe('/practice')
      expect(viewToPath('practice', 'ex_guitar_rising_sun')).toBe('/practice/house-of-the-rising-sun')
      expect(viewToPath('practice', 'ex_piano_shostakovich_waltz_2')).toBe('/practice/waltz-no-2')
    })
  })
})
