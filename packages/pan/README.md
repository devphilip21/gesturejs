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
  const { phase, deltaX, deltaY, velocityX, velocityY } = signal.value;

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
    const { deltaX, deltaY } = signal.value;

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

```typescript
import { createPanRecognizer } from "@cereb/pan";

const recognizer = createPanRecognizer({ threshold: 10 });

singlePointerStream.on((signal) => {
  const panEvent = recognizer.process(signal);
  if (panEvent) {
    console.log(panEvent.value.deltaX, panEvent.value.velocityX);
  }
});
```

## PanValue

| Property | Type | Description |
|----------|------|-------------|
| `phase` | `"start" \| "move" \| "end" \| "cancel"` | Current gesture phase |
| `deltaX` | `number` | X displacement from start point |
| `deltaY` | `number` | Y displacement from start point |
| `distance` | `number` | Total cumulative distance traveled |
| `direction` | `"up" \| "down" \| "left" \| "right" \| "none"` | Current movement direction |
| `velocityX` | `number` | X velocity (px/ms) |
| `velocityY` | `number` | Y velocity (px/ms) |
| `x` | `number` | Current X position (client) |
| `y` | `number` | Current Y position (client) |
| `pageX` | `number` | Current X position (page) |
| `pageY` | `number` | Current Y position (page) |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/devphilip21/cereb/blob/main/CONTRIBUTING.md).

## License

MIT
