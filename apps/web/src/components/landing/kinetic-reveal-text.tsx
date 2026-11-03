import React, { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

export type KineticRevealTextProps = {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  delay?: number
  stagger?: number
  italicLastWord?: boolean
}

export function KineticRevealText({
  text,
  as = 'h1',
  className = '',
  delay = 0.1,
  stagger = 0.04,
  italicLastWord = false,
}: KineticRevealTextProps): React.JSX.Element {
  const words = text.split(' ')
  const prefersReduced = useReducedMotion()

  const Component: React.ElementType = as

  return (
    <Component className={`inline-flex flex-wrap gap-x-2 gap-y-1 ${className}`}>
      {words.map((word, index) => {
        const isLast = index === words.length - 1 && italicLastWord

        return (
          <span key={`${word}-${index}`} className="relative inline-block overflow-hidden py-0.5">
            <motion.span
              className={`inline-block ${isLast ? 'italic text-[#C5A059]' : ''}`}
              initial={
                prefersReduced
                  ? { opacity: 0 }
                  : { y: '115%', opacity: 0, rotate: index % 2 === 0 ? -1.5 : 1.5 }
              }
              animate={
                prefersReduced
                  ? { opacity: 1 }
                  : { y: '0%', opacity: 1, rotate: 0 }
              }
              transition={{
                duration: 0.7,
                delay: delay + index * stagger,
                ease: [0.215, 0.61, 0.355, 1], // easeOutCubic
              }}
            >
              {word}
            </motion.span>
          </span>
        )
      })}
    </Component>
  )
}

export interface ExpandingWordmarkProps {
  className?: string
  text?: string
}

export function ExpandingWordmark({
  className = '',
  text = 'SONUS',
}: ExpandingWordmarkProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  // Track page scroll: 0% at page top, advancing through hero
  const { scrollYProgress } = useScroll()

  // Horizontal expansion: -0.03em to 0.22em tracking as scroll advances from 0% to 30%
  const letterSpacing = useTransform(scrollYProgress, [0, 0.3], ['-0.03em', '0.22em'])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.6], [1, 0.95, 0.4])

  return (
    <div
      ref={containerRef}
      data-testid="expanding-wordmark-container"
      className={`relative w-full flex items-center justify-center select-none overflow-hidden ${className}`}
    >
      <motion.span
        data-testid="expanding-wordmark"
        style={{
          letterSpacing: prefersReduced ? '0.05em' : letterSpacing,
          opacity: prefersReduced ? 1 : opacity,
        }}
        className="font-brand font-black text-6xl sm:text-8xl md:text-9xl text-[#242321] dark:text-[#EDE8DF] uppercase text-center will-change-[letter-spacing,opacity] py-2"
      >
        {text}
      </motion.span>
    </div>
  )
}
