import React from 'react'
import { motion, useReducedMotion } from 'motion/react'

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
