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

    const scale = 0.5
    const dims = {
      width: (canvas.width = Math.max(320, Math.round((window.innerWidth || 1280) * scale))),
      height: (canvas.height = Math.max(240, Math.round((window.innerHeight || 800) * scale))),
    }

    const handleResize = () => {
      if (!canvas) return
      const vw = window.innerWidth || 1280
      const vh = window.innerHeight || 800
      dims.width = canvas.width = Math.max(320, Math.round(vw * scale))
      dims.height = canvas.height = Math.max(240, Math.round(vh * scale))
    }
    window.addEventListener('resize', handleResize)

    // Initialize 12 subtle volumetric dust plumes
    const isDark = theme === 'dark'
    const plumes: SmokePlume[] = Array.from({ length: 12 }, (_, i) => {
      const tints: Array<'amber' | 'silver' | 'emerald'> = isDark
        ? ['silver', 'silver', 'silver', 'silver']
        : ['amber', 'amber', 'silver', 'amber']
      return {
        x: ((i * 197) % 100) * 0.01 * dims.width,
        y: ((i * 311) % 100) * 0.01 * dims.height,
        radius: Math.max(dims.width, dims.height) * (0.2 + (i % 4) * 0.05),
        vx: (i % 2 === 0 ? 1 : -1) * (0.16 + (i % 4) * 0.08),
        vy: -0.11 - (i % 3) * 0.06,
        phase: i * 0.7,
        phaseSpeed: 0.008 + (i % 4) * 0.003,
        tint: tints[i % tints.length],
        alphaBase: isDark ? 0.09 + (i % 4) * 0.025 : 0.045 + (i % 3) * 0.015,
      }
    })

    // Initialize 36 floating atmospheric dust motes
    const motes: DustMote[] = Array.from({ length: 36 }, (_, i) => ({
      x: ((i * 131) % 100) * 0.01 * dims.width,
      y: ((i * 257) % 100) * 0.01 * dims.height,
      size: 0.8 + (i % 3) * 0.45,
      vx: i % 2 === 0 ? 0.14 : -0.14,
      vy: -0.16 - (i % 4) * 0.08,
      alpha: isDark ? 0.42 + (i % 5) * 0.11 : 0.28 + (i % 5) * 0.1,
    }))

    const makePlumeSprite = (tint: 'amber' | 'silver' | 'emerald'): HTMLCanvasElement => {
      const sprite = document.createElement('canvas')
      const size = 128
      sprite.width = size
      sprite.height = size
      const sctx = sprite.getContext('2d')
      if (!sctx) return sprite
      const half = size / 2
      const grad = sctx.createRadialGradient(half, half, size * 0.03, half, half, half)
      if (isDark) {
        // Pure neutral white / silver-gelatin atmospheric dust mist in Dark Mode
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.78)')
        grad.addColorStop(0.5, 'rgba(212, 212, 216, 0.28)')
        grad.addColorStop(1, 'rgba(9, 9, 11, 0)')
      } else if (tint === 'amber') {
        // Subtle warm golden sunlight dust — zero milky white wash
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.45)')
        grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.14)')
        grad.addColorStop(1, 'rgba(217, 119, 6, 0)')
      } else {
        grad.addColorStop(0, 'rgba(254, 243, 199, 0.35)')
        grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.1)')
        grad.addColorStop(1, 'rgba(217, 119, 6, 0)')
      }
      sctx.fillStyle = grad
      sctx.fillRect(0, 0, size, size)
      return sprite
    }

    const sprites: Record<'amber' | 'silver' | 'emerald', HTMLCanvasElement> = {
      amber: makePlumeSprite('amber'),
      silver: makePlumeSprite('silver'),
      emerald: makePlumeSprite('emerald'),
    }

    const animState = { rafId: 0, lastRenderTime: 0 }
    const renderFrame = (now: number) => {
      if (!ctx) return
      if (document.hidden || (animState.lastRenderTime !== 0 && now - animState.lastRenderTime < 42)) {
        animState.rafId = requestAnimationFrame(renderFrame)
        return
      }
      animState.lastRenderTime = now
      const { width, height } = dims

      ctx.clearRect(0, 0, width, height)

      // Decay scroll velocity smoothly
      scrollVelocityRef.current *= 0.92
      const velBoost = scrollVelocityRef.current * 45

      // 1. Diagonal Acoustic Light Cone from window right-center
      const beamGrad = ctx.createLinearGradient(width * 0.72, 0, width * 0.22, height * 0.92)
      if (isDark) {
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
        beamGrad.addColorStop(0.5, 'rgba(228, 228, 231, 0.03)')
        beamGrad.addColorStop(1, 'rgba(9, 9, 11, 0)')
      } else {
        beamGrad.addColorStop(0, 'rgba(251, 191, 36, 0.09)')
        beamGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.03)')
        beamGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')
      }
      ctx.fillStyle = beamGrad
      ctx.fillRect(0, 0, width, height)

      // 2. Render drifting atmospheric plumes
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
        ctx.globalAlpha = pulseAlpha
        ctx.drawImage(
          sprites[p.tint],
          p.x - p.radius,
          p.y - p.radius,
          p.radius * 2,
          p.radius * 2
        )
      }
      ctx.globalAlpha = 1

      // 3. Render floating acoustic dust motes (Crisp White in Dark Mode, Warm Sun Motes in Light Mode)
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i]
        m.x += m.vx + velBoost * 0.35
        m.y += m.vy - Math.abs(velBoost) * 0.45
        if (m.x < 0) m.x = width
        if (m.x > width) m.x = 0
        if (m.y < 0) m.y = height
        if (m.y > height) m.y = 0

        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${m.alpha})`
          : `rgba(254, 243, 199, ${m.alpha})`
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2)
        ctx.fill()
      }

      animState.rafId = requestAnimationFrame(renderFrame)
    }

    animState.rafId = requestAnimationFrame(renderFrame)

    return () => {
      cancelAnimationFrame(animState.rafId)
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
