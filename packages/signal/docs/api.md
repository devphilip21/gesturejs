# API Reference

## Factory

```typescript
import { singlePointer } from "@gesturejs/signal";

const pointer$ = singlePointer(element, options?);
```

### Options

```typescript
interface SinglePointerOptions {
  deviceId?: string;
  pooling?: boolean;
  listenerOptions?: AddEventListenerOptions;
}
```

### Variants

```typescript
// PointerEvent-based (default)
import { singlePointer } from "@gesturejs/signal";

// TouchEvent-based
import { touchSinglePointer } from "@gesturejs/signal";

// MouseEvent-based
import { mouseSinglePointer } from "@gesturejs/signal";
```

---

## Operator

For custom pipelines.

```typescript
import { pointerEventsToSinglePointer } from "@gesturejs/signal";
import { touchEventsToSinglePointer } from "@gesturejs/signal";
import { mouseEventsToSinglePointer } from "@gesturejs/signal";
```

```typescript
import { pointerEventsToSinglePointer } from "@gesturejs/signal";
import { fromEvent, merge, pipe, filter } from "@gesturejs/stream";

const pointer$ = pipe(
  merge(
    fromEvent(el, "pointerdown"),
    fromEvent(el, "pointermove"),
    fromEvent(el, "pointerup"),
    fromEvent(el, "pointercancel")
  ),
  pointerEventsToSinglePointer({ pooling: true }),
  filter((p) => p.phase === "move")
);
```

---

## Emitter

For manual event handling.

```typescript
import { createPointerEmitter } from "@gesturejs/signal";
import { createTouchEmitter } from "@gesturejs/signal";
import { createMouseEmitter } from "@gesturejs/signal";
```

```typescript
import { createPointerEmitter } from "@gesturejs/signal";

const emitter = createPointerEmitter({ pooling: true });

element.addEventListener("pointerdown", (e) => {
  const pointer = emitter.process(e);
  if (pointer) {
    console.log(pointer.x, pointer.y);
  }
});

emitter.dispose();
```

---

## Pooling

When `pooling: true`, objects are reused to reduce GC pressure. The emitter automatically releases the previous pointer when a new event arrives. No manual release is required.

**Warning**: Do not store pointer references outside the callback. They will be reused on the next event.
