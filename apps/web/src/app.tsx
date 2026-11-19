import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { MotionConfig, AnimatePresence, motion } from 'motion/react'
import { UserButton } from '@clerk/react'
import { AudioTestBench } from '@/components/dev/audio-test-bench'
import { PracticeStudioCockpit } from '@/components/practice/practice-studio-cockpit'
import { LandingPage } from '@/components/landing/landing-page'
import { ProgressDashboardPage } from '@/components/progress/progress-dashboard-page'
import { PeerComparisonPage } from '@/components/community/peer-comparison-page'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { AuthShell } from '@/components/auth/auth-shell'
import {
  updateBktMastery,
  metricsToSm2Quality,
  updateSm2State,
  type TransitionMasteryState,
  type LongitudinalSessionPoint,
  type AdaptiveExerciseRecommendation,
} from '@/lib/adaptive/recommendation-engine'
import { MusicianLoadingScreen } from '@/components/ui/loading-screen'
import { BUILTIN_FULL_SONGS, ALL_BUILTIN_EXERCISES } from '@/lib/music/song-catalog'
import {
  fetchExercises,
  fetchMe,
  createMe,
  updateMe,
  fetchUserSessions,
  fetchUserStats,
  fetchUserHabits,
  fetchUserMastery,
  getClerkUserMetadata,
  ApiError,
  type ExerciseDto,
  type HabitPatternDto,
  type UserStatsDto,
} from '@/api/sessions'
import {
  mapBackendSessionsToLongitudinal,
  mapBackendHabitsToTransitions,
  mapBackendMasteryToTransitions,
} from '@/lib/adaptive/recommendation-engine'
import type { TakeEvaluationResponse } from '@/api/sessions'

import { ChordsScalesPage } from '@/components/theory/chords-scales-page'
import { GuitarTunerPage } from '@/components/tuner/guitar-tuner-page'
import { SettingsModal, loadStoredPreferences, type StudioPreferences } from '@/components/settings/settings-modal'
import { StudioSessionSelector } from '@/components/practice/studio-session-selector'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Music, BookOpen, Disc, TrendingUp, Users, Sliders, ChevronDown, SlidersHorizontal } from 'lucide-react'

export type AppViewMode =
  | 'landing'
  | 'practice'
  | 'progress'
  | 'community'
  | 'audio'
  | 'theory'
  | 'tuner'

export type AppProps = {
  initialView?: AppViewMode
  userButtonSlot?: React.ReactNode
  defaultSignedIn?: boolean
}

/**
 * Maps an internal exercise ID to a clean, canonical URL slug.
 */
export function exerciseIdToSlug(id: string): string {
  switch (id) {
    case 'ex_guitar_rising_sun':
      return 'house-of-the-rising-sun'
    case 'ex_piano_shostakovich_waltz_2':
      return 'waltz-no-2'
    case 'ex_piano_canon':
      return 'pachelbels-canon'
    case 'ex_guitar_four_chord':
      return 'four-chord-anthem'
    case 'ex_guitar_knockin':
      return 'knockin-cadence'
    case 'ex_piano_autumn_turnaround':
      return 'piano-autumn-turnaround'
    case 'ex_piano_pop_ballad':
      return 'piano-pop-ballad'
    default:
      if (id.startsWith('drill_chord_')) {
        return id.replace(/^drill_/, '').replace(/_/g, '-')
      }
      return id.replace(/^ex_/, '').replace(/_/g, '-')
  }
}

/**
 * Resolves a URL slug to an internal exercise ID from available catalogue items.
 */
