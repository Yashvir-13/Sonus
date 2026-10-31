import { ClerkProvider, Show, UserButton } from '@clerk/react'
import { StrictMode } from 'react'
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
import { AuthShell } from '@/components/auth/auth-shell'
import { SignInPage } from '@/components/auth/sign-in-page'
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
      <ClerkProvider publishableKey={publishableKey}>
        <Show when="signed-out">
          <SignInPage />
        </Show>
        <Show when="signed-in">
          <AuthShell>
            <App defaultSignedIn={true} userButtonSlot={<UserButton />} />
          </AuthShell>
        </Show>
      </ClerkProvider>
    )}
  </StrictMode>,
)
