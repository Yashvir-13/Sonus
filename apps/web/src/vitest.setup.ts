// Guard happy-dom's WAAPI Animation.cancel() from emitting unhandled AbortError rejections
// when Motion for React unmounts elements mid-animation during Vitest suites.
if (typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function') {
  const originalAnimate = Element.prototype.animate
  Element.prototype.animate = function patchedAnimate(...args: Parameters<typeof Element.prototype.animate>) {
    const animation = originalAnimate.apply(this, args)
    if (animation && typeof animation.finished?.catch === 'function') {
      animation.finished.catch(() => {})
    }
    return animation
  }
}
