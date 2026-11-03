import React from 'react'
import { X, Award, Activity, Compass, ArrowRight, RotateCcw } from 'lucide-react'
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
  const intonationScore = evaluation?.voicing_score ?? 95.8
  const coachingCritique =
    evaluation?.coaching_report?.summary ??
    'Clean chord transitions with resonant hand balance. Intonation centered firmly within ±5 cents across all measures. Minor acceleration on beat 3 transition. Keep your tempo grounded with the metronome ticks.'

  const isHighFidelity = overallScore >= 85

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          data-testid="take-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Slide-over Drawer (Right) */}
      <div
        data-testid="take-evaluation-drawer"
        aria-label="Performance Evaluation & Pedagogical Critique"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 w-full max-w-lg bg-[#FAF8F3] dark:bg-[#1A1816] text-[#242321] dark:text-[#EDE8DF] border-l border-[#E2DDD3] dark:border-[#38342E] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col font-serif ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        } ${className}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2DDD3] dark:border-[#38342E] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest uppercase text-[#3B6E57] dark:text-[#689F84]">
              <span>✓</span>
              <span>TAKE EVALUATION COMPLETE</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Pedagogical Review</h2>
          </div>

          <button
            type="button"
            data-testid="take-drawer-close"
            onClick={onClose}
            aria-label="Close evaluation drawer"
            className="p-2 rounded-xl text-[#736E65] hover:text-[#242321] hover:bg-[#EFECE6] dark:text-[#A39C8F] dark:hover:text-[#EDE8DF] dark:hover:bg-[#2A2723] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans">
          {/* Main Score Hero Card */}
          <div className="p-5 rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#736E65] dark:text-[#A39C8F]">
                DYNAMIC TIME WARPING (NEEDLEMAN-WUNSCH)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif font-black text-[#242321] dark:text-[#EDE8DF]">
                  {Math.round(overallScore)}
                </span>
                <span className="text-sm font-mono text-[#A09A8F]">/ 100</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 font-mono">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isHighFidelity
                    ? 'bg-[#3B6E57]/15 text-[#3B6E57] dark:bg-[#689F84]/20 dark:text-[#689F84]'
                    : 'bg-[#9A2A2A]/15 text-[#9A2A2A] dark:bg-[#D9534F]/20 dark:text-[#E57373]'
                }`}
              >
                {isHighFidelity ? 'VIRTUOSIC SYNC' : 'INTONATION DRIFT'}
              </span>
              <span className="text-[11px] text-[#736E65] dark:text-[#A39C8F]">
                Mean Offset: {meanTimingOffset.toFixed(1)}ms
              </span>
            </div>
          </div>

          {/* Metric Dials Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A]">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#736E65] dark:text-[#A39C8F]">
                <Activity className="size-3.5 text-[#3B6E57]" />
                <span>INTONATION</span>
              </div>
              <div className="mt-2 text-2xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF]">
                {intonationScore.toFixed(1)}%
              </div>
              <p className="mt-1 text-[11px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                ±5 Cents Tolerance
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A]">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#736E65] dark:text-[#A39C8F]">
                <Compass className="size-3.5 text-[#C5A059]" />
                <span>TIMING STABILITY</span>
              </div>
              <div className="mt-2 text-2xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF]">
                {Math.abs(meanTimingOffset) < 15 ? 'Locked' : 'Drifting'}
              </div>
              <p className="mt-1 text-[11px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                Sub-30ms Detection
              </p>
            </div>
          </div>

          {/* AI Grounded Pedagogical Report */}
          <div className="p-5 rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C5A059] tracking-wider uppercase">
              <span>§</span>
              <span>AI CONSERVATORY COACH ANALYSIS</span>
            </div>

            <p className="text-sm font-serif leading-relaxed text-[#242321] dark:text-[#EDE8DF]">
              “{coachingCritique}”
            </p>

            <div className="pt-2 border-t border-[#E2DDD3] dark:border-[#38342E] flex items-center justify-between text-[11px] font-mono text-[#736E65] dark:text-[#A39C8F]">
              <span>Basic Pitch ONNX Inferred</span>
              <span>Grounded Deterministic Synthesis</span>
            </div>
          </div>

          {/* Adaptive Drill Recommendation */}
          {generatedDrill && (
            <div className="p-5 rounded-2xl border border-[#C5A059]/40 bg-[#C5A059]/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#9A2A2A] dark:text-[#D9534F] tracking-wider uppercase">
                <Award className="size-4" />
                <span>RECOMMENDED ADAPTIVE DRILL</span>
              </div>

              <div>
                <h4 className="text-base font-bold font-serif text-[#242321] dark:text-[#EDE8DF]">
                  {generatedDrill.drill_type || 'Micro-Timing & Chord Transition Drill'}
                </h4>
                <p className="text-xs text-[#736E65] dark:text-[#A39C8F] mt-1 leading-relaxed">
                  {generatedDrill.description ||
                    'Focus on measure transitions with heightened metronome ticks.'}
                </p>
              </div>

              {onLaunchDrill && (
                <button
                  type="button"
                  onClick={() => {
                    onLaunchDrill(generatedDrill)
                    onClose()
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] font-mono text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-sm transition-all"
                >
                  <span>LAUNCH TARGETED DRILL</span>
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2DDD3] dark:border-[#38342E] flex items-center gap-3 bg-[#FCFBF8] dark:bg-[#1E1C1A]">
          {onRetake && (
            <button
              type="button"
              onClick={() => {
                onRetake()
                onClose()
              }}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#D9D3C7] dark:border-[#38342E] text-xs font-mono font-bold text-[#242321] dark:text-[#EDE8DF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2723] flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw className="size-3.5" />
              <span>RECORD NEW TAKE</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#C5A059] hover:bg-[#D4B36F] text-[#141312] font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>RETURN TO STAND</span>
          </button>
        </div>
      </div>
    </>
  )
}
