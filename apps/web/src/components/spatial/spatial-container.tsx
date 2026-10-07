import { motion, useReducedMotion } from 'framer-motion'
import { type ReactNode } from 'react'
import { SPATIAL_MOTION_CONFIG, MUSICAL_GLYPHS } from '@/design-system/tokens'
import { useSpatialNavigation } from './spatial-context'

export interface SpatialContainerProps {
  children?: ReactNode
  practiceScreen?: ReactNode
  profileScreen?: ReactNode
  historyScreen?: ReactNode
  tuningScreen?: ReactNode
  className?: string
}

function DefaultProfilePlaceholder({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#F4F1EA] text-[#2C2A29]">
      <div className="max-w-2xl w-full border border-[#2C2A29] p-8 text-center bg-[#F4F1EA] shadow-none">
        <div className="font-mono text-xs text-[#7E7570] tracking-widest uppercase mb-2">
          Folio II · Rehearsal Physiognomy
        </div>
        <div className="font-serif text-5xl mb-3 text-[#2C2A29]">
          {MUSICAL_GLYPHS.gClef}
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">
          Composer & Performer Persona
        </h2>
        <p className="font-serif italic text-sm text-[#7E7570] max-w-md mx-auto mb-6">
          "The true measure of a virtuoso is carved not in applause, but in the disciplined ledger of deliberate practice."
        </p>

        <div className="grid grid-cols-3 gap-4 border-t border-b border-[#2C2A29]/30 py-4 my-6 text-left">
          <div className="border-r border-[#2C2A29]/20 pr-4">
            <div className="font-mono text-[10px] text-[#7E7570] uppercase tracking-wider">Practice Ledger</div>
            <div className="font-mono text-xl font-bold mt-1 text-[#2C2A29]">142.5 hrs</div>
          </div>
          <div className="border-r border-[#2C2A29]/20 pr-4">
            <div className="font-mono text-[10px] text-[#7E7570] uppercase tracking-wider">Articulations</div>
            <div className="font-mono text-xl font-bold mt-1 text-[#2C2A29]">48,920</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#7E7570] uppercase tracking-wider">Intonation Purity</div>
            <div className="font-mono text-xl font-bold mt-1 text-[#9A2A2A]">96.4%</div>
          </div>
        </div>

        <button
          onClick={onReturn}
          className="inline-flex items-center gap-2 border border-[#2C2A29] px-6 py-2.5 font-serif text-sm hover:border-[#9A2A2A] hover:bg-[#E9E4DA] hover:text-[#9A2A2A] transition-colors shadow-none"
        >
          <span>↓</span>
          <span className="font-mono">{MUSICAL_GLYPHS.fermata}</span>
          <span>Return to Practice Stand</span>
        </button>
      </div>
    </div>
  )
}

function DefaultHistoryPlaceholder({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#F4F1EA] text-[#2C2A29]">
      <div className="max-w-2xl w-full border border-[#2C2A29] p-8 text-center bg-[#F4F1EA] shadow-none">
        <div className="font-mono text-xs text-[#7E7570] tracking-widest uppercase mb-2">
          Folio III · Constellation Star Map
        </div>
        <div className="font-serif text-5xl mb-3 text-[#2C2A29]">
          {MUSICAL_GLYPHS.coda}
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">
          Constellation Practice History
        </h2>
        <p className="font-serif italic text-sm text-[#7E7570] max-w-md mx-auto mb-6">
          "Each rehearsal take is plotted as a celestial node across tempo tempo velocity and pitch purity."
        </p>

        <div className="border border-dashed border-[#2C2A29]/40 p-6 my-6 bg-[#E9E4DA]/40">
          <div className="font-mono text-xs text-[#7E7570] tracking-wider mb-2">
            CELESTIAL SCATTER PLOT // 60-160 BPM × 60-100% ACCURACY
          </div>
          <div className="flex justify-center items-center gap-6 py-4 text-2xl">
            <span className="text-[#9A2A2A] font-bold">{MUSICAL_GLYPHS.starNode}</span>
            <span className="text-[#2C2A29]">{MUSICAL_GLYPHS.starHollow}</span>
            <span className="text-[#C8A858] font-bold">{MUSICAL_GLYPHS.starNode}</span>
            <span className="text-[#2C2A29]">{MUSICAL_GLYPHS.starHollow}</span>
            <span className="text-[#9A2A2A]">{MUSICAL_GLYPHS.starNode}</span>
          </div>
          <div className="font-mono text-[10px] text-[#7E7570]">
            48 TAKES RECORDED IN ARCHIVE
          </div>
        </div>

        <button
          onClick={onReturn}
          className="inline-flex items-center gap-2 border border-[#2C2A29] px-6 py-2.5 font-serif text-sm hover:border-[#9A2A2A] hover:bg-[#E9E4DA] hover:text-[#9A2A2A] transition-colors shadow-none"
        >
          <span className="font-mono">{MUSICAL_GLYPHS.fermata}</span>
          <span>Return to Practice Stand →</span>
        </button>
      </div>
    </div>
  )
}

