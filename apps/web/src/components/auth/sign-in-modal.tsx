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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative rounded-2xl bg-[#FAF8F3] dark:bg-[#1C1A18] border border-[#E2DDD3] dark:border-[#38342E] p-6 sm:p-8 shadow-2xl max-w-md w-full text-[#242321] dark:text-[#EDE8DF]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-xs font-mono font-bold text-[#736E65] hover:text-[#242321] dark:text-[#A39C8F] dark:hover:text-[#EDE8DF] border border-[#E2DDD3] dark:border-[#38342E] hover:bg-[#EFECE6] dark:hover:bg-[#2A2723] transition-colors"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {hasClerkKey ? (
          <div className="pt-2 flex justify-center">
            <SignIn />
          </div>
        ) : (
          <div className="space-y-6 text-center">
            {/* Brand Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#C5A059] font-serif font-black text-2xl shadow-sm">
                §
              </div>
              <h3 className="font-serif text-2xl font-bold tracking-tight text-[#242321] dark:text-[#EDE8DF]">
                Sign in to Sonus
              </h3>
              <p className="text-xs text-[#736E65] dark:text-[#A39C8F] font-sans max-w-xs leading-relaxed">
                Welcome back. Continue to your practice studio, saved chord progressions, and habit tracking.
              </p>
            </div>

            {/* Quick Demo Sign-In Action */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onSuccess) onSuccess()
                  onClose()
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#242321] text-[#FAF8F3] dark:bg-[#C5A059] dark:text-[#141312] py-3 px-4 text-xs font-sans font-semibold tracking-wide hover:bg-[#3D3A36] dark:hover:bg-[#DFC07A] transition-all shadow-md"
              >
                <span>Continue as Demo Musician</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-[#E2DDD3] dark:border-[#38342E] py-2.5 px-4 text-xs font-sans text-[#736E65] dark:text-[#A39C8F] hover:bg-[#EFECE6] dark:hover:bg-[#2A2723] transition-colors"
              >
                Explore Repertoire First
              </button>
            </div>

            {/* Config Notice for Live Clerk Key */}
            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-3 text-[11px] font-mono text-[#736E65] dark:text-[#A39C8F] text-left">
              <span className="font-bold text-[#C5A059] block mb-0.5">Clerk Auth Status:</span>
              To connect your live Clerk instance, set <code className="text-[#C5A059]">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="text-[#C5A059]">apps/web/.env</code>.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
