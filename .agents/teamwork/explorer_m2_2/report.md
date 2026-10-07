# Architecture Report: Navigation Triggers & Context Architecture (Milestone 2)

**Author**: Explorer M2-2  
**Target Milestone**: Milestone 2 — Spatial Single-Page Architecture  
**Scope**: `spatial-context.tsx`, `folio-nav-anchors.tsx`, `celestial-compass.tsx`, Global Keyboard Listeners, and URL Hash Synchronization.

---

## 1. Executive Summary

Milestone 2 replaces traditional multi-page routing with a continuous 2D treatise plane powered by Framer Motion. While **Explorer M2-1** designs the physical coordinate translation camera (`spatial-container.tsx`) and **Explorer M2-3** designs viewport grid placement and app shell integration (`app.tsx`), **Explorer M2-2** establishes the entire control and intent layer:

1. **`spatial-context.tsx`**: The centralized React context provider maintaining `currentTarget`, `isPanning`, history stack, URL hash synchronization, and event dispatch.
2. **`folio-nav-anchors.tsx`**: Subtle margin catchwords and SMuFL/Unicode musical glyphs (`← 𝄌 Historia`, `↑ 𝄞 Persona`, `→ 𝄐 Harmonia`), complete with contextual return triggers (`↓ 𝄐 Praxis`, `Praxis 𝄐 →`, `← 𝄐 Praxis`).
3. **`celestial-compass.tsx`**: An interactive 4-point Renaissance astrolabe pad (`Rosa Harmonica`) pinned to the bottom margin, serving as both a visual minimap and a direct navigation controller.
4. **Global Keyboard Listeners**: Directional 2D navigation via `Arrow keys` and `WASD`, plus instant re-centering via `Escape`, protected by input-focus guards.
5. **URL Hash Synchronization**: Bidirectional, recursive-safe sync between `#practice`, `#profile`, `#history`, and `#tuning`, guaranteeing bookmarkability, deep-linking, and full browser Back/Forward support.

---

## 2. Spatial Context Specification (`spatial-context.tsx`)

### 2.1 Interface & Types Contract

```typescript
export type SpatialTarget = 'practice' | 'profile' | 'history' | 'tuning';

export interface SpatialCoordinates {
  x: number; // 0, 1, or -1 (container translation multiplier)
  y: number; // 0, 1, or -1
}

export interface SpatialNavigationContextValue {
  currentTarget: SpatialTarget;
  panTo: (target: SpatialTarget) => void;
  isPanning: boolean;
  setIsPanning: (isPanning: boolean) => void;
  isAtCenter: boolean;
  returnToCenter: () => void;
  previousTarget: SpatialTarget | null;
  targetCoordinates: Record<SpatialTarget, SpatialCoordinates>;
}

export interface SpatialProviderProps {
  children: React.ReactNode;
  initialTarget?: SpatialTarget;
  disableKeyboard?: boolean;
  disableHashSync?: boolean;
}
```

### 2.2 Coordinate Mapping Alignment

Aligned with `SPATIAL_MOTION_CONFIG` in `apps/web/src/design-system/tokens.ts`:
- **Practice Stand** (Center `(0, 0)`): `{ x: 0, y: 0 }`
- **Composer's Bio Profile** (Up `(0, -1)` in world space): Container translation `{ x: 0, y: 1 }` (moves down to bring top screen into view)
- **Constellation History** (Left `(-1, 0)` in world space): Container translation `{ x: 1, y: 0 }` (moves right to bring left screen into view)
- **Setup & Tuning Ritual** (Right `(1, 0)` in world space): Container translation `{ x: -1, y: 0 }` (moves left to bring right screen into view)

### 2.3 Complete Reference Implementation

```tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SPATIAL_MOTION_CONFIG } from '@/design-system/tokens';

export type SpatialTarget = 'practice' | 'profile' | 'history' | 'tuning';

export interface SpatialCoordinates {
  x: number;
  y: number;
}

export interface SpatialNavigationContextValue {
  currentTarget: SpatialTarget;
  panTo: (target: SpatialTarget) => void;
  isPanning: boolean;
  setIsPanning: (isPanning: boolean) => void;
  isAtCenter: boolean;
  returnToCenter: () => void;
  previousTarget: SpatialTarget | null;
  targetCoordinates: Record<SpatialTarget, SpatialCoordinates>;
}

export interface SpatialProviderProps {
  children: React.ReactNode;
  initialTarget?: SpatialTarget;
  disableKeyboard?: boolean;
  disableHashSync?: boolean;
}

export const VALID_SPATIAL_TARGETS: readonly SpatialTarget[] = [
  'practice',
  'profile',
  'history',
  'tuning',
] as const;

export function isSpatialTarget(val: unknown): val is SpatialTarget {
  return typeof val === 'string' && VALID_SPATIAL_TARGETS.includes(val as SpatialTarget);
}

const SpatialNavigationContext = createContext<SpatialNavigationContextValue | null>(null);

function parseHashTarget(): SpatialTarget | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '').toLowerCase();
  return isSpatialTarget(hash) ? hash : null;
}

export function SpatialProvider({
  children,
  initialTarget,
  disableKeyboard = false,
  disableHashSync = false,
}: SpatialProviderProps) {
  // 1. Initial State Resolution
  const [currentTarget, setCurrentTarget] = useState<SpatialTarget>(() => {
    if (initialTarget && isSpatialTarget(initialTarget)) return initialTarget;
    if (!disableHashSync) {
      const fromHash = parseHashTarget();
      if (fromHash) return fromHash;
    }
    return 'practice';
  });

  const [previousTarget, setPreviousTarget] = useState<SpatialTarget | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const isNavigatingRef = useRef(false);
  const panningTimerRef = useRef<number | null>(null);

  // 2. Coordinated Pan Dispatcher
  const panTo = useCallback((target: SpatialTarget) => {
    if (!isSpatialTarget(target)) return;

    setCurrentTarget((current) => {
      if (current === target) return current;

      setPreviousTarget(current);
      setIsPanning(true);

      // Failsafe timer to reset isPanning if Framer Motion animation is interrupted
      if (panningTimerRef.current !== null) {
        window.clearTimeout(panningTimerRef.current);
      }
      panningTimerRef.current = window.setTimeout(() => {
        setIsPanning(false);
      }, 800);

      // Synchronize to URL hash
      if (!disableHashSync && typeof window !== 'undefined') {
        const expectedHash = `#${target}`;
        if (window.location.hash !== expectedHash) {
          isNavigatingRef.current = true;
          window.location.hash = target;
          window.setTimeout(() => {
            isNavigatingRef.current = false;
          }, 50);
        }
      }

      return target;
    });
  }, [disableHashSync]);

  const returnToCenter = useCallback(() => {
    panTo('practice');
  }, [panTo]);

  // 3. Bidirectional URL Hash Listener (Back / Forward button support)
  useEffect(() => {
    if (disableHashSync || typeof window === 'undefined') return;

    const handleHashChange = () => {
      if (isNavigatingRef.current) return;
      const targetFromHash = parseHashTarget() || 'practice';
      setCurrentTarget((current) => {
        if (current !== targetFromHash) {
          setPreviousTarget(current);
          setIsPanning(true);
          return targetFromHash;
        }
        return current;
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
      if (panningTimerRef.current !== null) {
        window.clearTimeout(panningTimerRef.current);
      }
    };
  }, [disableHashSync]);

  // 4. Global Keyboard Listeners
  useEffect(() => {
    if (disableKeyboard || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      const key = e.key;

      if (key === 'Escape') {
        if (currentTarget !== 'practice') {
          e.preventDefault();
          panTo('practice');
        }
        return;
      }

      // Up navigation (Profile)
      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        if (currentTarget === 'practice') {
          e.preventDefault();
          panTo('profile');
        }
      }
      // Down navigation (Return to Center from Profile)
      else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        if (currentTarget === 'profile') {
          e.preventDefault();
          panTo('practice');
        }
      }
      // Left navigation (History from Practice, or Return from Tuning)
      else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        if (currentTarget === 'practice') {
          e.preventDefault();
          panTo('history');
        } else if (currentTarget === 'tuning') {
          e.preventDefault();
          panTo('practice');
        }
      }
      // Right navigation (Tuning from Practice, or Return from History)
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        if (currentTarget === 'practice') {
          e.preventDefault();
          panTo('tuning');
        } else if (currentTarget === 'history') {
          e.preventDefault();
          panTo('practice');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disableKeyboard, currentTarget, panTo]);

  const contextValue: SpatialNavigationContextValue = {
    currentTarget,
    panTo,
    isPanning,
    setIsPanning,
    isAtCenter: currentTarget === 'practice',
    returnToCenter,
    previousTarget,
    targetCoordinates: SPATIAL_MOTION_CONFIG.coordinates,
  };

  return (
    <SpatialNavigationContext.Provider value={contextValue}>
      {children}
    </SpatialNavigationContext.Provider>
  );
}

