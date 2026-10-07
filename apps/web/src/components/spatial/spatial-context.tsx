/* oxlint-disable react/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { SPATIAL_MOTION_CONFIG } from '@/design-system/tokens'
import {
  isSpatialTarget,
  type SpatialTarget,
  type SpatialNavigationContextValue,
  type SpatialProviderProps,
} from './types'

export type * from './types'

const SpatialNavigationContext = createContext<SpatialNavigationContextValue | null>(null)

function parseHashTarget(): SpatialTarget | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#/, '').toLowerCase().trim()
  return isSpatialTarget(hash) ? hash : null
}

export function SpatialProvider({
  children,
  initialTarget,
  disableKeyboard = false,
  disableHashSync = false,
}: SpatialProviderProps) {
  const [currentTarget, setCurrentTarget] = useState<SpatialTarget>(() => {
    if (initialTarget && isSpatialTarget(initialTarget)) return initialTarget
    if (!disableHashSync) {
      const fromHash = parseHashTarget()
      if (fromHash) return fromHash
    }
    return 'practice'
  })

  const [previousTarget, setPreviousTarget] = useState<SpatialTarget | null>(null)
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const isNavigatingRef = useRef(false)
  const panningTimerRef = useRef<number | null>(null)

  const panTo = useCallback((target: SpatialTarget) => {
    if (!isSpatialTarget(target)) return

    setCurrentTarget((current) => {
      if (current === target) return current

      setPreviousTarget(current)
      setIsPanning(true)

      if (panningTimerRef.current !== null) {
        window.clearTimeout(panningTimerRef.current)
      }
      panningTimerRef.current = window.setTimeout(() => {
        setIsPanning(false)
      }, 800)

      if (!disableHashSync && typeof window !== 'undefined') {
        const expectedHash = `#${target}`
        if (window.location.hash !== expectedHash) {
          isNavigatingRef.current = true
          window.history.pushState(null, '', expectedHash)
          window.setTimeout(() => {
            isNavigatingRef.current = false
          }, 50)
        }
      }

      return target
    })
  }, [disableHashSync])

  const returnToCenter = useCallback(() => {
    panTo('practice')
  }, [panTo])

  const canNavigate = useCallback(
    (target: SpatialTarget) => isSpatialTarget(target) && target !== currentTarget,
    [currentTarget],
  )

  // Bidirectional URL Hash Sync (Back / Forward button support)
  useEffect(() => {
    if (disableHashSync || typeof window === 'undefined') return

    const handleHashChange = () => {
      if (isNavigatingRef.current) return
      const targetFromHash = parseHashTarget() || 'practice'
      setCurrentTarget((current) => {
        if (current !== targetFromHash) {
          setPreviousTarget(current)
          setIsPanning(true)
          if (panningTimerRef.current !== null) {
            window.clearTimeout(panningTimerRef.current)
          }
          panningTimerRef.current = window.setTimeout(() => {
            setIsPanning(false)
          }, 800)
          return targetFromHash
        }
        return current
      })
    }

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleHashChange)
      if (panningTimerRef.current !== null) {
        window.clearTimeout(panningTimerRef.current)
      }
    }
  }, [disableHashSync])

  // Global Keyboard Navigation (Arrows, WASD, Escape to re-center)
  useEffect(() => {
    if (disableKeyboard || typeof window === 'undefined') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.altKey || e.ctrlKey || e.metaKey) return

      const activeEl = document.activeElement as HTMLElement | null
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return
      }

      const key = e.key

      if (key === 'Escape') {
        if (currentTarget !== 'practice') {
          e.preventDefault()
          panTo('practice')
        }
        return
      }

      // Up: Profile
      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        if (currentTarget === 'practice') {
          e.preventDefault()
          panTo('profile')
        }
      }
      // Down: Return to Practice from Profile
      else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        if (currentTarget === 'profile') {
          e.preventDefault()
          panTo('practice')
        }
      }
      // Left: History from Practice, or Return to Practice from Tuning
      else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        if (currentTarget === 'practice') {
          e.preventDefault()
          panTo('history')
        } else if (currentTarget === 'tuning') {
          e.preventDefault()
          panTo('practice')
        }
      }
      // Right: Tuning from Practice, or Return to Practice from History
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        if (currentTarget === 'practice') {
          e.preventDefault()
          panTo('tuning')
        } else if (currentTarget === 'history') {
          e.preventDefault()
          panTo('practice')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [disableKeyboard, currentTarget, panTo])

  const contextValue: SpatialNavigationContextValue = {
    currentTarget,
    panTo,
    isPanning,
    setIsPanning,
    isAtCenter: currentTarget === 'practice',
    returnToCenter,
    previousTarget,
    targetCoordinates: SPATIAL_MOTION_CONFIG.coordinates,
    canNavigate,
  }

  return (
    <SpatialNavigationContext.Provider value={contextValue}>
      {children}
    </SpatialNavigationContext.Provider>
  )
}

export function useSpatialNavigation(): SpatialNavigationContextValue {
  const context = useContext(SpatialNavigationContext)
  if (!context) {
    throw new Error('useSpatialNavigation must be used within a SpatialProvider')
  }
  return context
}
