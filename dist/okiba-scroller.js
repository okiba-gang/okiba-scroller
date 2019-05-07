'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

/**
 * @module arrays
 * @description Array utils for okiba js
 */

/**
 * Cast an array-like object or single element to Array
 * @example
 * const elements = castArray(document.querySelectorAll('p')) // [p, p]
 * const fruits = castArray(🍒) // [🍒]
 *
 * @param {any} castable Array to cast
 * @returns {Array} The array-like converted to Array, or an Array containing the element
 */
function castArray(castable) {
  if (castable === void 0) return castable

  if (castable instanceof Array) {
    return castable
  }

  if (castable.callee || castable instanceof NodeList || castable instanceof DOMTokenList) {
    return Array.prototype.slice.call(castable)
  }

  return [castable]
}

/**
 * Removes an element from an array in-place without causing Garbage Collection
 * @example
 * const array = [🍎, 🍐, 🍌]
 * spliceOne(array, 1)
 * console.log(array) // Logs: [🍎, 🍌]
 * @param {Array} array Array you want to remove an element from
 * @param {Number} index The index of the element to remove
 */
function spliceOne(array, index) {
  for (let i = index, k = i + 1, n = array.length; k < n; i += 1, k += 1) {array[i] = array[k];}
  --array.length;
}

/**
 * @module  dom
 * @description Utilities to work with dom elements and selectors
 */

/**
 * Selects an array of DOM Elements, scoped to element
 *
 * @example
 * import {qsa} from '@okiba/dom'
 * const fruits = qsa('.fruit')
 * console.log(fruits) // [div.fruit, div.fruit]
 *
 * @param  {String}   selector            DOM Selector (tag, class, id, anything that can be passed to `querySelector` API)
 * @param  {Element}  [element=document]  DOM Element to scope the selection query, only childs of that element will be tageted
 *
 * @return {Element[]} An array of DOM elements matching `selector`
 */
function qsa(selector, element = document) {
  return castArray(element.querySelectorAll(selector))
}

/**
 * Gets top and left offsets of an element
 *
 * @example
 * import {qs, offset} from '@okiba/dom'
 * const el = qs('.something')
 * const offsets = offset(el)
 * console.log(offsets) // Logs: {top: 100, left: 100}
 *
 * @param {Element} el The element you want to get offsets of
 *
 * @return {Object} Object containing `top` and `left` offsets
 */
function offset(el) {
  let left = 0;
  let top = 0;

  while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
    left += el.offsetLeft - (el.tagName !== 'BODY' ? el.scrollLeft : 0);
    top += el.offsetTop - (el.tagName !== 'BODY' ? el.scrollTop : 0);
    el = el.offsetParent;
  }

  return {
    top,
    left
  }
}


/**
 * Useful to normalize parameters accepted by modules which work with dom nodes.
 * If you need to have an array of Elements and you want to accept any of: String, String array, Element, Element array
 *
 *
 * @example
 * import {qs, getElements} from '@okiba/dom'
 * const els1 = getElements(['.some', '#thing']) // => [div.some, span#it]
 *
 * const el = qs('.element')
 * const els2 = getElements(el) // => [el]
 *
 * @param {(String|String[]|Element|Element[])} target The target you want to be sure to obtain as an array of Elements
 *
 * @return {Element[]} An array of Elements
 */
function getElements(target) {
  let els;

  if (typeof target === 'string') {
    els = qsa(target);
  }

  if (target instanceof Node) {
    els = [target];
  }

  if (target instanceof NodeList) {
    els = castArray(target);
  }

  if (target instanceof Array) {
    if (target[0] instanceof Node) {
      return target
    } else if (typeof target[0] === 'string') {
      els = target.reduce((acc, curr) => acc.concat(qsa(curr)), []);
    }
  }

  if (!els) {
    throw new Error('No target provided')
  }

  return els
}

var animators = [];
var scrollY = 0;
var RafID;
var isObservedRunning = false;
var isRafNeeded = false;
var currentAnimator = null;
var currentObserved = null;
var currentCallbacks = null;