export function useSpatialNavigation(): SpatialNavigationContextValue {
  const context = useContext(SpatialNavigationContext);
  if (!context) {
    throw new Error('useSpatialNavigation must be used within a SpatialProvider');
  }
  return context;
}
```

---

## 3. Folio Navigation Anchors Specification (`folio-nav-anchors.tsx`)

### 3.1 Design Intent & Placement

In classical manuscripts and printed musical treatises (such as Praetorius's *Syntagma Musicum* or Tartini's *Traité des Agréments*), marginal catchwords and rubrics orient the musician without breaking immersion. 

The `FolioNavAnchors` component renders fixed edge triggers along the viewport perimeter:

1. **North / Top Margin**: 
   - When at `practice`: `↑ 𝄞 Persona` (`Folio II · Musician's Bio`) -> pans to `'profile'`.
   - When at `profile`: suppressed (musician is at top).
2. **West / Left Margin**: 
   - When at `practice`: `← 𝄌 Historia` (`Folio III · Constellation`) -> pans to `'history'`.
   - When at `tuning`: acts as Return Anchor: `← 𝄐 Praxis` (`Return to Stand`) -> pans to `'practice'`.
   - When at `history`: suppressed.
3. **East / Right Margin**: 
   - When at `practice`: `→ 𝄐 Harmonia` (`Folio IV · Tuning Ritual`) -> pans to `'tuning'`.
   - When at `history`: acts as Return Anchor: `Praxis 𝄐 →` (`Return to Stand`) -> pans to `'practice'`.
   - When at `tuning`: suppressed.
4. **South / Bottom Margin**:
   - When at `profile`: `↓ 𝄐 Praxis` (`Return to Stand`) -> pans to `'practice'`.
   - When at `practice`: suppressed (bottom is anchored by the Celestial Compass minimap).

### 3.2 Visual Styling Rules
- **Typography**: `Playfair Display` for title (`font-serif`), `Geist Mono` for folio metadata (`font-mono text-[10px] tracking-widest`).
- **Borders**: Sharp `1px solid #2C2A29`, `rounded-none`, zero modern box-shadow.
- **Palette**: `#F4F1EA` parchment background, `#2C2A29` charcoal text. On hover: `#E9E4DA` parchment tint, `#9A2A2A` cochineal crimson text/border accent.
- **Layering**: Pinned via `fixed` with `z-30` so they float stationary above the translating 2D canvas.

### 3.3 Complete Reference Implementation

