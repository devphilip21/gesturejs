# @gesturejs/pan

Observable-based pan gesture recognition with composable operators.

### Why @gesturejs/pan?
- **Observable-Based** - Compose with pipe, filter, merge and other stream operators
- **Extensible** - Add velocity tracking, axis locking, and custom behaviors via operators (type-inference support)
- **Zero GC Jank** - Object pooling keeps animations smooth at 60+ events/sec

## Installation

```bash
npm install @gesturejs/pan
```

## Quick Start

```typescript
import { panGesture } from "@gesturejs/pan";

const stream = panGesture(element, { threshold: 10 });
const unsub = stream.subscribe((event) => {
  console.log(event.deltaX, event.deltaY); // displacement from start
  console.log(event.phase); // start, change, end, cancel
});
```

### With Extensions

```typescript
import { panGesture } from "@gesturejs/pan";
import { withVelocity } from "@gesturejs/pan/extensions";
import { pipe } from "@gesturejs/stream";

const stream = pipe(
  panGesture(element, { threshold: 10 }),
  withVelocity()
);

const unsub = stream.subscribe((event) => {
  console.log(event.deltaX, event.deltaY); // displacement from start
  console.log(event.velocityX, event.velocityY);
  console.log(event.phase); // start, change, end, cancel
});
```

### Composable Usage

For more control, use `singlePointerToPanGesture` operator with your own pointer source:

```typescript
import { singlePointer } from "@gesturejs/single-pointer";
import { singlePointerToPanGesture } from "@gesturejs/pan";
import { withVelocity } from "@gesturejs/pan/extensions";
import { pipe } from "@gesturejs/stream";

const stream = pipe(
  singlePointer(element),
  singlePointerToPanGesture({ threshold: 10 }),
  withVelocity()
);
```

## Recipes

### Direction-Specific Threshold

```typescript
import { panGesture } from "@gesturejs/pan";

/**
 * Only trigger when horizontal movement exceeds threshold.
 * Vertical movement is ignored for threshold calculation.
 */
const stream = panGesture(element, {
  threshold: 10,
  direction: "horizontal", // "horizontal" | "vertical" | "all"
});
```

### Axis Lock

```typescript
import { panGesture } from "@gesturejs/pan";
import { axisLock } from "@gesturejs/pan/extensions";
import { pipe } from "@gesturejs/stream";

/**
 * Lock gesture to the initially detected axis.
 * After lock, movement on the opposite axis is zeroed out.
 */
const stream = pipe(
  panGesture(element, { threshold: 10 }),
  axisLock()
);

stream.subscribe((event) => {
  // One of deltaX/deltaY will always be 0 after axis is determined
  element.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px)`;
});
```

### Object Pooling

```typescript
import { panGesture } from "@gesturejs/pan";

/**
 * Pooling reduces allocations/GC pressure for high-frequency input
 * - but emitted objects are reused (mutated/reset). Don't keep references.
 * - If you need to persist data, copy the fields you need.
 */
const stream = panGesture(element, {
  threshold: 10,
  pooling: true,
  pointer: { pooling: true }, // also pool SinglePointer events
});
```

## License

MIT
