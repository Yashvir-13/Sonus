import { StrictMode } from 'react'
import { ClerkProvider } from '@clerk/react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/dm-sans/300.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/geist-mono/400.css'
import * as Sentry from '@sentry/react'
import App from '@/app'
import { ClerkConnectedApp, ClerkErrorBoundary } from '@/components/auth/clerk-connected-app'
import { DevOfflineShell } from '@/components/dev/dev-offline-shell'
import '@/styles/index.css'

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
