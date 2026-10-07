# Milestone 2 Architectural Specification: 2D Spatial Canvas & Coordinate Transform System

**Author**: Explorer M2-1 (Spatial Container & Coordinate Transform Architecture)  
**Target Date**: 2026-10-06  
**Status**: COMPLETE / VERIFIED  
**Target Codebase**: `apps/web/src/components/spatial/`  

---

## 1. Executive Architectural Summary

Milestone 2 establishes the core spatial canvas architecture for the Sonus Adaptive Musical Practice System. Traditional page-based routing (`react-router`, separate URLs) is replaced by a continuous, infinite 2D manuscript plane powered by Framer Motion. 

The musician navigates a cross/compass topology of four distinct folio surfaces:
1. **Center `(0, 0)`**: **Practice Stand** (`LivePracticeView`, pitch ribbon, real-time performance feedback).
2. **North / Up `(0, -1)`**: **Composer's Bio Profile** (`ComposerProfileFolio`, rehearsal physiognomy, repertoire ledger).
3. **West / Left `(-1, 0)`**: **Constellation History** (`ConstellationHistoryView`, tempo vs. accuracy celestial star map).
4. **East / Right `(+1, 0)`**: **Setup / Tuning Ritual** (`TuningRitualView`, Sacred Astrolabe intonation dial, Mic vs. MIDI detection).

The camera operates by translating a single unified world canvas (`<motion.div>`) behind a fixed, zero-overflow viewport aperture (`100vw × 100vh`). The motion is tuned to match the tactile feel of turning a heavy 17th-century printed treatise page, utilizing overdamped spring physics (`stiffness: 70, damping: 18`).

---

## 2. Coordinate Transform Mathematics & Verification

### 2.1 World Space vs. Camera Translation Space

There are two distinct coordinate representations that must be kept formally unambiguous:
1. **World / Canvas Plane Coordinates $(X_w, Y_w)$**: The logical 2D position where each folio screen resides relative to the central Practice Stand.
2. **Camera Container Translation $(T_x, T_y)$**: The transform vector applied to the Framer Motion canvas container (`transform: translate(Tx, Ty)`) to position the target folio precisely inside the viewport $[0, W] \times [0, H]$.

Because the camera viewport is stationary at the window origin $(0, 0)$, bringing a target folio at world position $(X_w, Y_w)$ into view requires shifting the world canvas in the **opposite direction**:

$$T_x = -X_w \times 100\text{vw}$$
$$T_y = -Y_w \times 100\text{vh}$$

### 2.2 Proof of Transformation Matrix

| Folio Screen | Target ID | World Coords $(X_w, Y_w)$ | Physical Screen Placement | Camera Translation $(T_x, T_y)$ | Effective Viewport Position $(X_w + T_x, Y_w + T_y)$ |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **Practice Stand** | `'practice'` | $(0, 0)$ | `left: 0, top: 0` | $(0\text{vw}, 0\text{vh})$ | $(0, 0)$ **[Centered]** |
| **Composer Profile** | `'profile'` | $(0, -1)$ | `left: 0, top: -100vh` | $(0\text{vw}, +100\text{vh})$ | $(0, -100\text{vh} + 100\text{vh}) = (0, 0)$ **[Centered]** |
| **Constellation History** | `'history'` | $(-1, 0)$ | `left: -100vw, top: 0` | $(+100\text{vw}, 0\text{vh})$ | $(-100\text{vw} + 100\text{vw}, 0) = (0, 0)$ **[Centered]** |
| **Tuning Ritual** | `'tuning'` | $(+1, 0)$ | `left: +100vw, top: 0` | $(-100\text{vw}, 0\text{vh})$ | $(+100\text{vw} - 100\text{vw}, 0) = (0, 0)$ **[Centered]** |

### 2.3 Reconciliation with Design System Tokens (`tokens.ts`)

In `apps/web/src/design-system/tokens.ts` (lines 107–112):
```typescript
coordinates: {
  practice: { x: 0, y: 0 },
  profile: { x: 0, y: 1 },
  history: { x: 1, y: 0 },
  tuning: { x: -1, y: 0 },
}
```
**Observation**: The token dictionary `SPATIAL_MOTION_CONFIG.coordinates` directly stores the **translation multipliers** ($M_x = T_x / 100\text{vw}, M_y = T_y / 100\text{vh}$), rather than the world positions.
Therefore:
$$\text{Framer Motion Translation} = \left(M_x \times 100\text{vw},\; M_y \times 100\text{vh}\right)$$
This aligns 100% with `tokens.ts`, `PROJECT.md`, and `DISPATCH.md`.