export function slugToExerciseId(slug: string, available: ExerciseDto[] = BUILTIN_FULL_SONGS): string | undefined {
  const normalized = slug.toLowerCase().trim()
  if (normalized === 'house-of-the-rising-sun' || normalized === 'rising-sun' || normalized === 'the-house-of-the-rising-sun') {
    return 'ex_guitar_rising_sun'
  }
  if (normalized === 'waltz-no-2' || normalized === 'shostakovich-waltz' || normalized === 'shostakovich-waltz-2' || normalized === 'waltz2') {
    return 'ex_piano_shostakovich_waltz_2'
  }
  if (normalized === 'pachelbels-canon' || normalized === 'pachelbel-canon' || normalized === 'pachelbel' || normalized === 'canon') {
    return 'ex_piano_canon'
  }
  if (normalized.startsWith('four-chord-anthem') || normalized === 'anthem-in-d' || normalized === 'four-chord') {
    return 'ex_guitar_four_chord'
  }
  if (normalized === 'knockin-cadence' || normalized === 'knockin' || normalized === 'knockin-on-heavens-door') {
    return 'ex_guitar_knockin'
  }
  if (normalized === 'piano-autumn-turnaround' || normalized === 'autumn-turnaround' || normalized === 'autumn-jazz-turnaround') {
    return 'ex_piano_autumn_turnaround'
  }
  if (normalized === 'piano-pop-ballad' || normalized === 'pop-ballad' || normalized === 'pop-ballad-cadence') {
    return 'ex_piano_pop_ballad'
  }

  // 1. Direct slug inverse check against exercise catalogue
  const bySlug = available.find((e) => exerciseIdToSlug(e.id) === normalized)
  if (bySlug) return bySlug.id

  // 2. Chord drill aliases and direct matching
  if (
    normalized.startsWith('chord-drill-') ||
    normalized.startsWith('drill-chord-') ||
    normalized.startsWith('chord-')
  ) {
    const drillMatch = available.find(
      (e) =>
        e.id.toLowerCase() === `drill_${normalized.replace(/-/g, '_')}` ||
        e.id.toLowerCase() === `drill_chord_${normalized.replace(/^chord-/, '').replace(/-/g, '_')}` ||
        e.id.toLowerCase() === `drill_chord_${normalized.replace(/^drill-chord-/, '').replace(/-/g, '_')}` ||
        e.id.toLowerCase() === `drill_chord_${normalized.replace(/^chord-drill-/, '').replace(/-/g, '_')}` ||
        e.id.toLowerCase() === normalized.replace(/-/g, '_') ||
        e.id.toLowerCase().replace(/_/g, '-') === normalized
    )
    if (drillMatch) return drillMatch.id

    // Fallback: Infer chord drill ID directly from slug pattern (e.g. chord-c -> drill_chord_c)
    const cleanChordSlug = normalized
      .replace(/^(drill-chord-|chord-drill-|chord-)/, '')
      .replace(/-/g, '_')
    if (cleanChordSlug) {
      return `drill_chord_${cleanChordSlug}`
    }
  }

  const direct = available.find((e) => e.id.toLowerCase() === normalized || e.id.toLowerCase() === `ex_${normalized.replace(/-/g, '_')}`)
  if (direct) return direct.id
  const byTitle = available.find((e) => e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(normalized))
  if (byTitle) return byTitle.id
  return undefined
}

import { createChordDrillExercise } from '@/lib/music/song-catalog'
export { createChordDrillExercise }

/**
 * Parses browser pathname into the matching AppViewMode and optional song ID.
 */
export function parseRouteFromPath(
  pathname: string,
  available: ExerciseDto[] = BUILTIN_FULL_SONGS
): { view: AppViewMode; songId?: string } {
  const clean = pathname.replace(/\/+$/, '').toLowerCase()
  if (!clean || clean === '' || clean === '/home') {
    return { view: 'landing' }
  }
  if (clean.startsWith('/practice')) {
    const parts = clean.split('/').filter(Boolean)
    const slug = parts[1]
    if (slug) {
      const matched = slugToExerciseId(slug, available)
      return { view: 'practice', songId: matched }
    }
    return { view: 'practice' }
  }
  if (clean === '/progress' || clean === '/dashboard' || clean === '/coach') {
    return { view: 'progress' }
  }
  if (clean === '/leaderboard' || clean === '/peers' || clean === '/community') {
    return { view: 'community' }
  }
  if (clean === '/chords-and-scales' || clean === '/chords' || clean === '/scales' || clean === '/theory') {
    return { view: 'theory' }
  }
  if (clean === '/tuner' || clean === '/guitar-tuner') {
    return { view: 'tuner' }
  }
  if (clean === '/audio' || clean === '/bench') {
    return { view: 'audio' }
  }
  return { view: 'landing' }
}

/**
 * Generates canonical browser URL pathname for a view and optional song ID.
 */
export function viewToPath(view: AppViewMode, songId?: string): string {
  switch (view) {
    case 'landing':
      return '/'
    case 'practice':
      return songId ? `/practice/${exerciseIdToSlug(songId)}` : '/practice'
    case 'theory':
      return '/chords-and-scales'
    case 'tuner':
      return '/tuner'
    case 'progress':
      return '/progress'
    case 'community':
      return '/leaderboard'
    case 'audio':
      return '/audio'
  }
}

