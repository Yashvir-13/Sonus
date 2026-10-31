import React from 'react'

export function HowItWorksGuide(): React.JSX.Element {
  const steps = [
    {
      num: '01',
      title: 'Pick a song or chord study',
      description:
        'Choose from classical repertoire, jazz progressions, or chord cycles. Toggle between piano grand staff and guitar tabs with one click.',
      tag: 'Step 1',
    },
    {
      num: '02',
      title: 'Play into your microphone',
      description:
        'Place your device on your piano stand or music desk. Built-in neural multipitch transcribes single notes and complex chords in real time.',
      tag: 'Step 2',
    },
    {
      num: '03',
      title: 'Fix timing and missed notes',
      description:
        'See exactly where you rushed, dragged, or missed a note. Targeted practice micro-drills isolate your weak transitions so you improve every day.',
      tag: 'Step 3',
    },
  ]

  return (
    <section
      id="how-it-works"
      aria-label="How Sonus Works"
      className="w-full scroll-mt-24 flex flex-col gap-8 rounded-3xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-8 sm:p-12 shadow-sm"
    >
      {/* Header */}
      <div className="space-y-2 max-w-2xl">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#C5A059] dark:text-[#DFC07A]">
          HOW IT WORKS
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF] tracking-tight">
          Three simple steps to better practice
        </h2>
        <p className="text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
          Zero setup, zero proprietary hardware. Start playing with your existing instrument in seconds.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="flex flex-col justify-between rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-7 shadow-2xs group hover:border-[#C5A059]/60 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-3xl sm:text-4xl text-[#C5A059]">
                  {step.num}
                </span>
                <span className="rounded bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#736E65] dark:text-[#A39C8F]">
                  {step.tag}
                </span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#242321] dark:text-[#EDE8DF]">
                  {step.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
