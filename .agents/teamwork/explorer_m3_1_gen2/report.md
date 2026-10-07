# Architectural Blueprint & Implementation Specification: Living Manuscript Landing Page

**Target Component**: `apps/web/src/components/screens/landing-screen.tsx`  
**Author**: Explorer M3-1 (Gen 2)  
**Date**: 2026-10-06  
**Status**: Ready for Implementation (Worker M3)  

---

## 1. Executive Summary & Problem Boundary

The Living Manuscript Landing Page serves as the frontispiece and ceremonial gateway of the **PRISM Adaptive Musical Practice System**. It establishes the aesthetic standard defined in `DESIGN.md` and `PROJECT.md`—a 17th-century printed treatise and illuminated sheet music canvas fused with high-precision acoustic telemetry.

### Core Objectives Formulated:
1. **Hero Section with Reactive Ink Bleed Bloom**:
   - Master calligraphic title **"PRISM"** set in 80px+ Playfair Display with the SVG turbulence & displacement filter `#ink-bleed` provided by `<InkBleedFilter />`.
   - Dynamic, reactive bloom interaction: on pointer hover / focus, the ink diffusion underlay expands and intensifies (`scale` increases from 5 to 8, `stdDeviation` from 0.6 to 1.1), simulating iron gall ink absorbing into unbleached manuscript parchment fibers.
   - Editorial subtitle (*Opus Manuscriptum: Adaptive Musical Practice System*) and treatise proposition.
2. **Historical Latin Marginalia & Technical Telemetry**:
   - Double-ruled charcoal hairline border (`border-2 border-[#2C2A29]` with inner rules and classical corner flourish marks).
   - Top-left Latin motto: **`AUDIRE · DISCERE · EXERCERE`** (*To Hear · To Learn · To Practice*).
   - Top-right monospace telemetry: **`REV. MMXXVI // ACOUSTIC INTELLIGENCE ENGINE // STANDBY`** with pulsing status indicator and SMuFL natural glyph `♮`.
   - Bottom colophon and parchment fiber status notes.
3. **Three Illuminated Parchment Feature Scrolls**:
   - Aligned across a subtle 5-line musical staff watermark (`staff-bg`):
     - **Scroll I: The Attentive Ear** (Adaptive Intonation & Real-Time Pitch Ribbon; G-Clef `𝄞`).
     - **Scroll II: The Spatial Canvas** (Temporal DTW Alignment & 2D Motion Physics; Caesura `𝄩`).
     - **Scroll III: The Constellation Memory** (Celestial Constellation History & Scatter Plot; Star Node `✦`).
   - Zero-radius hairline parchment cards with microtonal telemetry badges and classical corner brackets.
4. **Conservatory Guild Clerk Authentication Folio**:
   - Embedded Clerk `<SignIn />` component wrapped in an illuminated manuscript border.
   - Tailored Clerk `appearance` configuration using Living Manuscript tokens: sharp zero-radius inputs (`rounded-none`), `#E9E4DA` input fills, `#2C2A29` charcoal borders, `#2C2A29` solid action buttons with crimson `#9A2A2A` hover transitions.
5. **Direct "Audition as Guest (Instant Access)" Pathway**:
   - Ceremonial button flanked by a fermata glyph `𝄐`.
   - Manages `sessionStorage.setItem('prism_guest_mode', 'true')` and hash `#guest`.
   - Direct instantaneous transition into `<App isGuest={true} onExitGuest={...} />` for musicians and automated Playwright test verification without authentication hurdles.

---

## 2. Design System Alignment & Token Mapping