### 2.4 Unit Interpolation Proof

Framer Motion v14.0.0 was verified in the local runtime (`node -e ...`). The spring physics solver natively interpolates string units (`"100vw"`, `"100vh"`):
- Step test: `animate('0vw', '100vw', { type: 'spring', stiffness: 70, damping: 18 })` -> verified smooth numeric interpolation (`9.8915vw...`).
- Step test: `animate('0vh', '100vh', { type: 'spring', stiffness: 70, damping: 18 })` -> verified smooth numeric interpolation (`8.6456vh...`).

---

## 3. Harmonic Spring Physics & Motion Dynamics

### 3.1 Physics Formulation

The spatial canvas motion is modeled as a damped harmonic oscillator:
$$m \frac{d^2x}{dt^2} + c \frac{dx}{dt} + k x = 0$$

Using tokens from `SPATIAL_MOTION_CONFIG.spring`:
- Mass $m = 1.0$
- Stiffness $k = 70.0\text{ N/m}$
- Damping $c = 18.0\text{ N}\cdot\text{s/m}$

Calculated physical properties:
- **Natural angular frequency**: $\omega_0 = \sqrt{\frac{k}{m}} = \sqrt{70} \approx 8.3666\text{ rad/s}$
- **Critical damping coefficient**: $c_c = 2 \sqrt{km} = 2 \sqrt{70} \approx 16.7332$
- **Damping ratio**: $\zeta = \frac{c}{c_c} = \frac{18}{16.7332} \approx 1.0757$

### 3.2 Dynamics Assessment
Since $\zeta = 1.0757 > 1.0$, the system is **slightly overdamped**:
1. **Zero oscillation overshoot**: The canvas glides deliberately and settles directly into the target viewport without bouncing or rubber-banding.
2. **Settling time**: Settles within $5\%$ of equilibrium in approximately $0.48\text{ seconds}$.
3. **Aesthetic alignment**: Avoids bouncy, playful SaaS animations. It conveys the tactile friction and solemn weight of an authentic Renaissance treatise or orchestral folio stand.

### 3.3 Accessibility & Reduced Motion
For users with vestibular disorders or `prefers-reduced-motion: reduce`:
```typescript
const shouldReduceMotion = useReducedMotion();
const transitionConfig = shouldReduceMotion
  ? { duration: 0 }
  : {
      type: 'spring' as const,
      stiffness: SPATIAL_MOTION_CONFIG.spring.stiffness,
      damping: SPATIAL_MOTION_CONFIG.spring.damping,
      mass: SPATIAL_MOTION_CONFIG.spring.mass,
    };
```

---

## 4. DOM & Component Architecture

### 4.1 Component Hierarchy

```
SpatialNavigationProvider (Context: currentTarget, panTo, isPanning)
└── SpatialContainer (Viewport: 100vw × 100vh, overflow-hidden)
    ├── CanvasWorldLayer (<motion.div>, translated by Framer Motion)
    │   ├── ScreenSlot: Practice Stand (left: 0, top: 0, aria-hidden, inert)
    │   │   └── <LivePracticeView />
    │   ├── ScreenSlot: Profile Folio (left: 0, top: -100vh, aria-hidden, inert)
    │   │   └── <ComposerProfileScreen />
    │   ├── ScreenSlot: Constellation History (left: -100vw, top: 0, aria-hidden, inert)
    │   │   └── <ConstellationHistoryScreen />
    │   └── ScreenSlot: Tuning Ritual (left: +100vw, top: 0, aria-hidden, inert)
    │       └── <TuningRitualScreen />
    │
    ├── FolioNavAnchors (Fixed HUD Overlays)
    │   ├── Top Margin Anchor (↑ 𝄞 Persona) -> panTo('profile')
    │   ├── Left Margin Anchor (← 𝄌 Historia) -> panTo('history')
    │   ├── Right Margin Anchor (→ 𝄐 Harmonia) -> panTo('tuning')
    │   └── Return Anchors (shown when on off-center screens) -> panTo('practice')
    │
    └── CelestialCompass (Fixed Bottom Minimap)
        └── 4-Point SMuFL Glyph Diamond Pad (𝄞, 𝄢, 𝄐, ♮)
```

### 4.2 Accessibility & Focus Trapping Mitigation (`inert`)