function DefaultTuningPlaceholder({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#F4F1EA] text-[#2C2A29]">
      <div className="max-w-2xl w-full border border-[#2C2A29] p-8 text-center bg-[#F4F1EA] shadow-none">
        <div className="font-mono text-xs text-[#7E7570] tracking-widest uppercase mb-2">
          Folio IV · Sacred Astrolabe
        </div>
        <div className="font-serif text-5xl mb-3 text-[#2C2A29]">
          {MUSICAL_GLYPHS.natural}
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">
          Setup & Tuning Ritual
        </h2>
        <p className="font-serif italic text-sm text-[#7E7570] max-w-md mx-auto mb-6">
          "Harmonia est discordia concors — bring the physical instrument to balance with the cosmic standard."
        </p>

        <div className="border border-[#2C2A29] p-6 my-6 bg-[#E9E4DA]/40">
          <div className="font-mono text-xs text-[#7E7570] uppercase tracking-wider mb-2">
            PITCH STANDARD // A4 = 440.0 HZ (VERDI / CONCERT)
          </div>
          <div className="flex justify-center items-center gap-8 py-3">
            <div className="font-mono text-sm border border-[#2C2A29] px-3 py-1 bg-[#F4F1EA]">
              MIC: READY
            </div>
            <div className="font-mono text-sm border border-[#2C2A29] px-3 py-1 bg-[#F4F1EA]">
              MIDI: STANDBY
            </div>
          </div>
          <div className="font-mono text-xs text-[#9A2A2A] font-bold mt-2">
            INTONATION NEEDLE: ±0.0 CENTS [EQUILIBRIUM]
          </div>
        </div>

        <button
          onClick={onReturn}
          className="inline-flex items-center gap-2 border border-[#2C2A29] px-6 py-2.5 font-serif text-sm hover:border-[#9A2A2A] hover:bg-[#E9E4DA] hover:text-[#9A2A2A] transition-colors shadow-none"
        >
          <span>←</span>
          <span className="font-mono">{MUSICAL_GLYPHS.fermata}</span>
          <span>Return to Practice Stand</span>
        </button>
      </div>
    </div>
  )
}

export function SpatialContainer({
  children,
  practiceScreen,
  profileScreen,
  historyScreen,
  tuningScreen,
  className = '',
}: SpatialContainerProps) {
  const { currentTarget, panTo, setIsPanning } = useSpatialNavigation()
  const shouldReduceMotion = useReducedMotion()

  // Coordinate multipliers from tokens
  const coords = SPATIAL_MOTION_CONFIG.coordinates[currentTarget]
  const targetX = `${coords.x * 100}vw`
  const targetY = `${coords.y * 100}vh`

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        type: 'spring' as const,
        stiffness: SPATIAL_MOTION_CONFIG.spring.stiffness,
        damping: SPATIAL_MOTION_CONFIG.spring.damping,
        mass: SPATIAL_MOTION_CONFIG.spring.mass,
        restDelta: 0.001,
      }

  const handleReturn = () => {
    panTo('practice')
  }

  return (
    <div
      className={`spatial-viewport relative w-screen h-screen overflow-hidden select-none bg-[#F4F1EA] text-[#2C2A29] ${className}`}
      data-current-target={currentTarget}
    >
      {/* 2D Moving World Canvas */}
      <motion.div
        className="spatial-world-canvas absolute inset-0 w-full h-full will-change-transform"
        animate={{ x: targetX, y: targetY }}
        transition={springTransition}
        onAnimationStart={() => setIsPanning(true)}
        onAnimationComplete={() => setIsPanning(false)}
      >
        {/* If custom children are provided, render them directly in the world canvas */}
        {children}

        {/* If discrete screen slots are passed or rendered alongside */}
        {!children && (
          <>
            {/* Center (0, 0): Practice Stand */}
            <div
              id="viewport-practice"
              className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden"
              style={{ left: '0vw', top: '0vh' }}
              aria-hidden={currentTarget !== 'practice'}
              inert={currentTarget !== 'practice' ? true : undefined}
              data-screen="practice"
            >
              {practiceScreen}
            </div>

            {/* Up (0, -1): Composer Profile Folio */}
            <div
              id="viewport-profile"
              className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden"
              style={{ left: '0vw', top: '-100vh' }}
              aria-hidden={currentTarget !== 'profile'}
              inert={currentTarget !== 'profile' ? true : undefined}
              data-screen="profile"
            >
              {profileScreen ?? <DefaultProfilePlaceholder onReturn={handleReturn} />}
            </div>

            {/* Left (-1, 0): Constellation History */}
            <div
              id="viewport-history"
              className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden"
              style={{ left: '-100vw', top: '0vh' }}
              aria-hidden={currentTarget !== 'history'}
              inert={currentTarget !== 'history' ? true : undefined}
              data-screen="history"
            >
              {historyScreen ?? <DefaultHistoryPlaceholder onReturn={handleReturn} />}
            </div>

            {/* Right (+1, 0): Setup / Tuning Ritual */}
            <div
              id="viewport-tuning"
              className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden"
              style={{ left: '100vw', top: '0vh' }}
              aria-hidden={currentTarget !== 'tuning'}
              inert={currentTarget !== 'tuning' ? true : undefined}
              data-screen="tuning"
            >
              {tuningScreen ?? <DefaultTuningPlaceholder onReturn={handleReturn} />}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
