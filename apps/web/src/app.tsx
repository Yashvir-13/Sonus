import { useState, useCallback, useEffect, useMemo } from 'react'
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
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'
import {
  fetchExercises,
  fetchUserSessions,
  fetchUserStats,
  fetchUserHabits,
  fetchUserMastery,
  type ExerciseDto,
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
import { Music, BookOpen, Disc, TrendingUp, Users, Sliders } from 'lucide-react'

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
    default:
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
  if (normalized === 'four-chord-anthem' || normalized === 'anthem-in-d' || normalized === 'four-chord') {
    return 'ex_guitar_four_chord'
  }
  if (normalized === 'knockin-cadence' || normalized === 'knockin' || normalized === 'knockin-on-heavens-door') {
    return 'ex_guitar_knockin'
  }
  const direct = available.find((e) => e.id.toLowerCase() === normalized || e.id.toLowerCase() === `ex_${normalized.replace(/-/g, '_')}`)
  if (direct) return direct.id
  const byTitle = available.find((e) => e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(normalized))
  if (byTitle) return byTitle.id
  return undefined
}

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
  const [availableExercises, setAvailableExercises] = useState<ExerciseDto[]>(BUILTIN_FULL_SONGS)
  const [userStats, setUserStats] = useState<UserStatsDto | null>(null)
  const [isInitialHydrating, setIsInitialHydrating] = useState(true)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isSessionSelectorOpen, setIsSessionSelectorOpen] = useState(false)
  const [_studioPrefs, setStudioPrefs] = useState<StudioPreferences>(loadStoredPreferences)
  const [userProfile, setUserProfile] = useState<{ name: string; username: string; email: string }>({
    name: 'Studio Musician',
    username: 'musician',
    email: 'musician@sonus.studio',
  })
  const [navTransition, setNavTransition] = useState<{
    headline: string
    subtext: string
  } | null>(null)

  // Hydrate authentic repertoire catalogue and user history from PostgreSQL backend
  const loadBackendData = useCallback(async () => {
    try {
      const [exercisesRes, sessionsRes, statsRes, habitsRes, masteryRes] = await Promise.allSettled([
        fetchExercises(),
        fetchUserSessions(),
        fetchUserStats(),
        fetchUserHabits(),
        fetchUserMastery(),
      ])

      const loadedExercises =
        exercisesRes.status === 'fulfilled' && exercisesRes.value.length > 0
          ? exercisesRes.value
          : BUILTIN_FULL_SONGS
      setAvailableExercises(loadedExercises)

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.length > 0) {
        const longitudinal = mapBackendSessionsToLongitudinal(sessionsRes.value)
        setSessionHistory(longitudinal)
      }

      if (statsRes.status === 'fulfilled') {
        setUserStats(statsRes.value)
      }

      if (masteryRes.status === 'fulfilled' && masteryRes.value?.records?.length > 0) {
        const mappedTransitions = mapBackendMasteryToTransitions(masteryRes.value.records, loadedExercises)
        setTransitions(mappedTransitions)
      } else if (habitsRes.status === 'fulfilled' && habitsRes.value.length > 0) {
        const mappedTransitions = mapBackendHabitsToTransitions(habitsRes.value, loadedExercises)
        setTransitions(mappedTransitions)
      }
    } catch {
      // Fall back gracefully to local catalog and baseline state
    } finally {
      setIsInitialHydrating(false)
    }
  }, [])

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
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [availableExercises])

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const hasValidClerkKey = Boolean(
    publishableKey &&
      publishableKey !== '<YOUR_CLERK_PUBLISHABLE_KEY>' &&
      import.meta.env.VITE_DEV_OFFLINE !== 'true'
  )

  const effectiveUserButtonSlot =
    userButtonSlot || (isSignedIn && hasValidClerkKey ? <UserButton /> : undefined)

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
    if (typeof window !== 'undefined') {
      const targetPath = viewToPath(view, songToUse)
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view, songId: songToUse }, '', targetPath)
      }
    }

    let headline = 'Setting Up Practice Room'
    let subtext = 'Harmonizing interactive score, voicings, and visual stands...'
    if (view === 'progress') {
      headline = 'Curating Musician Archives'
      subtext = 'Synthesizing longitudinal trajectories, habit alerts, and spaced review queues...'
    } else if (view === 'community') {
      headline = 'Auditioning Cohort Benchmarks'
      subtext = 'Compiling percentile curves and repertoire leaderboards across active musicians...'
    } else if (view === 'theory') {
      headline = 'Harmony & Theory Compendium'
      subtext = 'Harmonizing diatonic, modal, and extended chord vocabularies...'
    } else if (view === 'tuner') {
      headline = 'Calibrating Acoustic Tuner'
      subtext = 'Engaging precision autocorrelation pitch sensor...'
    } else if (view === 'landing') {
      headline = 'Returning to Studio Stage'
      subtext = 'Preserving active score and practice telemetry...'
    }

    setNavTransition({ headline, subtext })
    setTimeout(() => {
      setActiveView(view)
      if (targetSongId) {
        setSelectedSongId(targetSongId)
      }
      setTimeout(() => {
        setNavTransition(null)
      }, 150)
    }, 280)
  }, [selectedSongId])

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
    <AuthShell>
      {navTransition && (
        <MusicianLoadingScreen
          headline={navTransition.headline}
          subtext={navTransition.subtext}
          fullscreen={true}
        />
      )}
      {activeView !== 'landing' && (
        <header
          data-testid="global-navigation-header"
          className="sticky top-0 z-40 w-full h-14 bg-white/95 dark:bg-[#111114]/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between gap-4 font-sans shrink-0"
        >
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateToView('landing')}
              className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 hover:text-amber-500 transition-colors cursor-pointer"
            >
              <span className="font-brand font-bold tracking-[0.2em] text-amber-600 dark:text-amber-500 text-sm">
                § SONUS
              </span>
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          </div>

          {/* Center: Navigation Pills */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs font-mono">
            <button
              type="button"
              data-testid="nav-pill-practice"
              onClick={() => navigateToView('practice')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'practice'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Music className="size-3.5" />
              <span>Practice</span>
            </button>

            <button
              type="button"
              data-testid="nav-pill-theory"
              onClick={() => navigateToView('theory')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'theory'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <BookOpen className="size-3.5" />
              <span>Chords &amp; Scales</span>
            </button>

            <button
              type="button"
              data-testid="nav-pill-tuner"
              onClick={() => navigateToView('tuner')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'tuner'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Disc className="size-3.5" />
              <span>Guitar Tuner</span>
            </button>

            <button
              type="button"
              data-testid="nav-pill-progress"
              onClick={() => navigateToView('progress')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'progress'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <TrendingUp className="size-3.5" />
              <span>Progress</span>
            </button>

            <button
              type="button"
              data-testid="nav-pill-community"
              onClick={() => navigateToView('community')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'community'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Users className="size-3.5" />
              <span>Peers</span>
            </button>
          </nav>

          {/* Right: Studio Settings, Theme & User */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="open-settings-modal-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Studio Settings"
            >
              <Sliders className="size-4" />
            </button>
            <ThemeToggle />
            {effectiveUserButtonSlot}
          </div>
        </header>
      )}

      {activeView === 'landing' && (
        <>
          <LandingPage
            onEnterStudio={(songId) => {
              const chosen = songId || selectedSongId
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
            onSignIn={() => setShowSignInModal(true)}
            isSignedIn={isSignedIn}
            userButtonSlot={effectiveUserButtonSlot}
          />
          <SignInModal
            isOpen={showSignInModal}
            onClose={() => setShowSignInModal(false)}
            onSuccess={() => {
              setIsSignedIn(true)
              setShowSignInModal(false)
              navigateToView('practice')
            }}
          />
        </>
      )}

      {activeView === 'practice' && (
        <PracticeStudioCockpit
          initialSongId={selectedSongId}
          initialLoopDrill={pendingLoopDrill}
          availableExercises={availableExercises}
          onSelectSong={handleSelectSong}
          onBackToDesk={() => navigateToView('landing')}
          onOpenProgress={() => navigateToView('progress')}
          onOpenCommunity={() => navigateToView('community')}
          onTakeCompleted={handleTakeCompleted}
          userButtonSlot={effectiveUserButtonSlot}
        />
      )}

      {activeView === 'theory' && (
        <ChordsScalesPage
          onBackToLanding={() => navigateToView('landing')}
          onOpenPracticeWithChord={(_chord) => {
            navigateToView('practice')
          }}
        />
      )}

      {activeView === 'tuner' && (
        <GuitarTunerPage
          onBackToLanding={() => navigateToView('landing')}
          onOpenStudio={() => navigateToView('practice')}
        />
      )}

      {activeView === 'progress' && (
        <ProgressDashboardPage
          transitions={transitions}
          sessionHistory={sessionHistory}
          onBackToLanding={() => navigateToView('landing')}
          onOpenStudioWithRecommendation={handleLaunchRecommendedDrill}
          onOpenCommunity={() => navigateToView('community')}
          userButtonSlot={effectiveUserButtonSlot}
        />
      )}

      {activeView === 'community' && (
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
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentName={userProfile.name}
        currentUsername={userProfile.username}
        currentEmail={userProfile.email}
        onSaveProfile={async (name, username) => {
          setUserProfile((prev) => ({ ...prev, name, username }))
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
    </AuthShell>
  )
}
