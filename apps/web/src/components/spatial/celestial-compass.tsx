import { useSpatialNavigation, type SpatialTarget } from './spatial-context'
import { MUSICAL_GLYPHS } from '@/design-system/tokens'

interface TargetMetadata {
  label: string
  glyph: string
  keyHint: string
  coord: string
  screenTitle: string
}

const TARGET_META: Record<SpatialTarget, TargetMetadata> = {
  practice: {
    label: 'Practice',
    glyph: MUSICAL_GLYPHS.natural,
    keyHint: 'ESC',
    coord: '(0, 0)',
    screenTitle: 'Practice Stand',
  },
  profile: {
    label: 'Profile',
    glyph: MUSICAL_GLYPHS.gClef,
    keyHint: 'W',
    coord: '(0, -1)',
    screenTitle: "Musician Profile",
  },
  history: {
    label: 'History',
    glyph: MUSICAL_GLYPHS.coda,
    keyHint: 'A',
    coord: '(-1, 0)',
    screenTitle: 'Practice History',
  },
  tuning: {
    label: 'Tuning',
    glyph: MUSICAL_GLYPHS.fermata,
    keyHint: 'D',
    coord: '(1, 0)',
    screenTitle: 'Device Setup',
  },
}

export function CelestialCompass() {
  const { currentTarget, panTo, isPanning } = useSpatialNavigation()

  return (
    <aside
      className="pointer-events-auto fixed bottom-5 right-6 z-40 flex flex-col items-center border border-[#2C2A29] bg-[#F4F1EA] p-2.5 select-none shadow-none"
      aria-label="Compass Navigation"
    >
      <div className="flex items-center justify-between w-full border-b border-[#2C2A29]/30 pb-1 mb-1.5 font-mono text-[9px] uppercase tracking-widest text-[#7E7570]">
        <span>Spatial</span>
        <span>Navigation</span>
      </div>

      <div className="grid grid-cols-3 grid-rows-2 items-center gap-1 w-28">
        <div className="col-start-2 row-start-1 flex justify-center">
          <button
            onClick={() => panTo('profile')}
            data-testid="compass-profile"
            title={`${TARGET_META.profile.screenTitle} [${TARGET_META.profile.keyHint}]`}
            className={`h-7 w-7 border text-xs font-serif transition-colors duration-150 flex items-center justify-center shadow-none ${
              currentTarget === 'profile'
                ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                : 'border-[#2C2A29] bg-[#E9E4DA] text-[#2C2A29] hover:bg-[#F4F1EA] hover:border-[#9A2A2A]'
            }`}
          >
            <span className="font-mono text-sm">{TARGET_META.profile.glyph}</span>
          </button>
        </div>

        <div className="col-start-1 row-start-2 flex justify-center">
          <button
            onClick={() => panTo('history')}
            data-testid="compass-history"
            title={`${TARGET_META.history.screenTitle} [${TARGET_META.history.keyHint}]`}
            className={`h-7 w-7 border text-xs font-serif transition-colors duration-150 flex items-center justify-center shadow-none ${
              currentTarget === 'history'
                ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                : 'border-[#2C2A29] bg-[#E9E4DA] text-[#2C2A29] hover:bg-[#F4F1EA] hover:border-[#9A2A2A]'
            }`}
          >
            <span className="font-mono text-sm">{TARGET_META.history.glyph}</span>
          </button>
        </div>

        <div className="col-start-2 row-start-2 flex justify-center">
          <button
            onClick={() => panTo('practice')}
            data-testid="compass-practice"
            title={`${TARGET_META.practice.screenTitle} [${TARGET_META.practice.keyHint}]`}
            className={`h-7 w-7 border text-xs font-serif transition-colors duration-150 flex items-center justify-center shadow-none ${
              currentTarget === 'practice'
                ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                : 'border-[#2C2A29] bg-[#E9E4DA] text-[#2C2A29] hover:bg-[#F4F1EA] hover:border-[#9A2A2A]'
            }`}
          >
            <span className="font-mono text-sm">{TARGET_META.practice.glyph}</span>
          </button>
        </div>

        <div className="col-start-3 row-start-2 flex justify-center">
          <button
            onClick={() => panTo('tuning')}
            data-testid="compass-tuning"
            title={`${TARGET_META.tuning.screenTitle} [${TARGET_META.tuning.keyHint}]`}
            className={`h-7 w-7 border text-xs font-serif transition-colors duration-150 flex items-center justify-center shadow-none ${
              currentTarget === 'tuning'
                ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                : 'border-[#2C2A29] bg-[#E9E4DA] text-[#2C2A29] hover:bg-[#F4F1EA] hover:border-[#9A2A2A]'
            }`}
          >
            <span className="font-mono text-sm">{TARGET_META.tuning.glyph}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-[#2C2A29]/30 pt-1.5 mt-1.5 font-mono text-[9px] tracking-widest text-[#7E7570]">
        <span className="font-semibold uppercase text-[#2C2A29]">
          {TARGET_META[currentTarget].label}
        </span>
        <span>•</span>
        <span>{TARGET_META[currentTarget].coord}</span>
        {isPanning && (
          <span className="text-[#9A2A2A] font-bold animate-pulse">PAN</span>
        )}
      </div>
    </aside>
  )
}
