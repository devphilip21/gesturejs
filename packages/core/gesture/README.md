# @cereb/gesture

Core gesture event abstractions for cereb. Provides the base `GestureEvent` type and utilities that all gesture implementations build upon.

## Installation

```bash
npm install @cereb/gesture
```

## Core Concepts

### GestureEvent

The base type for all gesture events, combining `Signal` with gesture-specific properties and optional extensions:

```typescript
import type { GestureEvent, GesturePhase } from "@cereb/gesture";

// GestureEvent<TType, TExtension>
type GestureEvent<
  TType extends string = string,
  TExtension extends object = object,
> = Signal<TType> & {
  phase: GesturePhase;
  prevent(): void;
} & TExtension;

type GesturePhase = "start" | "change" | "end" | "cancel";
```

Define gesture-specific events by providing extension data:

```typescript
// Define pan-specific properties
interface PanEventData {
  deltaX: number;
  deltaY: number;
  distance: number;
}

// Create a typed pan event
type PanEvent = GestureEvent<"pan", PanEventData>;

// PanEvent now has: type, timestamp, deviceId, phase, prevent(), deltaX, deltaY, distance
```

### GestureEventPool

Built-in object pooling for gesture events to prevent garbage collection pauses during high-frequency input:

```typescript
import { createGestureEventPool, type GestureEvent } from "@cereb/gesture";

interface PanEventData {
  deltaX: number;
  deltaY: number;
}

type PanEvent = GestureEvent<"pan", PanEventData>;

const pool = createGestureEventPool<PanEvent>(
  () => ({
    type: "pan",
    phase: "start",
    timestamp: 0,
    deviceId: "",
    deltaX: 0,
    deltaY: 0,
    prevent() { /* ... */ },
  }),
  (obj) => {
    obj.phase = "start";
    obj.timestamp = 0;
    obj.deltaX = 0;
    obj.deltaY = 0;
  },
  20,  // initial size
  100  // max size
);

const event = pool.acquire();
// use event...
pool.release(event);
```

The pool provides:
- `acquire()` - Get an event object from the pool
- `release(obj)` - Return an event object to the pool
- `clear()` - Empty the pool
- `size` - Current number of objects in the pool
- `active` - Number of objects currently in use

### Event Prevention

Gesture events can be prevented from propagating to downstream operators:

```typescript
import { isPrevented, excludePrevented } from "@cereb/gesture";
import { pipe, tap } from "@cereb/stream";

pipe(
  gestureStream,
  tap((event) => {
    if (shouldPrevent(event)) {
      event.prevent();
    }
  }),
  excludePrevented()
).subscribe((event) => {
  // Only non-prevented events arrive here
});
```

## API

### Types

- `GestureEvent<TType, TExtension>` - Base type for all gesture events
- `GesturePhase` - Gesture lifecycle phases: `"start"` | `"change"` | `"end"` | `"cancel"`

### Functions

- `isPrevented(event)` - Check if a gesture event has been prevented
- `createGestureEventPool(factory, reset, initialSize?, maxSize?)` - Create an object pool for gesture events

### Operators

- `excludePrevented()` - Filter out prevented gesture events from a stream

## License

MIT
