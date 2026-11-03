import { UserButton } from '@clerk/react'
import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
  hideHeader?: boolean
}

import { ThemeToggle } from '@/components/theme/theme-toggle'

export function AuthShell({ children, hideHeader = false }: AuthShellProps) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const hasValidClerkKey = Boolean(
    publishableKey &&
    publishableKey !== '<YOUR_CLERK_PUBLISHABLE_KEY>' &&
    import.meta.env.VITE_DEV_OFFLINE !== 'true'
  )

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {!hideHeader && (
        <header className="flex items-center justify-between border-b border-border/60 bg-card/50 px-6 py-3.5 backdrop-blur-md">
          <span className="font-brand text-base font-bold tracking-[0.05em] text-foreground">
            Sonus
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {hasValidClerkKey && <UserButton />}
          </div>
        </header>
      )}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
