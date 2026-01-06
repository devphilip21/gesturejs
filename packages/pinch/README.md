# [@cereb/pinch](https://cereb.dev/stream-api/pinch)

Pinch gesture recognition for multi-touch interactions. Works seamlessly with [cereb](https://www.npmjs.com/package/cereb) reactive streams.

## Installation

```bash
npm install --save cereb @cereb/pinch
```

## Quick Start

```typescript
import { pinch } from "@cereb/pinch";

pinch(element).on((signal) => {
  const { phase, distance, velocity, center } = signal.value;
  const [centerX, centerY] = center;

  if (phase === "change") {
    console.log(`Distance: ${distance}px, Velocity: ${velocity}px/ms, Center: (${centerX}, ${centerY})`);
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

## Documentation

For detailed documentation, examples, and guides, visit [cereb.dev/stream-api/pinch](https://cereb.dev/stream-api/pinch).

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
Accepts any signal that satisfies `PinchSourceSignal` interface.

```typescript
import { createPinchRecognizer, type PinchSourceSignal } from "@cereb/pinch";

const recognizer = createPinchRecognizer({ threshold: 10 });

// Works with any source that provides the required properties
function handleMultiPointerEvent(signal: PinchSourceSignal) {
  const pinchEvent = recognizer.process(signal);
  if (pinchEvent) {
    console.log(pinchEvent.value.distance);
  }
}
```

## PinchValue

| Property | Type | Description |
|----------|------|-------------|
| `phase` | `"start" \| "change" \| "end" \| "cancel"` | Current gesture phase |
| `initialDistance` | `number` | Distance between pointers at gesture start |
| `distance` | `number` | Current distance between pointers |
| `ratio` | `number` | Current distance / initial distance |
| `deltaDistance` | `number` | Distance change since last event |
| `velocity` | `number` | Velocity of distance change (px/ms) |
| `center` | `[number, number]` | Center point between pointers (client coordinates) |
| `pageCenter` | `[number, number]` | Center point between pointers (page coordinates) |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/devphilip21/cereb/blob/main/CONTRIBUTING.md).

## License

MIT
