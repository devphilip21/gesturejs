# Cereb

 Composable, high-performance user interaction interpreter for JavaScript runtimes.

```typescript
import { pan } from "@cereb/pan";

pan(element, { threshold: 10 }).subscribe((event) => {
  element.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px)`;
  element.innerText = `velocity: ${event.velocityX}, ${event.velocityY}`;
});
```

Alternatively, it can be extended using pipelines.

```typescript
import { pipe } from "cereb";
import { pan } from "@cereb/pan";
import { withVelocity } from "@cereb/pan/extensions";

const gestureStream = pipe(
  pan(element, { threshold: 10 }),
  withVelocity(),
);

gestureStream.subscribe((event) => {
  element.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px)`;
  element.innerText = `velocity: ${event.velocityX}, ${event.velocityY}`; // Type inference automatically
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

MIT
