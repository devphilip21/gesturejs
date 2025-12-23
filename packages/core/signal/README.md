# @cereb/signal

**Signal** is a higher-level abstraction over events that merges and refines disparate inputs into a single, composable stream.

## Installation

```bash
npm install --save @cereb/signal
```

## Core Concepts

### Signal

A `Signal` is the base interface for all normalized event data:

```typescript
interface Signal<T extends string = string> {
  type: T;
  timestamp: number;
  deviceId: string;
}
```

### SignalPool

Built-in object pooling for Signal types to prevent garbage collection pauses during high-frequency input (60+ events/sec):

```typescript
import { createSignalPool, type Signal } from "@cereb/signal";

interface MySignal extends Signal<"custom"> {
  type: "custom";
  x: number;
  y: number;
}

const pool = createSignalPool<MySignal>(
  () => ({ type: "custom", timestamp: 0, deviceId: "", x: 0, y: 0 }),
  (obj) => { obj.timestamp = 0; obj.deviceId = ""; obj.x = 0; obj.y = 0; },
  20,   // initial size
  100   // max size
);

const signal = pool.acquire();
// use signal...
pool.release(signal);
```

## License

MIT
