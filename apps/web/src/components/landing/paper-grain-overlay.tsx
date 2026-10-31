import React from 'react'

/**
 * Subtle Archival Paper Vellum SVG Grain Texture Overlay.
 * Renders an inline fractal noise SVG with ultra-low opacity
 * to evoke 19th-century conservatory manuscript parchment.
 */
export function PaperGrainOverlay(): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.032] dark:opacity-[0.022] select-none"
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="vellum-paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#vellum-paper-grain)" />
      </svg>
    </div>
  )
}
