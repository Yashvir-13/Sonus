import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LANDING_ACT_WAYPOINTS,
  LANDING_SNAP_RATIOS,
  clampProgress,
  resolveActiveActIndex,
  computePointerParallax,
  computeForegroundParallax,
  resolveScrollTargetTop,
} from './scroll-choreography.ts'

test('defines tightly paced 5-act waypoints with ascending snap ratios and instrument-targeted camera moves', () => {
  assert.equal(LANDING_ACT_WAYPOINTS.length, 5)
  assert.deepEqual(LANDING_SNAP_RATIOS, [0, 0.22, 0.45, 0.68, 0.92])
  for (let i = 1; i < LANDING_SNAP_RATIOS.length; i++) {
    assert.ok(LANDING_SNAP_RATIOS[i]! > LANDING_SNAP_RATIOS[i - 1]!)
  }

  // Act 3 zooms deepest onto the grand piano music desk
  const act3 = LANDING_ACT_WAYPOINTS[2]!
  assert.equal(act3.camera.origin, '50% 50%')
  assert.ok(act3.camera.scale >= 2.0)
  assert.ok(act3.camera.scale > LANDING_ACT_WAYPOINTS[1]!.camera.scale)
  assert.ok(act3.camera.scale > LANDING_ACT_WAYPOINTS[3]!.camera.scale)
  assert.ok(act3.camera.xPercent > 0)
  assert.ok(act3.camera.yPercent > 0)
  assert.ok(act3.camera.spotlightOpacity > LANDING_ACT_WAYPOINTS[0]!.camera.spotlightOpacity)
})

test('clamps out-of-range or NaN scroll progress values safely', () => {
  assert.equal(clampProgress(-0.5), 0)
  assert.equal(clampProgress(1.8), 1)
  assert.equal(clampProgress(Number.NaN), 0)
  assert.equal(clampProgress(0.45), 0.45)
})

test('resolves exact act index across all 5 scroll windows', () => {
  assert.equal(resolveActiveActIndex(0), 0)
  assert.equal(resolveActiveActIndex(0.22), 1)
  assert.equal(resolveActiveActIndex(0.45), 2)
  assert.equal(resolveActiveActIndex(0.68), 3)
  assert.equal(resolveActiveActIndex(0.92), 4)
  assert.equal(resolveActiveActIndex(1.0), 4)
})

test('computes subtle bounded 3D camera parallax angles and counter-depth foreground drift', () => {
  const center = computePointerParallax(720, 450, 1440, 900)
  assert.equal(center.rotateX, 0)
  assert.equal(center.rotateY, 0)
  assert.equal(center.shiftX, 0)
  assert.equal(center.shiftY, 0)

  const corner = computePointerParallax(1440, 0, 1440, 900)
  assert.ok(Math.abs(corner.rotateX) <= 2)
  assert.ok(Math.abs(corner.rotateY) <= 2)
  assert.equal(corner.shiftX, -14)
  assert.equal(corner.shiftY, 10)

  const fgCenter = computeForegroundParallax(720, 450, 1440, 900)
  assert.equal(fgCenter.fgShiftX, 0)
  assert.equal(fgCenter.fgShiftY, 0)

  const fgCorner = computeForegroundParallax(1440, 0, 1440, 900)
  assert.equal(fgCorner.fgShiftX, 9)
  assert.equal(fgCorner.fgShiftY, -6)
  assert.ok(Math.sign(fgCorner.fgShiftX) === -Math.sign(corner.shiftX))
  assert.ok(Math.sign(fgCorner.fgShiftY) === -Math.sign(corner.shiftY))
})

test('resolves exact pixel scroll offset for waypoint jumps', () => {
  assert.equal(resolveScrollTargetTop(0, 4500, 900, 0.5), 1800)
  assert.equal(resolveScrollTargetTop(100, 900, 900, 0.5), 100)
})
