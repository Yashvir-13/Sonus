import { useState, useEffect } from 'react'
import { useSpatialNavigation } from '@/components/spatial'

type DeviceMode = 'voice' | 'guitar' | 'piano'

export function DeviceSetupScreen() {
  const [mode, setMode] = useState<DeviceMode>('voice')
  const { panTo } = useSpatialNavigation()

  // Mock states for UI
  const isAudioConnected = false // Force to false to show the "Mock" state clearly
  const [mockCents, setMockCents] = useState(0)

  // Animated idle state (breathing mock values)
  useEffect(() => {
    if (!isAudioConnected) {
      const interval = setInterval(() => {
        // Gently waver between -5 and +5 cents if idle
        setMockCents(Math.sin(Date.now() / 1000) * 4)
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isAudioConnected])

  const isInTune = mockCents > -3 && mockCents < 3

  return (
    <div className="w-full h-full p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center bg-[#F4F1EA] text-[#2C2A29]">
      <div className="w-full max-w-2xl flex flex-col items-center gap-16">
        
        {/* Step 1: Input Source */}
        <div className="flex flex-col items-center gap-6 w-full">
          <span className="font-mono text-[10px] text-[#7E7570] tracking-widest uppercase">
            1. Input Source
          </span>
          <div className="flex gap-1 border-b border-[#2C2A29]/20 w-full justify-center pb-1">
            {(['voice', 'guitar', 'piano'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-6 py-2 font-serif text-lg italic transition-all ${
                  mode === m 
                    ? 'text-[#2C2A29] border-b-2 border-[#2C2A29] -mb-[2px]' 
                    : 'text-[#7E7570] hover:text-[#2C2A29]'
                }`}
              >
                {m === 'voice' ? 'Acoustic / Mic' : m === 'guitar' ? 'Electric / Line' : 'MIDI Instrument'}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Calibration (The Tuner) */}
        <div className="flex flex-col items-center gap-12 w-full">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-[#7E7570] tracking-widest uppercase">
              2. Establish A440
            </span>
            {!isAudioConnected && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#E9E4DA] border border-[#2C2A29]/20 text-[#2C2A29] uppercase">
                Mock Signal
              </span>
            )}
          </div>

          {/* Central Tuner */}
          <div className="flex flex-col items-center relative w-full h-40">
            <div className="text-[6rem] leading-none font-serif text-[#2C2A29] font-black tracking-tighter absolute top-0 -translate-y-1/2">
              A<span className="text-4xl text-[#7E7570] align-baseline">4</span>
            </div>

            {/* The minimal animated idle line / tuner needle */}
            <div className="absolute bottom-4 w-full max-w-md h-12 flex flex-col justify-end">
              <div className="relative w-full h-px bg-[#2C2A29]/30">
                {/* Center marker */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-px h-4 bg-[#2C2A29]" />
                {/* Boundary markers */}
                <div className="absolute left-[20%] -bottom-1 w-px h-2 bg-[#2C2A29]/50" />
                <div className="absolute right-[20%] -bottom-1 w-px h-2 bg-[#2C2A29]/50" />
                
                {/* Needle */}
                <div 
                  className={`absolute bottom-0 w-px h-8 transition-transform duration-75 origin-bottom ${
                    isInTune ? 'bg-[#2C2A29]' : 'bg-[#9A2A2A]'
                  }`}
                  style={{ 
                    left: '50%',
                    transform: `translateX(-50%) rotate(${mockCents * 1.5}deg)` 
                  }}
                />
              </div>
              
              <div className="flex justify-between w-full mt-4 font-mono text-[10px] text-[#7E7570] uppercase tracking-wider">
                <span>Flat</span>
                <span className={isInTune ? 'text-[#2C2A29] font-bold' : ''}>
                  {isInTune ? 'Locked' : `${mockCents > 0 ? '+' : ''}${mockCents.toFixed(1)}¢`}
                </span>
                <span>Sharp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Action */}
        <div className="pt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => panTo('practice')}
            className="group flex items-center gap-3 border border-[#2C2A29] px-6 py-3 hover:bg-[#2C2A29] hover:text-[#F4F1EA] transition-colors shadow-[2px_2px_0_0_#2C2A29] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <span className="font-mono text-xs uppercase tracking-widest">
              Return to Practice Stand
            </span>
            <span className="font-serif text-lg leading-none transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>

      </div>
    </div>
  )
}
