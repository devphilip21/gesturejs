# Cereb

User input modeling and orchestration with a lightweight reactive stream library.

```typescript
import { pipe, singlePointer } from "cereb";
import { offset, singlePointerSession } from "cereb/operators";

pipe(
  // Subscribe to a single-pointer signal from `window`.
  singlePointer(window),

  // Treat start → end as one session (signals outside the session are ignored).
  singlePointerSession(),

  // `singlePointer(window)` yields window-relative x/y.
  // Compute canvas-relative coordinates and add `offsetX`/`offsetY`.
  offset({ target: canvas }),
).subscribe((signal) => {
  // Read values from the signal and draw.
  const { phase, offsetX, offsetY, pointerType } = signal.value;

  drawTrackingPointer({
    x: offsetX,
    y: offsetY,
    phase,
    pointerType,
  });
});
```

## Why cereb?

- **Observable-Based** - Compose with `pipe`, `filter`, `merge` and other stream operators
- **Extensible** - Add velocity tracking, axis locking, and custom behaviors via operators
- **Zero GC Jank** - Object pooling keeps animations smooth at 60+ events/sec

## Packages

| Package | Description |
|---------|-------------|
| [cereb](./packages/core) | Core |
| [@cereb/pan](./packages/pan) | Pan gesture recognition |

## License

Cereb is [MIT licensed](./packages/cereb/LICENSE).
