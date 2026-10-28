import { ClerkProvider, Show } from '@clerk/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/dm-sans/300.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/geist-mono/400.css'
import * as Sentry from '@sentry/react'
import App from '@/app'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignInPage } from '@/components/auth/sign-in-page'
import '@/styles/index.css'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 1.0,
  })
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
import { ThemeToggle } from '@/components/theme/theme-toggle'

const isOfflineDev = !publishableKey || import.meta.env.VITE_DEV_OFFLINE === 'true'

function DevOfflineShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground transition-colors duration-200">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/70 bg-card/75 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9A2A2A]/10 border border-[#9A2A2A]/25 text-[#9A2A2A] font-brand font-bold text-sm shadow-2xs">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-brand text-base font-bold tracking-[0.05em] text-[#242321]">
                Sonus Studio
              </span>
              <span className="rounded-full bg-[#EFECE6] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#524D44] border border-[#D9D3C7]">
                Archival Conservatory
              </span>
            </div>
            <p className="text-[11px] text-[#736E65] hidden sm:block">
              Adaptive Musical Practice & Pedagogical Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-[#D9D3C7] bg-[#FCFBF8] px-3 py-1 text-xs text-[#736E65] font-mono md:flex shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#4A6B5B] animate-pulse" />
            <span>SQLite & Dev Token Active</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isOfflineDev ? (
      <DevOfflineShell>
        <App />
      </DevOfflineShell>
    ) : (
      <ClerkProvider publishableKey={publishableKey}>
        <Show when="signed-out">
          <SignInPage />
        </Show>
        <Show when="signed-in">
          <AuthShell>
            <App />
          </AuthShell>
        </Show>
      </ClerkProvider>
    )}
  </StrictMode>,
)
