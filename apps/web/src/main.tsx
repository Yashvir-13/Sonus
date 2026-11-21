import React, { StrictMode } from 'react'
import { ClerkProvider, useAuth, UserButton } from '@clerk/react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/dm-sans/300.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import * as Sentry from '@sentry/react'
import App from '@/app'
import { DevOfflineShell } from '@/components/dev/dev-offline-shell'
import { ClerkTokenBridge } from '@/lib/auth/clerk-token-bridge'
import '@/styles/index.css'

class ClerkErrorBoundary extends React.Component<
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

function ClerkConnectedApp() {
  const { isLoaded, isSignedIn } = useAuth()

  return (
    <>
      <ClerkTokenBridge />
      <App
        defaultSignedIn={Boolean(isLoaded && isSignedIn)}
        userButtonSlot={isLoaded && isSignedIn ? <UserButton /> : undefined}
      />
    </>
  )
}

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 1.0,
  })
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const hasValidClerkKey = Boolean(
  publishableKey &&
  publishableKey !== '<YOUR_CLERK_PUBLISHABLE_KEY>' &&
  import.meta.env.VITE_DEV_OFFLINE !== 'true'
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {!hasValidClerkKey ? (
      <DevOfflineShell>
        <App defaultSignedIn={false} />
      </DevOfflineShell>
    ) : (
      <ClerkErrorBoundary fallback={<App defaultSignedIn={false} />}>
        <ClerkProvider publishableKey={publishableKey}>
          <ClerkConnectedApp />
        </ClerkProvider>
      </ClerkErrorBoundary>
    )}
  </StrictMode>,
)
