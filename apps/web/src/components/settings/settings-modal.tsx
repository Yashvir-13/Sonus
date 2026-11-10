import React, { useState, useEffect, useRef } from 'react'
import { X, User, Sliders, Mic, Check, Save } from 'lucide-react'

export interface StudioPreferences {
  defaultInstrument: 'guitar' | 'piano'
  defaultNotation: 'staff' | 'keys'
  metronomeSound: 'wooden' | 'digital'
  concertPitchHz: number // 440 or 432
  micSensitivityDb: number // e.g. -40
}

export const DEFAULT_STUDIO_PREFERENCES: StudioPreferences = {
  defaultInstrument: 'piano',
  defaultNotation: 'staff',
  metronomeSound: 'wooden',
  concertPitchHz: 440,
  micSensitivityDb: -38,
}

export function loadStoredPreferences(): StudioPreferences {
  if (typeof window === 'undefined') return DEFAULT_STUDIO_PREFERENCES
  try {
    const raw = localStorage.getItem('sonus_studio_preferences')
    if (raw) {
      return { ...DEFAULT_STUDIO_PREFERENCES, ...JSON.parse(raw) }
    }
  } catch {
    // fallback
  }
  return DEFAULT_STUDIO_PREFERENCES
}

export function saveStoredPreferences(prefs: StudioPreferences): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('sonus_studio_preferences', JSON.stringify(prefs))
  } catch {
    // quota exceeded or private mode
  }
}

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentName?: string
  currentUsername?: string
  currentEmail?: string
  onSaveProfile?: (name: string, username: string) => Promise<void>
  onSavePreferences?: (prefs: StudioPreferences) => void
}

