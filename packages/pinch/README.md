# @cereb/pinch

Pinch gesture recognition for multi-touch interactions. Works seamlessly with [cereb](https://www.npmjs.com/package/cereb) reactive streams.

## Installation

```bash
npm install cereb @cereb/pinch
```

## Quick Start

```typescript
import { pinch } from "@cereb/pinch";

pinch(element).on((signal) => {
  const { phase, distance, velocity, centerX, centerY } = signal.value;

  if (phase === "change") {
    console.log(`Distance: ${distance}px, Velocity: ${velocity}px/ms`);
  }
});
```

## With Zoom Operator

Use the `zoom` operator from cereb to convert distance into scale values:

```typescript
import { zoom } from "cereb/operators";
import { pinch } from "@cereb/pinch";

pinch(element)
  .pipe(zoom({ minScale: 0.5, maxScale: 3.0 }))
  .on((signal) => {
    const { scale, scaleVelocity } = signal.value;

    element.style.transform = `scale(${scale})`;
  });
```

## API

### `pinch(target, options?)`

Creates a pinch gesture stream from an element.

```typescript
import { pinch } from "@cereb/pinch";

const stream = pinch(element, { threshold: 10 });
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `0` | Minimum distance change (px) before gesture starts |

### `pinchRecognizer(options?)`

Operator that transforms multi-pointer signals into pinch events. Use this when composing with other operators.

```typescript
import { multiPointer } from "cereb";
import { multiPointerSession } from "cereb/operators";
import { pinchRecognizer } from "@cereb/pinch";

multiPointer(element, { maxPointers: 2 })
  .pipe(
    multiPointerSession(2),
    pinchRecognizer({ threshold: 10 })
  ).on((signal) => {
    // ...
  });
```

### `createPinchRecognizer(options?)`

Low-level API for imperative usage or custom integrations.

```typescript
import { createPinchRecognizer } from "@cereb/pinch";

const recognizer = createPinchRecognizer({ threshold: 10 });

multiPointerStream.on((signal) => {
  const pinchEvent = recognizer.process(signal);
  if (pinchEvent) {
    console.log(pinchEvent.value.distance);
  }
});
```

## PinchValue

| Property | Type | Description |
|----------|------|-------------|
| `phase` | `"start" \| "change" \| "end" \| "cancel"` | Current gesture phase |
| `initialDistance` | `number` | Distance between pointers at gesture start |
| `distance` | `number` | Current distance between pointers |
| `deltaDistance` | `number` | Distance change since last event |
| `velocity` | `number` | Velocity of distance change (px/ms) |
| `centerX` | `number` | Center X between pointers (client) |
| `centerY` | `number` | Center Y between pointers (client) |
| `pageCenterX` | `number` | Center X between pointers (page) |
| `pageCenterY` | `number` | Center Y between pointers (page) |

## License

MIT
