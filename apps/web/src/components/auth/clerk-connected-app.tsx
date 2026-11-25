import React, { useMemo } from 'react'
import { useAuth, useUser, UserButton } from '@clerk/react'
import App from '@/app'
import { ClerkTokenBridge } from '@/lib/auth/clerk-token-bridge'

export class ClerkErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Clerk failed to initialize (DNS propagating or network issue):', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export function ClerkConnectedApp() {
  const { isLoaded, isSignedIn } = useAuth()
  const { isLoaded: isUserLoaded, user } = useUser()

  const clerkProfile = useMemo(() => {
    if (!isSignedIn || !user) return null
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress ??
      ''
    const name =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      ''
    const username = user.username || (email ? email.split('@')[0] : '') || ''
    return { name, username, email }
  }, [isSignedIn, user])

  return (
    <>
      <ClerkTokenBridge />
      <App
        isSignedIn={Boolean(isLoaded && isSignedIn)}
        defaultSignedIn={Boolean(isLoaded && isSignedIn)}
        clerkProfile={clerkProfile}
        isClerkProfileLoading={Boolean(isLoaded && isSignedIn && !isUserLoaded)}
        userButtonSlot={isLoaded && isSignedIn ? <UserButton /> : undefined}
      />
    </>
  )
}
