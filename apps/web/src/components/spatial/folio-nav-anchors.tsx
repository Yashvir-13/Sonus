import { useSpatialNavigation } from './spatial-context'
import { MUSICAL_GLYPHS } from '@/design-system/tokens'

export function FolioNavAnchors() {
  const { currentTarget, panTo } = useSpatialNavigation()

  return (
    <nav
      className="pointer-events-none fixed inset-0 z-30 select-none"
      aria-label="Navigation Anchors"
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex justify-center">
        {currentTarget === 'practice' && (
          <button
            onClick={() => panTo('profile')}
            data-testid="nav-profile"
            className="pointer-events-auto group flex flex-col items-center border border-[#2C2A29] bg-[#F4F1EA] px-5 py-1.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A] shadow-none"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span className="font-mono text-base">{MUSICAL_GLYPHS.gClef}</span>
              <span>Profile</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Go to Profile [W]
            </span>
          </button>
        )}

        {currentTarget === 'profile' && (
          <button
            onClick={() => panTo('practice')}
            className="pointer-events-auto group flex flex-col items-center border border-[#2C2A29] bg-[#F4F1EA] px-6 py-2 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A] shadow-none"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span className="font-mono text-base">{MUSICAL_GLYPHS.fermata}</span>
              <span>Practice Stand</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Return to Practice [Esc / S]
            </span>
          </button>
        )}
      </div>

      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
        {currentTarget === 'practice' && (
          <button
            onClick={() => panTo('history')}
            data-testid="nav-history"
            className="pointer-events-auto group flex flex-col items-start border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A] shadow-none"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span className="font-mono text-base">{MUSICAL_GLYPHS.coda}</span>
              <span>History</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Go to History [A]
            </span>
          </button>
        )}

        {currentTarget === 'tuning' && (
          <button
            onClick={() => panTo('practice')}
            className="pointer-events-auto group flex flex-col items-start border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A] shadow-none"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span className="font-mono text-base">{MUSICAL_GLYPHS.fermata}</span>
              <span>Practice Stand</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Return to Practice [Esc / A]
            </span>
          </button>
        )}
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
        {currentTarget === 'practice' && (
          <button
            onClick={() => panTo('tuning')}
            data-testid="nav-tuning"
            className="pointer-events-auto group flex flex-col items-end border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A] shadow-none"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span>Device Setup</span>
              <span className="font-mono text-base">{MUSICAL_GLYPHS.natural}</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Go to Device Setup [D]
            </span>
          </button>
        )}

        {currentTarget === 'history' && (
          <button
            onClick={() => panTo('practice')}
            className="pointer-events-auto group flex flex-col items-end border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A] shadow-none"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span>Practice Stand</span>
              <span className="font-mono text-base">{MUSICAL_GLYPHS.fermata}</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Return to Practice [Esc / D]
            </span>
          </button>
        )}
      </div>
    </nav>
  )
}
