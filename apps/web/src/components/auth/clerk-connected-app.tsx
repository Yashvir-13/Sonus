import React from 'react'
import { useAuth, UserButton } from '@clerk/react'
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

  return (
    <>
      <ClerkTokenBridge />
      <App
        isSignedIn={Boolean(isLoaded && isSignedIn)}
        defaultSignedIn={Boolean(isLoaded && isSignedIn)}
        userButtonSlot={isLoaded && isSignedIn ? <UserButton /> : undefined}
      />
    </>
  )
}
