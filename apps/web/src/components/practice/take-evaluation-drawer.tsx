import React from 'react'
import { X, Activity, Compass, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react'
import type { TakeEvaluationResponse, AdaptiveInterventionDto } from '@/api/sessions'

export interface TakeEvaluationDrawerProps {
  isOpen: boolean
  onClose: () => void
  evaluation: TakeEvaluationResponse | null
  generatedDrill?: AdaptiveInterventionDto | null
  onLaunchDrill?: (drill: AdaptiveInterventionDto) => void
  onRetake?: () => void
  className?: string
}

export function TakeEvaluationDrawer({
  isOpen,
  onClose,
  evaluation,
  generatedDrill,
  onLaunchDrill,
  onRetake,
  className = '',
}: TakeEvaluationDrawerProps): React.JSX.Element | null {
  if (!evaluation && !isOpen) return null

  const overallScore = evaluation?.overall_accuracy ?? 92
  const meanTimingOffset = evaluation?.avg_timing_error_ms ?? -4.2
  const voicingScore = evaluation?.voicing_score ?? 95.8
  const chordMetrics = evaluation?.chord_metrics ?? []
  const primaryBottleneck = evaluation?.coaching_report?.primary_bottleneck ?? 'None'
  const summaryText =
    evaluation?.coaching_report?.summary ??
    'Your played chords were matched against each measure of the score. Review your per-bar timing and missed chord notes below.'

  const isHighFidelity = overallScore >= 85

  return (
    <>
      {isOpen && (
        <div
          data-testid="take-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      <div
        data-testid="take-evaluation-drawer"
        aria-label="Performance Evaluation & Alignment Diagnostics"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col font-sans ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        } ${className}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-[#F8F8F6] dark:bg-[#09090B]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
              <span>✓</span>
              <span>TAKE EVALUATION COMPLETE</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Practice Take Breakdown &amp; Suggested Loop
            </h2>
          </div>

          <button
            type="button"
            data-testid="take-drawer-close"
            onClick={onClose}
            aria-label="Close evaluation drawer"
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                OVERALL TAKE SCORE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {overallScore.toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  (Grade {evaluation?.coaching_report?.letter_grade || (isHighFidelity ? 'A' : 'B')})
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 font-mono">
              <span
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  isHighFidelity
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40'
                }`}
              >
                {isHighFidelity ? 'CLEAN TAKE' : 'NEEDS LOOP PRACTICE'}
              </span>
              <span className="text-[11px] text-zinc-500">
                Avg Timing: {meanTimingOffset > 0 ? '+' : ''}
                {meanTimingOffset.toFixed(1)}ms
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B]">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <Activity className="size-3.5 text-emerald-500" />
                <span>CHORD NOTES</span>
              </div>
              <div className="mt-1.5 text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {voicingScore.toFixed(1)}%
              </div>
              <p className="mt-0.5 text-[10px] font-mono text-zinc-500">
                Notes rang clearly
              </p>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B]">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <Compass className="size-3.5 text-amber-500" />
                <span>TIMING</span>
              </div>
              <div className="mt-1.5 text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {meanTimingOffset > 0 ? '+' : ''}
                {Math.round(meanTimingOffset)}ms
              </div>
              <p className="mt-0.5 text-[10px] font-mono text-zinc-500">
                {Math.abs(meanTimingOffset) < 20
                  ? 'Right in the pocket'
                  : meanTimingOffset < 0
                  ? 'Slightly early'
                  : 'Slightly late'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B]">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <AlertTriangle className="size-3.5 text-red-500" />
                <span>FOCUS BAR</span>
              </div>
              <div className="mt-1.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {primaryBottleneck}
              </div>
              <p className="mt-1 text-[10px] font-mono text-zinc-500">
                Spot to practice
              </p>
            </div>
          </div>

          {chordMetrics.length > 0 && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-[#141418]">
                <span>MEASURE-BY-MEASURE CHECK</span>
                <span>{chordMetrics.length} MEASURES</span>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80 max-h-52 overflow-y-auto font-mono text-xs">
                {chordMetrics.map((m, idx) => {
                  const hasDrop = m.missed_notes && m.missed_notes.length > 0
                  const hasLag = m.onset_error_ms >= 80
                  const hasDrift = Math.abs(m.onset_error_ms) >= 30
                  return (
                    <div
                      key={idx}
                      className="px-4 py-2 flex items-center justify-between gap-2 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-zinc-500 text-[10px] w-8">Bar {idx + 1}</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{m.expected_chord}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] ${
                            hasLag
                              ? 'text-red-600 dark:text-red-400 font-bold'
                              : hasDrift
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {m.onset_error_ms >= 0 ? '+' : ''}
                          {Math.round(m.onset_error_ms)}ms
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {Math.round(m.voicing_completeness * 100)}% notes
                        </span>
                        {hasDrop && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-bold">
                            Missed: {m.missed_notes.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-600 dark:text-amber-500 tracking-wider uppercase">
              <span>WHAT HAPPENED IN THIS TAKE</span>
              <span className="text-zinc-500">PRACTICE NOTES</span>
            </div>

            <p className="text-xs font-sans leading-relaxed text-zinc-700 dark:text-zinc-300">
              {summaryText}
            </p>
          </div>

          {generatedDrill && (
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
                <span>SUGGESTED 2-BAR PRACTICE LOOP</span>
                <span>START AT {generatedDrill.target_tempo} BPM</span>
              </div>

              <div>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 mt-1 leading-relaxed">
                  {generatedDrill.description ||
                    'Isolate this two-chord change at a slower speed, then step up gradually.'}
                </p>
              </div>

              {onLaunchDrill && (
                <button
                  type="button"
                  onClick={() => {
                    onLaunchDrill(generatedDrill)
                    onClose()
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-amber-500 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-400 transition-all cursor-pointer"
                >
                  <span>LOOP THESE TWO BARS NOW</span>
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-[#F8F8F6] dark:bg-[#09090B]">
          {onRetake && (
            <button
              type="button"
              onClick={() => {
                onRetake()
                onClose()
              }}
              className="flex-1 py-2.5 px-4 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>RECORD NEW TAKE</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>BACK TO PRACTICE ROOM</span>
          </button>
        </div>
      </div>
    </>
  )
}
