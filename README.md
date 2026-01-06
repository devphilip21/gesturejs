# [Cereb](https://cereb.dev)

**User input handling and orchestration** library,
From low-level events (keyboard, wheel, pointer, touch, ...) to high-level gestures (pan, pinch, ...)

```bash
npm install --save cereb
```

## Getting started

The example below moves an element by tracking pointer position:

```typescript
import { singlePointer } from "cereb";

// Create a stream from pointer events
singlePointer(canvas)
  // Listen to stream events
  .on((signal) => {
    // Receive signals from the stream
    const { phase, cursor } = signal.value;
    const [x, y] = cursor;
    switch (phase){
      case "move":
        element.style.transform = `translate(${x}px, ${y}px)`;
        break;
    }
  });
```

## High-level gestures packages

For advanced gestures like pan or pinch, install dedicated packages that build on top of Cereb's core:

| Package | Description |
|---------|-------------|
| [@cereb/pan](./packages/pan) | Pan/drag gestures with velocity and direction tracking |
| [@cereb/pinch](./packages/pinch) | Pinch-to-zoom with distance and scale calculations |

### Pinch example

```bash
npm install --save cereb @cereb/pinch
```

```typescript
import { pipe } from "cereb";
import { zoom } from "cereb/operators";
import { pinch } from "@cereb/pinch";

// pipe creates a pipeline where signals flow through operators
// Each operator extends the signal (signals are immutable)
pinch(element)
  // Operator: Determine scale value.
  .pipe(zoom({ minScale: 0.5, maxScale: 3.0 })).on((signal) => {
    // The scale property is extended from the value.
    // - pinch emits distance → zoom calculates scale
    // - zoom also works with other inputs (keyboard, wheel, etc.)
    element.style.transform = `scale(${signal.value.scale})`;
  });
```

## Documentation

### Stream API

Create streams from various input sources:

| API | Description |
|-----|-------------|
| [pan](https://cereb.dev/stream-api/pan) | Pan gesture with velocity and direction |
| [pinch](https://cereb.dev/stream-api/pinch) | Pinch gesture with distance and center |
| [singlePointer](https://cereb.dev/stream-api/single-pointer) | Unified pointer (mouse/touch/pen) |
| [multiPointer](https://cereb.dev/stream-api/multi-pointer) | Multi-touch tracking |
| [keyboard](https://cereb.dev/stream-api/keyboard) | Keyboard events (keydown + keyup) |
| [keydown](https://cereb.dev/stream-api/keydown) | Keydown events only |
| [keyheld](https://cereb.dev/stream-api/keyheld) | Track if a key is held |
| [wheel](https://cereb.dev/stream-api/wheel) | Wheel/scroll events |
| [domEvent](https://cereb.dev/stream-api/dom-event) | Any DOM event |

### Operator API

Transform and compose streams with operators like `filter`, `map`, `merge`, `throttle`, `debounce`, and more.

[See all operators →](https://cereb.dev/operator-api/compose)

## The Problems Cereb Solves

- **Spaghetti Event Code** — Scattered handlers, shared mutable state, duplicated logic
- **Lightweight Bundle** — ~77% smaller than Hammer.js (1.73 KB gzipped for pan gesture)
- **Resource Efficiency** — Event listener reuse, single-responsibility operators

[See detailed examples →](https://cereb.dev/core-concepts/the-problem-solves)

## Contributing

If you find Cereb useful, consider giving it a star — it helps others discover the project!

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a Pull Request.

## License

Cereb is [MIT licensed](./LICENSE).
