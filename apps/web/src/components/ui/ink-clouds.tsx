import { motion, useReducedMotion } from 'framer-motion'

export type InkCloudsProps = {
  className?: string
}

export function InkClouds({ className }: InkCloudsProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
      data-testid="ink-clouds-container"
    >
      <svg
        className="absolute h-0 w-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
        tabIndex={-1}
      >
        <defs>
          <filter
            id="sonus-ink-crimson-filter"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.025"
              numOctaves={3}
              seed={41}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="40"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="6" result="softEdges" />
            <feMerge>
              <feMergeNode in="softEdges" opacity="0.8" />
              <feMergeNode in="displaced" opacity="0.7" />
            </feMerge>
          </filter>

          <filter
            id="sonus-ink-charcoal-filter"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.022"
              numOctaves={3}
              seed={93}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="50"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="8" result="softEdges" />
            <feMerge>
              <feMergeNode in="softEdges" opacity="0.9" />
              <feMergeNode in="displaced" opacity="0.8" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* 1. TOP-LEFT: Muted Crimson Ink Wash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 3, ease: 'easeOut' }}
        className="pointer-events-none absolute -left-20 -top-20 h-[22rem] w-[22rem] select-none mix-blend-multiply sm:-left-24 sm:-top-24 sm:h-[26rem] sm:w-[26rem]"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  scale: [1, 1.05, 0.96, 1],
                  rotate: [0, 2, -1.5, 0],
                  x: [0, 6, -4, 0],
                  y: [0, -5, 4, 0],
                }
          }
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="h-full w-full"
        >
          <svg
            viewBox="0 0 400 400"
            className="h-full w-full"
            style={{ filter: 'url(#sonus-ink-crimson-filter)' }}
          >
            <path
              d="M 10,10 L 260,10 Q 230,80 170,120 T 110,210 Q 60,250 10,260 Z"
              fill="#9A2A2A"
              fillOpacity="0.3"
            />
            <path
              d="M 10,10 L 200,10 Q 180,60 130,100 T 80,180 Q 40,200 10,210 Z"
              fill="#8B2222"
              fillOpacity="0.4"
            />
            <circle cx="100" cy="100" r="50" fill="#7A1D1D" fillOpacity="0.3" />
          </svg>
        </motion.div>
      </motion.div>

      {/* 2. BOTTOM-RIGHT: Dense Charcoal Cloud */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 3.5, ease: 'easeOut' }}
        className="pointer-events-none absolute -bottom-24 -right-24 h-[26rem] w-[26rem] select-none mix-blend-multiply sm:-bottom-28 sm:-right-28 sm:h-[32rem] sm:w-[32rem]"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  scale: [1, 0.95, 1.04, 1],
                  rotate: [0, -2, 1.8, 0],
                  x: [0, -8, 5, 0],
                  y: [0, 6, -4, 0],
                }
          }
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="h-full w-full"
        >
          <svg
            viewBox="0 0 400 400"
            className="h-full w-full"
            style={{ filter: 'url(#sonus-ink-charcoal-filter)' }}
          >
            <path
              d="M 390,390 L 140,390 Q 180,310 240,270 T 300,160 Q 350,130 390,120 Z"
              fill="#2C2A29"
              fillOpacity="0.4"
            />
            <path
              d="M 390,390 L 200,390 Q 230,330 280,290 T 340,200 Q 370,170 390,170 Z"
              fill="#22201F"
              fillOpacity="0.5"
            />
            <circle cx="300" cy="300" r="70" fill="#1B1918" fillOpacity="0.6" />
          </svg>
        </motion.div>
      </motion.div>

      {/* 3. TOP-RIGHT: Charcoal Bleed */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 4, ease: 'easeOut' }}
        className="pointer-events-none absolute -right-20 -top-20 h-[18rem] w-[18rem] select-none mix-blend-multiply sm:-right-24 sm:-top-24 sm:h-[22rem] sm:w-[22rem]"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  scale: [1, 1.04, 0.97, 1],
                  opacity: [0.75, 0.95, 0.75],
                }
          }
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="h-full w-full"
        >
          <svg
            viewBox="0 0 300 300"
            className="h-full w-full"
            style={{ filter: 'url(#sonus-ink-charcoal-filter)' }}
          >
            <path
              d="M 290,10 L 120,10 Q 160,70 210,110 T 290,200 Z"
              fill="#363331"
              fillOpacity="0.3"
            />
            <circle cx="230" cy="70" r="50" fill="#2C2A29" fillOpacity="0.4" />
          </svg>
        </motion.div>
      </motion.div>

      {/* 4. BOTTOM-LEFT: Crimson Wash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 4.5, ease: 'easeOut' }}
        className="pointer-events-none absolute -bottom-20 -left-20 h-[18rem] w-[18rem] select-none mix-blend-multiply sm:-bottom-24 sm:-left-24 sm:h-[22rem] sm:w-[22rem]"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  scale: [1, 1.05, 0.97, 1],
                  opacity: [0.7, 0.9, 0.7],
                }
          }
          transition={{
            duration: 21,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="h-full w-full"
        >
          <svg
            viewBox="0 0 300 300"
            className="h-full w-full"
            style={{ filter: 'url(#sonus-ink-crimson-filter)' }}
          >
            <path
              d="M 10,290 L 10,120 Q 70,160 110,210 T 200,290 Z"
              fill="#9A2A2A"
              fillOpacity="0.25"
            />
            <circle cx="70" cy="230" r="40" fill="#8B2222" fillOpacity="0.35" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}
