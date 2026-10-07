import { useEffect, useRef } from 'react'

export function HarmonicSeismograph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Interactive target coordinates
  const mouseRef = useRef({ x: 0, y: 0, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0

    function resize() {
      if (!canvas || !container) return
      const rect = container.getBoundingClientRect()
      // Adjust for device pixel ratio for crisp ink lines
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      width = rect.width
      height = rect.height
      ctx?.scale(dpr, dpr)
    }
    
    window.addEventListener('resize', resize)
    resize()

    let animationId: number
    let time = 0

    // Parameters for the seismograph wave
    const numPoints = 200 // Resolution of the curve
    const baseAmplitude = height * 0.15

    function draw() {
      if (!ctx) return
      
      // Clear the canvas - background is handled by CSS
      ctx.clearRect(0, 0, width, height)
      
      time += 0.015

      // Draw the main ink line
      ctx.beginPath()
      
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * width
        
        // Base sine waves for complex harmonic motion (like a pendulum)
        const fundamental = Math.sin((i / numPoints) * Math.PI * 4 - time * 2)
        const overtone1 = Math.sin((i / numPoints) * Math.PI * 9 + time * 3) * 0.4
        const overtone2 = Math.sin((i / numPoints) * Math.PI * 15 - time * 4) * 0.2
        
        let waveY = fundamental + overtone1 + overtone2
        
        // Mouse interaction: if mouse is active, pinch/pull the wave towards the mouse Y
        let amplitude = baseAmplitude
        if (mouseRef.current.active) {
          const dx = x - mouseRef.current.x
          const dist = Math.abs(dx)
          const influenceRange = width * 0.3
          
          if (dist < influenceRange) {
            // Calculate a bell curve influence factor
            const influence = Math.pow(Math.cos((dist / influenceRange) * (Math.PI / 2)), 2)
            
            // Push the center of the wave towards the mouse Y
            const targetCenter = mouseRef.current.y
            const centerBase = height / 2
            const centerShift = (targetCenter - centerBase) * influence
            
            // Also increase amplitude locally for resonance effect
            amplitude = baseAmplitude * (1 + (influence * 1.5))
            
            waveY = (waveY * amplitude) + centerBase + centerShift
          } else {
             waveY = (waveY * amplitude) + (height / 2)
          }
        } else {
           waveY = (waveY * amplitude) + (height / 2)
        }

        if (i === 0) {
          ctx.moveTo(x, waveY)
        } else {
          ctx.lineTo(x, waveY)
        }
      }

      // Ink pen styling
      ctx.strokeStyle = 'rgba(44, 42, 41, 0.7)' // Charcoal ink, slightly transparent
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      
      // Draw a secondary, fainter overtone shadow line (like ink bleed)
      ctx.beginPath()
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * width
        const fundamental = Math.sin((i / numPoints) * Math.PI * 4 - time * 2)
        const overtone1 = Math.sin((i / numPoints) * Math.PI * 9 + time * 3) * 0.4
        const overtone2 = Math.sin((i / numPoints) * Math.PI * 15 - time * 4) * 0.2
        // Slightly delayed phase for the shadow
        let waveY = fundamental + (overtone1 * 1.2) + (overtone2 * 1.5)
        
        let amplitude = baseAmplitude * 1.1
        if (mouseRef.current.active) {
          const dx = x - mouseRef.current.x
          const dist = Math.abs(dx)
          const influenceRange = width * 0.3
          if (dist < influenceRange) {
            const influence = Math.pow(Math.cos((dist / influenceRange) * (Math.PI / 2)), 2)
            const targetCenter = mouseRef.current.y
            const centerBase = height / 2
            const centerShift = (targetCenter - centerBase) * influence
            amplitude = amplitude * (1 + (influence * 1.2))
            waveY = (waveY * amplitude) + centerBase + centerShift
          } else {
            waveY = (waveY * amplitude) + (height / 2)
          }
        } else {
           waveY = (waveY * amplitude) + (height / 2)
        }

        if (i === 0) {
          ctx.moveTo(x, waveY)
        } else {
          ctx.lineTo(x, waveY)
        }
      }
      ctx.strokeStyle = 'rgba(154, 42, 42, 0.15)' // Faint crimson shadow
      ctx.lineWidth = 4
      ctx.stroke()

      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    }
  }

  const handlePointerLeave = () => {
    mouseRef.current.active = false
  }

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="absolute inset-0 w-full h-full z-0 overflow-hidden"
      style={{
        backgroundColor: '#FAF7F0',
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(255,255,255,0.6) 0%, rgba(243,239,230,0) 100%),
          repeating-linear-gradient(0deg, rgba(60,54,45,0.02) 0px, rgba(60,54,45,0.02) 1px, transparent 1px, transparent 4px),
          repeating-linear-gradient(90deg, rgba(60,54,45,0.015) 0px, rgba(60,54,45,0.015) 1px, transparent 1px, transparent 4px)
        `
      }}
    >
      {/* Three subtle horizontal structural lines like a bare minimum staff */}
      <div className="absolute inset-0 flex flex-col justify-center gap-32 pointer-events-none opacity-20">
        <div className="w-full h-px bg-charcoal"></div>
        <div className="w-full h-px bg-charcoal"></div>
        <div className="w-full h-px bg-charcoal"></div>
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  )
}
