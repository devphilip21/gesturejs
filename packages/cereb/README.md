# Cereb

User input modeling and orchestration with a lightweight reactive stream library.

## Installation

```bash
npm install cereb
```

## Quick Start

Cereb models user input as lightweight reactive streams—from low-level DOM events to pointers, and higher-level gestures like pan or pinch.
Below is a minimal example for a **single pointer** stream.

```typescript
import { singlePointer } from "cereb";

/**
 * Provides a stream for a single pointer.
 * - Merges DOM events from pointer start → end/cancel into one stream and normalizes them into a single, clean interface.
 * - Keeps pointer handling clear and purpose-driven—no need to juggle multiple DOM event shapes.
 * - Lets you coordinate and control priority across multiple input streams.
 */
singlePointer(canvas).subscribe((signal) => {
  const { phase, x, y } = signal.value;

  switch (phase) {
    case "move":
      point.style.setProperty("transform", `translateX(${x}, ${y})`);
      break;
  }
});
```

## What problems does Cereb solve?

- **Unified Input Abstraction** - Handle mouse, touch, and pen with a single `SinglePointer` interface
- **Composable Pipelines** - Transform streams with operators like `filter`, `map`, `throttle`, and more
- **Stream Orchestration** - Schedule and coordinate multiple streams (coming soon)
- **Lightweight** - Minimal overhead for high-frequency input handling

## Recipes

### Session Filtering

Filter events to only emit during active sessions (from pointer down to up/cancel). Events outside a session are ignored.

```typescript
import { pipe, singlePointer, singlePointerSession } from "cereb";

// Only emits events from start → end/cancel
const stream = pipe(
  singlePointer(element),
  singlePointerSession()
);

stream.subscribe((signal) => {
  // Guaranteed to be within an active pointer session
  const { phase, x, y } = signal.value;
});
```

For custom session boundaries, use `session` directly:

```typescript
import { pipe, session } from "cereb";

const stream = pipe(
  someStream,
  session({
    start: (signal) => signal.value.phase === "start",
    end: (signal) => signal.value.phase === "end",
  })
);
```

### DOM Events

Cereb includes factories to convert DOM events into streams, and to build higher-level streams by merging mouse/touch/pointer events.

```typescript
import { domEvent, mouseEvents } from "cereb";

const $touchScrollContainer = domEvent(scrollContainerElement, "touchstart");
const $mouseSomething = mouseEvents(somethingElement);
```

You can also build a `singlePointer` stream from touch events:

```typescript
import { touchEvents, pipe } from "cereb";
import { singlePointerRecognizer } from "cereb/single-pointer/touch";

const pointSomething$ = pipe(
  touchEvents(somethingElement),
  singlePointerRecognizer(),
);

pointSomething$.subscribe((signal) => { /* .. */ });
```

### Blocking Streams

All streams are blockable - events are silently dropped when blocked:

```typescript
import { singlePointer } from "cereb";

const stream$ = singlePointer(element);

stream$.subscribe((p) => console.log(p.x, p.y));
stream$.block(); // Pause event processing
stream$.unblock(); // Resume event processing
```

## Cereb Operators

| Operator | Description |
|----------|-------------|
| `offset` | Add element-relative `offsetX`, `offsetY` to pointer signals |

```typescript
import { pipe, singlePointer, offset } from "cereb";

const stream = pipe(
  singlePointer(element),
  offset({ target: element }) // includes offsetX, offsetY relative to target element
);

stream.subscribe((signal) => {
  const { x, y, offsetX, offsetY } = signal.value;
});
```

## General Operators

Core includes common stream operators:

| Operator | Description |
|----------|-------------|
| `filter` | Emit only values that pass a predicate |
| `map` | Transform each value |
| `throttle` | Limit emission rate |
| `debounce` | Delay until quiet period |
| `take` / `skip` | Control emission count |
| `merge` | Combine multiple streams |
| `share` | Multicast to multiple subscribers |
| `distinctUntilChanged` | Skip consecutive duplicates |

```typescript
import { pipe, filter, throttle, map } from "cereb";

const stream = pipe(
  singlePointer(element),
  filter((p) => p.phase !== "cancel"),
  throttle(16), // ~60fps
  map((p) => ({ x: p.x, y: p.y }))
);
```

### Combining Streams

```typescript
import { pipe, merge, singlePointer, domEvent } from "cereb";

const keyboard$ = domEvent(window, "keydown");
const pointer$ = singlePointer(element);

// You can subscribe to events from multiple sources as one stream.
// This example simply merges, but you can orchestrate behavior with pipelines and operators.
const combined$ = merge(keyboard$, pointer$);
```

## License

MIT
