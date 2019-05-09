# okiba-scroller

A lightweight module to animate elements on your page as you scroll written in pure Javascript. 

## Setup
Download via npm 
```js
npm i @okiba/scroller
```

or use it via cdn 
```html
<script src="https://unpkg.com/@okiba/scroller/dist/okiba-scroller.umd.min.js"></script>`
```

```js
import 'OkibaScroller' from '@okiba/scroller'

const animator = OkibaScroller()
```

## How use it
You can add all "animators" that you want!

#### Simple use 

```js
const boxes = Array.from(document.querySelectorAll('.box-1'))
animator.observe(boxes)
  .add({
    onEnter: function(observed) {
      observed.el.classList.add('visible')
    }
  })
```

#### Advanced use

Start adding the elements that you want to observe, adding callback if you want.

```js
function onInit(observed) {
  console.log('onInit', observed)
}

function onCalculate(observed) {
  console.log('onCalculate', observed)
}

const observed = animator.observe(
  Array.from(document.querySelectorAll('.box-1')),
  onInit, // optional, called when element is added
  onCalculate // optional, called every time that the element position in calculated
)
```

Now you can add multiple sets of callback 

```js
observed.add({
  position: 'top', // optional, possible values are ['top', 'middle', 'bottom']
  offset: 0, // optional
  onEnter: function(observed, scrollY) {
    // called when element enter in viewport based on position and offset settings

    // for example set an attribute
    observed.el.setAttribute('data-state', 'show');
    // or add a css class
    observed.el.classList.add('visible');
  },
  onRaf(): function(observed, scrollY) { 
    // optional, called when element is in viewport based on position and offset settings
    // ... example of canvas animation when in viewport
    console.log('onRaf', observed)
  },
  onExit: function(observed, scrollY) { 
    // optional, called when element exit in viewport based on position and offset settings
    observed.el.classList.remove('visible')
  }
}
```

An example to animate a canvas in viewport (animateOnce to false):
```js
observed.add({
  onRaf: function(observed, scrollY){
    observed.ctx.clearRect(0,0,300,150);
    observed.ctx.fillStyle="red";
    observed.ctx.fillRect(0,0,300,150);
  },
});

```

or play video only in viewport:
```js
observed.add({
  onEnter: function(elem, scrollY){
    elem.el.play();
  },
  onExit: function(elem, scrollY){
    elem.el.pause();
  }
});

```

Be sure to polyfill if needed:
- `window.requestAnimationFrame`


*ENJOY!*

**Okiba Gang** 🔪