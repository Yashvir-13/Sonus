import React from 'react'
import { motion } from 'motion/react'
import { Music, Disc } from 'lucide-react'

export type MusicianLoadingScreenProps = {
  headline?: string
  subtext?: string
  fullscreen?: boolean
  showStaffAnimation?: boolean
}

/**
 * Archival Musician Loading Screen
 * Dual-theme (Studio Alabaster & Obsidian), accessible, zero layout shift.
 */
export function MusicianLoadingScreen({
  headline = 'Calibrating Studio Acoustics',
  subtext = 'Preparing interactive score, chord voicings, and practice stands...',
  fullscreen = true,
  showStaffAnimation = true,
}: MusicianLoadingScreenProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="musician-loading-screen"
      className={`${
        fullscreen ? 'fixed inset-0 z-50 min-h-screen w-full' : 'w-full py-16'
      } flex flex-col items-center justify-center bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 px-6 transition-colors select-none`}
    >
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* Emblem / Stave Animation */}
        <div className="relative flex items-center justify-center size-20">
          {/* Subtle Outer Ring */}
          <div className="absolute inset-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-[#121215]/70 shadow-sm backdrop-blur-sm" />

          {/* Pulsing Metronome / Note Icon */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-10 flex items-center justify-center size-12 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"
          >
            <Music className="size-6 animate-pulse" />
          </motion.div>
        </div>

        {/* 5-Line Musical Staff Indicator */}
        {showStaffAnimation && (
          <div
            className="w-48 py-2 relative flex flex-col justify-between h-9 opacity-80"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4].map((lineIdx) => (
              <div
                key={lineIdx}
                className="w-full h-px bg-zinc-300 dark:bg-zinc-700/80"
              />
            ))}
            {/* Sliding Notehead */}
            <motion.div
              animate={{
                x: [-70, 70],
                y: [2, -6, 4, -2, 2],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              className="absolute left-1/2 top-1/2 -ml-2 -mt-2 size-4 rounded-full bg-amber-500 shadow-sm border border-amber-600 dark:border-amber-400 flex items-center justify-center"
            >
              <span className="size-1 rounded-full bg-white" />
            </motion.div>
          </div>
        )}

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-[10px] font-mono tracking-widest uppercase text-amber-600 dark:text-amber-500">
            <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>SONUS STUDIO DESK</span>
          </div>
          <h2 className="text-xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {headline}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans max-w-sm mx-auto">
            {subtext}
          </p>
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-36 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500"
          />
        </div>
      </div>
    </div>
  )
}

export type AudioProcessingHudProps = {
  isProcessing: boolean
  statusMessage?: string
  timingStage?: 'recording' | 'encoding' | 'aligning' | 'coaching'
}

/**
 * Compact, Non-blocking Audio Evaluation HUD
 * Appears during take submission and ONNX transcription.
 */
export function AudioProcessingHud({
  isProcessing,
  statusMessage = 'Aligning onsets and transcribing voicings...',
  timingStage = 'aligning',
}: AudioProcessingHudProps): React.JSX.Element | null {
  if (!isProcessing) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      role="status"
      aria-live="polite"
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-[#121215]/95 shadow-2xl backdrop-blur-md flex items-center gap-4 text-xs font-sans text-zinc-900 dark:text-zinc-100 ring-1 ring-amber-500/20"
    >
      <div className="relative flex items-center justify-center size-5 text-amber-500">
        <Disc className="size-4 animate-spin text-amber-500" />
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <span>{statusMessage}</span>
          <span className="text-[10px] font-mono font-normal text-amber-600 dark:text-amber-400">
            {timingStage === 'encoding'
              ? 'WAV Encoding'
              : timingStage === 'aligning'
              ? 'Basic Pitch ONNX'
              : 'AI Coach'}
          </span>
        </span>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
          Sequence alignment against canonical measure grid
        </span>
      </div>
    </motion.div>
  )
}