```tsx
import React from 'react';
import { useSpatialNavigation } from './spatial-context';
import { MUSICAL_GLYPHS } from '@/design-system/tokens';

export function FolioNavAnchors() {
  const { currentTarget, panTo } = useSpatialNavigation();

  return (
    <nav className="pointer-events-none fixed inset-0 z-30 select-none" aria-label="Spatial Folio Navigation">
      {/* TOP ANCHOR: Persona / Profile Folio */}
      {currentTarget === 'practice' && (
        <div className="pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2">
          <button
            onClick={() => panTo('profile')}
            className="group flex flex-col items-center border border-[#2C2A29] bg-[#F4F1EA] px-5 py-1.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A]"
            aria-label="Pan up to Musician Profile"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span>↑</span>
              <span className="text-base">{MUSICAL_GLYPHS.gClef}</span>
              <span>Persona</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Folio II · Musician's Physiognomy
            </span>
          </button>
        </div>
      )}

      {/* RETURN FROM PROFILE: Bottom of Profile Screen */}
      {currentTarget === 'profile' && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            onClick={() => panTo('practice')}
            className="group flex flex-col items-center border border-[#2C2A29] bg-[#F4F1EA] px-6 py-2 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A]"
            aria-label="Return to Practice Stand"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span>↓</span>
              <span className="text-base">{MUSICAL_GLYPHS.fermata}</span>
              <span>Praxis</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Return to Practice Stand [Esc / S]
            </span>
          </button>
        </div>
      )}

      {/* LEFT ANCHOR: Historia (from Practice) OR Return from Tuning */}
      {currentTarget === 'practice' && (
        <div className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2">
          <button
            onClick={() => panTo('history')}
            className="group flex flex-col items-start border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A]"
            aria-label="Pan left to Constellation History"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span>←</span>
              <span className="text-base">{MUSICAL_GLYPHS.coda}</span>
              <span>Historia</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Folio III · Constellation [A]
            </span>
          </button>
        </div>
      )}

      {currentTarget === 'tuning' && (
        <div className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2">
          <button
            onClick={() => panTo('practice')}
            className="group flex flex-col items-start border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A]"
            aria-label="Return to Practice Stand from Tuning"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span>←</span>
              <span className="text-base">{MUSICAL_GLYPHS.fermata}</span>
              <span>Praxis</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Return to Stand [Esc / A]
            </span>
          </button>
        </div>
      )}

      {/* RIGHT ANCHOR: Harmonia (from Practice) OR Return from History */}
      {currentTarget === 'practice' && (
        <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2">
          <button
            onClick={() => panTo('tuning')}
            className="group flex flex-col items-end border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A]"
            aria-label="Pan right to Tuning Ritual"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span>Harmonia</span>
              <span className="text-base">{MUSICAL_GLYPHS.fermata}</span>
              <span>→</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Folio IV · Tuning Ritual [D]
            </span>
          </button>
        </div>
      )}

      {currentTarget === 'history' && (
        <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2">
          <button
            onClick={() => panTo('practice')}
            className="group flex flex-col items-end border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2.5 transition-all duration-150 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] focus:outline-none focus:ring-1 focus:ring-[#9A2A2A]"
            aria-label="Return to Practice Stand from History"
          >
            <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#2C2A29] group-hover:text-[#9A2A2A]">
              <span>Praxis</span>
              <span className="text-base">{MUSICAL_GLYPHS.fermata}</span>
              <span>→</span>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7E7570] group-hover:text-[#9A2A2A]">
              Return to Stand [Esc / D]
            </span>
          </button>
        </div>
      )}
    </nav>
  );
}
```

---

## 4. Celestial Compass Specification (`celestial-compass.tsx`)

### 4.1 Concept & Layout

The Celestial Compass (`Rosa Harmonica`) provides a 4-point glyph pad in the bottom margin (`fixed bottom-4 left-1/2 -translate-x-1/2 z-30`).

