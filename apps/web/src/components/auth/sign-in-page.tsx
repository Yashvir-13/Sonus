import { useState } from 'react'
import { LandingPage } from '@/components/landing/landing-page'
import { SignInModal } from '@/components/auth/sign-in-modal'
import App from '@/app'

export function SignInPage() {
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [targetView, setTargetView] = useState<'practice' | 'progress' | 'community'>('practice')

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