When three screens are outside the viewport, interactive elements within them (buttons, links, inputs) must not intercept tab key focus.
Using the HTML standard `inert` attribute:
```tsx
<div
  className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto"
  style={{ left: `${screenPos.x * 100}vw`, top: `${screenPos.y * 100}vh` }}
  aria-hidden={currentTarget !== targetId}
  inert={currentTarget !== targetId ? true : undefined}
>
  {children}
</div>
```
This guarantees screen readers and keyboard tabbing remain strictly scoped to the active visible folio.

---

## 5. Navigation Modalities & Event Handling

### 5.1 Keyboard Navigation
Musicians practicing with an acoustic instrument or keyboard require immediate, hands-on spatial navigation without precision mouse clicking:
- **ArrowUp / 'W'**: When on `practice`, pans to `profile`.
- **ArrowLeft / 'A'**: When on `practice`, pans to `history`; when on `tuning`, returns to `practice`.
- **ArrowRight / 'D'**: When on `practice`, pans to `tuning`; when on `history`, returns to `practice`.
- **ArrowDown / 'S'**: When on `profile`, returns to `practice`.
- **Escape**: Returns to `practice` from any active screen.

*Input element guard*: If the active focused element is `<input>`, `<textarea>`, or `[contenteditable]`, keyboard spatial triggers are bypassed to allow standard text editing.

### 5.2 URL Hash Synchronization
The active folio coordinates synchronize bi-directionally with the browser URL hash:
1. Valid hashes: `#practice`, `#profile`, `#history`, `#tuning`.
2. On initial mount: URL hash is parsed; if present and valid, viewport initializes directly at that folio.
3. On navigation: `window.history.pushState(null, '', '#' + target)` ensures browser Back and Forward buttons work seamlessly.
4. On `popstate` / `hashchange`: Viewport pans smoothly to match history state changes.

---

## 6. Implementation Blueprints for Worker M2

Below are the exact code blueprints for the implementation files.

### 6.1 Type Contracts: `apps/web/src/types/spatial.ts`

```typescript
/**
 * Spatial Navigation and Canvas Types
 * Aligned with PROJECT.md and Living Manuscript Design Tokens
 */

export type SpatialTarget = 'practice' | 'profile' | 'history' | 'tuning';

export interface SpatialPosition {
  /** Translation multiplier in 100vw units */
  x: number;
  /** Translation multiplier in 100vh units */
  y: number;
  target: SpatialTarget;
}

export interface SpatialNavigationContextValue {
  currentTarget: SpatialTarget;
  panTo: (target: SpatialTarget) => void;
  isPanning: boolean;
  canNavigate: (target: SpatialTarget) => boolean;
}
```

### 6.2 Context Provider: `apps/web/src/components/spatial/spatial-context.tsx`

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { SpatialNavigationContextValue, SpatialTarget } from '@/types/spatial';

const SpatialNavigationContext = createContext<SpatialNavigationContextValue | null>(null);

const VALID_TARGETS: ReadonlySet<SpatialTarget> = new Set([
  'practice',
  'profile',
  'history',
  'tuning',
]);

function getTargetFromHash(): SpatialTarget {
  if (typeof window === 'undefined') return 'practice';
  const hash = window.location.hash.replace('#', '') as SpatialTarget;
  return VALID_TARGETS.has(hash) ? hash : 'practice';
}

export function SpatialNavigationProvider({ children }: { children: ReactNode }) {
  const [currentTarget, setCurrentTarget] = useState<SpatialTarget>(getTargetFromHash);
  const [isPanning, setIsPanning] = useState(false);

  const panTo = useCallback((target: SpatialTarget) => {
    if (!VALID_TARGETS.has(target)) return;
    setCurrentTarget(target);
    if (typeof window !== 'undefined') {
      const newHash = `#${target}`;
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
    }
  }, []);

  const canNavigate = useCallback(
    (target: SpatialTarget) => VALID_TARGETS.has(target) && target !== currentTarget,
    [currentTarget],
  );

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const target = getTargetFromHash();
      setCurrentTarget(target);
    };

    window.addEventListener('popstate', handleHashChange);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        panTo('practice');
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (currentTarget === 'practice') panTo('profile');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (currentTarget === 'profile') panTo('practice');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (currentTarget === 'practice') panTo('history');
        else if (currentTarget === 'tuning') panTo('practice');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (currentTarget === 'practice') panTo('tuning');
        else if (currentTarget === 'history') panTo('practice');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTarget, panTo]);

  return (
    <SpatialNavigationContext.Provider
      value={{
        currentTarget,
        panTo,
        isPanning,
        canNavigate,
      }}
    >
      {children}
    </SpatialNavigationContext.Provider>
  );
}