It is structured as a cross/radar array:
- **North Point (Persona)**: `𝄞` G-Clef (`profile`, key `W`)
- **West Point (Historia)**: `𝄌` Coda (`history`, key `A`)
- **Center Point (Praxis)**: `♮` Natural / `✦` Star Node (`practice`, key `Esc`)
- **East Point (Harmonia)**: `𝄐` Fermata (`tuning`, key `D`)

### 4.2 State Indication
- **Active Point**: Highlighted in solid charcoal `#2C2A29` with parchment `#F4F1EA` text, outlined with a 1px crimson hairline border (`#9A2A2A`).
- **Telemetry Bar**: Monospace string below the cross displaying:
  `ROSA HARMONICA // [TARGET] // COORD: (X, Y)`
  (e.g., `ROSA HARMONICA // PRAXIS // (0, 0)`).

### 4.3 Complete Reference Implementation

```tsx
import React from 'react';
import { useSpatialNavigation, type SpatialTarget } from './spatial-context';
import { MUSICAL_GLYPHS } from '@/design-system/tokens';

const TARGET_META: Record<SpatialTarget, { label: string; glyph: string; keyHint: string; coord: string }> = {
  practice: { label: 'Praxis', glyph: MUSICAL_GLYPHS.natural, keyHint: 'ESC', coord: '(0, 0)' },
  profile: { label: 'Persona', glyph: MUSICAL_GLYPHS.gClef, keyHint: 'W', coord: '(0, -1)' },
  history: { label: 'Historia', glyph: MUSICAL_GLYPHS.coda, keyHint: 'A', coord: '(-1, 0)' },
  tuning: { label: 'Harmonia', glyph: MUSICAL_GLYPHS.fermata, keyHint: 'D', coord: '(1, 0)' },
};

export function CelestialCompass() {
  const { currentTarget, panTo, isPanning } = useSpatialNavigation();

  // If currently at profile, the bottom return trigger is rendered by FolioNavAnchors;
  // CelestialCompass renders in a compact, non-interfering docked state or provides unified control.
  return (
    <aside
      className="pointer-events-auto fixed bottom-3 left-1/2 z-30 -translate-x-1/2 border border-[#2C2A29] bg-[#F4F1EA] px-3 py-2 shadow-none select-none"
      aria-label="Celestial Compass 4-point navigation"
    >
      <div className="flex flex-col items-center gap-1.5">
        {/* Navigation Glyph Cross Grid */}
        <div className="grid grid-cols-3 grid-rows-2 items-center gap-1 w-32">
          {/* Row 1, Col 2: North (Persona / Profile) */}
          <div className="col-start-2 row-start-1 flex justify-center">
            <button
              onClick={() => panTo('profile')}
              title="Persona: Musician Profile [W]"
              className={`h-7 w-7 border text-xs font-serif transition-colors duration-150 flex items-center justify-center ${
                currentTarget === 'profile'
                  ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                  : 'border-[#2C2A29] bg-[#F4F1EA] text-[#2C2A29] hover:bg-[#E9E4DA] hover:text-[#9A2A2A]'
              }`}
            >
              {TARGET_META.profile.glyph}
            </button>
          </div>

          {/* Row 2, Col 1: West (Historia / History) */}
          <div className="col-start-1 row-start-2 flex justify-center">
            <button
              onClick={() => panTo('history')}
              title="Historia: Constellation History [A]"
              className={`h-7 w-7 border text-xs font-serif transition-colors duration-150 flex items-center justify-center ${
                currentTarget === 'history'
                  ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                  : 'border-[#2C2A29] bg-[#F4F1EA] text-[#2C2A29] hover:bg-[#E9E4DA] hover:text-[#9A2A2A]'
              }`}
            >
              {TARGET_META.history.glyph}
            </button>
          </div>

          {/* Row 2, Col 2: Origin (Praxis / Practice) */}
          <div className="col-start-2 row-start-2 flex justify-center">
            <button
              onClick={() => panTo('practice')}
              title="Praxis: Practice Stand [Esc]"
              className={`h-7 w-7 border text-xs font-serif transition-colors duration-150 flex items-center justify-center ${
                currentTarget === 'practice'
                  ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                  : 'border-[#2C2A29] bg-[#F4F1EA] text-[#2C2A29] hover:bg-[#E9E4DA] hover:text-[#9A2A2A]'
              }`}
            >
              {TARGET_META.practice.glyph}
            </button>
          </div>

          {/* Row 2, Col 3: East (Harmonia / Tuning) */}
          <div className="col-start-3 row-start-2 flex justify-center">
            <button
              onClick={() => panTo('tuning')}
              title="Harmonia: Tuning Ritual [D]"
              className={`h-7 w-7 border text-xs font-serif transition-colors duration-150 flex items-center justify-center ${
                currentTarget === 'tuning'
                  ? 'border-[#9A2A2A] bg-[#2C2A29] text-[#F4F1EA] font-bold'
                  : 'border-[#2C2A29] bg-[#F4F1EA] text-[#2C2A29] hover:bg-[#E9E4DA] hover:text-[#9A2A2A]'
              }`}
            >
              {TARGET_META.tuning.glyph}
            </button>
          </div>
        </div>

        {/* Telemetry Readout */}
        <div className="flex items-center gap-1.5 border-t border-[#2C2A29]/40 pt-1 font-mono text-[9px] tracking-widest text-[#7E7570]">
          <span className="font-semibold uppercase text-[#2C2A29]">
            {TARGET_META[currentTarget].label}
          </span>
          <span>·</span>
          <span>{TARGET_META[currentTarget].coord}</span>
          {isPanning && (
            <span className="text-[#9A2A2A] animate-pulse">TRANSIT</span>
          )}
        </div>
      </div>
    </aside>
  );
}
```

