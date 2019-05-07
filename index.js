
import {offset, getElements} from '@okiba/dom'
import {spliceOne} from '@okiba/arrays'

const animators = []

let scrollY = 0
let RafID

let isObservedRunning = false
let isRafNeeded = false

let currentAnimator = null
let currentObserved = null
let currentCallbacks = null

class OkibaScroller {
  constructor() {
    scrollY = window.pageYOffset
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
    this.calculateOffset(animator)

    if (onInit) onInit(animator)

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
      currentCallbacks.onExit(currentObserved, scrollY)
    }
  }

  animateIn(callbackIndex) {
    if (!currentObserved.settings[callbackIndex].entered) {
      currentObserved.settings[callbackIndex].entered = true
      currentCallbacks.onEnter(currentObserved, scrollY)
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
        currentCallbacks.onRaf(currentObserved, scrollY)
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

  onScroll= () => {
    scrollY = window.pageYOffset

    this.stop()
    this.RAF()
  }

  onResize = () => {
    this.recalculate()
  }

  onRaf = () => {
    isRafNeeded = false
    for (let i = 0; i < animators.length; i++) {
      currentAnimator = animators[i]

      for (let j = 0; j < currentAnimator.observed.length; j++) {
        currentObserved = currentAnimator.observed[j]
        isObservedRunning = false

        for (let k = 0; k < currentAnimator.callbacks.length; k++) {
          if (!currentObserved.settings[k].enable) continue

          currentCallbacks = currentAnimator.callbacks[k]
          isObservedRunning = true
          this.animateObserved(k)
        }

        if (!isObservedRunning) {
          currentObserved = null
          spliceOne(currentAnimator.observed, j)
          j--
        }

        if (currentAnimator.observed.length < 1) {
          currentAnimator = null
          spliceOne(animators, i)
          i--
          break
        }
      }

      if (isRafNeeded) {
        this.RAF()
      }
    }
  }

  addListeners() {
    window.addEventListener('scroll', this.onScroll)
    window.addEventListener('resize', this.onResize)
  }

  removeListeners() {
    window.addEventListener('scroll', this.onScroll)
    window.addEventListener('resize', this.onResize)
  }
}

let instance
export default function() {
  if (!instance) instance = new OkibaScroller()
  return instance
}