| Element | Living Manuscript Token | CSS / Tailwind Value | Role / Rationale |
|---|---|---|---|
| Canvas Background | `LIVING_MANUSCRIPT_COLORS.parchment` | `#F4F1EA` | Unbleached calfskin parchment |
| Recessed Inputs / Cards | `LIVING_MANUSCRIPT_COLORS.parchmentSecondary` | `#E9E4DA` | Aged vellum ledger trough |
| Structural Lines / Text | `LIVING_MANUSCRIPT_COLORS.charcoal` | `#2C2A29` | Iron gall / lampblack charcoal ink |
| Accents / Wax Seals / Errors | `LIVING_MANUSCRIPT_COLORS.crimson` | `#9A2A2A` | Rubricated cochineal crimson |
| Marginalia / Telemetry | `LIVING_MANUSCRIPT_COLORS.mutedInk` | `#7E7570` | Faint graphite wash |
| Editorial Typography | `LIVING_MANUSCRIPT_FONTS.serif` | `'Playfair Display', Georgia, serif` | Treatise titles & opus annotations |
| Telemetry Typography | `LIVING_MANUSCRIPT_FONTS.mono` | `'Geist Mono', monospace` | Technical status & cents measurements |
| Body Typography | `LIVING_MANUSCRIPT_FONTS.sans` | `'Inter', sans-serif` | Functional labels |
| Border Radius | `LIVING_MANUSCRIPT_GEOMETRY.radius` | `0px` (`rounded-none`) | Strict zero-radius guillotine-trimmed edges |
| Border Rules | `borderHairline` / `borderDouble` | `1px solid #2C2A29` / `3px double` | Classical copperplate engravings |
| Musical Glyphs | `MUSICAL_GLYPHS` | `𝄐` (fermata), `𝄩` (caesura), `𝄞` (gClef), `✦` (star) | SMuFL standard iconography |

---

## 3. Structural Component Architecture

```text
[LandingScreen (landing-screen.tsx)]
│
├── <InkBleedFilter id="ink-bleed" ... /> (SVG turbulence & displacement filter in DOM)
│
├── <main className="bg-[#F4F1EA] text-[#2C2A29] min-h-screen ...">
│   │
│   ├── Outer Double Hairline Frame (Concentric borders with corner flourishes)
│   │   ├── Top Header:
│   │   │   ├── Latin Marginalia: "AUDIRE · DISCERE · EXERCERE"
│   │   │   └── Technical Telemetry: "REV. MMXXVI // ACOUSTIC ENGINE // STANDBY ♮"
│   │   │
│   │   ├── Center Content Grid / Columns:
│   │   │   ├── Hero Section:
│   │   │   │   ├── Reactive Bloom Underlay (Framer Motion pulsating radial ink wash)
│   │   │   │   ├── Calligraphic "PRISM" Heading (style={{ filter: 'url(#ink-bleed)' }})
│   │   │   │   ├── Opus Subtitle ("Opus Manuscriptum: Adaptive Musical Practice System")
│   │   │   │   └── Editorial Proposition Treatise Paragraph
│   │   │   │
│   │   │   └── Sanctuary Gate Ledger (Illuminated Parchment Card):
│   │   │       ├── Header: "CONSERVATORY GUILD ACCESS // CODEX MMXXVI 𝄐"
│   │   │       ├── Embedded Clerk <SignIn appearance={livingManuscriptClerkTheme} />
│   │   │       ├── Classical Divider: "— vel auditionem directam —"
│   │   │       └── Primary Guest CTA: "Audition as Guest (Instant Access)" [data-testid="guest-audition-btn"]
│   │   │
│   │   ├── Bottom 3 Feature Scrolls (Aligned across 5-line staff watermark):
│   │   │   ├── Scroll I: The Attentive Ear (Adaptive Intonation / Pitch Ribbon)
│   │   │   ├── Scroll II: The Spatial Canvas (Temporal DTW / 2D Panning Camera)
│   │   │   └── Scroll III: The Constellation Memory (Celestial Scatter Plot History)
│   │   │
│   │   └── Footer Colophon:
│   │       ├── "PRISM // ADAPTIVE ACOUSTIC INTELLIGENCE // STANDBY"
│   │       ├── "Audire · Discere · Exercere"
│   │       └── "Ex officina scriptoria MMXXVI // Coordinates: (0, 0)"
│
└── [Guest Mode State: When isGuest === true]
    └── Renders <App isGuest={true} onExitGuest={handleExitGuest} />
```

---

