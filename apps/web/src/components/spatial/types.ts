export const VALID_SPATIAL_TARGETS = [
  'practice',
  'profile',
  'history',
  'tuning',
] as const

export type SpatialTarget = (typeof VALID_SPATIAL_TARGETS)[number]

export interface SpatialCoordinates {
  x: number
  y: number
}

export interface SpatialPosition {
  x: number
  y: number
  target: SpatialTarget
}

export interface SpatialNavigationContextValue {
  currentTarget: SpatialTarget
  panTo: (target: SpatialTarget) => void
  isPanning: boolean
  setIsPanning: (isPanning: boolean) => void
  isAtCenter: boolean
  returnToCenter: () => void
  previousTarget: SpatialTarget | null
  targetCoordinates: Record<SpatialTarget, SpatialCoordinates>
  canNavigate: (target: SpatialTarget) => boolean
}

export interface SpatialProviderProps {
  children: React.ReactNode
  initialTarget?: SpatialTarget
  disableKeyboard?: boolean
  disableHashSync?: boolean
}

export function isSpatialTarget(val: unknown): val is SpatialTarget {
  return typeof val === 'string' && VALID_SPATIAL_TARGETS.includes(val as SpatialTarget)
}