export function useSpatialNavigation(): SpatialNavigationContextValue {
  const context = useContext(SpatialNavigationContext);
  if (!context) {
    throw new Error('useSpatialNavigation must be used within a SpatialNavigationProvider');
  }
  return context;
}
```

### 6.3 2D Canvas Container: `apps/web/src/components/spatial/spatial-container.tsx`

```tsx
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { SPATIAL_MOTION_CONFIG } from '@/design-system/tokens';
import { useSpatialNavigation } from './spatial-context';
import { FolioNavAnchors } from './folio-nav-anchors';
import { CelestialCompass } from './celestial-compass';

interface SpatialContainerProps {
  practiceScreen: ReactNode;
  profileScreen?: ReactNode;
  historyScreen?: ReactNode;
  tuningScreen?: ReactNode;
}

export function SpatialContainer({
  practiceScreen,
  profileScreen,
  historyScreen,
  tuningScreen,
}: SpatialContainerProps) {
  const { currentTarget, panTo } = useSpatialNavigation();
  const shouldReduceMotion = useReducedMotion();

  // Translation multipliers from design tokens
  const coords = SPATIAL_MOTION_CONFIG.coordinates[currentTarget];
  const targetX = `${coords.x * 100}vw`;
  const targetY = `${coords.y * 100}vh`;

  return (
    <div
      className="spatial-viewport relative w-screen h-screen overflow-hidden select-none bg-[var(--color-parchment,#F4F1EA)] text-[var(--color-charcoal,#2C2A29)]"
      data-current-target={currentTarget}
    >
      {/* Moving 2D Manuscript World Canvas */}
      <motion.div
        className="spatial-world-canvas absolute inset-0 w-full h-full will-change-transform"
        animate={{ x: targetX, y: targetY }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: SPATIAL_MOTION_CONFIG.spring.stiffness,
                damping: SPATIAL_MOTION_CONFIG.spring.damping,
                mass: SPATIAL_MOTION_CONFIG.spring.mass,
              }
        }
      >
        {/* Center (0, 0): Practice Stand */}
        <div
          className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden"
          style={{ left: '0vw', top: '0vh' }}
          aria-hidden={currentTarget !== 'practice'}
          inert={currentTarget !== 'practice' ? true : undefined}
          data-screen="practice"
        >
          {practiceScreen}
        </div>

        {/* Up (0, -1): Composer Profile Folio */}
        <div
          className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden"
          style={{ left: '0vw', top: '-100vh' }}
          aria-hidden={currentTarget !== 'profile'}
          inert={currentTarget !== 'profile' ? true : undefined}
          data-screen="profile"
        >
          {profileScreen}
        </div>

        {/* Left (-1, 0): Constellation History */}
        <div
          className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden"
          style={{ left: '-100vw', top: '0vh' }}
          aria-hidden={currentTarget !== 'history'}
          inert={currentTarget !== 'history' ? true : undefined}
          data-screen="history"
        >
          {historyScreen}
        </div>

        {/* Right (+1, 0): Setup / Tuning Ritual */}
        <div
          className="spatial-screen absolute inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden"
          style={{ left: '100vw', top: '0vh' }}
          aria-hidden={currentTarget !== 'tuning'}
          inert={currentTarget !== 'tuning' ? true : undefined}
          data-screen="tuning"
        >
          {tuningScreen}
        </div>
      </motion.div>

      {/* Fixed Folio Edge Navigation Anchors */}
      <FolioNavAnchors currentTarget={currentTarget} onNavigate={panTo} />

      {/* Celestial Compass Minimap */}
      <CelestialCompass currentTarget={currentTarget} onNavigate={panTo} />
    </div>
  );
}
```

### 6.4 Folio Edge Nav Anchors: `apps/web/src/components/spatial/folio-nav-anchors.tsx`

```tsx
import type { SpatialTarget } from '@/types/spatial';
import { MUSICAL_GLYPHS } from '@/design-system/tokens';

interface FolioNavAnchorsProps {
  currentTarget: SpatialTarget;
  onNavigate: (target: SpatialTarget) => void;
}

