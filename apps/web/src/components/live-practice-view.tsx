import { useState } from "react"
import { PitchRibbon } from "./pitch-ribbon"

export function LivePracticeView() {
  const [isPlaying, setIsPlaying] = useState(false)
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-[#F4F1EA] text-[#2C2A29] p-8">
      {/* Structural Staves Background (The Grid) */}
      <div className="absolute inset-0 staff-bg opacity-20 pointer-events-none" />

      {/* Main Practice Desk */}
      <div className="relative w-full max-w-4xl flex flex-col items-center">
        
        {/* Context / Mode Indicator */}
        <div className="flex items-center gap-6 mb-12">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#7E7570]">Input Source</span>
            <span className="font-mono text-xs font-bold">Studio Mic</span>
          </div>
          <div className="w-px h-8 bg-[#2C2A29]/20" />
          <div className="flex flex-col items-start">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#7E7570]">Calibration</span>
            <span className="font-mono text-xs font-bold">A4 = 440 Hz</span>
          </div>
        </div>

        {/* Target Note Display */}
        <div className="flex flex-col items-center mb-8 relative">
          <h2 className="font-serif text-[8rem] leading-none text-[#2C2A29] font-black tracking-tighter">
            F<span className="text-[#9A2A2A]">#</span><span className="text-6xl text-[#7E7570] align-baseline">4</span>
          </h2>
          <div className="font-serif italic text-[#7E7570] text-lg mt-2">
            Target Note
          </div>
          
          {/* Cents deviation badge */}
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-bold text-[#9A2A2A]">+12</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7E7570]">Cents</span>
          </div>
          
          <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-bold text-[#2C2A29]">72</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7E7570]">BPM</span>
          </div>
        </div>

        {/* The Live Pitch Ribbon Container */}
        <div className="w-full h-48 border-y border-[#2C2A29]/30 relative overflow-hidden flex items-center group transition-colors duration-500 hover:border-[#2C2A29]">
          
          {/* Empty state label when paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#F4F1EA]/50 backdrop-blur-[1px]">
              <div className="border border-[#2C2A29] px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#2C2A29] bg-[#E9E4DA] shadow-sm transition-transform hover:scale-[1.02]">
                Ready for Diagnostic (Mock Data)
              </div>
            </div>
          )}

          {/* Center target line */}
          <div className="absolute w-full h-px bg-[#9A2A2A] opacity-50 shadow-[0_0_8px_rgba(154,42,42,0.4)]" />
          
          {/* Flowing Ribbon Visualization */}
          <div className={isPlaying ? "opacity-100 transition-opacity duration-1000" : "opacity-30 transition-opacity duration-1000 blur-[2px]"}>
             <PitchRibbon active={isPlaying} />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-12 flex items-center gap-8">
          <button 
            className="flex items-center justify-center w-16 h-16 border border-[#2C2A29] bg-transparent text-[#2C2A29] hover:bg-[#2C2A29] hover:text-[#F4F1EA] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#9A2A2A] focus:ring-offset-4 focus:ring-offset-[#F4F1EA] shadow-[4px_4px_0_0_#2C2A29] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause diagnostic" : "Start diagnostic"}
          >
            {isPlaying ? (
              <span title="Fermata (Pause)" className="font-serif text-3xl mb-1">&#119058;</span>
            ) : (
              <span title="Play (Right Triangle)" className="text-2xl ml-1">&#9654;</span>
            )}
          </button>
          
          <button 
            className="flex items-center justify-center w-12 h-12 border border-[#9A2A2A]/50 bg-transparent text-[#9A2A2A] hover:bg-[#9A2A2A] hover:text-[#F4F1EA] hover:border-[#9A2A2A] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#9A2A2A] focus:ring-offset-4 focus:ring-offset-[#F4F1EA]"
            onClick={() => setIsPlaying(false)}
            aria-label="Stop / End Session"
          >
            <span className="text-xl">&#9632;</span>
          </button>
        </div>

      </div>
    </div>
  )
}
