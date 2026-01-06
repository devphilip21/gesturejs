# [@cereb/pan](https://cereb.dev/stream-api/pan)

Pan gesture recognition for pointer interactions. Works seamlessly with [cereb](https://www.npmjs.com/package/cereb) reactive streams.

## Installation

```bash
npm install --save cereb @cereb/pan
```

## Quick Start

```typescript
import { pan } from "@cereb/pan";

pan(element).on((signal) => {
  const { phase, delta, velocity } = signal.value;
  const [deltaX, deltaY] = delta;
  const [velocityX, velocityY] = velocity;

  if (phase === "move") {
    console.log(`Delta: (${deltaX}, ${deltaY}), Velocity: (${velocityX}, ${velocityY})`);
  }
});
```

## With Axis Lock Operator

Use the `axisLock` operator to lock gesture to the initially detected axis:

```typescript
import { pan } from "@cereb/pan";
import { axisLock } from "@cereb/pan/operators";

pan(element, { threshold: 10 })
  .pipe(axisLock())
  .on((signal) => {
    const [deltaX, deltaY] = signal.value.delta;

    // One of deltaX/deltaY will always be 0 after axis is determined
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });
```

## Documentation

For detailed documentation, examples, and guides, visit [cereb.dev/stream-api/pan](https://cereb.dev/stream-api/pan).

## API

### `pan(target, options?)`

Creates a pan gesture stream from an element.

```typescript
import { pan } from "@cereb/pan";

const stream = pan(element, { threshold: 10, direction: "horizontal" });
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `10` | Minimum movement (px) before gesture starts |
| `direction` | `"horizontal" \| "vertical" \| "all"` | `"all"` | Direction constraint for threshold calculation |

### `panRecognizer(options?)`

Operator that transforms single-pointer signals into pan events. Use this when composing with other operators.

```typescript
import { singlePointer } from "cereb";
import { panRecognizer } from "@cereb/pan";

singlePointer(element)
  .pipe(panRecognizer({ threshold: 10 }))
  .on((signal) => {
    // ...
  });
```

### `createPanRecognizer(options?)`

Low-level API for imperative usage or custom integrations.
Accepts any signal that satisfies `PanSourceSignal` interface.

```typescript
import { createPanRecognizer, type PanSourceSignal } from "@cereb/pan";

const recognizer = createPanRecognizer({ threshold: 10 });

// Works with any source that provides the required properties
function handlePointerEvent(signal: PanSourceSignal) {
  const panEvent = recognizer.process(signal);
  if (panEvent) {
    const [deltaX] = panEvent.value.delta;
    const [velocityX] = panEvent.value.velocity;
    console.log(deltaX, velocityX);
  }
}
```

## PanValue

| Property | Type | Description |
|----------|------|-------------|
| `phase` | `"start" \| "move" \| "end" \| "cancel"` | Current gesture phase |
| `cursor` | `[number, number]` | Current position (client coordinates) |
| `pageCursor` | `[number, number]` | Current position (page coordinates) |
| `delta` | `[number, number]` | Displacement from start point `[deltaX, deltaY]` |
| `velocity` | `[number, number]` | Velocity (px/ms) `[velocityX, velocityY]` |
| `distance` | `number` | Total cumulative distance traveled |
| `direction` | `"up" \| "down" \| "left" \| "right" \| "none"` | Current movement direction |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/devphilip21/cereb/blob/main/CONTRIBUTING.md).

## License

MIT
