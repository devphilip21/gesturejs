# @gesturejs/signal

**Signal** is a higher-level abstraction over events that merges and refines disparate inputs into a single, composable stream.

## Why @gesturejs/signal?

- **Unified Interface** - Subscribe to diverse event sources through one consistent API by normalizing them into a unified signal stream.
- **GC Optimized** - Built-in object pooling prevents garbage collection pauses during high-frequency input (60+ events/sec)
- **Observable-Based** - Works seamlessly with reactive patterns via `@gesturejs/stream`.

## Installation

```bash
npm install @gesturejs/signal
```

## Quick Start

### Single Pointer

```typescript
import { singlePointer } from "@gesturejs/signal";

const stream = singlePointer(canvasElement);
const unsub = stream.subscribe((pointer) => {
  console.log(pointer.x, pointer.y);
  console.log(pointer.phase); // start, move, end, cancel
});
```

## Recipes

### Use Other Events

```typescript
import { touchEventsToSinglePointer } from "@gesturejs/signal";
import { fromEvent, merge, pipe, filter } from "@gesturejs/stream";

/**
 * The `singlePointer()` factory is primarily designed for PointerEvents.
 * If you're working with TouchEvents, you can convert a TouchEvent stream via
 * `touchEventsToSinglePointer()` and keep using the same SinglePointer pipeline.
 */
const stream = pipe(
  merge(
    fromEvent(el, "touchstart"),
    fromEvent(el, "touchmove"),
    fromEvent(el, "touchend"),
    fromEvent(el, "touchcancel")
  ),
  touchEventsToSinglePointer(),
  filter((p) => p.phase === "move")
);
const unsub = stream.subscribe((pointer) => {
  draw(pointer.x, pointer.y);
});
```

### Object Pooling

```typescript
/**
 * Pooling reduces allocations/GC pressure for high-frequency input
 * - but emitted objects are reused (mutated/reset). Don't keep references.
 * - If you need to persist data, copy the fields you need.
 */
const spStream = singlePointer(canvasElement, { pooling: true });
```

## Documentation

- [API Reference](./docs/api.md)
- [Signal Structure](./docs/signal.md)

## License

MIT
