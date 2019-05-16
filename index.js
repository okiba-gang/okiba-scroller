
import {offset, getElements} from '@okiba/dom'
import {spliceOne} from '@okiba/arrays'

const animators = []
let targetY = 0
let scrollY = 0
let lastScrollY = 0
let deltaScrollY = 0
let RafID

let isObservedRunning = false
let isRafNeeded = false

let currentAnimator = null
let currentObserved = null
let currentCallbacks = null

let loopI = 0
let loopJ = 0
let loopK = 0

class OkibaScroller {
  constructor(options = {}) {
    scrollY = window.pageYOffset
    lastScrollY = window.pageYOffset
    this.opts = options
    this.smooth = options.smooth || false
    // smooth factor
    this.smoothF = options.smoothFactor || 0.2
    this.addListeners()
  }

  observe(target, onInit, onCalculate) {
    const observed = getElements(target).map(el => ({el}))

    const animator = {
      observed,
      onCalculate,
      callbacks: [],
    }

    animators.push(animator)

    if (onInit) {
      animator.observed.forEach(o => {
        onInit(o)
      })
    }

    this.calculateOffset(animator)

    const add = function(callbacks) {
      animator.callbacks.push(callbacks)

      this.calculateOffset(animator)
      this.onScroll()

      return {add}
    }.bind(this)

    return {add}
  }

  recalculate = _ => {
    for (let i = 0; i < animators.length; i++) {
      this.calculateOffset(animators[i])
    }
  }

  calculateOffset(animator) {
    for (let i = 0; i < animator.observed.length; i++) {
      const observed = animator.observed[i]
      const offsets = offset(observed.el)
      observed.top = offsets.top
      observed.bottom = observed.top + observed.el.offsetHeight
      observed.left = offsets.left
      observed.right = offsets.left + observed.el.offsetWidth

      observed.settings = []

      for (let j = 0; j < animator.callbacks.length; j++) {
        const cbOptions = animator.callbacks[j]

        observed.settings[j] = {}
        observed.settings[j].enable = true

        observed.settings[j].top = observed.top
        observed.settings[j].bottom = observed.bottom

        if (cbOptions.offset) {
          observed.settings[j].top += animator.offset
        }

        if (cbOptions.position) {
          if (cbOptions.position === 'middle') {
            observed.settings[j].top += (observed.el.offsetHeight / 2)
          }
          if (cbOptions.position === 'bottom') {
            observed.settings[j].top += observed.el.offsetHeight
          }
        }

        if (observed.settings[j].top > window.innerHeight) {
          observed.settings[j].top -= window.innerHeight
        } else {
          observed.settings[j].top = 0
        }
      }
      if (animator.onCalculate) animator.onCalculate(observed)
    }
  }

  animateOut(callbackIndex) {
    if (!currentObserved.settings[callbackIndex].entered) return

    currentObserved.settings[callbackIndex].entered = false

    if (currentCallbacks.onExit) {
      currentCallbacks.onExit(currentObserved, scrollY, deltaScrollY)
    }
  }

  animateIn(callbackIndex) {
    if (!currentObserved.settings[callbackIndex].entered) {
      currentObserved.settings[callbackIndex].entered = true
      if (currentCallbacks.onEnter) {
        currentCallbacks.onEnter(currentObserved, scrollY, deltaScrollY)
      }
    }

    if (!currentCallbacks.onRaf && !currentCallbacks.onExit) {
      currentObserved.settings[callbackIndex].enable = false
    }
  }

  animateObserved(callbackIndex) {
    const positions = currentObserved.settings[callbackIndex]

    if (positions.top === undefined) return

    if (scrollY >= positions.top && scrollY < positions.bottom) {
      if (!currentObserved.entered) {
        this.animateIn(callbackIndex)
      }
      if (currentCallbacks.onRaf) {
        isRafNeeded = true
        currentCallbacks.onRaf(currentObserved, scrollY, deltaScrollY)
      }
    } else {
      this.animateOut(callbackIndex)
    }
  }

  RAF = () =>{
    RafID = requestAnimationFrame(this.onRaf)
  }

  reset() {
    animators.length = 0
  }

  stop() {
    if (RafID) cancelAnimationFrame(RafID)
  }

  updateScroll() {
    if (targetY == scrollY) return false

    lastScrollY = scrollY

    if (this.smooth) {
      scrollY += (targetY - scrollY) * this.smoothF
      if (Math.abs(targetY - scrollY) < 1) {
        scrollY = targetY
      }
    } else {
      scrollY = targetY
    }

    deltaScrollY = scrollY - lastScrollY

    return true
  }

  onScroll= () => {
    targetY = Math.max(0, window.pageYOffset)

    this.stop()
    this.RAF()
  }

  onResize = () => {
    this.recalculate()
  }

  onRaf = () => {
    isRafNeeded = this.updateScroll()

    for (loopI = 0; loopI < animators.length; loopI++) {
      currentAnimator = animators[loopI]

      for (loopJ = 0; loopJ < currentAnimator.observed.length; loopJ++) {
        currentObserved = currentAnimator.observed[loopJ]
        isObservedRunning = false

        for (loopK = 0; loopK < currentAnimator.callbacks.length; loopK++) {
          if (!currentObserved.settings[loopK].enable) continue

          currentCallbacks = currentAnimator.callbacks[loopK]
          isObservedRunning = true
          this.animateObserved(loopK)
        }

        if (!isObservedRunning) {
          currentObserved = null
          spliceOne(currentAnimator.observed, loopJ)
          loopJ--
        }

        if (currentAnimator.observed.length < 1) {
          currentAnimator = null
          spliceOne(animators, loopI)
          loopI--
          break
        }
      }

      if (isRafNeeded) {
        this.stop()
        this.RAF()
      }
    }
  }

  addListeners() {
    window.addEventListener('scroll', this.onScroll, {passive: true})
    window.addEventListener('resize', this.onResize)
  }

  removeListeners() {
    window.addEventListener('scroll', this.onScroll, {passive: true})
    window.addEventListener('resize', this.onResize)
  }
}

let instance
export default function() {
  if (!instance) instance = new OkibaScroller()
  return instance
}