export function FolioNavAnchors({ currentTarget, onNavigate }: FolioNavAnchorsProps) {
  return (
    <nav className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-6 select-none" aria-label="Folio Marginalia Navigation">
      {/* Top Margin: Profile Link (when in Practice) OR Return Link (when in Profile) */}
      <div className="flex justify-center w-full">
        {currentTarget === 'practice' && (
          <button
            onClick={() => onNavigate('profile')}
            className="pointer-events-auto flex items-center gap-2 border border-[#2C2A29] bg-[#F4F1EA] px-4 py-1.5 font-serif text-sm italic tracking-wide text-[#2C2A29] hover:border-[#9A2A2A] hover:text-[#9A2A2A] transition-colors shadow-none"
            aria-label="Ascend to Composer's Bio Profile"
          >
            <span>↑</span>
            <span className="font-mono text-xs">{MUSICAL_GLYPHS.gClef}</span>
            <span>Persona Folio</span>
          </button>
        )}
        {currentTarget === 'profile' && (
          <button
            onClick={() => onNavigate('practice')}
            className="pointer-events-auto flex items-center gap-2 border border-[#2C2A29] bg-[#F4F1EA] px-4 py-1.5 font-serif text-sm italic tracking-wide text-[#2C2A29] hover:border-[#9A2A2A] hover:text-[#9A2A2A] transition-colors shadow-none"
            aria-label="Descend to Practice Stand"
          >
            <span>↓</span>
            <span className="font-mono text-xs">{MUSICAL_GLYPHS.fermata}</span>
            <span>Return to Practice Stand</span>
          </button>
        )}
      </div>

      {/* Middle Row: Left Margin (History) and Right Margin (Tuning) */}
      <div className="flex justify-between items-center w-full">
        {/* Left Margin */}
        <div>
          {currentTarget === 'practice' && (
            <button
              onClick={() => onNavigate('history')}
              className="pointer-events-auto flex items-center gap-2 border border-[#2C2A29] bg-[#F4F1EA] px-3 py-2 font-serif text-sm italic tracking-wide text-[#2C2A29] hover:border-[#9A2A2A] hover:text-[#9A2A2A] transition-colors shadow-none"
              aria-label="Navigate to Constellation History"
            >
              <span>←</span>
              <span className="font-mono text-xs">{MUSICAL_GLYPHS.coda}</span>
              <span>Historia</span>
            </button>
          )}
          {currentTarget === 'history' && (
            <button
              onClick={() => onNavigate('practice')}
              className="pointer-events-auto flex items-center gap-2 border border-[#2C2A29] bg-[#F4F1EA] px-3 py-2 font-serif text-sm italic tracking-wide text-[#2C2A29] hover:border-[#9A2A2A] hover:text-[#9A2A2A] transition-colors shadow-none"
              aria-label="Return to Practice Stand"
            >
              <span className="font-mono text-xs">{MUSICAL_GLYPHS.fermata}</span>
              <span>Return to Stand →</span>
            </button>
          )}
        </div>

        {/* Right Margin */}
        <div>
          {currentTarget === 'practice' && (
            <button
              onClick={() => onNavigate('tuning')}
              className="pointer-events-auto flex items-center gap-2 border border-[#2C2A29] bg-[#F4F1EA] px-3 py-2 font-serif text-sm italic tracking-wide text-[#2C2A29] hover:border-[#9A2A2A] hover:text-[#9A2A2A] transition-colors shadow-none"
              aria-label="Navigate to Tuning Ritual"
            >
              <span>Harmonia</span>
              <span className="font-mono text-xs">{MUSICAL_GLYPHS.natural}</span>
              <span>→</span>
            </button>
          )}
          {currentTarget === 'tuning' && (
            <button
              onClick={() => onNavigate('practice')}
              className="pointer-events-auto flex items-center gap-2 border border-[#2C2A29] bg-[#F4F1EA] px-3 py-2 font-serif text-sm italic tracking-wide text-[#2C2A29] hover:border-[#9A2A2A] hover:text-[#9A2A2A] transition-colors shadow-none"
              aria-label="Return to Practice Stand"
            >
              <span>←</span>
              <span className="font-mono text-xs">{MUSICAL_GLYPHS.fermata}</span>
              <span>Return to Stand</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty bottom space; reserved for Celestial Compass in corner */}
      <div />
    </nav>
  );
}
```

### 6.5 Celestial Compass Minimap: `apps/web/src/components/spatial/celestial-compass.tsx`

```tsx
import type { SpatialTarget } from '@/types/spatial';
import { MUSICAL_GLYPHS } from '@/design-system/tokens';

interface CelestialCompassProps {
  currentTarget: SpatialTarget;
  onNavigate: (target: SpatialTarget) => void;
}

export function CelestialCompass({ currentTarget, onNavigate }: CelestialCompassProps) {
  return (
    <aside
      className="fixed bottom-6 right-6 z-40 flex flex-col items-center bg-[#F4F1EA] border border-[#2C2A29] p-2 select-none"
      aria-label="Celestial Compass Minimap"
    >
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#7E7570] mb-1">
        Compass
      </div>

      {/* 4-Point Compass Grid */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-20 h-20 place-items-center">
        {/* Top: Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className={`col-start-2 row-start-1 w-6 h-6 flex items-center justify-center font-serif text-xs border border-[#2C2A29] transition-colors ${
            currentTarget === 'profile'
              ? 'bg-[#9A2A2A] text-[#F4F1EA]'
              : 'bg-[#E9E4DA] text-[#2C2A29] hover:border-[#9A2A2A]'
          }`}
          title="Composer Profile Folio (Up)"
          aria-label="Navigate to Profile"
        >
          {MUSICAL_GLYPHS.gClef}
        </button>

        {/* Left: History */}
        <button
          onClick={() => onNavigate('history')}
          className={`col-start-1 row-start-2 w-6 h-6 flex items-center justify-center font-serif text-xs border border-[#2C2A29] transition-colors ${
            currentTarget === 'history'
              ? 'bg-[#9A2A2A] text-[#F4F1EA]'
              : 'bg-[#E9E4DA] text-[#2C2A29] hover:border-[#9A2A2A]'
          }`}
          title="Constellation History (Left)"
          aria-label="Navigate to History"
        >
          {MUSICAL_GLYPHS.fClef}
        </button>

        {/* Center: Practice */}
        <button
          onClick={() => onNavigate('practice')}
          className={`col-start-2 row-start-2 w-6 h-6 flex items-center justify-center font-serif text-xs border border-[#2C2A29] transition-colors ${
            currentTarget === 'practice'
              ? 'bg-[#9A2A2A] text-[#F4F1EA]'
              : 'bg-[#E9E4DA] text-[#2C2A29] hover:border-[#9A2A2A]'
          }`}
          title="Practice Stand (Center)"
          aria-label="Navigate to Practice Stand"
        >
          {MUSICAL_GLYPHS.natural}
        </button>

        {/* Right: Tuning */}
        <button
          onClick={() => onNavigate('tuning')}
          className={`col-start-3 row-start-2 w-6 h-6 flex items-center justify-center font-serif text-xs border border-[#2C2A29] transition-colors ${
            currentTarget === 'tuning'
              ? 'bg-[#9A2A2A] text-[#F4F1EA]'
              : 'bg-[#E9E4DA] text-[#2C2A29] hover:border-[#9A2A2A]'
          }`}
          title="Tuning Ritual (Right)"
          aria-label="Navigate to Tuning Ritual"
        >
          {MUSICAL_GLYPHS.cClef}
        </button>
      </div>

      <div className="font-mono text-[9px] text-[#7E7570] mt-1 uppercase">
        {currentTarget}
      </div>
    </aside>
  );
}
```

---

## 7. Verification & Implementation Roadmap for Milestone 2

1. **Step 1: Write Types**
   - Create `apps/web/src/types/spatial.ts` with `SpatialTarget`, `SpatialPosition`, `SpatialNavigationContextValue`.
2. **Step 2: Implement Spatial Context & Hooks**
   - Create `apps/web/src/components/spatial/spatial-context.tsx` with hash synchronization and keyboard listeners.
3. **Step 3: Implement Navigation Overlays**
   - Create `apps/web/src/components/spatial/folio-nav-anchors.tsx`.
   - Create `apps/web/src/components/spatial/celestial-compass.tsx`.
4. **Step 4: Implement Spatial Canvas Container**
   - Create `apps/web/src/components/spatial/spatial-container.tsx` with Framer Motion spring physics and `inert` attributes.
5. **Step 5: Wire into `App` Shell**
   - Wrap `App` in `<SpatialNavigationProvider>` and render `<SpatialContainer>`.
6. **Step 6: Build & Lint Gate**
   - Run `pnpm run lint` (`oxlint`).
   - Run `pnpm run build` (`tsc -b && vite build`).