## 4. Implementation Blueprint: `landing-screen.tsx`

Worker M3 should create `apps/web/src/components/screens/landing-screen.tsx` with the following complete, production-ready code:

```tsx
import { SignIn } from '@clerk/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useState, useEffect, type ReactNode } from 'react'
import App from '@/app'
import { InkBleedFilter } from '@/components/ui/ink-bleed-filter'
import {
  LIVING_MANUSCRIPT_COLORS,
  MUSICAL_GLYPHS,
} from '@/design-system/tokens'
import { LANDING_SCREEN_SPEC } from '@/design-system/screens'

export interface LandingScreenProps {
  /** Optional callback invoked when the user triggers guest audition mode */
  onAuditionGuest?: () => void
  /** Optional custom hero title override */
  title?: string
}

interface CornerOrnamentProps {
  position: 'tl' | 'tr' | 'bl' | 'br'
}

function CornerOrnament({ position }: CornerOrnamentProps) {
  const positionClasses = {
    tl: 'top-2 left-2 border-t-2 border-l-2',
    tr: 'top-2 right-2 border-t-2 border-r-2',
    bl: 'bottom-2 left-2 border-b-2 border-l-2',
    br: 'bottom-2 right-2 border-b-2 border-r-2',
  }[position]

  return (
    <div
      className={`absolute w-3 h-3 border-[#2C2A29] pointer-events-none ${positionClasses}`}
      aria-hidden="true"
    />
  )
}

