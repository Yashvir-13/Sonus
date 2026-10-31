import React from 'react'

export function ColophonFooter(): React.JSX.Element {
  return (
    <footer className="w-full border-t border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#141312] px-6 py-12 transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand & Quote */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-serif font-black text-sm">
                §
              </span>
              <span className="font-serif text-lg font-black tracking-wider text-[#242321] dark:text-[#EDE8DF]">
                SONUS
              </span>
              <span className="text-xs text-[#736E65] dark:text-[#A39C8F] font-sans">
                • Adaptive Music Practice
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-serif italic leading-relaxed">
              “Simplicity is the final achievement. After one has played a vast quantity of notes and more notes, it is simplicity that emerges as the crowning reward of art.”
            </p>
            <span className="block text-[11px] font-mono text-[#C5A059]">
              — Frédéric Chopin
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-sans text-[#736E65] dark:text-[#A39C8F]">
            <a href="#how-it-works" className="hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors">
              How it works
            </a>
            <a href="#diagnostics" className="hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors">
              What it fixes
            </a>
            <a href="#repertoire" className="hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors">
              Songs
            </a>
            <a href="#tuning-chamber" className="hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors">
              A440 Tuning
            </a>
            <a href="#root" className="text-[#C5A059] hover:underline transition-colors font-medium">
              ↑ Back to top
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E2DDD3] dark:border-[#38342E] pt-6 gap-4 text-xs font-sans text-[#736E65] dark:text-[#A39C8F]">
          <div>Sonus © 2026. Precision music practice for piano and guitar.</div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Built for musicians</span>
            <span>•</span>
            <span>Local audio processing</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