---

## 5. Global Keyboard Navigation Matrix

| Key Combo | Current Viewport | Target Dispatched | Mental Model / Rationale |
|---|---|---|---|
| `ArrowUp` / `W` / `w` | `'practice'` | `'profile'` | Move UP into Musician's Bio Frontispiece |
| `ArrowDown` / `S` / `s` | `'profile'` | `'practice'` | Move DOWN to return to Practice Stand |
| `ArrowLeft` / `A` / `a` | `'practice'` | `'history'` | Move WEST into Constellation History Star Map |
| `ArrowLeft` / `A` / `a` | `'tuning'` | `'practice'` | Move WEST from Tuning back to Center |
| `ArrowRight` / `D` / `d` | `'practice'` | `'tuning'` | Move EAST into Setup & Tuning Ritual |
| `ArrowRight` / `D` / `d` | `'history'` | `'practice'` | Move EAST from History back to Center |
| `Escape` | any (`profile`, `history`, `tuning`) | `'practice'` | Emergency return to origin / Center |

### Safety Invariants
1. **Input Shielding**: Evaluates `document.activeElement`. If the element is an `<input>`, `<textarea>`, `<select>`, or contenteditable block, keys are passed unhindered to allow typing.
2. **Modifier Shielding**: If `metaKey`, `ctrlKey`, or `altKey` is active, keyboard listeners yield to prevent conflicting with browser shortcuts (`Cmd+R`, `Ctrl+W`, etc.).
3. **Scroll Cancellation**: When a spatial navigation key is handled, `e.preventDefault()` is invoked to prevent unwanted browser scrolling.

---

## 6. URL Hash Synchronization Architecture

### 6.1 State Flow Diagram

```
                 [ User Types URL or Clicks Link ]
                                |
                                v
                       window.location.hash
                                |
                   (hashchange / popstate event)
                                |
                                v
              +------------------------------------+
              |       SpatialProvider              |
              |  - reads parseHashTarget()         |
              |  - checks if !== currentTarget     |
              |  - sets currentTarget state        |
              |  - triggers Framer Motion spring   |
              +------------------------------------+
                                ^
                                |
                 [ UI Trigger (Anchor, Compass, Key) ]
                                |
                             panTo()
                                |
                  (updates currentTarget & sets hash)
```

