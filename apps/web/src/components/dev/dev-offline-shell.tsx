import React from 'react'

export function DevOfflineShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground transition-colors duration-200">
      {children}
    </div>
  )
}