export default function App({
  initialView = 'landing',
  userButtonSlot,
  defaultSignedIn = false,
}: AppProps) {
  // Read initial route from browser URL location (supports direct links and reloads)
  const initialRoute = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/') {
      return parseRouteFromPath(window.location.pathname, BUILTIN_FULL_SONGS)
    }
    return { view: initialView, songId: undefined }
  }, [initialView])

  const [activeView, setActiveView] = useState<AppViewMode>(initialRoute.view)
  const [isSignedIn, setIsSignedIn] = useState(defaultSignedIn || Boolean(userButtonSlot))
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [authReturnUrl, setAuthReturnUrl] = useState<string>('/practice')
  const [selectedSongId, setSelectedSongId] = useState<string>(initialRoute.songId || 'ex_guitar_knockin')
  const [pendingLoopDrill, setPendingLoopDrill] = useState<{
    fromChord: string
    toChord: string
    targetBpm: number
    description?: string
  } | null>(null)

  // Shared Longitudinal State across Practice Room, Progress & Coach, and Peer Benchmarks
  const [transitions, setTransitions] = useState<TransitionMasteryState[]>([])
  const [sessionHistory, setSessionHistory] = useState<LongitudinalSessionPoint[]>([])
  const [availableExercises, setAvailableExercises] = useState<ExerciseDto[]>(() => {
    if (initialRoute.songId && initialRoute.songId.startsWith('drill_chord_')) {
      const rawChord = initialRoute.songId
        .replace(/^drill_chord_/, '')
        .replace(/_sharp/g, '#')
        .replace(/_/g, ' ')
      const chordSymbol = rawChord.charAt(0).toUpperCase() + rawChord.slice(1)
      const drill = createChordDrillExercise(chordSymbol)
      return [...ALL_BUILTIN_EXERCISES, drill]
    }
    return ALL_BUILTIN_EXERCISES
  })
  const [userStats, setUserStats] = useState<UserStatsDto | null>(null)
  const [userHabits, setUserHabits] = useState<HabitPatternDto[]>([])
  const [isInitialHydrating, setIsInitialHydrating] = useState(true)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isSessionSelectorOpen, setIsSessionSelectorOpen] = useState(false)
  const [isStudioSetupOpen, setIsStudioSetupOpen] = useState(false)
  const studioSetupMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isStudioSetupOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (studioSetupMenuRef.current && !studioSetupMenuRef.current.contains(e.target as Node)) {
        setIsStudioSetupOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isStudioSetupOpen])
  const [studioPrefs, setStudioPrefs] = useState<StudioPreferences>(loadStoredPreferences)
  const [userProfile, setUserProfile] = useState<{ name: string; username: string; email: string }>({
    name: 'Studio Musician',
    username: 'musician',
    email: 'musician@sonus.studio',
  })
  const [practiceInstrument, setPracticeInstrument] = useState<'guitar' | 'piano'>(
    studioPrefs.defaultInstrument || 'guitar'
  )
  const [practiceMode, setPracticeMode] = useState<'listen' | 'practice'>('practice')
  const [practiceNotationMode, setPracticeNotationMode] = useState<'staff' | 'keys'>('staff')
  const [isRepertoireOpen, setIsRepertoireOpen] = useState(false)

  const selectedSong = useMemo(() => {
    const found =
      availableExercises.find((s) => s.id === selectedSongId) ??
      BUILTIN_FULL_SONGS.find((s) => s.id === selectedSongId)
    if (found) return found

    if (selectedSongId?.startsWith('drill_chord_')) {
      const rawChord = selectedSongId
        .replace(/^drill_chord_/, '')
        .replace(/_sharp/g, '#')
        .replace(/_/g, ' ')
      const chordSymbol = rawChord.charAt(0).toUpperCase() + rawChord.slice(1)
      return createChordDrillExercise(chordSymbol, studioPrefs.defaultInstrument || 'guitar')
    }

    return (
      availableExercises[0] ??
      BUILTIN_FULL_SONGS[0]
    )
  }, [availableExercises, selectedSongId, studioPrefs.defaultInstrument])

  useEffect(() => {
    if (selectedSong?.instrument) {
      setPracticeInstrument(selectedSong.instrument.toLowerCase() === 'guitar' ? 'guitar' : 'piano')
    }
  }, [selectedSong?.id, selectedSong?.instrument])

  // Hydrate authentic repertoire catalogue and user history from PostgreSQL backend
  const loadBackendData = useCallback(async () => {
    try {
      if (!isSignedIn) {
        try {
          const exercisesRes = await fetchExercises()
          if (exercisesRes && exercisesRes.length > 0) {
            setAvailableExercises((prev) => {
              const drills = prev.filter((e) => e.id.startsWith('drill_chord_'))
              const existingIds = new Set(exercisesRes.map((e) => e.id))
              const uniqueDrills = drills.filter((d) => !existingIds.has(d.id))
              return [...exercisesRes, ...uniqueDrills]
            })
            if (typeof window !== 'undefined') {
              const route = parseRouteFromPath(window.location.pathname, exercisesRes)
              if (route.songId) {
                setSelectedSongId(route.songId)
              }
            }
          }
        } catch {
          // Keep builtin catalogue
        }
        return
      }

      const [exercisesRes, sessionsRes, statsRes, habitsRes, masteryRes, meRes] = await Promise.allSettled([
        fetchExercises(),
        fetchUserSessions(),
        fetchUserStats(),
        fetchUserHabits(),
        fetchUserMastery(),
        fetchMe(),
      ])

      const loadedExercises =
        exercisesRes.status === 'fulfilled' && exercisesRes.value.length > 0
          ? exercisesRes.value
          : BUILTIN_FULL_SONGS
      setAvailableExercises((prev) => {
        const drills = prev.filter((e) => e.id.startsWith('drill_chord_'))
        const existingIds = new Set(loadedExercises.map((e) => e.id))
        const uniqueDrills = drills.filter((d) => !existingIds.has(d.id))
        return [...loadedExercises, ...uniqueDrills]
      })

      if (typeof window !== 'undefined') {
        const route = parseRouteFromPath(window.location.pathname, loadedExercises)
        if (route.songId) {
          setSelectedSongId(route.songId)
        }
      }

      if (meRes.status === 'fulfilled' && meRes.value) {
        setUserProfile({
          name: meRes.value.name,
          username: meRes.value.username,
          email: meRes.value.email,
        })
      } else if (
        meRes.status === 'rejected' &&
        meRes.reason instanceof ApiError &&
        meRes.reason.status === 404
      ) {
        const meta = getClerkUserMetadata()
        const rawBase = (meta?.username || 'musician')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/^_+|_+$/g, '')
        const baseUsername = (rawBase.length >= 3 ? rawBase : `musician_${rawBase}`).slice(0, 22)
        const suffix = Math.random().toString(36).slice(2, 6)
        const candidateUsername = `${baseUsername}_${suffix}`.slice(0, 30)
        const candidateName = (meta?.name || 'Studio Musician').trim().slice(0, 100) || 'Studio Musician'
        try {
          const created = await createMe({ name: candidateName, username: candidateUsername })
          setUserProfile({
            name: created.name,
            username: created.username,
            email: created.email,
          })
        } catch {
          // User may have already been created in a concurrent request
        }
      }

      if (sessionsRes.status === 'fulfilled') {
        const longitudinal = mapBackendSessionsToLongitudinal(sessionsRes.value)
        setSessionHistory(longitudinal)
      }

      if (statsRes.status === 'fulfilled') {
        setUserStats(statsRes.value)
      }

      if (habitsRes.status === 'fulfilled') {
        setUserHabits(habitsRes.value)
      }

      if (masteryRes.status === 'fulfilled') {
        if (masteryRes.value?.records?.length > 0) {
          const mappedTransitions = mapBackendMasteryToTransitions(masteryRes.value.records, loadedExercises)
          setTransitions(mappedTransitions)
        } else if (habitsRes.status === 'fulfilled' && habitsRes.value.length > 0) {
          const mappedTransitions = mapBackendHabitsToTransitions(habitsRes.value, loadedExercises)
          setTransitions(mappedTransitions)
        } else {
          setTransitions([])
        }
      } else if (habitsRes.status === 'fulfilled' && habitsRes.value.length > 0) {
        const mappedTransitions = mapBackendHabitsToTransitions(habitsRes.value, loadedExercises)
        setTransitions(mappedTransitions)
      }
    } catch {
      // Preserve existing state on transient network failure without synthesizing mock takes
    } finally {
      setIsInitialHydrating(false)
    }
  }, [isSignedIn])

  useEffect(() => {
    void loadBackendData()
  }, [loadBackendData])

  // Synchronize browser history navigation (Back / Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return
      const { view, songId } = parseRouteFromPath(window.location.pathname, availableExercises)
      setActiveView(view)
      if (songId) {
        setSelectedSongId(songId)
        if (songId.startsWith('drill_chord_') && !availableExercises.some((e) => e.id === songId)) {
          const rawChord = songId
            .replace(/^drill_chord_/, '')
            .replace(/_sharp/g, '#')
            .replace(/_/g, ' ')
          const chordSymbol = rawChord.charAt(0).toUpperCase() + rawChord.slice(1)
          const drill = createChordDrillExercise(chordSymbol, studioPrefs.defaultInstrument || 'guitar')
          setAvailableExercises((prev) => [...prev, drill])
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [availableExercises, studioPrefs])

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const hasValidClerkKey = Boolean(
    publishableKey &&
      publishableKey !== '<YOUR_CLERK_PUBLISHABLE_KEY>' &&
      import.meta.env.VITE_DEV_OFFLINE !== 'true'
  )

  const effectiveUserButtonSlot =
    userButtonSlot ||
    (isSignedIn && hasValidClerkKey ? (
      <UserButton />
    ) : (
      <button
        type="button"
        data-testid="global-signin-btn"
        onClick={() => {
          setAuthReturnUrl(window.location.pathname)
          setShowSignInModal(true)
        }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-xs cursor-pointer"
      >
        Sign In
      </button>
    ))

  // Dynamically update BKT mastery, SM-2 schedule, and session history when a take completes
  const handleTakeCompleted = useCallback(
    (
      evaluation: TakeEvaluationResponse,
      songTitle: string,
      instrument: 'piano' | 'guitar',
      tempoBpm: number
    ) => {
      const rawAcc = evaluation.overall_accuracy
      const acc = rawAcc <= 1.0 ? rawAcc * 100 : rawAcc
      const absLag = Math.abs(evaluation.avg_timing_error_ms)
      const rawVox = evaluation.voicing_score
      const vox = rawVox <= 1.0 ? Math.round(rawVox * 100) : Math.round(rawVox)

      setSessionHistory((prev) => {
        const nextIdx = prev.length + 1
        const nextPoint: LongitudinalSessionPoint = {
          sessionIndex: nextIdx,
          dateLabel: 'Today',
          songId: selectedSongId,
          songTitle,
          instrument,
          accuracyPct: Number(acc.toFixed(1)),
          avgLatencyMs: Math.round(absLag),
          voicingPct: vox,
          tempoBpm,
          cusumEvent:
            acc >= 94
              ? {
                  type: 'breakthrough_locked',
                  label: 'Verified Clean Take',
                  detail: `Aligned at ${acc.toFixed(1)}% with ±${Math.round(absLag)}ms timing.`,
                }
              : undefined,
        }
        return [...prev, nextPoint]
      })

      setTransitions((prev) =>
        prev.map((t, idx) => {
          if (idx !== 0 && t.songId !== selectedSongId) return t
          const isClean = acc >= 85 && absLag <= 45 && vox >= 80
          const bkt = updateBktMastery(t.pKnown, isClean)
          const q = metricsToSm2Quality(acc, absLag, vox)
          const sm2 = updateSm2State(t.sm2IntervalDays, t.sm2EaseFactor, t.sm2Repetitions, q)
          const updatedEwma = Math.round(0.35 * absLag + 0.65 * t.ewmaLatencyMs)
          return {
            ...t,
            pKnown: bkt.pKnown,
            isMastered: bkt.isMastered,
            observationsCount: t.observationsCount + 1,
            ewmaLatencyMs: updatedEwma,
            voicingCompletenessPct: Math.round(0.35 * vox + 0.65 * t.voicingCompletenessPct),
            sm2IntervalDays: sm2.intervalDays,
            sm2EaseFactor: sm2.easeFactor,
            sm2Repetitions: sm2.repetitions,
            daysSinceLastPractice: 0,
            dueStatus: q >= 4 ? 'scheduled' : 'due_today',
          }
        })
      )

      // Refresh live backend session history and stats
      void loadBackendData()
    },
    [selectedSongId, loadBackendData]
  )

  const navigateToView = useCallback((view: AppViewMode, targetSongId?: string) => {
    const songToUse = targetSongId || selectedSongId
    const targetPath = viewToPath(view, songToUse)

    if (!isSignedIn && (view === 'practice' || view === 'progress' || view === 'community')) {
      setAuthReturnUrl(targetPath)
      setShowSignInModal(true)
      return
    }

    if (typeof window !== 'undefined') {
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view, songId: songToUse }, '', targetPath)
      }
    }

    setActiveView(view)
    if (targetSongId) {
      setSelectedSongId(targetSongId)
    }
  }, [selectedSongId, isSignedIn])

  const handleSelectSong = useCallback((songId: string) => {
    setSelectedSongId(songId)
    if (typeof window !== 'undefined' && activeView === 'practice') {
      const nextPath = `/practice/${exerciseIdToSlug(songId)}`
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ view: 'practice', songId }, '', nextPath)
      }
    }
  }, [activeView])

  const handleLaunchRecommendedDrill = (rec: AdaptiveExerciseRecommendation) => {
    setSelectedSongId(rec.songId)
    setPendingLoopDrill({
      fromChord: rec.fromChord,
      toChord: rec.toChord,
      targetBpm: rec.recommendedBpm,
      description: rec.practiceInstructions,
    })
    navigateToView('practice', rec.songId)
  }

  const handleLaunchChordDrill = useCallback(
    (chordSymbol: string) => {
      const drill = createChordDrillExercise(chordSymbol, studioPrefs.defaultInstrument || 'guitar')
      setAvailableExercises((prev) => {
        const idx = prev.findIndex((e) => e.id === drill.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = drill
          return next
        }
        return [...prev, drill]
      })
      setSelectedSongId(drill.id)
      setPendingLoopDrill(null)
      navigateToView('practice', drill.id)
    },
    [studioPrefs, navigateToView]
  )

  const latestSession = sessionHistory[sessionHistory.length - 1]

  if (isInitialHydrating) {
    return (
      <MusicianLoadingScreen
        headline="Calibrating Studio Acoustics"
        subtext="Preparing interactive score, chord voicings, and practice stands..."
      />
    )
  }

  return (
    <MotionConfig reducedMotion="user">
    <AuthShell>
      {activeView !== 'landing' && (
        <header
          data-testid="global-navigation-header"
          className="sticky top-0 z-40 w-full h-14 bg-white/95 dark:bg-[#111114]/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 font-sans shrink-0 overflow-visible"
        >
          {/* Zone 1: Brand, Repertoire Selector & Hideable Studio Setup */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <button
              type="button"
              onClick={() => navigateToView('landing')}
              className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 hover:text-amber-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="font-brand font-bold tracking-[0.2em] text-amber-600 dark:text-amber-500 text-sm">
                § SONUS
              </span>
            </button>

            {activeView === 'practice' && selectedSong && (
              <>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <button
                  type="button"
                  data-testid="open-repertoire-drawer"
                  onClick={() => setIsRepertoireOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 border border-zinc-300 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer truncate max-w-[130px] sm:max-w-[180px] lg:max-w-[220px]"
                  title="Change piece / repertoire"
                >
                  <span className="text-amber-600 dark:text-amber-400 truncate">
                    {selectedSong.title}
                  </span>
                  <span className="text-[10px] text-zinc-400 shrink-0">▾</span>
                </button>

                {/* Hideable Studio Setup Menu */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    data-testid="studio-setup-toggle-btn"
                    onClick={() => setIsStudioSetupOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 border border-zinc-300 dark:border-zinc-800 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                    title="Studio Setup (Mode, Instrument, Notation)"
                  >
                    <SlidersHorizontal className="size-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span className="font-bold hidden md:inline">
                      {practiceMode === 'listen' ? '🎧 Listen' : '🎯 Practice'}
                    </span>
                    <span className="hidden md:inline text-zinc-400">·</span>
                    <span className="uppercase text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      {practiceInstrument}
                    </span>
                    {practiceInstrument === 'piano' && (
                      <>
                        <span className="hidden lg:inline text-zinc-400">·</span>
                        <span className="hidden lg:inline text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                          {practiceNotationMode}
                        </span>
                      </>
                    )}
                    <ChevronDown className={`size-3 text-zinc-400 transition-transform duration-150 ${isStudioSetupOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStudioSetupOpen && (
                    <div
                      ref={studioSetupMenuRef}
                      className="absolute left-0 mt-2 w-72 p-3.5 rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col gap-3 font-sans animate-in fade-in zoom-in-95 duration-100"
                    >
                      {/* Mode selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
                          Practice Mode
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-mono">
                          <button
                            type="button"
                            data-testid="mode-listen-btn"
                            onClick={() => { setPracticeMode('listen'); }}
                            className={`py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                              practiceMode === 'listen'
                                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                          >
                            <span>🎧 Listen</span>
                          </button>
                          <button
                            type="button"
                            data-testid="mode-practice-btn"
                            onClick={() => { setPracticeMode('practice'); }}
                            className={`py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                              practiceMode === 'practice'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                          >
                            <span>🎯 Practice</span>
                          </button>
                        </div>
                      </div>

                      {/* Instrument selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
                          Instrument
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-mono">
                          <button
                            type="button"
                            data-testid="toggle-inst-guitar"
                            onClick={() => { setPracticeInstrument('guitar'); }}
                            className={`py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                              practiceInstrument === 'guitar'
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                          >
                            <span>🎸 Guitar</span>
                          </button>
                          <button
                            type="button"
                            data-testid="toggle-inst-piano"
                            onClick={() => { setPracticeInstrument('piano'); }}
                            className={`py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                              practiceInstrument === 'piano'
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                          >
                            <span>🎹 Piano</span>
                          </button>
                        </div>
                      </div>

                      {/* Piano Notation (when piano is active) */}
                      {practiceInstrument === 'piano' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
                            Piano Display
                          </label>
                          <div data-testid="piano-notation-toggle" className="grid grid-cols-2 gap-1.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => { setPracticeNotationMode('staff'); }}
                              className={`py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                                practiceNotationMode === 'staff'
                                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <span>🎼 Grand Staff</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setPracticeNotationMode('keys'); }}
                              className={`py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                                practiceNotationMode === 'keys'
                                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <span>🎹 Falling Keys</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Key & Song metadata badge */}
                      {selectedSong && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                          <span>Key: <strong className="text-zinc-700 dark:text-zinc-300">{selectedSong.progression?.key || 'C'}</strong></span>
                          <span>Meter: <strong className="text-zinc-700 dark:text-zinc-300">{(selectedSong.progression as Record<string, unknown> | undefined)?.time_signature as string || '4/4'}</strong></span>
                          <span>Tempo: <strong className="text-amber-600 dark:text-amber-400">{selectedSong.tempo_bpm || 80} BPM</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Zone 2: Navigation Tabs with shared layoutId underline */}
          <nav className="flex items-center gap-1 shrink-0 text-xs font-mono">
            {(
              [
                { id: 'practice', testId: 'nav-pill-practice', label: 'Practice', shortLabel: 'Studio', icon: Music },
                { id: 'theory', testId: 'nav-pill-theory', label: 'Chords & Scales', shortLabel: 'Chords', icon: BookOpen },
                { id: 'tuner', testId: 'nav-pill-tuner', label: 'Guitar Tuner', shortLabel: 'Tuner', icon: Disc },
                { id: 'progress', testId: 'nav-pill-progress', label: 'Progress', shortLabel: 'Progress', icon: TrendingUp },
                { id: 'community', testId: 'nav-pill-community', label: 'Peers', shortLabel: 'Peers', icon: Users },
              ] as const
            )
              .filter((tab) => {
                if (!isSignedIn && (tab.id === 'progress' || tab.id === 'community')) {
                  return false
                }
                return true
              })
              .map((tab) => {
                const Icon = tab.icon
                const isActive = activeView === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={tab.testId}
                    onClick={() => navigateToView(tab.id)}
                    className={`relative px-2.5 sm:px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'text-zinc-950 dark:text-zinc-100'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="global-nav-active-tab"
                        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                        className="absolute inset-0 rounded-lg bg-amber-500/20 dark:bg-amber-500/20 border border-amber-500/60"
                        aria-hidden="true"
                      />
                    )}
                    <Icon className={`relative z-10 size-3.5 shrink-0 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                    <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                    <span className="relative z-10 sm:hidden">{tab.shortLabel}</span>
                  </button>
                )
              })}
          </nav>

          {/* Zone 3: Studio Settings, Theme & User */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              data-testid="open-settings-modal-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              aria-label="Studio Settings"
              className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Studio Settings"
            >
              <Sliders className="size-4" />
            </button>
            <ThemeToggle />
            {effectiveUserButtonSlot}
          </div>
        </header>
      )}

      <AnimatePresence mode="wait">
      {activeView === 'landing' && (
        <motion.div
          key="view-landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <LandingPage
            onEnterStudio={(songId) => {
              const chosen = songId || selectedSongId
              if (!isSignedIn) {
                const targetPath = chosen ? `/practice/${exerciseIdToSlug(chosen)}` : '/practice'
                setAuthReturnUrl(targetPath)
                setShowSignInModal(true)
                return
              }
              if (songId) {
                setSelectedSongId(songId)
                setPendingLoopDrill(null)
                navigateToView('practice', chosen)
              } else {
                setIsSessionSelectorOpen(true)
                navigateToView('practice')
              }
            }}
            onOpenTheory={() => navigateToView('theory')}
            onOpenTuner={() => navigateToView('tuner')}
            onOpenProgress={() => navigateToView('progress')}
            onOpenCommunity={() => navigateToView('community')}
            onSignIn={() => {
              setAuthReturnUrl('/practice')
              setShowSignInModal(true)
            }}
            isSignedIn={isSignedIn}
            userButtonSlot={effectiveUserButtonSlot}
          />
        </motion.div>
      )}

      {activeView === 'practice' && (
        <motion.div
          key="view-practice"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
        <PracticeStudioCockpit
          embedded={true}
          instrument={practiceInstrument}
          onInstrumentChange={setPracticeInstrument}
          studioMode={practiceMode}
          onStudioModeChange={setPracticeMode}
          isRepertoireOpen={isRepertoireOpen}
          onRepertoireOpenChange={setIsRepertoireOpen}
          pianoNotationMode={practiceNotationMode}
          onPianoNotationModeChange={setPracticeNotationMode}
          initialSongId={selectedSongId}
          initialLoopDrill={pendingLoopDrill}
          availableExercises={availableExercises}
          initialHabits={userHabits}
          onSelectSong={handleSelectSong}
          onBackToDesk={() => navigateToView('landing')}
          onOpenProgress={() => navigateToView('progress')}
          onOpenCommunity={() => navigateToView('community')}
          onTakeCompleted={handleTakeCompleted}
          userButtonSlot={effectiveUserButtonSlot}
        />
        </motion.div>
      )}

      {activeView === 'theory' && (
        <motion.div
          key="view-theory"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
        <ChordsScalesPage
          onBackToLanding={() => navigateToView('landing')}
          onOpenPracticeWithChord={handleLaunchChordDrill}
        />
        </motion.div>
      )}

      {activeView === 'tuner' && (
        <motion.div
          key="view-tuner"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
        <GuitarTunerPage
          onBackToLanding={() => navigateToView('landing')}
          onOpenStudio={() => navigateToView('practice')}
        />
        </motion.div>
      )}

      {activeView === 'progress' && (
        <motion.div
          key="view-progress"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
        <ProgressDashboardPage
          transitions={transitions}
          sessionHistory={sessionHistory}
          onBackToLanding={() => navigateToView('landing')}
          onOpenStudioWithRecommendation={handleLaunchRecommendedDrill}
          onOpenCommunity={() => navigateToView('community')}
          userButtonSlot={effectiveUserButtonSlot}
        />
        </motion.div>
      )}

      {activeView === 'community' && (
        <motion.div
          key="view-community"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
        <PeerComparisonPage
          userAccuracyPct={userStats ? (userStats.overall_accuracy_pct <= 1.0 ? userStats.overall_accuracy_pct * 100 : userStats.overall_accuracy_pct) : latestSession?.accuracyPct}
          userMeanLatencyMs={userStats ? Math.round(Math.abs(userStats.avg_timing_error_ms)) : latestSession?.avgLatencyMs}
          userVoicingPct={userStats ? (userStats.avg_voicing_score <= 1.0 ? Math.round(userStats.avg_voicing_score * 100) : Math.round(userStats.avg_voicing_score)) : latestSession?.voicingPct}
          hasRecordedTakes={Boolean((userStats && userStats.total_sessions_completed > 0) || sessionHistory.length > 0)}
          onBackToLanding={() => navigateToView('landing')}
          onOpenProgress={() => navigateToView('progress')}
          onPracticePiece={(songId, _targetBpm) => {
            setSelectedSongId(songId)
            setPendingLoopDrill(null)
            navigateToView('practice', songId)
          }}
          userButtonSlot={effectiveUserButtonSlot}
        />
        </motion.div>
      )}
      </AnimatePresence>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentName={userProfile.name}
        currentUsername={userProfile.username}
        currentEmail={userProfile.email}
        onSaveProfile={async (name, username) => {
          const updated = await updateMe({ name, username })
          setUserProfile({
            name: updated.name,
            username: updated.username,
            email: updated.email,
          })
        }}
        onSavePreferences={(prefs) => {
          setStudioPrefs(prefs)
        }}
      />

      <StudioSessionSelector
        isOpen={isSessionSelectorOpen}
        onClose={() => setIsSessionSelectorOpen(false)}
        availableExercises={availableExercises}
        currentSongId={selectedSongId}
        onLaunchSession={(song, _instrument) => {
          setSelectedSongId(song.id)
          setIsSessionSelectorOpen(false)
          navigateToView('practice', song.id)
        }}
      />

      {activeView === 'audio' && (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 font-sans bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-[0.15em] uppercase text-amber-500">
                  SONUS
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-xs text-zinc-500 font-mono">Acoustic &amp; DSP Bench</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                Acoustic &amp; FFT Bench
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateToView('landing')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono font-semibold tracking-wide text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer"
              >
                ← Back to Home
              </button>
              <button
                type="button"
                onClick={() => navigateToView('practice')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono font-semibold tracking-wide bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all cursor-pointer"
              >
                Open Practice Room →
              </button>
            </div>
          </header>

          <section aria-label="Testing Studio" className="w-full">
            <AudioTestBench />
          </section>
        </main>
      )}

      <SignInModal
        isOpen={showSignInModal}
        returnUrl={authReturnUrl}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => {
          setIsSignedIn(true)
          setShowSignInModal(false)
          if (authReturnUrl) {
            const { view, songId } = parseRouteFromPath(authReturnUrl, availableExercises)
            setActiveView(view)
            if (songId) setSelectedSongId(songId)
          }
          void loadBackendData()
        }}
      />
    </AuthShell>
    </MotionConfig>
  )
}
