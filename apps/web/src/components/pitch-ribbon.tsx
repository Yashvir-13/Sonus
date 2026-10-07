import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function PitchRibbon({ active }: { active: boolean }) {
  // Mock data generator for the visual effect
  // In a real implementation, this would be driven by AudioWorklet pitch data
  const [points, setPoints] = useState<number[]>([])

  useEffect(() => {
    if (!active) return

    let animationFrame: number
    const updatePitch = () => {
      setPoints((prev) => {
        // Generate a random walk that stays roughly near the center (0)
        const last = prev.length > 0 ? prev[prev.length - 1] : 0
        const drift = (Math.random() - 0.5) * 15
        const next = Math.max(-40, Math.min(40, last + drift - (last * 0.05))) // Soft centering
        
        // Keep the last 100 points
        return [...prev.slice(-100), next]
      })
      animationFrame = requestAnimationFrame(updatePitch)
    }
    
    updatePitch()
    return () => cancelAnimationFrame(animationFrame)
  }, [active])

  if (!active && points.length === 0) {
    return (
      <div className="w-full flex items-center justify-center font-serif text-[var(--muted-foreground)] italic">
        Awaiting performance...
      </div>
    )
  }

  // Create an SVG path from the points
  const width = 1000 // Fixed internal coordinate system width
  const height = 200 // Fixed internal height
  const stepX = width / 100

  const pathD = points.reduce((acc, point, i) => {
    // Map -50..50 cents to height 0..200 (center is 100)
    const x = i * stepX
    const y = 100 - (point * 2) 
    if (i === 0) return `M ${x},${y}`
    // Smooth curves could be calculated here, but simple lines work for the raw signal look
    return `${acc} L ${x},${y}`
  }, "")

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {active && pathD && (
          <motion.path
            d={pathD}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </svg>
      
      {/* Particle Overlay (Abstract representation) */}
      {active && (
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply">
          {/* We would render HTML/Canvas particles here. For this scaffold, a simple CSS animation simulating ink bleed */}
          <div className="absolute right-0 top-1/2 w-4 h-4 rounded-full bg-[var(--accent)] blur-md animate-pulse transform -translate-y-1/2" />
        </div>
      )}
    </div>
  )
}
