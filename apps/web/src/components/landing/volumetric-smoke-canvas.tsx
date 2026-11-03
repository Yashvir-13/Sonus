import React, { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/use-theme'

export interface VolumetricSmokeCanvasProps {
  scrollProgress?: number
  className?: string
}

interface SmokePlume {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  phase: number
  phaseSpeed: number
  tint: 'amber' | 'silver' | 'emerald'
  alphaBase: number
}

interface DustMote {
  x: number
  y: number
  size: number
  vx: number
  vy: number
  alpha: number
}

export function VolumetricSmokeCanvas({
  scrollProgress = 0,
  className = '',
}: VolumetricSmokeCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { theme } = useTheme()
  const scrollRef = useRef(scrollProgress)
  const lastScrollRef = useRef(scrollProgress)
  const scrollVelocityRef = useRef(0)

  useEffect(() => {
    const delta = scrollProgress - lastScrollRef.current
    scrollVelocityRef.current = Math.max(-0.08, Math.min(0.08, delta * 14))
    lastScrollRef.current = scrollProgress
    scrollRef.current = scrollProgress
  }, [scrollProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let ctx: CanvasRenderingContext2D | null = null
    try {
      ctx = canvas.getContext('2d')
    } catch {
      ctx = null
    }
    if (!ctx) return

    let width = (canvas.width = window.innerWidth || 1280)
    let height = (canvas.height = window.innerHeight || 800)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth || 1280
      height = canvas.height = window.innerHeight || 800
    }
    window.addEventListener('resize', handleResize)

    // Initialize 26 large volumetric smoke plumes
    const plumes: SmokePlume[] = Array.from({ length: 26 }, (_, i) => {
      const tints: Array<'amber' | 'silver' | 'emerald'> = ['silver', 'amber', 'silver', 'emerald']
      return {
        x: ((i * 197) % 100) * 0.01 * width,
        y: ((i * 311) % 100) * 0.01 * height,
        radius: Math.max(width, height) * (0.22 + (i % 5) * 0.065),
        vx: (i % 2 === 0 ? 1 : -1) * (0.28 + (i % 4) * 0.14),
        vy: -0.18 - (i % 3) * 0.1,
        phase: i * 0.7,
        phaseSpeed: 0.008 + (i % 4) * 0.003,
        tint: tints[i % tints.length],
        alphaBase: 0.14 + (i % 4) * 0.035,
      }
    })

    // Initialize 42 atmospheric dust motes floating in the stage beam
    const motes: DustMote[] = Array.from({ length: 42 }, (_, i) => ({
      x: ((i * 131) % 100) * 0.01 * width,
      y: ((i * 257) % 100) * 0.01 * height,
      size: 1.2 + (i % 3) * 0.9,
      vx: (i % 2 === 0 ? 0.22 : -0.22),
      vy: -0.25 - (i % 4) * 0.12,
      alpha: 0.25 + (i % 5) * 0.12,
    }))

    let rafId = 0
    const isDark = theme === 'dark'

    const renderFrame = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      // Decay scroll velocity smoothly
      scrollVelocityRef.current *= 0.92
      const velBoost = scrollVelocityRef.current * 45

      // 1. Diagonal Tungsten / Sunlit Acoustic Light Cone from top center-left
      const beamGrad = ctx.createLinearGradient(width * 0.18, 0, width * 0.75, height * 0.92)
      if (isDark) {
        beamGrad.addColorStop(0, 'rgba(245, 158, 11, 0.14)')
        beamGrad.addColorStop(0.5, 'rgba(244, 244, 245, 0.06)')
        beamGrad.addColorStop(1, 'rgba(9, 9, 11, 0)')
      } else {
        beamGrad.addColorStop(0, 'rgba(217, 119, 6, 0.13)')
        beamGrad.addColorStop(0.5, 'rgba(113, 113, 122, 0.07)')
        beamGrad.addColorStop(1, 'rgba(248, 248, 246, 0)')
      }
      ctx.fillStyle = beamGrad
      ctx.fillRect(0, 0, width, height)

      // 2. Render drifting, swirling volumetric smoke plumes
      for (let i = 0; i < plumes.length; i++) {
        const p = plumes[i]
        p.phase += p.phaseSpeed
        p.x += p.vx + Math.sin(p.phase) * 0.45 + velBoost * (i % 2 === 0 ? 1 : -0.8)
        p.y += p.vy + Math.cos(p.phase * 0.8) * 0.25 - Math.abs(velBoost) * 0.6

        if (p.x < -p.radius) p.x = width + p.radius * 0.6
        if (p.x > width + p.radius) p.x = -p.radius * 0.6
        if (p.y < -p.radius) p.y = height + p.radius * 0.6
        if (p.y > height + p.radius) p.y = -p.radius * 0.6

        const pulseAlpha = p.alphaBase * (0.78 + 0.22 * Math.sin(p.phase))
        const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.06, p.x, p.y, p.radius)

        if (isDark) {
          if (p.tint === 'amber') {
            grad.addColorStop(0, `rgba(245, 158, 11, ${pulseAlpha.toFixed(3)})`)
            grad.addColorStop(0.48, `rgba(161, 161, 170, ${(pulseAlpha * 0.55).toFixed(3)})`)
            grad.addColorStop(1, 'rgba(9, 9, 11, 0)')
          } else if (p.tint === 'emerald') {
            grad.addColorStop(0, `rgba(16, 185, 129, ${(pulseAlpha * 0.75).toFixed(3)})`)
            grad.addColorStop(0.5, `rgba(113, 113, 122, ${(pulseAlpha * 0.45).toFixed(3)})`)
            grad.addColorStop(1, 'rgba(9, 9, 11, 0)')
          } else {
            grad.addColorStop(0, `rgba(228, 228, 231, ${(pulseAlpha * 0.95).toFixed(3)})`)
            grad.addColorStop(0.52, `rgba(113, 113, 122, ${(pulseAlpha * 0.48).toFixed(3)})`)
            grad.addColorStop(1, 'rgba(9, 9, 11, 0)')
          }
        } else {
          // Daylight Studio Haze: visible warm amber & slate mist clouds against Alabaster #F8F8F6
          if (p.tint === 'amber') {
            grad.addColorStop(0, `rgba(217, 119, 6, ${(pulseAlpha * 0.95).toFixed(3)})`)
            grad.addColorStop(0.5, `rgba(161, 161, 170, ${(pulseAlpha * 0.55).toFixed(3)})`)
            grad.addColorStop(1, 'rgba(248, 248, 246, 0)')
          } else if (p.tint === 'emerald') {
            grad.addColorStop(0, `rgba(5, 150, 105, ${(pulseAlpha * 0.7).toFixed(3)})`)
            grad.addColorStop(0.5, `rgba(161, 161, 170, ${(pulseAlpha * 0.45).toFixed(3)})`)
            grad.addColorStop(1, 'rgba(248, 248, 246, 0)')
          } else {
            grad.addColorStop(0, `rgba(113, 113, 122, ${(pulseAlpha * 0.85).toFixed(3)})`)
            grad.addColorStop(0.52, `rgba(161, 161, 170, ${(pulseAlpha * 0.48).toFixed(3)})`)
            grad.addColorStop(1, 'rgba(248, 248, 246, 0)')
          }
        }

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // 3. Render floating acoustic dust motes in the stage beam
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i]
        m.x += m.vx + velBoost * 0.35
        m.y += m.vy - Math.abs(velBoost) * 0.45
        if (m.x < 0) m.x = width
        if (m.x > width) m.x = 0
        if (m.y < 0) m.y = height
        if (m.y > height) m.y = 0

        ctx.fillStyle = isDark
          ? `rgba(251, 191, 36, ${m.alpha})`
          : `rgba(180, 83, 9, ${m.alpha * 0.75})`
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2)
        ctx.fill()
      }

      rafId = requestAnimationFrame(renderFrame)
    }

    rafId = requestAnimationFrame(renderFrame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      data-testid="volumetric-smoke-canvas"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full z-0 ${className}`}
    />
  )
}