export function SettingsModal({
  isOpen,
  onClose,
  currentName = 'Studio Musician',
  currentUsername = 'musician',
  currentEmail = 'musician@sonus.studio',
  onSaveProfile,
  onSavePreferences,
}: SettingsModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'account' | 'studio' | 'audio'>('account')

  // Account form
  const [name, setName] = useState(currentName)
  const [username, setUsername] = useState(currentUsername)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Studio preferences
  const [preferences, setPreferences] = useState<StudioPreferences>(loadStoredPreferences)

  // Audio mic testing
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [micVolumeLevel, setMicVolumeLevel] = useState(0)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setName(currentName)
    setUsername(currentUsername)
  }, [currentName, currentUsername])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSaveSuccess(false)
    setIsSavingProfile(true)

    try {
      if (onSaveProfile) {
        await onSaveProfile(name, username)
      }
      setProfileSaveSuccess(true)
      setTimeout(() => setProfileSaveSuccess(false), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.'
      setProfileError(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const updatePreference = <K extends keyof StudioPreferences>(
    key: K,
    value: StudioPreferences[K]
  ) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value }
      saveStoredPreferences(next)
      onSavePreferences?.(next)
      return next
    })
  }

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)

      const buffer = new Float32Array(analyser.fftSize)
      const checkVolume = () => {
        analyser.getFloatTimeDomainData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
          sum += (buffer[i] || 0) * (buffer[i] || 0)
        }
        const rms = Math.sqrt(sum / buffer.length)
        const db = 20 * Math.log10(Math.max(1e-5, rms))
        // Map -60dB..0dB to 0..100%
        const pct = Math.max(0, Math.min(100, ((db + 60) / 60) * 100))
        setMicVolumeLevel(pct)
        animFrameRef.current = requestAnimationFrame(checkVolume)
      }
      animFrameRef.current = requestAnimationFrame(checkVolume)
      setIsTestingMic(true)
    } catch {
      setIsTestingMic(false)
    }
  }

  const stopMicTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setIsTestingMic(false)
    setMicVolumeLevel(0)
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  if (!isOpen) return null

  return (
    <div
      data-testid="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="w-full max-w-2xl bg-white dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500 block">
              PREFERENCES &amp; IDENTITY
            </span>
            <h2 id="settings-dialog-title" className="text-xl sm:text-2xl font-bold tracking-tight">
              Studio &amp; Account Settings
            </h2>
          </div>

          <button
            type="button"
            data-testid="close-settings-modal-btn"
            onClick={() => {
              stopMicTest()
              onClose()
            }}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 bg-white dark:bg-[#111114] text-xs font-mono">
          <button
            type="button"
            data-testid="settings-tab-account"
            onClick={() => {
              stopMicTest()
              setActiveTab('account')
            }}
            className={`py-3 px-4 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'account'
                ? 'border-amber-500 text-zinc-900 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <User className="size-3.5" />
            <span>Profile &amp; Account</span>
          </button>

          <button
            type="button"
            data-testid="settings-tab-studio"
            onClick={() => {
              stopMicTest()
              setActiveTab('studio')
            }}
            className={`py-3 px-4 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'studio'
                ? 'border-amber-500 text-zinc-900 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sliders className="size-3.5" />
            <span>Studio Preferences</span>
          </button>

          <button
            type="button"
            data-testid="settings-tab-audio"
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'audio'
                ? 'border-amber-500 text-zinc-900 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Mic className="size-3.5" />
            <span>Audio &amp; Mic Input</span>
          </button>
        </div>

        {/* Tab 1: Profile & Account */}
        {activeTab === 'account' && (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-5 overflow-y-auto">
            {profileError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-600 dark:text-red-400">
                {profileError}
              </div>
            )}
            {profileSaveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Check className="size-4" />
                <span>Profile successfully updated.</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="settings-name" className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                FULL NAME
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-amber-500 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-username" className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                USERNAME (3-30 CHARACTERS)
              </label>
              <input
                id="settings-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-email" className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>PRIMARY EMAIL</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Verified via Clerk</span>
              </label>
              <input
                id="settings-email"
                type="email"
                value={currentEmail}
                disabled
                className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 font-mono cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="size-4" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Studio Preferences */}
        {activeTab === 'studio' && (
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Default Instrument */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 block">
                DEFAULT PRACTICE INSTRUMENT
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'piano', label: 'Acoustic Piano', icon: '🎹' },
                  { id: 'guitar', label: '6-String Guitar', icon: '🎸' },
                ].map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => updatePreference('defaultInstrument', inst.id as 'guitar' | 'piano')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      preferences.defaultInstrument === inst.id
                        ? 'bg-amber-500/10 border-amber-500 font-bold'
                        : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">{inst.label}</span>
                    <span className="text-lg">{inst.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Notation */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 block">
                DEFAULT PIANO VISUALIZATION
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'staff', label: 'Flowing Grand Staff (Sheet Music)', desc: 'Sight-reading score' },
                  { id: 'keys', label: 'Neon Waterfall (Falling Keys)', desc: 'Synthesia-style roll' },
                ].map((not) => (
                  <button
                    key={not.id}
                    type="button"
                    onClick={() => updatePreference('defaultNotation', not.id as 'staff' | 'keys')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      preferences.defaultNotation === not.id
                        ? 'bg-amber-500/10 border-amber-500 font-bold'
                        : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="text-xs text-zinc-900 dark:text-zinc-100 font-bold">{not.label}</div>
                    <div className="text-[10px] text-zinc-500">{not.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Metronome Sound */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 block">
                METRONOME CLICK SOUND
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'wooden', label: 'Authentic Wooden Block', desc: 'Dual-cavity acoustic resonance' },
                  { id: 'digital', label: 'Digital Rimshot Beep', desc: 'Crisp electronic pulse' },
                ].map((metro) => (
                  <button
                    key={metro.id}
                    type="button"
                    onClick={() => updatePreference('metronomeSound', metro.id as 'wooden' | 'digital')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      preferences.metronomeSound === metro.id
                        ? 'bg-amber-500/10 border-amber-500 font-bold'
                        : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="text-xs text-zinc-900 dark:text-zinc-100 font-bold">{metro.label}</div>
                    <div className="text-[10px] text-zinc-500">{metro.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Concert Pitch */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 block">
                CONCERT PITCH CALIBRATION
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { hz: 440, label: 'A4 = 440 Hz (Standard Concert Pitch)' },
                  { hz: 432, label: 'A4 = 432 Hz (Verdi Harmonic Tuning)' },
                ].map((pitch) => (
                  <button
                    key={pitch.hz}
                    type="button"
                    onClick={() => updatePreference('concertPitchHz', pitch.hz)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      preferences.concertPitchHz === pitch.hz
                        ? 'bg-amber-500/10 border-amber-500 font-bold'
                        : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="text-xs text-zinc-900 dark:text-zinc-100">{pitch.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Audio & Microphone Calibration */}
        {activeTab === 'audio' && (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 block">
                LIVE INPUT SENSITIVITY VU METER
              </span>
              <p className="text-xs text-zinc-500">
                Test your microphone volume to ensure chords and takes are captured clearly without background noise.
              </p>

              <div className="p-4 rounded-2xl bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Input Signal Level:</span>
                  <span className="font-bold">{micVolumeLevel.toFixed(0)}%</span>
                </div>

                {/* Level Meter Bar */}
                <div className="w-full h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                    style={{ width: `${micVolumeLevel}%` }}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={isTestingMic ? stopMicTest : startMicTest}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isTestingMic
                        ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Mic className="size-4" />
                    <span>{isTestingMic ? 'Stop Test' : 'Test Microphone'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sensitivity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">NOISE GATE THRESHOLD</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {preferences.micSensitivityDb} dB
                </span>
              </div>
              <input
                type="range"
                min="-60"
                max="-20"
                step="1"
                value={preferences.micSensitivityDb}
                onChange={(e) => updatePreference('micSensitivityDb', parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>-60 dB (High Sensitivity)</span>
                <span>-40 dB (Balanced)</span>
                <span>-20 dB (Noisy Room)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
