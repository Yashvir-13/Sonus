import { useState } from 'react'
import { LandingPage } from '@/components/landing/landing-page'
import { SignInModal } from '@/components/auth/sign-in-modal'
import App from '@/app'

export function SignInPage() {
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)

  if (isGuestMode) {
    return <App defaultSignedIn={false} initialView="practice" />
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <LandingPage
        onSignIn={() => setShowSignInModal(true)}
        onEnterStudio={() => setShowSignInModal(true)}
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
