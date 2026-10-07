import { useUser, useAuth } from '@clerk/react'

function CornerOrnament({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const baseClasses = "absolute w-4 h-4 border-[#2C2A29]/40"
  switch (position) {
    case 'tl': return <div className={`${baseClasses} top-0 left-0 border-t border-l`} />
    case 'tr': return <div className={`${baseClasses} top-0 right-0 border-t border-r`} />
    case 'bl': return <div className={`${baseClasses} bottom-0 left-0 border-b border-l`} />
    case 'br': return <div className={`${baseClasses} bottom-0 right-0 border-b border-r`} />
  }
}

const MUSICAL_GLYPHS = {
  gClef: '',
  fClef: '',
  cClef: '',
  fermata: '',
}

interface ComposerProfileProps {
  panTo?: (target: 'history' | 'tuning' | 'profile' | 'practice') => void
  isGuest?: boolean
  onExitGuest?: () => void
}

export function ComposerProfileScreen({
  panTo = () => {},
  isGuest = false,
  onExitGuest,
}: ComposerProfileProps) {
  const { user } = useUser()
  const { signOut } = useAuth()

  const handleSignOutOrExit = () => {
    if (isGuest && onExitGuest) {
      onExitGuest()
    } else {
      signOut()
    }
  }

  // Use Clerk user data if available, fallback to Guest
  const displayName = isGuest ? 'Guest Musician' : (user?.fullName || user?.firstName || 'Musician')
  const userIdentifier = isGuest ? 'A440-GUEST' : (user?.id?.slice(-8) || '00000000')

  // Empty data since mock data is removed
  const filteredRepertoire: any[] = []
  const dominantHabits: string[] = []

  return (
    <div className="w-full h-full bg-[#FAF7F0] overflow-y-auto custom-scrollbar p-8 md:p-12 lg:p-16 flex justify-center">
      <div className="max-w-5xl w-full flex flex-col min-h-full">
        
        {/* 1. Header: The Composer's Plate */}
        <header className="mb-16 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-[#2C2A29] pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[#9A2A2A] text-xl">{MUSICAL_GLYPHS.gClef}</span>
                <span className="font-mono text-xs text-[#7E7570] tracking-[0.2em] uppercase">
                  Dossier
                </span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#2C2A29] tracking-tight">
                {displayName}
              </h1>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="flex items-center gap-3 bg-[#E9E4DA]/50 px-3 py-1.5 border border-[#2C2A29]/10">
                <div className="w-1 h-1 bg-[#2C2A29]/50 rounded-full" />
                <span className="font-mono text-[10px] text-[#2C2A29] tracking-wider uppercase">
                  ID: {userIdentifier}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase border px-1.5 py-0.5 ${isGuest ? 'border-[#7E7570] text-[#7E7570]' : 'border-[#9A2A2A] text-[#9A2A2A]'}`}
                >
                  {isGuest ? 'Guest' : 'Verified'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 2. Primary Story: Repertoire & Tendencies */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 mb-12">
          
          {/* Left Column - Repertoire List */}
          <section className="flex-[1.5] min-w-[300px] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-[#2C2A29]/20 pb-2 gap-4">
              <h2 className="font-serif text-2xl font-bold text-[#2C2A29] flex items-center gap-2">
                <span className="text-[#2C2A29]/60">{MUSICAL_GLYPHS.fClef}</span>
                Active Repertoire
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              {filteredRepertoire.length === 0 ? (
                <div className="text-[#7E7570] font-serif italic py-8 text-center border border-dashed border-[#2C2A29]/20">
                  No repertoire data available. Practice a piece to begin tracking.
                </div>
              ) : null}
            </div>
          </section>

          {/* Right Column - Recurring Tendencies */}
          <section className="flex-1 min-w-[300px]">
            <div className="bg-[#E9E4DA]/40 p-6 relative border border-[#2C2A29]/10 h-full">
              <CornerOrnament position="tl" />
              <CornerOrnament position="br" />

              <h2 className="font-serif text-2xl font-bold text-[#2C2A29] mb-6 flex items-center gap-2">
                <span className="text-[#2C2A29]/60">{MUSICAL_GLYPHS.cClef}</span>
                Technical Tendencies
              </h2>

              <ul className="space-y-6">
                {dominantHabits.length === 0 ? (
                  <li className="text-[#7E7570] font-serif italic">
                    Insufficient data to analyze habits.
                  </li>
                ) : null}
              </ul>
            </div>
          </section>
        </div>

        {/* 3. Secondary Story: Aggregate Statistics */}
        <footer className="border-t border-[#2C2A29]/20 pt-8 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            
            {/* Stats strip */}
            <div className="flex flex-wrap gap-8 md:gap-12 font-mono text-xs text-[#2C2A29]">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#7E7570] tracking-widest uppercase mb-1">Total Discipline</span>
                <span className="text-xl font-bold">0 <span className="text-sm font-normal">hrs</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#7E7570] tracking-widest uppercase mb-1">Active Streak</span>
                <span className="text-xl font-bold">0 <span className="text-sm font-normal">days</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#7E7570] tracking-widest uppercase mb-1">Intonation</span>
                <span className="text-xl font-bold">0%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#7E7570] tracking-widest uppercase mb-1">Timing Variance</span>
                <span className="text-xl font-bold">0ms</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => panTo('tuning')}
                className="font-mono text-xs text-[#2C2A29] hover:text-[#9A2A2A] hover:underline underline-offset-4 transition-colors"
              >
                [Calibrate Instrument]
              </button>

              <button
                onClick={handleSignOutOrExit}
                className="font-mono text-xs text-[#9A2A2A] hover:text-[#7A1D1D] hover:underline underline-offset-4 transition-colors"
              >
                [{isGuest ? 'Exit Guest Mode' : 'Sign Out'}]
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default ComposerProfileScreen