var ScrollAnimator =
/*#__PURE__*/
function () {
  function ScrollAnimator() {
    var _this = this;

    _classCallCheck(this, ScrollAnimator);

    _defineProperty(this, "recalculate", function (_) {
      for (var i = 0; i < animators.length; i++) {
        _this.calculateOffset(animators[i]);
      }
    });

    _defineProperty(this, "RAF", function () {
      RafID = requestAnimationFrame(_this.onRaf);
    });

    _defineProperty(this, "onScroll", function () {
      scrollY = window.pageYOffset;

      _this.stop();

      _this.RAF();
    });

    _defineProperty(this, "onResize", function () {
      _this.recalculate();
    });

    _defineProperty(this, "onRaf", function () {
      isRafNeeded = false;

      for (var i = 0; i < animators.length; i++) {
        currentAnimator = animators[i];

        for (var j = 0; j < currentAnimator.observed.length; j++) {
          currentObserved = currentAnimator.observed[j];
          isObservedRunning = false;

          for (var k = 0; k < currentAnimator.callbacks.length; k++) {
            if (!currentObserved.settings[k].enable) continue;
            currentCallbacks = currentAnimator.callbacks[k];
            isObservedRunning = true;

            _this.animateObserved(k);
          }

          if (!isObservedRunning) {
            currentObserved = null;
            spliceOne(currentAnimator.observed, j);
            j--;
          }

          if (currentAnimator.observed.length < 1) {
            currentAnimator = null;
            spliceOne(animators, i);
            i--;
            break;
          }
        }

        if (isRafNeeded) {
          _this.RAF();
        }
      }
    });

    scrollY = window.pageYOffset;
    this.addListeners();
  }

  _createClass(ScrollAnimator, [{
    key: "observe",
    value: function observe(target, onInit, onCalculate) {
      var observed = getElements(target).map(function (el) {
        return {
          el: el
        };
      });
      var animator = {
        observed: observed,
        onCalculate: onCalculate,
        callbacks: []
      };
      animators.push(animator);
      this.calculateOffset(animator);
      if (onInit) onInit(animator);

      var add = function (callbacks) {
        animator.callbacks.push(callbacks);
        this.calculateOffset(animator);
        this.onScroll();
        return {
          add: add
        };
      }.bind(this);

      return {
        add: add
      };
    }
  }, {
    key: "calculateOffset",
    value: function calculateOffset(animator) {
      for (var i = 0; i < animator.observed.length; i++) {
        var observed = animator.observed[i];
        var offsets = offset(observed.el);
        observed.top = offsets.top;
        observed.bottom = observed.top + observed.el.offsetHeight;
        observed.left = offsets.left;
        observed.right = offsets.left + observed.el.offsetWidth;
        observed.settings = [];

        for (var j = 0; j < animator.callbacks.length; j++) {
          var cbOptions = animator.callbacks[j];
          observed.settings[j] = {};
          observed.settings[j].enable = true;
          observed.settings[j].top = observed.top;
          observed.settings[j].bottom = observed.bottom;

          if (cbOptions.offset) {
            observed.settings[j].top += animator.offset;
          }

          if (cbOptions.position) {
            if (cbOptions.position === 'middle') {
              observed.settings[j].top += observed.el.offsetHeight / 2;
            }

            if (cbOptions.position === 'bottom') {
              observed.settings[j].top += observed.el.offsetHeight;
            }
          }

          if (observed.settings[j].top > window.innerHeight) {
            observed.settings[j].top -= window.innerHeight;
          } else {
            observed.settings[j].top = 0;
          }
        }

        if (animator.onCalculate) animator.onCalculate(observed);
      }
    }
  }, {
    key: "animateOut",
    value: function animateOut(callbackIndex) {
      if (!currentObserved.settings[callbackIndex].entered) return;
      currentObserved.settings[callbackIndex].entered = false;

      if (currentCallbacks.onExit) {
        currentCallbacks.onExit(currentObserved, scrollY);
      }
    }
  }, {
    key: "animateIn",
    value: function animateIn(callbackIndex) {
      if (!currentObserved.settings[callbackIndex].entered) {
        currentObserved.settings[callbackIndex].entered = true;
        currentCallbacks.onEnter(currentObserved, scrollY);
      }

      if (!currentCallbacks.onRaf && !currentCallbacks.onExit) {
        currentObserved.settings[callbackIndex].enable = false;
      }
    }
  }, {
    key: "animateObserved",
    value: function animateObserved(callbackIndex) {
      var positions = currentObserved.settings[callbackIndex];
      if (positions.top === undefined) return;

      if (scrollY >= positions.top && scrollY < positions.bottom) {
        if (!currentObserved.entered) {
          this.animateIn(callbackIndex);
        }

        if (currentCallbacks.onRaf) {
          isRafNeeded = true;
          currentCallbacks.onRaf(currentObserved, scrollY);
        }
      } else {
        this.animateOut(callbackIndex);
      }
    }
  }, {
    key: "reset",
    value: function reset() {
      animators.length = 0;
    }
  }, {
    key: "stop",
    value: function stop() {
      if (RafID) cancelAnimationFrame(RafID);
    }
  }, {
    key: "addListeners",
    value: function addListeners() {
      window.addEventListener('scroll', this.onScroll);
      window.addEventListener('resize', this.onResize);
    }
  }, {
    key: "removeListeners",
    value: function removeListeners() {
      window.addEventListener('scroll', this.onScroll);
      window.addEventListener('resize', this.onResize);
    }
  }]);

  return ScrollAnimator;
}();

var instance;
function index () {
  if (!instance) instance = new ScrollAnimator();
  return instance;
}

exports.default = index;
