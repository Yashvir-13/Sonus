import { useState } from 'react'
import { useUser, useClerk } from '@clerk/react'
import { useSpatialNavigation } from '@/components/spatial'
import {
  LIVING_MANUSCRIPT_COLORS,
  MUSICAL_GLYPHS,
} from '@/design-system/tokens'
import { COMPOSER_PROFILE_SPEC } from '@/design-system/screens'

export interface RepertoireItem {
  title: string
  composer: string
  difficulty: string // Roman numerals: 'II', 'IV', 'V'
  masteryPercent: number
  lastPracticed: string
  status: 'Conquered' | 'In Active Discipline' | 'Experimental Sanctuary'
  targetTempoBpm: number
}

export interface ComposerProfileScreenProps {
  isGuest?: boolean
  onExitGuest?: () => void
  onReturnToStand?: () => void
  className?: string
}

export function ComposerProfileScreen({
  isGuest = false,
  onExitGuest,
  onReturnToStand,
  className = '',
}: ComposerProfileScreenProps) {
  const { panTo } = useSpatialNavigation()
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false)
  const [repertoireFilter, setRepertoireFilter] = useState<'all' | 'active' | 'conquered'>('all')

  const handleReturn = () => {
    if (onReturnToStand) {
      onReturnToStand()
    } else {
      panTo('practice')
    }
  }

  // Display name resolution: Clerk logged in name -> default 'Maestro Yash'
  const displayName =
    isSignedIn && user?.fullName
      ? user.fullName
      : isSignedIn && user?.username
        ? user.username
        : COMPOSER_PROFILE_SPEC.folioHeader.defaultName

  const authRegistry =
    isSignedIn && user
      ? `REGISTRY: USR_${user.id.slice(-8).toUpperCase()} // STATUS: AUTHENTICATED // DISCIPLINE ACTIVE`
      : isGuest
        ? 'REGISTRY: GUEST_MMXXVI // STATUS: AUDITION VIRTUS // DISCIPLINE ACTIVE'
        : COMPOSER_PROFILE_SPEC.folioHeader.authVerification

  const physiognomy = COMPOSER_PROFILE_SPEC.defaultPhysiognomy
  const repertoireList = COMPOSER_PROFILE_SPEC.defaultRepertoire as unknown as RepertoireItem[]

  const filteredRepertoire = repertoireList.filter((item) => {
    if (repertoireFilter === 'active') return item.status === 'In Active Discipline'
    if (repertoireFilter === 'conquered') return item.status === 'Conquered'
    return true
  })

  const handleExportFolio = () => {
    const summary = `PRISM FOLIO LEDGER — ${displayName}
Status: ${authRegistry}
Total Practice: ${physiognomy.totalPracticeHours} hrs (${physiognomy.totalNotesArticulated} notes)
Intonation Purity: ${physiognomy.intonationPurityPercent}% (Timing Precision: ±${physiognomy.timingPrecisionMs}ms)
Repertoire Studied: ${repertoireList.map((r) => `${r.title} (${r.masteryPercent}%)`).join(', ')}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2500)
    }
  }

  const handleSignOutOrExit = () => {
    if (isGuest && onExitGuest) {
      onExitGuest()
    } else if (isSignedIn) {
      signOut()
    }
  }

  return (
    <div
      className={`w-full min-h-screen bg-[#F4F1EA] text-[#2C2A29] p-4 md:p-8 flex flex-col justify-between select-none ${className}`}
      data-testid="composer-profile-screen"
    >
      {/* Outer Classical Double Border Frame Container */}
      <div className="flex-1 w-full max-w-6xl mx-auto border-2 border-[#2C2A29] p-6 md:p-8 bg-[#F4F1EA] shadow-none flex flex-col justify-between relative">
        {/* Decorative corner flourishes */}
        <span className="absolute top-1 left-2 font-serif text-sm text-[#2C2A29]/50 select-none">
          ⌜
        </span>
        <span className="absolute top-1 right-2 font-serif text-sm text-[#2C2A29]/50 select-none">
          ⌝
        </span>
        <span className="absolute bottom-1 left-2 font-serif text-sm text-[#2C2A29]/50 select-none">
          ⌞
        </span>
        <span className="absolute bottom-1 right-2 font-serif text-sm text-[#2C2A29]/50 select-none">
          ⌟
        </span>

        {/* 1. 17th-Century Printed Treatise Frontispiece Header */}
        <header className="border-b-2 border-[#2C2A29] pb-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Woodcut Emblem Crest */}
            <div className="flex items-center gap-5">
              {/* Circular Illuminated Woodcut Crest */}
              <div
                className="relative w-22 h-22 flex-shrink-0 flex items-center justify-center border-2 border-[#2C2A29] bg-[#E9E4DA] rounded-none shadow-none"
                aria-label="Composer Monogram Crest"
              >
                {/* SVG Concentric Rings and Engraved Astrolabe Hatching */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full absolute inset-0 pointer-events-none"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="#2C2A29"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#2C2A29"
                    strokeWidth="0.75"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="none"
                    stroke="#2C2A29"
                    strokeWidth="1"
                  />
                  {/* Subtle 8-point compass ticks */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <line
                      key={deg}
                      x1="50"
                      y1="6"
                      x2="50"
                      y2="10"
                      stroke="#2C2A29"
                      strokeWidth="1"
                      transform={`rotate(${deg} 50 50)`}
                    />
                  ))}
                </svg>

                {/* Central Treble Clef Emblem with Crimson Accent */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <span className="font-serif text-4xl text-[#2C2A29] leading-none">
                    {MUSICAL_GLYPHS.gClef}
                  </span>
                  <span className="font-mono text-[8px] font-bold tracking-widest text-[#9A2A2A] -mt-1">
                    MMXXVI
                  </span>
                </div>
              </div>

              {/* Frontispiece Performer Titles */}
              <div>
                <div className="font-mono text-[10px] text-[#7E7570] uppercase tracking-widest">
                  Folio II · Persona et Physiognomia
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#2C2A29] mt-0.5">
                  {displayName}
                </h1>
                <div className="font-serif italic text-sm text-[#7E7570] mt-0.5">
                  {COMPOSER_PROFILE_SPEC.folioHeader.title}
                </div>
                <div className="font-mono text-[10px] text-[#9A2A2A] tracking-wider mt-1.5 font-semibold">
                  {authRegistry}
                </div>
              </div>
            </div>

            {/* Right: Return to Stand Quick Action */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleReturn}
                className="flex items-center gap-2 border border-[#2C2A29] bg-[#F4F1EA] px-5 py-2.5 font-serif text-sm font-semibold hover:border-[#9A2A2A] hover:bg-[#E9E4DA] hover:text-[#9A2A2A] transition-colors shadow-none cursor-pointer"
                aria-label="Descend to Practice Stand"
              >
                <span>↓</span>
                <span className="font-mono text-base">
                  {MUSICAL_GLYPHS.fermata}
                </span>
                <span>Return to Practice Stand</span>
              </button>
              <div className="font-mono text-[9px] text-[#7E7570] tracking-wider uppercase">
                Continuous 2D Navigation [S / Esc]
              </div>
            </div>
          </div>
        </header>

        {/* 2. Two-Column Folio Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-auto">
          {/* ======================================================== */}
          {/* Column 1 (Left): The Physiognomy of Practice            */}
          {/* ======================================================== */}
          <section
            className="flex flex-col justify-between border-t lg:border-t-0 border-[#2C2A29]/30 pt-4 lg:pt-0"
            aria-labelledby="physiognomy-heading"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#2C2A29] pb-2 mb-4">
                <h2
                  id="physiognomy-heading"
                  className="font-serif text-xl font-bold tracking-tight text-[#2C2A29]"
                >
                  I. The Physiognomy of Practice
                </h2>
                <span className="font-mono text-[10px] text-[#7E7570] uppercase tracking-wider">
                  Physiognomia Exercitationis
                </span>
              </div>

              <p className="font-serif italic text-xs text-[#7E7570] mb-4 leading-relaxed">
                "An analytical ledger of physical and acoustic habits carved
                across microtonal intonation deviations, tempo horizons, and
                kinetic constancy."
              </p>

              {/* Structured Telemetry Ledger Grid */}
              <div className="grid grid-cols-2 gap-3 border border-[#2C2A29] p-4 bg-[#E9E4DA]/40 font-mono mb-5">
                {/* Total Discipline */}
                <div className="border-r border-b border-[#2C2A29]/20 pb-3 pr-3">
                  <div className="text-[9px] text-[#7E7570] uppercase tracking-wider">
                    Total Discipline
                  </div>
                  <div className="text-xl font-bold text-[#2C2A29] mt-0.5">
                    {physiognomy.totalPracticeHours}{' '}
                    <span className="text-xs font-normal">hrs</span>
                  </div>
                  <div className="text-[10px] text-[#7E7570] mt-0.5">
                    {physiognomy.totalNotesArticulated.toLocaleString()} notes
                  </div>
                </div>

                {/* Daily Streak */}
                <div className="border-b border-[#2C2A29]/20 pb-3 pl-3">
                  <div className="text-[9px] text-[#7E7570] uppercase tracking-wider">
                    Daily Constancy
                  </div>
                  <div className="text-xl font-bold text-[#2C2A29] mt-0.5">
                    {physiognomy.consecutiveStreakDays}{' '}
                    <span className="text-xs font-normal">Days</span>
                  </div>
                  <div className="text-[10px] text-[#9A2A2A] mt-0.5 font-semibold">
                    Non omisso die (Active)
                  </div>
                </div>

                {/* Intonation Purity */}
                <div className="border-r border-[#2C2A29]/20 pt-3 pr-3">
                  <div className="text-[9px] text-[#7E7570] uppercase tracking-wider">
                    Intonation Purity
                  </div>
                  <div className="text-xl font-bold text-[#9A2A2A] mt-0.5">
                    {physiognomy.intonationPurityPercent}%
                  </div>
                  <div className="text-[10px] text-[#7E7570] mt-0.5">
                    Harmonic poise (±3¢)
                  </div>
                </div>

                {/* Timing Precision */}
                <div className="pt-3 pl-3">
                  <div className="text-[9px] text-[#7E7570] uppercase tracking-wider">
                    Timing Precision
                  </div>
                  <div className="text-xl font-bold text-[#2C2A29] mt-0.5">
                    ±{physiognomy.timingPrecisionMs}{' '}
                    <span className="text-xs font-normal">ms</span>
                  </div>
                  <div className="text-[10px] text-[#7E7570] mt-0.5">
                    Mean onset latency
                  </div>
                </div>
              </div>

              {/* Tempo Velocity Bands */}
              <div className="flex justify-between items-center font-mono text-xs border border-[#2C2A29] px-3 py-2 bg-[#F4F1EA] mb-5">
                <div>
                  <span className="text-[#7E7570] uppercase text-[10px] block">
                    Max Controlled Tempo
                  </span>
                  <span className="font-bold text-[#2C2A29]">
                    {physiognomy.maxControlledTempoBpm} BPM
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#9A2A2A] uppercase text-[10px] block font-semibold">
                    Breakdown Horizon
                  </span>
                  <span className="font-bold text-[#9A2A2A]">
                    {physiognomy.breakdownHorizonBpm} BPM
                  </span>
                </div>
              </div>

              {/* Analytical Diagnoses of Player Habits */}
              <div className="border border-[#2C2A29] p-4 bg-[#F4F1EA]">
                <div className="flex items-center gap-2 font-serif text-sm font-bold text-[#2C2A29] border-b border-[#2C2A29]/30 pb-2 mb-3">
                  <span className="text-[#9A2A2A]">{MUSICAL_GLYPHS.caesura}</span>
                  <span>Diagnosed Habitus & Kinetic Biases</span>
                </div>

                <ul className="space-y-2.5">
                  {physiognomy.dominantHabits.map((habit, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs font-serif leading-relaxed"
                    >
                      <span className="font-mono text-[11px] font-bold text-[#9A2A2A] flex-shrink-0 mt-0.5">
                        {idx === 0
                          ? '♯ +5¢'
                          : idx === 1
                            ? '♭ -4¢'
                            : '𝄩 +4%'}
                      </span>
                      <span className="text-[#2C2A29]/90 italic">{habit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* Column 2 (Right): The Repertoire Ledger                  */}
          {/* ======================================================== */}
          <section
            className="flex flex-col justify-between border-t lg:border-t-0 border-[#2C2A29]/30 pt-4 lg:pt-0"
            aria-labelledby="repertoire-heading"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#2C2A29] pb-2 mb-4">
                <h2
                  id="repertoire-heading"
                  className="font-serif text-xl font-bold tracking-tight text-[#2C2A29]"
                >
                  II. The Repertoire Ledger
                </h2>
                {/* Filter Toggles */}
                <div className="flex gap-1 font-mono text-[10px]">
                  <button
                    onClick={() => setRepertoireFilter('all')}
                    className={`px-2 py-0.5 border ${
                      repertoireFilter === 'all'
                        ? 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA]'
                        : 'border-[#2C2A29]/30 bg-transparent text-[#2C2A29]'
                    }`}
                  >
                    All ({repertoireList.length})
                  </button>
                  <button
                    onClick={() => setRepertoireFilter('active')}
                    className={`px-2 py-0.5 border ${
                      repertoireFilter === 'active'
                        ? 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA]'
                        : 'border-[#2C2A29]/30 bg-transparent text-[#2C2A29]'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setRepertoireFilter('conquered')}
                    className={`px-2 py-0.5 border ${
                      repertoireFilter === 'conquered'
                        ? 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA]'
                        : 'border-[#2C2A29]/30 bg-transparent text-[#2C2A29]'
                    }`}
                  >
                    Conquered
                  </button>
                </div>
              </div>

              <p className="font-serif italic text-xs text-[#7E7570] mb-4 leading-relaxed">
                "Catalogue of studied compositions, difficulty gradations, and
                mechanical mastery indices."
              </p>

              {/* Masterworks Cards */}
              <div className="space-y-4">
                {filteredRepertoire.map((item, idx) => {
                  const isConquered = item.status === 'Conquered'
                  const isActive = item.status === 'In Active Discipline'

                  return (
                    <div
                      key={idx}
                      className="border border-[#2C2A29] bg-[#E9E4DA]/30 p-4 transition-colors hover:border-[#9A2A2A]"
                    >
                      {/* Title & Difficulty */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-serif text-base font-bold text-[#2C2A29]">
                            {item.title}
                          </h3>
                          <div className="font-serif italic text-xs text-[#7E7570]">
                            {item.composer}
                          </div>
                        </div>

                        {/* Difficulty Roman Numeral Box */}
                        <div
                          className="font-mono text-xs border border-[#2C2A29] px-2 py-0.5 bg-[#F4F1EA] text-[#2C2A29] font-bold"
                          title={`Difficulty Gradation: ${item.difficulty}`}
                        >
                          Gradus {item.difficulty}
                        </div>
                      </div>

                      {/* Hand-Engraved Progress Bar */}
                      <div className="my-3">
                        <div className="flex justify-between font-mono text-[10px] mb-1">
                          <span className="text-[#7E7570] uppercase">
                            Mastery Index
                          </span>
                          <span className="font-bold text-[#2C2A29]">
                            {item.masteryPercent}%
                          </span>
                        </div>
                        {/* 0px radius custom progress bar with hairline border */}
                        <div className="w-full h-2.5 border border-[#2C2A29] bg-[#F4F1EA] p-0.5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isConquered
                                ? 'bg-[#2C2A29]'
                                : isActive
                                  ? 'bg-[#9A2A2A]'
                                  : 'bg-[#7E7570]'
                            }`}
                            style={{ width: `${item.masteryPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Milestones & Wax Seal Status */}
                      <div className="flex justify-between items-center pt-2 border-t border-[#2C2A29]/20 font-mono text-[11px]">
                        <div className="text-[#7E7570]">
                          <span>Milestone: </span>
                          <span className="font-semibold text-[#2C2A29]">
                            {item.targetTempoBpm} BPM
                          </span>
                          <span className="mx-1.5">·</span>
                          <span className="text-[10px]">
                            {item.lastPracticed}
                          </span>
                        </div>

                        {/* Wax Seal Status Stamp */}
                        <span
                          className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider border ${
                            isConquered
                              ? 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA]'
                              : isActive
                                ? 'border-[#9A2A2A] text-[#9A2A2A] bg-[#F4F1EA]'
                                : 'border-[#7E7570] text-[#7E7570] bg-[#F4F1EA]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </div>

        {/* 3. Folio Colophon & Action Ledger Footer */}
        <footer className="border-t-2 border-[#2C2A29] pt-4 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportFolio}
                className="font-mono text-xs border border-[#2C2A29] px-3.5 py-1.5 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] hover:text-[#9A2A2A] transition-colors shadow-none cursor-pointer"
              >
                {copyFeedback ? '✓ Folio Copied' : '𝄌 Export Folio Ledger'}
              </button>

              <button
                onClick={() => panTo('tuning')}
                className="font-mono text-xs border border-[#2C2A29] px-3.5 py-1.5 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] hover:text-[#9A2A2A] transition-colors shadow-none cursor-pointer"
              >
                𝄡 Audio Calibration
              </button>

              <button
                onClick={handleSignOutOrExit}
                className="font-mono text-xs border border-[#9A2A2A] text-[#9A2A2A] px-3.5 py-1.5 hover:bg-[#9A2A2A] hover:text-[#F4F1EA] transition-colors shadow-none cursor-pointer"
              >
                {isGuest ? 'Depart Sanctuary (Exit Guest)' : 'Depart Sanctuary (Sign Out)'}
              </button>
            </div>

            {/* Colophon & Latin Sign-off */}
            <div className="font-mono text-[10px] text-[#7E7570] text-right">
              <div>PRISM ADAPTIVE ENGINE // ANNO MMXXVI</div>
              <div className="italic font-serif text-[#2C2A29]">
                Ex officina scriptoria · Soli Deo Gloria
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
