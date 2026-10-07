import type { ReactNode } from 'react'

export interface AuthShellProps {
  children: ReactNode
}

/**
 * AuthShell provides an immersive, full-screen container for authenticated users.
 * The legacy SaaS navbar has been removed so the continuous 2D spatial canvas
 * fills the entire viewport without coordinate clipping.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#F4F1EA] text-[#2C2A29] select-none">
      {children}
    </div>
  )
}
