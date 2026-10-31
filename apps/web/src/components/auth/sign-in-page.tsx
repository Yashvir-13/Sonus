import { useState } from 'react'
import { LandingPage } from '@/components/landing/landing-page'
import { SignInModal } from '@/components/auth/sign-in-modal'

export function SignInPage() {
  const [showSignInModal, setShowSignInModal] = useState(false)

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
          // If in offline dev mode, reloading or navigating can transition
        }}
      />
    </div>
  )
}
