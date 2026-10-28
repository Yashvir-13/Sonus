import { UserButton } from '@clerk/react'
import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
}

import { ThemeToggle } from '@/components/theme/theme-toggle'

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/60 bg-card/50 px-6 py-3.5 backdrop-blur-md">
        <span className="font-brand text-base font-bold tracking-[0.05em] text-foreground">
          Sonus
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
