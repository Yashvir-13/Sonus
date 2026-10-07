import { useEffect, useRef, useState } from 'react'

const MELODY = [
  // Blue Danube Intro
  62, 62, 62, 67, 71, 71, 71, 67, 67, 71, 74, 74, 74, 71, 71, 67, 67,
  // Next phrase
  62, 62, 62, 66, 72, 72, 72, 66, 66, 72, 74, 74, 74, 72, 72, 66, 66
]

function midiToFreq(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12)
}

interface InkDrop {
  id: number;
  x: number;
  y: number;
  startTime: number;
}

export function LivingManuscript() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [, setDrops] = useState<InkDrop[]>([])
  
  // Audio state
  const audioCtxRef = useRef<AudioContext | null>(null)
  const melodyIndexRef = useRef(0)
  const lastYRef = useRef<number | null>(null)
  const [isAudioReady, setIsAudioReady] = useState(false)

  // Initialize Audio Context on first interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      setIsAudioReady(true)
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
    
    window.addEventListener('click', initAudio)
    window.addEventListener('keydown', initAudio)
    return () => {
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [])

  const playNote = (vol = 0.3) => {
    if (!audioCtxRef.current || !isAudioReady) return
    
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sine'
    
    const midi = MELODY[melodyIndexRef.current % MELODY.length]
    osc.frequency.setValueAtTime(midiToFreq(midi), ctx.currentTime)
    melodyIndexRef.current++

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5)

    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 2.5)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const numLines = 25
    const lineSpacing = rect.height / numLines
    
    const currentLine = Math.floor(y / lineSpacing)
    
    if (lastYRef.current !== null) {
      const lastLine = Math.floor(lastYRef.current / lineSpacing)
      
      if (currentLine !== lastLine) {
        // Pluck!
        playNote(0.7)
        
        const newDrop: InkDrop = {
          id: Date.now() + Math.random(),
          x,
          y: currentLine * lineSpacing,
          startTime: Date.now()
        }
        setDrops(prev => [...prev, newDrop])
      }
    }
    
    lastYRef.current = y
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    let animationId: number
    
    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const now = Date.now()
      
      setDrops(prevDrops => {
        const activeDrops = prevDrops.filter(drop => now - drop.startTime < 2000)
        
        activeDrops.forEach(drop => {
          const age = now - drop.startTime
          const progress = age / 2000 // 0 to 1
          
          const width = 10 + (progress * 150)
          const height = 4 + (progress * 6)
          const opacity = 1 - Math.pow(progress, 1.5)
          
          ctx.save()
          ctx.translate(drop.x, drop.y)
          
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width/2)
          gradient.addColorStop(0, `rgba(40, 35, 30, ${opacity * 1.0})`)
          gradient.addColorStop(1, `rgba(40, 35, 30, 0)`)
          
          ctx.fillStyle = gradient
          
          ctx.beginPath()
          ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.restore()
        })
        
        return activeDrops
      })
      
      animationId = requestAnimationFrame(draw)
    }
    
    animationId = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  const staveSystems = [15, 35, 55, 75]

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-0 overflow-hidden" 
      style={{
        backgroundColor: '#FAF7F0',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.45) 0%, rgba(243,239,230,0) 80%), repeating-linear-gradient(0deg, rgba(60,54,45,0.015) 0px, rgba(60,54,45,0.015) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(60,54,45,0.012) 0px, rgba(60,54,45,0.012) 1px, transparent 1px, transparent 4px)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-10"
      />
      
      {!isAudioReady && (
        <div className="absolute bottom-8 w-full text-center text-charcoal/40 font-mono text-xs tracking-widest uppercase animate-pulse pointer-events-none">
          Click anywhere to awaken the manuscript
        </div>
      )}

      {staveSystems.map((top, i) => (
        <div 
          key={i} 
          className="absolute left-0 right-0 h-10 flex flex-col justify-between pointer-events-none opacity-85"
          style={{ top: `${top}%` }}
        >
          {[0,1,2,3,4].map(line => (
            <div 
              key={line} 
              className="w-full h-[1px]"
              style={{
                background: 'linear-gradient(90deg, rgba(50, 46, 42, 0.04) 0%, rgba(50, 46, 42, 0.16) 15%, rgba(50, 46, 42, 0.18) 50%, rgba(50, 46, 42, 0.16) 85%, rgba(50, 46, 42, 0.04) 100%)'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
