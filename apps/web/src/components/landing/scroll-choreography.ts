export type LandingActId = 'act1' | 'act2' | 'act3' | 'act4' | 'act5'

export type CameraKeyframe = {
  scale: number
  xPercent: number
  yPercent: number
  origin: string
  spotlightOpacity: number
}

export type LandingActWaypoint = {
  id: LandingActId
  actNumber: string
  label: string
  ratio: number
  focusTarget: string
  camera: CameraKeyframe
}

export const LANDING_ACT_WAYPOINTS: readonly LandingActWaypoint[] = [
  {
    id: 'act1',
    actNumber: '01',
    label: 'Overview',
    ratio: 0.0,
    focusTarget: 'Wide sunlit & monochrome studio',
    camera: {
      scale: 1.09,
      xPercent: 0,
      yPercent: 0,
      origin: '50% 50%',
      spotlightOpacity: 0.16,
    },
  },
  {
    id: 'act2',
    actNumber: '02',
    label: 'Practice View',
    ratio: 0.22,
    focusTarget: 'Grand piano keys & acoustic guitar',
    camera: {
      scale: 1.68,
      xPercent: -1,
      yPercent: -15,
      origin: '50% 50%',
      spotlightOpacity: 0.26,
    },
  },
  {
    id: 'act3',
    actNumber: '03',
    label: 'Bar Feedback',
    ratio: 0.45,
    focusTarget: 'Open sheet music on piano stand',
    camera: {
      scale: 2.05,
      xPercent: 18,
      yPercent: 12,
      origin: '50% 50%',
      spotlightOpacity: 0.34,
    },
  },
  {
    id: 'act4',
    actNumber: '04',
    label: 'Drills & Tools',
    ratio: 0.68,
    focusTarget: 'Acoustic guitar, window rays & metronome',
    camera: {
      scale: 1.68,
      xPercent: -32,
      yPercent: -10,
      origin: '50% 50%',
      spotlightOpacity: 0.28,
    },
  },
  {
    id: 'act5',
    actNumber: '05',
    label: 'Song Library',
    ratio: 0.92,
    focusTarget: 'Full rehearsal studio finale',
    camera: {
      scale: 1.09,
      xPercent: 0,
      yPercent: 0,
      origin: '50% 50%',
      spotlightOpacity: 0.18,
    },
  },
]

export const LANDING_SNAP_RATIOS: readonly number[] = LANDING_ACT_WAYPOINTS.map((wp) => wp.ratio)

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export function resolveActiveActIndex(progress: number): number {
  const p = clampProgress(progress)
  if (p < 0.13) return 0
  if (p < 0.34) return 1
  if (p < 0.57) return 2
  if (p < 0.8) return 3
  return 4
}

export function computePointerParallax(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number
): { rotateX: number; rotateY: number; shiftX: number; shiftY: number } {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { rotateX: 0, rotateY: 0, shiftX: 0, shiftY: 0 }
  }
  const nx = Math.max(-1, Math.min(1, (clientX / viewportWidth) * 2 - 1))
  const ny = Math.max(-1, Math.min(1, (clientY / viewportHeight) * 2 - 1))
  return {
    rotateX: Number((-ny * 1.4).toFixed(3)),
    rotateY: Number((nx * 1.8).toFixed(3)),
    shiftX: Number((-nx * 14).toFixed(2)),
    shiftY: Number((-ny * 10).toFixed(2)),
  }
}

export function computeForegroundParallax(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number
): { fgShiftX: number; fgShiftY: number } {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { fgShiftX: 0, fgShiftY: 0 }
  }
  const nx = Math.max(-1, Math.min(1, (clientX / viewportWidth) * 2 - 1))
  const ny = Math.max(-1, Math.min(1, (clientY / viewportHeight) * 2 - 1))
  return {
    fgShiftX: Number((nx * 9).toFixed(2)),
    fgShiftY: Number((ny * 6).toFixed(2)),
  }
}

export function resolveScrollTargetTop(
  containerTop: number,
  containerHeight: number,
  viewportHeight: number,
  ratio: number
): number {
  const scrollable = Math.max(0, containerHeight - viewportHeight)
  return Math.round(containerTop + scrollable * clampProgress(ratio))
}
