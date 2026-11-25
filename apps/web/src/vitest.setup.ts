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

// Guard HTMLDialogElement modal methods in lightweight DOM test environments
if (typeof HTMLDialogElement !== 'undefined') {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '')
    }
  }
  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function close(returnValue?: string) {
      this.removeAttribute('open')
      if (returnValue !== undefined) {
        this.returnValue = returnValue
      }
      this.dispatchEvent(new Event('close'))
    }
  }
}
