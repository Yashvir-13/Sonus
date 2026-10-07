export function PracticeHistoryScreen() {
  // Mock data removed. We will eventually fetch this from the backend.
  const practiceData: any[] = []
  
  const totalSessions = practiceData.length

  return (
    <div className="w-full h-full p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-[#FAF7F0] text-[#2C2A29] selection:bg-[#9A2A2A] selection:text-[#FAF7F0]">
      
      <div className="w-full max-w-5xl mx-auto flex flex-col">
        
        {/* Header / Thesis */}
        <header className="mb-16 max-w-3xl">
          <div className="font-mono text-[10px] text-[#7E7570] tracking-widest uppercase mb-4 flex items-center gap-4">
            <span>Diagnostic Archive</span>
            <span className="w-8 h-px bg-[#7E7570]" />
            <span>{totalSessions} Sessions Recorded</span>
          </div>
          
          {practiceData.length === 0 ? (
            <>
              <h2 className="text-4xl md:text-5xl font-serif text-[#2C2A29] leading-tight mb-4 text-[#2C2A29]/40 italic">
                Awaiting your first practice session.
              </h2>
              <p className="font-serif text-lg text-[#7E7570] italic">
                Sonus will analyze your intonation and structural integrity across tempi to find your exact mechanical bottlenecks.
              </p>
            </>
          ) : (
             <h2 className="text-4xl md:text-5xl font-serif text-[#2C2A29] leading-tight mb-4">
               Technique remains stable at moderate tempi, but structural integrity falters at 
               <span className="text-[#9A2A2A] italic"> BPM</span>.
             </h2>
          )}
        </header>

        {/* The Progression Story */}
        <div className="relative pt-12 pb-24 border border-dashed border-[#2C2A29]/20 flex items-center justify-center min-h-[250px]">
           <span className="font-mono text-xs uppercase tracking-widest text-[#7E7570]">
             Graph canvas empty
           </span>
        </div>

      </div>
    </div>
  )
}
