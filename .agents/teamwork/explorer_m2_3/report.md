# M2-3 Investigation Report: App Shell Integration & Viewport Placement

**Explorer**: Explorer M2-3  
**Target**: Milestone 2 — App Shell Integration, Viewport Placement & Auth Pathways  
**Codebase**: `d:\Projects\adaptive-music-practice\apps\web\`  
**Date**: 2026-10-06  

---

## 1. Executive Summary

Milestone 2 establishes the **2D Spatial Single-Page Architecture** for the PRISM Adaptive Musical Practice System, replacing conventional URL route switching with an infinite 2D manuscript plane powered by Framer Motion.

This investigation resolves three fundamental architectural questions:
1. **Viewport Placement & Positioning**: How the 4 primary viewports—Center `(0, 0)` Practice Stand, Up `(0, -1)` Composer's Bio Profile, Left `(-1, 0)` Constellation History, and Right `(1, 0)` Tuning Ritual—are mounted within the DOM and transformed across the 2D plane.
2. **CSS Layout Rules & Stacking Context**: Ensuring strict zero-bleed, zero-scrollbar layout using `w-screen h-screen overflow-hidden relative bg-parchment` on the outer shell, dynamic translation on the Framer Motion world container, and coordinate offsets for child viewports.
3. **Clerk Authentication & "Audition as Guest" Pathways**: Reconciling the strict `AGENTS.md` Clerk rules with `PROJECT.md` requirements for a Living Manuscript Landing Page with styled Clerk `<SignIn />` and an unauthenticated "Audition as Guest" instant entry pathway required for Playwright verification.

---

## 2. Viewport Placement & 2D Grid Transform Math

### 2.1 The Two Coordinate Frames

To avoid coordinate inversions between camera motion and world positioning, we distinguish two frames:

#### Frame 1: World Placement Coordinates (Where screens sit in the world relative to Center)
Each screen is an independent viewport measuring exactly `100vw` by `100vh`:
- **Center `(0, 0)`**: `LivePracticeView` (Practice Stand)
  - Placement: `top: 0`, `left: 0`, `transform: translate3d(0, 0, 0)`
- **Up `(0, -1)`**: `ComposerProfileScreen` (Composer's Bio Profile)
  - Placement: `top: 0`, `left: 0`, `transform: translate3d(0, -100vh, 0)` (or Tailwind `-translate-y-full`)
- **Left `(-1, 0)`**: `ConstellationHistoryScreen` (Constellation History)
  - Placement: `top: 0`, `left: 0`, `transform: translate3d(-100vw, 0, 0)` (or Tailwind `-translate-x-full`)
- **Right `(1, 0)`**: `TuningRitualScreen` (Setup & Tuning Ritual)
  - Placement: `top: 0`, `left: 0`, `transform: translate3d(100vw, 0, 0)` (or Tailwind `translate-x-full`)

#### Frame 2: Camera Translation Vector (How the World Container moves to reveal a screen)
The outer container functions as a fixed camera lens of dimensions `100vw × 100vh`. When the user navigates, the entire World Container (`motion.div`) moves in the opposite direction of the camera movement:

$$\mathbf{T}_{\text{world}} = -1 \times \mathbf{P}_{\text{screen}}$$

| Navigation Target | Screen Offset $\mathbf{P}$ | World Transform $\mathbf{T}$ | CSS Translation |
| :--- | :--- | :--- | :--- |
| **`practice`** | `(0, 0)` | `(0, 0)` | `x: 0, y: 0` |
| **`profile`** | `(0, -100vh)` | `(0, +100vh)` | `x: 0, y: '100vh'` (or `100%`) |
| **`history`** | `(-100vw, 0)` | `(+100vw, 0)` | `x: '100vw', y: 0` (or `100%`) |
| **`tuning`** | `(+100vw, 0)` | `(-100vw, 0)` | `x: '-100vw', y: 0` (or `-100%`) |

This precisely matches the `SPATIAL_MOTION_CONFIG.coordinates` defined in `apps/web/src/design-system/tokens.ts`:
```typescript
coordinates: {
  practice: { x: 0, y: 0 },
  profile: { x: 0, y: 1 },
  history: { x: 1, y: 0 },
  tuning: { x: -1, y: 0 },
}
```

### 2.2 Framer Motion Spring Configuration
The spring transition must feel deliberate and mechanical—resembling the turning of a heavy vellum leaf in a 17th-century treatise:
- `stiffness: 70`
- `damping: 18`
- `mass: 1`
- `restDelta: 0.001`

---

## 3. CSS Layout & Stacking Architecture

### 3.1 DOM Hierarchy

```text
apps/web/src/app.tsx
│
├── <SpatialNavigationProvider>           [Context: currentTarget, panTo, isPanning]
│   │
│   ├── Outer Container                   [w-screen h-screen overflow-hidden relative bg-[#F4F1EA]]
│   │   │
│   │   ├── World Container (motion.div)  [w-screen h-screen absolute top-0 left-0]
│   │   │   │
│   │   │   ├── Center Viewport (0, 0)    [w-screen h-screen absolute top-0 left-0]
│   │   │   │   └── <LivePracticeView />
│   │   │   │
│   │   │   ├── Up Viewport (0, -1)       [w-screen h-screen absolute top-0 left-0 -translate-y-full]
│   │   │   │   └── <ComposerProfileScreen />
│   │   │   │
│   │   │   ├── Left Viewport (-1, 0)     [w-screen h-screen absolute top-0 left-0 -translate-x-full]
│   │   │   │   └── <ConstellationHistoryScreen />
│   │   │   │
│   │   │   └── Right Viewport (1, 0)     [w-screen h-screen absolute top-0 left-0 translate-x-full]
│   │   │       └── <TuningRitualScreen />
│   │   │
│   │   └── Fixed Overlay HUD             [pointer-events-none absolute inset-0 z-40]
│   │       ├── <FolioNavAnchors />       [pointer-events-auto: ← 𝄌 Historia, ↑ 𝄞 Persona, → 𝄐 Harmonia]
│   │       └── <CelestialCompass />      [pointer-events-auto: 4-point glyph pad in bottom margin]
```

### 3.2 Viewport CSS Specifications
To eliminate all scrollbar flickering and subpixel rendering glitches:
1. `html`, `body`, `#root` are pinned to `height: 100%; margin: 0; padding: 0; overflow: hidden;` (already configured in `index.css`).
2. The outer container uses `w-screen h-screen overflow-hidden relative bg-[var(--background)]`.
3. Viewports use `w-screen h-screen absolute top-0 left-0` with hardware-accelerated transforms (`translate3d`).
4. Overlays use `pointer-events-none` on parent containers and `pointer-events-auto` on clickable anchor buttons.

---

## 4. Authentication Architecture: Clerk vs. Guest Entry Pathways

### 4.1 The Architectural Challenge
`AGENTS.md` mandates:
- `main.tsx` must configure Clerk via `<ClerkProvider>`:
  ```tsx
  <ClerkProvider publishableKey={publishableKey}>
    <Show when="signed-out"><SignInPage /></Show>
    <Show when="signed-in"><AuthShell><App /></AuthShell></Show>
  </ClerkProvider>
  ```
- No silent auth fallback UI when keys are missing.
- Keep auth chrome under `components/auth/`.

Meanwhile, `PROJECT.md` and `ORIGINAL_REQUEST.md` mandate:
- Signed-out state presents the **Living Manuscript Landing Page** (`LandingScreen`) with ink bleed bloom `#ink-bleed`, historical marginalia, and styled Clerk `<SignIn />`.
- **"Audition as Guest" CTA** enables instant access to the 2D Spatial Stand for unauthenticated musicians and automated Playwright test verification.

### 4.2 The Solution: Transparent Guest Gateway in `components/auth/`
By managing guest mode inside `components/auth/sign-in-page.tsx`, we satisfy **both** requirements with zero architectural compromises:

1. In `main.tsx`:
   - Structure remains 100% compliant with `AGENTS.md`. No modifications required that violate root rules.
2. In `components/auth/sign-in-page.tsx`:
   - Checks `sessionStorage.getItem('prism_guest_mode') === 'true'` or URL hash `#guest`.
   - If `isGuest === false`: Renders `LandingScreen` with:
     - Ink bleed filter `#ink-bleed`
     - Clerk `<SignIn />` styled via `clerkThemeConfig`
     - "Audition as Guest (Instant Access)" button with fermata glyph (`𝄐`)
   - If `isGuest === true`: Directly renders `<App isGuest={true} onExitGuest={...} />`.
3. In `components/auth/auth-shell.tsx`:
   - Provides a borderless, full-viewport shell for authenticated users without top headers that interfere with the 2D spatial canvas.
   - User profile management / `UserButton` is placed inside the Composer's Bio Profile screen at `(0, -1)`, matching the 17th-century frontispiece aesthetic.

---

## 5. Screen Viewport Interface Contracts for Milestone 3

Each screen container in `apps/web/src/components/screens/` should implement a uniform interface contract:

```typescript
export interface BaseScreenProps {
  /** Optional callback to pan to a specific spatial target */
  onNavigate?: (target: SpatialTarget) => void;
  /** Whether the user is in guest mode */
  isGuest?: boolean;
}
```

### 5.1 Center Viewport: Practice Stand
- **Component**: `apps/web/src/components/live-practice-view.tsx`
- **Location**: `(0, 0)`
- **Header**: Classical Opus Manuscriptum title ("Opus Manuscriptum: Adaptive Practice System").
- **Core View**: Monophonic pitch ribbon with real-time acoustic telemetry (BPM, Cents deviation, detected note).
- **Navigation cues**: Subtle margin folio links to Persona (Up), Historia (Left), and Harmonia (Right).

### 5.2 Up Viewport: Composer's Bio Profile Folio
- **Component**: `apps/web/src/components/screens/composer-profile-screen.tsx`
- **Location**: `(0, -1)`
- **Header**: Woodcut crest with treble clef (`𝄞`), "Maestro Yash", Clerk verified authentication badge / guest badge.
- **Content**: Telemetry ledger (practice hours, notes articulated, habit diagnosis) + Repertoire ledger.
- **Return anchor**: `↓ Return to Practice Stand` (`𝄐`).

### 5.3 Left Viewport: Constellation History View
- **Component**: `apps/web/src/components/screens/constellation-history-screen.tsx`
- **Location**: `(-1, 0)`
- **Header**: Monospace telemetry bar (`CONSTELLATION LEDGER // 48 TAKES RECORDED`).
- **Content**: Celestial scatter plot (Tempo 60–160 BPM vs. Accuracy 60–100%) with star nodes (`✦`, `✧`) and inspector folio.
- **Return anchor**: `Return to Practice Stand →` (`𝄐`).

### 5.4 Right Viewport: Setup & Sacred Tuning Ritual
- **Component**: `apps/web/src/components/screens/tuning-ritual-screen.tsx`
- **Location**: `(1, 0)`
- **Header**: Italian directive: *Accordatura: Moderato e tranquillo*.
- **Content**: Sacred Astrolabe dial (-50 to +50 cents needle), Mic vs. MIDI detector, Pitch standard selector (415 Hz / 440 Hz / 442 Hz).
- **Return anchor**: `← Return to Practice Stand` (`𝄐`).

---

## 6. Implementation Code Blueprints for Worker M2

### Blueprint 1: `apps/web/src/app.tsx`

```tsx
import { useSpatialNavigation, SpatialNavigationProvider } from "@/components/spatial/spatial-context"
import { SpatialContainer } from "@/components/spatial/spatial-container"
import { FolioNavAnchors } from "@/components/spatial/folio-nav-anchors"
import { CelestialCompass } from "@/components/spatial/celestial-compass"
import { LivePracticeView } from "@/components/live-practice-view"
import { ComposerProfileScreen } from "@/components/screens/composer-profile-screen"
import { ConstellationHistoryScreen } from "@/components/screens/constellation-history-screen"
import { TuningRitualScreen } from "@/components/screens/tuning-ritual-screen"

interface AppProps {
  isGuest?: boolean
  onExitGuest?: () => void
}

function AppCanvas({ isGuest, onExitGuest }: AppProps) {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[var(--background)] text-[var(--foreground)] select-none">
      {/* 2D Panning World Container */}
      <SpatialContainer>
        {/* Center (0, 0): Practice Stand */}
        <div 
          id="viewport-practice"
          className="w-screen h-screen absolute top-0 left-0 flex flex-col justify-between p-8"
        >
          {/* Header */}
          <header className="w-full flex justify-between items-baseline z-10 px-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif tracking-tight">
                Opus Manuscriptum
              </h1>
              <p className="font-mono text-xs text-[var(--muted-foreground)] tracking-widest uppercase mt-1">
                Adaptive Practice System · Stand (0, 0)
              </p>
            </div>
            {isGuest && (
              <button 
                onClick={onExitGuest}
                className="font-mono text-xs border border-[var(--border)] px-3 py-1 hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors"
              >
                Depart Sanctuary (Guest)
              </button>
            )}
          </header>

          {/* Stand Content */}
          <div className="flex-1 w-full flex items-center justify-center">
            <LivePracticeView />
          </div>
        </div>

        {/* Up (0, -1): Composer's Bio Profile */}
        <div 
          id="viewport-profile"
          className="w-screen h-screen absolute top-0 left-0 -translate-y-full"
        >
          <ComposerProfileScreen isGuest={isGuest} onExitGuest={onExitGuest} />
        </div>

        {/* Left (-1, 0): Constellation History */}
        <div 
          id="viewport-history"
          className="w-screen h-screen absolute top-0 left-0 -translate-x-full"
        >
          <ConstellationHistoryScreen />
        </div>

        {/* Right (1, 0): Setup / Tuning Ritual */}
        <div 
          id="viewport-tuning"
          className="w-screen h-screen absolute top-0 left-0 translate-x-full"
        >
          <TuningRitualScreen />
        </div>
      </SpatialContainer>

      {/* Fixed Navigation Overlays */}
      <FolioNavAnchors />
      <CelestialCompass />
    </div>
  )
}

export default function App(props: AppProps) {
  return (
    <SpatialNavigationProvider>
      <AppCanvas {...props} />
    </SpatialNavigationProvider>
  )
}
```

### Blueprint 2: `apps/web/src/components/auth/sign-in-page.tsx`

```tsx
import { useState, useEffect } from 'react'
import App from '@/app'
import { LandingScreen } from '@/components/screens/landing-screen'

export function SignInPage() {
  const [isGuest, setIsGuest] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.location.hash.includes('guest') ||
      sessionStorage.getItem('prism_guest_mode') === 'true'
    )
  })

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('guest')) {
        sessionStorage.setItem('prism_guest_mode', 'true')
        setIsGuest(true)
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const handleAuditionAsGuest = () => {
    sessionStorage.setItem('prism_guest_mode', 'true')
    setIsGuest(true)
  }

  const handleExitGuest = () => {
    sessionStorage.removeItem('prism_guest_mode')
    setIsGuest(false)
    window.location.hash = ''
  }

  if (isGuest) {
    return <App isGuest={true} onExitGuest={handleExitGuest} />
  }

  return <LandingScreen onAuditionAsGuest={handleAuditionAsGuest} />
}
```

### Blueprint 3: `apps/web/src/components/auth/auth-shell.tsx`

```tsx
import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
}

/**
 * AuthShell provides a clean, borderless container for authenticated users.
 * Does not insert fixed headers that would clip the 2D spatial canvas viewports.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {children}
    </div>
  )
}
```

---

## 7. Risk Analysis & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Clerk Auth blocking Playwright tests** | Automated tests fail because Clerk requires interactive login credentials. | "Audition as Guest" CTA bypasses auth directly into `App` with `isGuest=true`. Supported via button click and `#guest` hash. |
| **Transform conflicts between World Container and Viewports** | Subpixel jitter or transform overrides. | Viewports use fixed percentage/viewport units (`-translate-x-full`, `-translate-y-full`, `translate-x-full`) while the parent `motion.div` animates `x` and `y`. |
| **Scrollbars appearing during diagonal transitions** | Browser horizontal/vertical scrollbars disrupt full-screen immersion. | Root `#root`, `body`, and outer container are pinned with `overflow-hidden` and `fixed/absolute` dimensions. |
| **Interactive clicks blocked by navigation overlay** | User cannot click practice buttons or tuning controls. | Navigation overlay container has `pointer-events-none`; anchor links and compass pad have `pointer-events-auto`. |

---

## 8. Verification Strategy for Worker M2

1. **Static Analysis**: Run `pnpm exec tsc --noEmit` from `apps/web/`. Must complete with 0 errors.
2. **Dev Server Run**: Run `pnpm run dev` to verify Vite compilation and bundle generation.
3. **Viewport Mounting Test**:
   - Verify `viewport-practice`, `viewport-profile`, `viewport-history`, `viewport-tuning` are present in DOM.
   - Trigger navigation via keyboard (`ArrowUp`, `ArrowLeft`, `ArrowRight`, `Escape`) and verify world coordinates update.
4. **Guest Mode Test**:
   - Access `http://localhost:5173/#guest` and confirm immediate mounting of the 2D Spatial Stand.
   - Click "Audition as Guest" on Landing Page and confirm immediate transition to Practice Stand.
