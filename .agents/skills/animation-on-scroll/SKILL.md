---
name: animation-on-scroll
description: Create on-scroll animation triggers and kinetic typography expansion using Motion and IntersectionObserver with Tailwind-friendly animation classes. Use when asked for scroll-reveal, horizontal text expansion, or sequencing element animations as user scrolls.
---

# Animation On Scroll Skill

## Workflow
1. Confirm animation style, timing, and whether animations should run once or scrub continuously with scroll.
2. For scrubbed kinetic typography (e.g. horizontal letter-spacing expansion or masked reveal), use `motion/react` (`useScroll` + `useTransform`).
3. For discrete entrances, use `IntersectionObserver` or `whileInView` with spring/ease-out transitions.
4. Gate all movement, scale, and blur behind `useReducedMotion()`.

## Scrubbed Kinetic Typography with Framer Motion (`motion/react`)
```tsx
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

export function ExpandingWordmark() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Expand letter spacing from compact to majestic architectural spacing
  const letterSpacing = useTransform(scrollYProgress, [0, 0.6], ['-0.03em', '0.22em'])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 0.9], [1, 0.85, 0])
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, 1.04])

  return (
    <div ref={containerRef} className="h-[180vh] relative">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <motion.h1
          style={{ letterSpacing, opacity, scale }}
          className="font-serif font-light text-7xl sm:text-9xl text-[#242321] select-none text-center"
        >
          SONUS
        </motion.h1>
      </div>
    </div>
  )
}
```

## Exact Guidelines
- **Scrub Ratio**: Keep the primary letter-spacing expansion within the first 40–60% of the sticky section height.
- **Reduced Motion**: Under `prefers-reduced-motion: reduce`, set static readable tracking (`0.05em`) and skip continuous transforms.
- **Transition Smoothing**: Pair with Lenis smooth scroll for organic fluid tracking adjustments.
