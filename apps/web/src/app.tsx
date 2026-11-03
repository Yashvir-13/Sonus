import { useState, useCallback } from 'react'
import { UserButton } from '@clerk/react'
import { AudioTestBench } from '@/components/dev/audio-test-bench'
import { PracticeStudioCockpit } from '@/components/practice/practice-studio-cockpit'
import { LandingPage } from '@/components/landing/landing-page'
import { ProgressDashboardPage } from '@/components/progress/progress-dashboard-page'
import { PeerComparisonPage } from '@/components/community/peer-comparison-page'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { AuthShell } from '@/components/auth/auth-shell'
import {
  INITIAL_TRANSITION_MASTERY,
  INITIAL_SESSION_HISTORY,
  updateBktMastery,
  metricsToSm2Quality,
  updateSm2State,
  type TransitionMasteryState,
  type LongitudinalSessionPoint,
  type AdaptiveExerciseRecommendation,
} from '@/lib/adaptive/recommendation-engine'
import type { TakeEvaluationResponse } from '@/api/sessions'

export type AppViewMode = 'landing' | 'practice' | 'progress' | 'community' | 'audio'

export type AppProps = {
  initialView?: AppViewMode
  userButtonSlot?: React.ReactNode
  defaultSignedIn?: boolean
}

export default function App({
  initialView = 'landing',
  userButtonSlot,
  defaultSignedIn = false,
}: AppProps) {
  const [activeView, setActiveView] = useState<AppViewMode>(initialView)
  const [isSignedIn, setIsSignedIn] = useState(defaultSignedIn || Boolean(userButtonSlot))
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [selectedSongId, setSelectedSongId] = useState<string>('ex_piano_shostakovich_waltz_2')
  const [pendingLoopDrill, setPendingLoopDrill] = useState<{
    fromChord: string
    toChord: string
    targetBpm: number
    description?: string
  } | null>(null)

  // Shared Longitudinal State across Practice Room, Progress & Coach, and Peer Benchmarks
  const [transitions, setTransitions] = useState<TransitionMasteryState[]>(
    INITIAL_TRANSITION_MASTERY
  )
  const [sessionHistory, setSessionHistory] = useState<LongitudinalSessionPoint[]>(
    INITIAL_SESSION_HISTORY
  )

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
      const acc = evaluation.overall_accuracy
      const absLag = Math.abs(evaluation.avg_timing_error_ms)
      const vox = evaluation.voicing_score

      setSessionHistory((prev) => {
        const nextIdx = prev.length + 1
        const nextPoint: LongitudinalSessionPoint = {
          sessionIndex: nextIdx,
          dateLabel: 'Today',
          songId: selectedSongId,
          songTitle,
          instrument,
          accuracyPct: acc,
          avgLatencyMs: Math.round(absLag),
          voicingPct: Math.round(vox),
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
    },
    [selectedSongId]
  )

  const handleLaunchRecommendedDrill = (rec: AdaptiveExerciseRecommendation) => {
    setSelectedSongId(rec.songId)
    setPendingLoopDrill({
      fromChord: rec.fromChord,
      toChord: rec.toChord,
      targetBpm: rec.recommendedBpm,
      description: rec.practiceInstructions,
    })
    setActiveView('practice')
  }

  const latestSession = sessionHistory[sessionHistory.length - 1]

  return (
    <AuthShell
      hideHeader={
        activeView === 'landing' ||
        activeView === 'practice' ||
        activeView === 'progress' ||
        activeView === 'community'
      }
    >
      {activeView === 'landing' && (
        <>
          <LandingPage
            onEnterStudio={(songId) => {
              if (songId) {
                setSelectedSongId(songId)
              }
              setPendingLoopDrill(null)
              if (isSignedIn) {
                setActiveView('practice')
              } else {
                setShowSignInModal(true)
              }
            }}
            onOpenProgress={() => setActiveView('progress')}
            onOpenCommunity={() => setActiveView('community')}
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
              setActiveView('practice')
            }}
          />
        </>
      )}

      {activeView === 'practice' && (
        <PracticeStudioCockpit
          initialSongId={selectedSongId}
          initialLoopDrill={pendingLoopDrill}
          onBackToDesk={() => setActiveView('landing')}
          onOpenProgress={() => setActiveView('progress')}
          onOpenCommunity={() => setActiveView('community')}
          onTakeCompleted={handleTakeCompleted}
          userButtonSlot={effectiveUserButtonSlot}
        />
      )}

      {activeView === 'progress' && (
        <ProgressDashboardPage
          transitions={transitions}
          sessionHistory={sessionHistory}
          onBackToLanding={() => setActiveView('landing')}
          onOpenStudioWithRecommendation={handleLaunchRecommendedDrill}
          onOpenCommunity={() => setActiveView('community')}
          userButtonSlot={effectiveUserButtonSlot}
        />
      )}

      {activeView === 'community' && (
        <PeerComparisonPage
          userAccuracyPct={latestSession?.accuracyPct ?? 92.4}
          userMeanLatencyMs={latestSession?.avgLatencyMs ?? 28.0}
          userVoicingPct={latestSession?.voicingPct ?? 95.0}
          onBackToLanding={() => setActiveView('landing')}
          onOpenProgress={() => setActiveView('progress')}
          onPracticePiece={(songId) => {
            setSelectedSongId(songId)
            setPendingLoopDrill(null)
            setActiveView('practice')
          }}
          userButtonSlot={effectiveUserButtonSlot}
        />
      )}

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
                onClick={() => setActiveView('landing')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono font-semibold tracking-wide text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all"
              >
                ← Back to Home
              </button>
              <button
                type="button"
                onClick={() => setActiveView('practice')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono font-semibold tracking-wide bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all"
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