### 6.2 Recursive Prevention
To avoid infinite loops where `panTo` sets `window.location.hash`, which fires `hashchange`, which calls `panTo`:
1. `isNavigatingRef.current = true` is set immediately before setting `window.location.hash`.
2. The `hashchange` handler checks `if (isNavigatingRef.current) return;`.
3. If `hashTarget === currentTarget`, no state update is dispatched.

---

## 7. Integration Contract for Worker M2

### 7.1 Target File Hierarchy

```
apps/web/src/components/spatial/
├── spatial-context.tsx       (Provider, useSpatialNavigation, hash sync, keyboard listeners)
├── folio-nav-anchors.tsx     (Margin edge links with glyphs & return triggers)
├── celestial-compass.tsx     (4-point glyph pad in bottom margin)
├── spatial-container.tsx     (Framer Motion 2D camera viewport — per Explorer M2-1)
└── index.ts                  (Barrel export)
```

### 7.2 Barrel Export (`apps/web/src/components/spatial/index.ts`)

```typescript
export * from './spatial-context';
export * from './folio-nav-anchors';
export * from './celestial-compass';
export * from './spatial-container';
```

### 7.3 App Shell Integration Pattern (`apps/web/src/app.tsx`)

```tsx
import { SpatialProvider, FolioNavAnchors, CelestialCompass } from '@/components/spatial';
import { SpatialContainer } from '@/components/spatial/spatial-container';
import { LivePracticeView } from '@/components/live-practice-view';

export default function App() {
  return (
    <SpatialProvider>
      <div className="relative h-screen w-screen overflow-hidden bg-[#F4F1EA]">
        {/* Continuous 2D Framer Motion Canvas Container */}
        <SpatialContainer>
          {/* M2-3 mounts 4 viewports here:
              - Center (0, 0): LivePracticeView
              - Up (0, -1): ComposerProfileScreen placeholder
              - Left (-1, 0): ConstellationHistoryScreen placeholder
              - Right (1, 0): TuningRitualScreen placeholder */}
        </SpatialContainer>

        {/* Marginal Triggers & Minimap */}
        <FolioNavAnchors />
        <CelestialCompass />
      </div>
    </SpatialProvider>
  );
}
```

---

## 8. Verification & Test Plan

1. **Hash Navigation**:
   - Navigate to `http://localhost:5173/#history` -> Viewport initializes directly panned to Constellation History.
   - Navigate to `http://localhost:5173/#profile` -> Viewport initializes panned to Profile.
   - Click browser Back button -> Viewport springs smoothly back to previous screen.
2. **Keyboard Controls**:
   - From `#practice`, press `W` or `ArrowUp` -> Pans to `#profile`.
   - From `#profile`, press `S` or `ArrowDown` -> Pans back to `#practice`.
   - From `#practice`, press `A` or `ArrowLeft` -> Pans to `#history`.
   - From `#history`, press `D` or `ArrowRight` -> Pans back to `#practice`.
   - From `#practice`, press `D` or `ArrowRight` -> Pans to `#tuning`.
   - From any screen, press `Escape` -> Returns immediately to `#practice`.
   - In any text input, typing `W`, `A`, `S`, `D` enters text without triggering camera pan.
3. **Anchor & Compass Clicks**:
   - Click `← 𝄌 Historia` -> Pans to History, right margin flips to `Praxis 𝄐 →`.
   - Click `→ 𝄐 Harmonia` -> Pans to Tuning, left margin flips to `← 𝄐 Praxis`.
   - Click `↑ 𝄞 Persona` -> Pans to Profile, bottom button shows `↓ 𝄐 Praxis`.
   - In Celestial Compass, active cell turns dark charcoal with crimson hairline accent.
