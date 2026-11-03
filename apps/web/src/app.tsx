import { useState } from 'react'
import { UserButton } from '@clerk/react'
import { AudioTestBench } from '@/components/dev/audio-test-bench'
import { PracticeStudioCockpit } from '@/components/practice/practice-studio-cockpit'
import { LandingPage } from '@/components/landing/landing-page'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { AuthShell } from '@/components/auth/auth-shell'

export type AppProps = {
  initialView?: 'landing' | 'practice' | 'audio'
  userButtonSlot?: React.ReactNode
  defaultSignedIn?: boolean
}

export default function App({ initialView = 'landing', userButtonSlot, defaultSignedIn = false }: AppProps) {
  const [activeView, setActiveView] = useState<'landing' | 'practice' | 'audio'>(initialView)
  const [isSignedIn, setIsSignedIn] = useState(defaultSignedIn || Boolean(userButtonSlot))
  const [showSignInModal, setShowSignInModal] = useState(false)

  const effectiveUserButtonSlot = userButtonSlot || (isSignedIn ? <UserButton /> : undefined)

  return (
    <AuthShell hideHeader={activeView === 'landing' || activeView === 'practice'}>
      {activeView === 'landing' && (
        <>
          <LandingPage
            onEnterStudio={() => {
              if (isSignedIn) {
                setActiveView('practice')
              } else {
                setShowSignInModal(true)
              }
            }}
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
          onBackToDesk={() => setActiveView('landing')}
          userButtonSlot={effectiveUserButtonSlot}
        />
      )}

      {activeView === 'audio' && (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 font-serif">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[#E2DDD3] bg-[#FAF8F3] dark:border-[#38342E] dark:bg-[#1E1C1A] p-6 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-[0.15em] uppercase text-[#9A2A2A] dark:text-[#D9534F]">
                  SONUS
                </span>
                <span className="text-[#A09A8F] dark:text-[#6E675C]">•</span>
                <span className="text-xs text-[#736E65] dark:text-[#A39C8F] font-sans">Acoustic Testing Bench</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#242321] dark:text-[#EDE8DF] sm:text-3xl">
                Acoustic &amp; FFT Bench
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView('landing')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide text-[#736E65] hover:bg-[#EFECE6] hover:text-[#242321] dark:text-[#A39C8F] dark:hover:bg-[#2A2723] dark:hover:text-[#EDE8DF] transition-all"
              >
                ← Back to Desk
              </button>
              <button
                type="button"
                onClick={() => setActiveView('practice')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] transition-all"
              >
                Open Studio Cockpit →
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

