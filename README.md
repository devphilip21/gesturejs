# gesturejs

Composable, high-performance gesture recognition for JavaScript runtimes.

```typescript
import { panGesture } from "@gesturejs/pan";

panGesture(element, { threshold: 10 }).subscribe((event) => {
  element.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px)`;
  element.innerText = `velocity: ${event.velocityX}, ${event.velocityY}`;
});
```

Alternatively, it can be extended using pipelines.

```typescript
import { panGesture } from "@gesturejs/pan";
import { withVelocity } from "@gesturejs/pan/extensions";

const gestureStream = pipe(
  panGesture(element, { threshold: 10 }),
  withVelocity(),  
)

gestureStream.subscribe((event) => {
  element.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px)`;
  element.innerText = `velocity: ${event.velocityX}, ${event.velocityY}`; // Type inference automatically
});
```

## Why gesturejs?

- **Observable-Based** - Compose with `pipe`, `filter`, `merge` and other stream operators
- **Extensible** - Add velocity tracking, axis locking, and custom behaviors via operators
- **Zero GC Jank** - Object pooling keeps animations smooth at 60+ events/sec

## Architecture

<p align="center">
  <img src="docs/assets/gesturejs-base-structure-diagram.webp" alt="gesturejs architecture" width="600" />
</p>

| Layer | Role |
|-------|------|
| **Gesture Layer** | Recognizes gestures (pan, pinch) from signal streams |
| **Signal Layer** | Normalizes inputs into a unified interface |
| **Native Events Layer** | Raw pointer, touch, mouse events |

## Packages

| Package | Description |
|---------|-------------|
| [@gesturejs/pan](./packages/gesture/pan) | Pan gesture recognition |
| [@gesturejs/single-pointer](./packages/signal/single-pointer) | Unified pointer/touch/mouse input |
| [@gesturejs/gesture](./packages/core/gesture) | Gesture event framework |
| [@gesturejs/signal](./packages/core/signal) | Base signal abstraction |
| [@gesturejs/stream](./packages/core/stream) | Lightweight reactive streams (zero dependencies) |

## License

MIT
