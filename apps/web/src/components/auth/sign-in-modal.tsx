import React from 'react'
import { SignIn } from '@clerk/react'

export type SignInModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SignInModal({
  isOpen,
  onClose,
  onSuccess,
}: SignInModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const hasClerkKey = Boolean(publishableKey && publishableKey !== '<YOUR_CLERK_PUBLISHABLE_KEY>')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to Sonus"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative rounded-xl bg-[#111114] border border-zinc-800 p-6 sm:p-8 shadow-2xl max-w-md w-full text-zinc-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg px-2 py-1 text-xs font-mono font-bold text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:bg-zinc-900 transition-colors"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {hasClerkKey ? (
          <div className="pt-2 flex flex-col items-center">
            <SignIn />
            <div className="mt-4 pt-3 border-t border-zinc-800 w-full text-center">
              <button
                type="button"
                onClick={() => {
                  if (onSuccess) onSuccess()
                  onClose()
                }}
                className="text-xs text-zinc-400 hover:text-amber-400 font-mono underline underline-offset-4 cursor-pointer transition-colors"
              >
                Or enter practice studio in guest acoustic mode →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500/15 border border-amber-500/40 text-amber-500 font-mono font-bold text-sm">
                  §
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  SONUS WORKSTATION AUTH
                </span>
              </div>
              <h3 className="font-sans text-xl font-bold tracking-tight text-zinc-100 pt-1">
                Sign in to Sonus
              </h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Launch the acoustic practice workstation, inspect measure-level timing and voicing errors, and run closed-loop habit drills.
              </p>
            </div>

            {/* Quick Demo Sign-In Action */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (onSuccess) onSuccess()
                  onClose()
                }}
                className="w-full flex items-center justify-between rounded-lg bg-amber-500 text-zinc-950 py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer"
              >
                <span>Continue as Demo Musician</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-zinc-800 bg-[#09090B] py-2.5 px-4 text-xs font-mono text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Explore Repertoire First
              </button>
            </div>

            {/* Config Notice for Live Clerk Key */}
            <div className="rounded-lg border border-zinc-800/80 bg-[#09090B] p-3 text-[11px] font-mono text-zinc-500 text-left">
              <span className="font-bold text-amber-500 block mb-0.5">Local Session Mode</span>
              Set <code className="text-zinc-300">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="text-zinc-300">apps/web/.env</code> to sync longitudinal habit records with Clerk JWT identity.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