export function LandingScreen({ onAuditionGuest }: LandingScreenProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  const [isGuest, setIsGuest] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.location.hash.toLowerCase().includes('guest') ||
      sessionStorage.getItem('prism_guest_mode') === 'true'
    )
  })

  // Synchronize hash changes and browser navigation
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.toLowerCase().includes('guest')) {
        sessionStorage.setItem('prism_guest_mode', 'true')
        setIsGuest(true)
      }
    }
    window.addEventListener('hashchange', handleHash)
    window.addEventListener('popstate', handleHash)
    return () => {
      window.removeEventListener('hashchange', handleHash)
      window.removeEventListener('popstate', handleHash)
    }
  }, [])

  const handleAuditionAsGuest = () => {
    sessionStorage.setItem('prism_guest_mode', 'true')
    setIsGuest(true)
    if (onAuditionGuest) {
      onAuditionGuest()
    }
  }

  const handleExitGuest = () => {
    sessionStorage.removeItem('prism_guest_mode')
    setIsGuest(false)
    if (window.location.hash.toLowerCase().includes('guest')) {
      window.location.hash = ''
    }
  }

  // If in Guest mode, instantly enter the 2D Spatial Practice Stand
  if (isGuest) {
    return <App isGuest={true} onExitGuest={handleExitGuest} />
  }

  // Reactive Ink Bleed parameters
  const currentScale = isHovered ? 8 : 5
  const currentStdDev = isHovered ? 1.1 : 0.6

  return (
    <div className="min-h-screen w-full bg-[#F4F1EA] text-[#2C2A29] flex flex-col justify-between p-3 sm:p-6 md:p-8 relative select-none overflow-x-hidden">
      {/* 1. Dynamic SVG Ink Bleed Bloom Filter */}
      <InkBleedFilter
        id="ink-bleed"
        baseFrequency={0.04}
        numOctaves={4}
        scale={currentScale}
        stdDeviation={currentStdDev}
      />

      {/* 2. Outer Manuscript Border with Classical Double Rules & Marginalia */}
      <div className="w-full h-full min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-3rem)] md:min-h-[calc(100vh-4rem)] border-2 border-[#2C2A29] p-4 sm:p-6 md:p-8 flex flex-col justify-between relative bg-[#F4F1EA]">
        {/* Classical Corner Flourish Ornaments */}
        <CornerOrnament position="tl" />
        <CornerOrnament position="tr" />
        <CornerOrnament position="bl" />
        <CornerOrnament position="br" />

        {/* 3. Editorial Header & Latin Marginalia */}
        <header className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2C2A29] pb-4 mb-8 gap-3">
          {/* Top-Left: Classical Latin Motto */}
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-xs md:text-sm tracking-widest text-[#2C2A29] uppercase">
              {LANDING_SCREEN_SPEC.latinMotto}
            </span>
            <span className="text-[#9A2A2A] text-xs font-mono">✦</span>
          </div>

          {/* Top-Right: Monospace Telemetry Status */}
          <div className="flex items-center gap-2 font-mono text-[10px] md:text-xs text-[#7E7570] tracking-wider uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-[#9A2A2A] animate-pulse" />
            <span>{LANDING_SCREEN_SPEC.telemetryStatus}</span>
            <span className="text-[#2C2A29] font-bold text-sm ml-1">
              {MUSICAL_GLYPHS.natural}
            </span>
          </div>
        </header>

        {/* 4. Main Stage: Center Hero & Authentication Folio */}
        <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 my-4">
          {/* Left Column: Calligraphic Hero & Editorial Proposition */}
          <section className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left relative w-full">
            {/* Atmospheric Ink Bloom Underlay */}
            <motion.div
              className="absolute -top-12 -left-12 w-96 h-96 pointer-events-none rounded-none"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: isHovered ? [1.02, 1.1, 1.05] : [1, 1.04, 1],
                      opacity: isHovered ? 0.75 : 0.35,
                    }
              }
              transition={{
                duration: isHovered ? 2 : 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, rgba(44,42,41,0.20) 0%, rgba(154,42,42,0.08) 45%, transparent 75%)',
                filter: 'url(#ink-bleed)',
              }}
              aria-hidden="true"
            />

            {/* Frontispiece Monogram Tag */}
            <div className="font-mono text-xs text-[#7E7570] tracking-widest uppercase mb-2 flex items-center gap-2">
              <span className="text-base text-[#9A2A2A]">{MUSICAL_GLYPHS.gClef}</span>
              <span>Opus Manuscriptum · Frontispiece MMXXVI</span>
            </div>

            {/* Calligraphic PRISM Title with Reactive Ink-Bleed Bloom */}
            <motion.h1
              className="text-7xl sm:text-8xl md:text-9xl font-serif font-black tracking-wider text-[#2C2A29] select-none cursor-pointer relative z-10 my-1"
              style={{
                filter: 'url(#ink-bleed)',
                textShadow: isHovered
                  ? '0 0 24px rgba(154, 42, 42, 0.25), 0 0 2px rgba(44, 42, 41, 0.6)'
                  : '0 0 1px rgba(44, 42, 41, 0.35)',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {LANDING_SCREEN_SPEC.masterTitle}
            </motion.h1>

            {/* Subtitle Annotation */}
            <h2 className="font-serif italic text-lg sm:text-xl md:text-2xl text-[#7E7570] mt-2 mb-4">
              {LANDING_SCREEN_SPEC.opusSubtitle}
            </h2>

            {/* Editorial Proposition */}
            <p className="font-serif text-sm sm:text-base text-[#2C2A29]/90 max-w-xl leading-relaxed italic border-l-2 border-[#9A2A2A] pl-4 my-2">
              "{LANDING_SCREEN_SPEC.proposition}"
            </p>

            {/* Interactive Bloom Indicator */}
            <div className="mt-4 flex items-center gap-3 font-mono text-[11px] text-[#7E7570]">
              <span className="font-bold text-[#2C2A29]">
                [Turbulence: {currentScale}px · Blur: {currentStdDev}px]
              </span>
              <span>·</span>
              <span className="italic">Hover title to bloom iron gall ink</span>
            </div>
          </section>

          {/* Right Column: Conservatory Guild Authentication & Instant Audition Gate */}
          <section className="w-full lg:w-[460px] flex flex-col items-center">
            <div className="w-full border-2 border-[#2C2A29] p-6 sm:p-8 bg-[#F4F1EA] shadow-none relative">
              {/* Manuscript Corner Brackets */}
              <CornerOrnament position="tl" />
              <CornerOrnament position="tr" />
              <CornerOrnament position="bl" />
              <CornerOrnament position="br" />

              {/* Guild Card Header */}
              <div className="flex items-center justify-between border-b border-[#2C2A29] pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl text-[#9A2A2A]">
                    {MUSICAL_GLYPHS.fermata}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[#2C2A29] font-bold">
                    Conservatory Guild Ledger
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#7E7570] tracking-wider">
                  CODEX MMXXVI
                </span>
              </div>

              {/* Instant Guest Audition Pathway (Prominent Top/Center CTA) */}
              <div className="mb-6 flex flex-col gap-2">
                <button
                  onClick={handleAuditionAsGuest}
                  data-testid="guest-audition-btn"
                  className="w-full flex items-center justify-center gap-3 border-2 border-[#2C2A29] bg-[#E9E4DA] px-6 py-4 font-serif text-base font-bold text-[#2C2A29] hover:border-[#9A2A2A] hover:bg-[#F4F1EA] hover:text-[#9A2A2A] transition-all shadow-none cursor-pointer group"
                  aria-label="Audition as Guest (Instant Access)"
                >
                  <span className="font-mono text-xl group-hover:scale-110 transition-transform">
                    {MUSICAL_GLYPHS.fermata}
                  </span>
                  <span>Audition as Guest</span>
                  <span className="font-mono text-xs text-[#7E7570] group-hover:text-[#9A2A2A] font-normal tracking-normal">
                    [Instant Access]
                  </span>
                </button>
                <p className="font-mono text-[10px] text-[#7E7570] text-center">
                  Bypasses authentication directly to the 2D Spatial Practice Stand (0, 0).
                </p>
              </div>

              {/* Classical Divider */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2C2A29]/30" />
                </div>
                <div className="relative bg-[#F4F1EA] px-3 font-mono text-[10px] uppercase tracking-widest text-[#7E7570]">
                  vel authentica sigillo
                </div>
              </div>

              {/* Bespoke Clerk Sign In Form */}
              <div className="w-full">
                <SignIn
                  appearance={{
                    elements: {
                      card: 'border-0 rounded-none shadow-none bg-transparent p-0 w-full',
                      headerTitle: 'font-serif text-[#2C2A29] text-xl',
                      headerSubtitle: 'font-serif italic text-[#7E7570] text-xs',
                      formButtonPrimary:
                        'bg-[#2C2A29] text-[#F4F1EA] rounded-none hover:bg-[#9A2A2A] shadow-none text-xs font-mono tracking-wider transition-colors py-3',
                      formFieldInput:
                        'border border-[#2C2A29] rounded-none bg-[#E9E4DA] text-[#2C2A29] font-mono text-xs focus:ring-1 focus:ring-[#9A2A2A]',
                      footerActionLink: 'text-[#9A2A2A] hover:underline font-mono text-xs',
                      socialButtonsBlockButton:
                        'border border-[#2C2A29] rounded-none bg-[#E9E4DA] text-[#2C2A29] font-mono text-xs hover:bg-[#F4F1EA]',
                      formFieldLabel:
                        'font-mono text-[11px] text-[#7E7570] uppercase tracking-wider',
                      dividerLine: 'bg-[#2C2A29]/20',
                      dividerText: 'font-mono text-[10px] text-[#7E7570] uppercase',
                    },
                    variables: {
                      colorPrimary: LIVING_MANUSCRIPT_COLORS.charcoal,
                      colorText: LIVING_MANUSCRIPT_COLORS.charcoal,
                      colorBackground: LIVING_MANUSCRIPT_COLORS.parchment,
                      colorInputBackground: LIVING_MANUSCRIPT_COLORS.parchmentSecondary,
                      colorInputText: LIVING_MANUSCRIPT_COLORS.charcoal,
                      borderRadius: '0px',
                      fontFamily: "'Geist Mono', monospace",
                    },
                  }}
                />
              </div>
            </div>
          </section>
        </main>

        {/* 5. Bottom Section: Three Illuminated Feature Scrolls over 5-Line Staff Watermark */}
        <section className="w-full border-t border-[#2C2A29] pt-6 mt-8 relative">
          {/* Subtle 5-line musical staff watermark */}
          <div className="absolute inset-0 staff-bg opacity-15 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Scroll I: The Attentive Ear (Adaptive Intonation) */}
            <div className="border border-[#2C2A29] bg-[#F4F1EA] p-5 hover:border-[#9A2A2A] hover:bg-[#E9E4DA]/40 transition-all duration-200 flex flex-col justify-between group relative">
              <CornerOrnament position="tl" />
              <CornerOrnament position="br" />
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-serif text-2xl font-bold text-[#9A2A2A]">
                    {LANDING_SCREEN_SPEC.features[0].numeral}.
                  </span>
                  <span className="font-serif text-xl text-[#2C2A29] group-hover:text-[#9A2A2A] transition-colors">
                    {LANDING_SCREEN_SPEC.features[0].glyph}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#2C2A29] mb-1">
                  {LANDING_SCREEN_SPEC.features[0].title}
                </h3>
                <div className="font-mono text-[10px] text-[#7E7570] uppercase tracking-wider mb-2">
                  Adaptive Intonation & Pitch Ribbon
                </div>
                <p className="font-serif text-xs text-[#2C2A29]/80 leading-relaxed italic">
                  {LANDING_SCREEN_SPEC.features[0].description}
                </p>
              </div>
              <div className="border-t border-[#2C2A29]/20 pt-3 mt-4 font-mono text-[10px] text-[#7E7570] flex justify-between items-center">
                <span>LATENCY &lt; 15MS</span>
                <span className="text-[#9A2A2A]">TOLERANCE ±3¢</span>
              </div>
            </div>

            {/* Scroll II: The Spatial Canvas (Temporal DTW Alignment) */}
            <div className="border border-[#2C2A29] bg-[#F4F1EA] p-5 hover:border-[#9A2A2A] hover:bg-[#E9E4DA]/40 transition-all duration-200 flex flex-col justify-between group relative">
              <CornerOrnament position="tl" />
              <CornerOrnament position="br" />
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-serif text-2xl font-bold text-[#9A2A2A]">
                    {LANDING_SCREEN_SPEC.features[1].numeral}.
                  </span>
                  <span className="font-serif text-xl text-[#2C2A29] group-hover:text-[#9A2A2A] transition-colors">
                    {LANDING_SCREEN_SPEC.features[1].glyph}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#2C2A29] mb-1">
                  {LANDING_SCREEN_SPEC.features[1].title}
                </h3>
                <div className="font-mono text-[10px] text-[#7E7570] uppercase tracking-wider mb-2">
                  Temporal DTW Alignment & 2D Motion
                </div>
                <p className="font-serif text-xs text-[#2C2A29]/80 leading-relaxed italic">
                  {LANDING_SCREEN_SPEC.features[1].description}
                </p>
              </div>
              <div className="border-t border-[#2C2A29]/20 pt-3 mt-4 font-mono text-[10px] text-[#7E7570] flex justify-between items-center">
                <span>CAMERA PLANE</span>
                <span className="text-[#2C2A29]">SPRING (70, 18)</span>
              </div>
            </div>

            {/* Scroll III: The Constellation Memory (Celestial Constellation History) */}
            <div className="border border-[#2C2A29] bg-[#F4F1EA] p-5 hover:border-[#9A2A2A] hover:bg-[#E9E4DA]/40 transition-all duration-200 flex flex-col justify-between group relative">
              <CornerOrnament position="tl" />
              <CornerOrnament position="br" />
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-serif text-2xl font-bold text-[#9A2A2A]">
                    {LANDING_SCREEN_SPEC.features[2].numeral}.
                  </span>
                  <span className="font-serif text-xl text-[#2C2A29] group-hover:text-[#9A2A2A] transition-colors">
                    {LANDING_SCREEN_SPEC.features[2].glyph}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#2C2A29] mb-1">
                  {LANDING_SCREEN_SPEC.features[2].title}
                </h3>
                <div className="font-mono text-[10px] text-[#7E7570] uppercase tracking-wider mb-2">
                  Celestial Scatter Plot & Chronology
                </div>
                <p className="font-serif text-xs text-[#2C2A29]/80 leading-relaxed italic">
                  {LANDING_SCREEN_SPEC.features[2].description}
                </p>
              </div>
              <div className="border-t border-[#2C2A29]/20 pt-3 mt-4 font-mono text-[10px] text-[#7E7570] flex justify-between items-center">
                <span>TEMPO 60-160 BPM</span>
                <span className="text-[#9A2A2A]">ACCURACY 60-100%</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Footer Colophon */}
        <footer className="w-full flex flex-col sm:flex-row justify-between items-center border-t border-[#2C2A29] pt-4 mt-6 font-mono text-[10px] text-[#7E7570] gap-2">
          <div>PRISM // ADAPTIVE ACOUSTIC INTELLIGENCE ENGINE</div>
          <div className="italic font-serif text-xs text-[#2C2A29]">
            Audire · Discere · Exercere
          </div>
          <div>Ex officina scriptoria MMXXVI // Standby (0, 0)</div>
        </footer>
      </div>
    </div>
  )
}

export default LandingScreen
```

---

## 5. Integration Architecture

### 5.1 Barrel Export: `apps/web/src/components/screens/index.ts`
Create `apps/web/src/components/screens/index.ts` to cleanly export all Milestone 3 screens:
```typescript
export * from './landing-screen'
// When implemented by M3-2 and M3-3:
// export * from './tuning-ritual-screen'
// export * from './composer-profile-screen'
// export * from './constellation-history-screen'
```

### 5.2 Seamless Delegation in `apps/web/src/components/auth/sign-in-page.tsx`
Update `apps/web/src/components/auth/sign-in-page.tsx` to directly mount `LandingScreen`:
```tsx
import { LandingScreen } from '@/components/screens/landing-screen'

export function SignInPage() {
  return <LandingScreen />
}
```
*Rationale*: This preserves 100% backward compatibility with `apps/web/src/main.tsx` (`<Show when="signed-out"><SignInPage /></Show>`), while ensuring the newly implemented `LandingScreen` with full ink bleed bloom and Latin marginalia renders immediately on app launch.

---

## 6. Verification & Test Plan (Playwright & Visual)

### 6.1 DOM & Selector Contract for Playwright (Milestone 4)
| Target Element | Recommended Selector | Verification Assertion |
|---|---|---|
| Master Title | `h1:has-text("PRISM")` | Visible, computed style `filter` contains `url("#ink-bleed")` |
| Ink Bleed SVG Filter | `svg filter#ink-bleed` | Exists in DOM with `feTurbulence` and `feDisplacementMap` |
| Latin Motto | `text="AUDIRE · DISCERE · EXERCERE"` | Visible in top marginalia header |
| Telemetry Status | `text="REV. MMXXVI"` | Visible in top-right monospace header |
| Feature Scroll I | `h3:has-text("The Attentive Ear")` | Visible with numeral `I.` and G-Clef `𝄞` |
| Feature Scroll II | `h3:has-text("The Spatial Canvas")` | Visible with numeral `II.` and Caesura `𝄩` |
| Feature Scroll III | `h3:has-text("The Constellation Memory")` | Visible with numeral `III.` and Star Node `✦` |
| Guest Audition CTA | `[data-testid="guest-audition-btn"]` | Visible, click transitions to `App` with `Opus Manuscriptum · Stand (0, 0)` |
| Clerk SignIn | `.cl-signIn-root, [data-clerk-component="SignIn"]` | Mounted inside Conservatory Guild Ledger card |

### 6.2 Visual Regression Checklist
1. Background color strictly matches `#F4F1EA` (parchment).
2. Structural lines and borders match `#2C2A29` (charcoal).
3. Zero border radius (`border-radius: 0px`) across inputs, buttons, and frames.
4. Classical double-ruled framing with ornamental corner brackets.
5. Reactive hover expands ink bloom halo behind the calligraphic PRISM title.
