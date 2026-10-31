import React from 'react'
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react'

/**
 * 5-Line Musical Staff Scroll Progress Indicator.
 * Fixed at the very top of the viewport. Five delicate staff lines
 * carry a moving burnished brass G-clef indicator that glides
 * proportionally with viewport scroll progress.
 */
export function StaffScrollProgress(): React.JSX.Element {
  const { scrollYProgress } = useScroll()
  const prefersReduced = useReducedMotion()

  // Smooth spring physics for fluid clef motion
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: prefersReduced ? 1000 : 200,
    damping: prefersReduced ? 100 : 25,
    restDelta: 0.001,
  })

  // Clef horizontal translation smoothly tracking scroll progress across 100% width
  const clefLeft = useTransform(
    smoothProgress,
    (v) => `calc(${Math.min(Math.max(v, 0), 1) * 100}% - ${Math.min(Math.max(v, 0), 1) * 24}px)`
  )
  const clefOpacity = useTransform(smoothProgress, [0, 0.02, 0.98, 1], [0.3, 1, 1, 0.8])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-40 h-5 bg-[#FAF8F3]/80 dark:bg-[#141312]/80 backdrop-blur-xs border-b border-[#E2DDD3]/60 dark:border-[#38342E]/60 select-none overflow-hidden"
    >
      {/* 5 Engraved Staff Lines */}
      <div className="relative w-full h-full flex flex-col justify-between py-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-full h-[1px] bg-[#E2DDD3] dark:bg-[#2A2723]"
          />
        ))}

        {/* Golden Progress Fill along Staff Line 3 (B4) */}
        <motion.div
          className="absolute left-0 top-[9px] h-[1.5px] bg-gradient-to-r from-[#C5A059]/40 via-[#C5A059] to-[#DFC07A]"
          style={{ width: useTransform(smoothProgress, (v) => `${v * 100}%`) }}
        />

        {/* Gliding G-Clef / Caliper Ornament */}
        <motion.div
          style={{
            left: clefLeft,
            opacity: clefOpacity,
          }}
          className="absolute -top-[1px] flex items-center justify-center text-[#C5A059] drop-shadow-[0_0_4px_rgba(197,160,89,0.4)] will-change-[left,opacity]"
        >
          <svg width="18" height="22" viewBox="0 0 22 42" fill="none">
            <path
              d="M12 3C11 1 8 1 7 4C6 7 8 11 10 14C12 17 14 20 14 25C14 29 11 32 7 31C4 30 3 26 4 23C5 20 8 20 9 22C10 24 9 26 7 26C8 28 11 28 12 26C13 23 11 20 9 17C7 14 4 10 5 6C6 2 10 0 13 2C15 4 15 7 13 12L11 38C11 40 9 41 8 40C7 39 7 38 8 37L10 28"
              stroke="#C5A059"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  )
}
