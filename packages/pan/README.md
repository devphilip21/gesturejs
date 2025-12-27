# @cereb/pan

Observable-based pan gesture recognition with composable operators.

### Why @cereb/pan?
- **Observable-Based** - Compose with pipe, filter, merge and other stream operators
- **Extensible** - Add velocity tracking, axis locking, and custom behaviors via operators (type-inference support)
- **Lightweight** - Minimal overhead for high-frequency gesture handling

## Installation

```bash
npm install @cereb/pan
```

## Quick Start

```typescript
import { pan } from "@cereb/pan";

pan(element).subscribe((signal) => {
  console.log(signal.deltaX, signal.deltaY); // displacement from start
  console.log(signal.phase); // start, move, end, cancel
});
```

### With Extensions

```typescript
import { pipe } from "cereb";
import { pan } from "@cereb/pan";
import { withVelocity } from "@cereb/pan/operators";

const panCanvas$ = pipe(
  pan(canvas, { threshold: 10 }),
  withVelocity()
);

const unsub = panCanvas$.subscribe((signal) => {
  console.log(signal.deltaX, signal.deltaY); // displacement from start
  console.log(signal.velocityX, signal.velocityY);
  console.log(signal.phase); // start, change, end, cancel
});
```

## Recipes

### Direction-Specific Threshold

```typescript
import { pan } from "@cereb/pan";

/**
 * Only trigger when horizontal movement exceeds threshold.
 * Vertical movement is ignored for threshold calculation.
 */
const pan$ = pan(element, {
  threshold: 10,
  direction: "horizontal", // "horizontal" | "vertical" | "all"
});
```

### Axis Lock

```typescript
import { pipe } from "cereb";
import { pan } from "@cereb/pan";
import { axisLock } from "@cereb/pan/operators";

/**
 * Lock gesture to the initially detected axis.
 * After lock, movement on the opposite axis is zeroed out.
 */
const pan$ = pipe(
  pan(element, { threshold: 10 }),
  axisLock()
);

pan$.subscribe((event) => {
  // One of deltaX/deltaY will always be 0 after axis is determined
  element.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px)`;
});
```

## License

MIT
