# [@cereb/tap](https://cereb.dev/stream-api/tap)

Tap gesture recognition with multi-tap support. Works seamlessly with [cereb](https://www.npmjs.com/package/cereb) reactive streams.

## Installation

```bash
npm install --save cereb @cereb/tap
```

## Quick Start

```typescript
import { tap } from "@cereb/tap";

tap(element).on((signal) => {
  const { tapCount, cursor } = signal.value;
  const [x, y] = cursor;

  if (tapCount === 2) {
    console.log(`Double tap at (${x}, ${y})`);
  }
});
```

## With Visual Feedback

Use the `tapRecognizer` operator to handle tap lifecycle for visual feedback:

```typescript
import { singlePointer } from "cereb";
import { tapRecognizer } from "@cereb/tap";

singlePointer(element)
  .pipe(tapRecognizer({ durationThreshold: 300 }))
  .on((signal) => {
    const { phase } = signal.value;

    if (phase === "start") {
      element.classList.add("pressed");
    } else {
      element.classList.remove("pressed");
    }
  });
```

## Documentation

For detailed documentation, examples, and guides, visit [cereb.dev/stream-api/tap](https://cereb.dev/stream-api/tap).

## API

### `tap(target, options?)`

Creates a tap gesture stream from an element. Only emits successful tap events (phase === "end").

```typescript
import { tap } from "@cereb/tap";

const stream = tap(element, { durationThreshold: 300, chainIntervalThreshold: 250 });
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `movementThreshold` | `number` | `10` | Max movement (px) allowed during tap |
| `durationThreshold` | `number` | `500` | Max duration (ms) for a valid tap |
| `chainMovementThreshold` | `number` | `movementThreshold` | Max distance between consecutive taps |
| `chainIntervalThreshold` | `number` | `durationThreshold / 2` | Max interval (ms) between consecutive taps |

### `tapRecognizer(options?)`

Operator that transforms single-pointer signals into tap events with full lifecycle (start, end, cancel). Use this when you need visual feedback or composition with other operators.

```typescript
import { singlePointer } from "cereb";
import { tapRecognizer } from "@cereb/tap";

singlePointer(element)
  .pipe(tapRecognizer({ movementThreshold: 15 }))
  .on((signal) => {
    // ...
  });
```

### `tapEndOnly(options?)`

Operator that only emits successful tap events (phase === "end"). Filters out start and cancel phases.

```typescript
import { singlePointer } from "cereb";
import { tapEndOnly } from "@cereb/tap";

singlePointer(element)
  .pipe(tapEndOnly())
  .on((signal) => {
    console.log(`Tap count: ${signal.value.tapCount}`);
  });
```

### `createTapRecognizer(options?)`

Low-level API for imperative usage or custom integrations.
Accepts any signal that satisfies `TapSourceSignal` interface.

```typescript
import { createTapRecognizer, type TapSourceSignal } from "@cereb/tap";

const recognizer = createTapRecognizer({ durationThreshold: 300 });

// Works with any source that provides the required properties
function handlePointerEvent(signal: TapSourceSignal) {
  const tapEvent = recognizer.process(signal);
  if (tapEvent?.value.phase === "end") {
    console.log(`Tap ${tapEvent.value.tapCount}!`);
  }
}
```

## TapValue

| Property | Type | Description |
|----------|------|-------------|
| `phase` | `"start" \| "end" \| "cancel"` | Current gesture phase |
| `cursor` | `[number, number]` | Tap position (client coordinates) |
| `pageCursor` | `[number, number]` | Tap position (page coordinates) |
| `tapCount` | `number` | Consecutive tap count (1=single, 2=double, etc.) |
| `duration` | `number` | How long the pointer was pressed (ms) |
| `pointerType` | `"mouse" \| "touch" \| "pen" \| "unknown"` | Type of pointer |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/devphilip21/cereb/blob/main/CONTRIBUTING.md).

## License

MIT
