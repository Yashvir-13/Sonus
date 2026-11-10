import { useState, useMemo } from 'react'
import { LandingPage } from '@/components/landing/landing-page'
import { SignInModal } from '@/components/auth/sign-in-modal'
import App, { type AppViewMode, parseRouteFromPath } from '@/app'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'

export function SignInPage() {
  const [showSignInModal, setShowSignInModal] = useState(false)

  // Direct path recognition for unauthenticated/guest sessions
  const route = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/') {
      return parseRouteFromPath(window.location.pathname, BUILTIN_FULL_SONGS)
    }
    return { view: 'landing' as AppViewMode }
  }, [])

  const [isGuestMode, setIsGuestMode] = useState(route.view !== 'landing')
  const [targetView, setTargetView] = useState<AppViewMode>(route.view)

  if (isGuestMode) {
    return <App defaultSignedIn={false} initialView={targetView} />
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <LandingPage
        onSignIn={() => setShowSignInModal(true)}
        onEnterStudio={() => {
          setTargetView('practice')
          setIsGuestMode(true)
        }}
        onOpenTheory={() => {
          setTargetView('theory')
          setIsGuestMode(true)
        }}
        onOpenTuner={() => {
          setTargetView('tuner')
          setIsGuestMode(true)
        }}
        onOpenProgress={() => {
          setTargetView('progress')
          setIsGuestMode(true)
        }}
        onOpenCommunity={() => {
          setTargetView('community')
          setIsGuestMode(true)
        }}
      />

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => {
          setShowSignInModal(false)
          setIsGuestMode(true)
        }}
      />
    </div>
  )
}

