# Cereb

**User input handling and orchestration** library,
From low-level events (keyboard, wheel, pointer) to high-level gestures (pan, pinch)

```bash
npm install --save cereb
```

## Getting started

The example below moves an element by tracking pointer position:

```typescript
import { singlePointer } from "cereb";

// Create a stream from pointer events
singlePointer(canvas)
  // Listen to stream events
  .on((signal) => {
    // Receive signals from the stream
    const { phase, x, y } = signal.value;
    switch (phase){
      case "move":
        element.style.transform = `translate(${x}px, ${y}px)`;
        break;
    }
  });
```

## High-level gestures packages

For advanced gestures like pan or pinch, install dedicated packages that build on top of Cereb's core:

| Package | Description |
|---------|-------------|
| [@cereb/pan](./packages/pan) | Pan/drag gestures with velocity and direction tracking |
| [@cereb/pinch](./packages/pinch) | Pinch-to-zoom with distance and scale calculations |

### Pinch example

```bash
npm install --save cereb @cereb/pinch
```

```typescript
import { pipe } from "cereb";
import { zoom } from "cereb/operators";
import { pinch } from "@cereb/pinch";

// pipe creates a pipeline where signals flow through operators
// Each operator extends the signal (signals are immutable)
pinch(element)
  // Operator: Determine scale value.
  .pipe(zoom({ minScale: 0.5, maxScale: 3.0 })).on((signal) => {
    // The scale property is extended from the value.
    // - pinch emits distance → zoom calculates scale
    // - zoom also works with other inputs (keyboard, wheel, etc.)
    element.style.transform = `scale(${signal.value.scale})`;
  });
```

## API overview

Full API docs are coming soon.
In the meantime, check the source—it's well-typed and commented:

- [Stream Factories](https://github.com/devphilip21/cereb/tree/main/packages/cereb/src/browser)
- [Operators](https://github.com/devphilip21/cereb/tree/main/packages/cereb/src/operators)

## The Problems Cereb Solves

### 1. Event-Driven Code Becomes Spaghetti

Traditional event handlers create **scattered logic, side effects, and duplicated code** that's hard to maintain.
See how this plays out in a multi-input zoom implementation:

```typescript
// Before: Scattered handlers, shared state, duplicated logic
let currentScale = 1;
let isZoomMode = false;
let initialPinchDistance = 0;

window.addEventListener('keydown', e => {
  if (e.key === 'z') { isZoomMode = true; toggleZoomModeIndicator(true); }
  if (isZoomMode && (e.key === '+' || e.key === '=' || e.key === '-')) {
    e.preventDefault();
    currentScale = Math.max(MIN, Math.min(MAX, currentScale + ...));
    render(currentScale);  // min/max logic here
  }
});
window.addEventListener('keyup', e => { /* isZoomMode = false ... */ });

box.addEventListener('wheel', e => {
  if (!isZoomMode) return;
  currentScale = Math.max(MIN, Math.min(MAX, ...));  // duplicated
  render(currentScale);
}, { passive: false });

// Pinch: touchstart/touchmove/touchend, track two fingers, calculate distance...
box.addEventListener('touchstart', e => { /* ... */ });
box.addEventListener('touchmove', e => {
  // ... 10+ lines: distance calculation, ratio, min/max again
});
box.addEventListener('touchend', () => { /* cleanup */ });

slider.addEventListener('input', e => { /* ... min/max again */ });
// 8 handlers, 3+ shared states, min/max duplicated everywhere
```

<br>

Cereb's solution:
Model events as streams, and you get readable, reusable, extensible declarative pipelines.

```typescript
// After: Clear flow, no side effects, composable
import { pipe, keyboard, keyboardHeld, wheel, domEvent } from "cereb";
import { zoom, extend, when } from "cereb/operators";
import { pinch } from "@cereb/pinch";

const MIN_SCALE = 0.2, MAX_SCALE = 5;

// 'z' key pressed to enter Zoom Mode Stream
const isInZoomMode$ = keyboardHeld(window, { key: "z" });
isInZoomMode$.on(toggleZoomModeIndicator);

// Pinch Zoom
pinch(box, { threshold: 10 })
  .pipe(zoom({ minScale: MIN_SCALE, maxScale: MAX_SCALE }))
  .on(render);

// 'z' + '+/-'
keyboard(window, { key: ["+", "=", "-"], preventDefault: true })
  .pipe(
    when(isInZoomMode$),
    extend<KeyboardSignal, ZoomInput>((signal) => ({
      ratio: zoomManager.getScale() + (signal.value.key === "+" || signal.value.key === "=" ? 0.15 : -0.15),
    })),
    zoom({ minScale: MIN_SCALE, maxScale: MAX_SCALE }),
  ).on(render);

// 'z' + 'wheel'
wheel(box, { passive: false, preventDefault: true })
  .pipe(
    when(isInZoomMode$),
    extend<WheelSignal, ZoomInput>((signal) => ({
      ratio: zoomManager.getScale() + (-signal.value.deltaY * 0.005),
    })),
    zoom({ minScale: MIN_SCALE, maxScale: MAX_SCALE }),
  ).on(render);

// 'Slider Input'
domEvent(slider, "input")
  .pipe(
    extend<DomEventSignal<Event>, ZoomInput>((signal) => {
      const inputElement = signal.value.target as HTMLInputElement;
      const value = Number(inputElement.value);
      const logScale = logMin + (value / 100) * (logMax - logMin);
      const scale = Math.exp(logScale);
      return {
        ratio: clamp(scale, MIN_SCALE, MAX_SCALE),
      };
    }),
    zoom({ minScale: MIN_SCALE, maxScale: MAX_SCALE, baseScale: zoomManager.getScale() }),
  ).on(render);
```

### 2. Lightweight Bundle Size

Benchmark: Equivalent pan gesture implementation

| | Minified | Gzipped |
|--|----------|---------|
| cereb + @cereb/pan | 4.58 KB | **1.73 KB** |
| Hammer.js | 20.98 KB | 7.52 KB |

**~77% smaller** than Hammer.js for equivalent pan gesture functionality.

### 3. Performance & Resource Efficiency

**1. Event Listener Reuse**

```typescript
// Before: Multiple addEventListener calls
window.addEventListener('keydown', handler1);
window.addEventListener('keydown', handler2);
window.addEventListener('keydown', handler3);

// After: Shared stream, single listener
// addEventListener called once
keyboard(window).on(handler1);
keyboard(window).on(handler2);
keyboard(window).on(handler3);
```

**2. Single Responsibility Operators**

```typescript
pan(element)                // Pan gesture recognition
  .pipe(
    offset({ target }),     // Element-relative coordinates
    axisLock()              // Lock to horizontal/vertical
  )
```

## License

Cereb is [MIT licensed](./packages/cereb/LICENSE).
