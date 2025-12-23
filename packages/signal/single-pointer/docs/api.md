# API Reference

## Factory

```typescript
import { singlePointer } from "@cereb/single-pointer";

const stream = singlePointer(element, options?);
```

### Options

```typescript
interface SinglePointerOptions {
  deviceId?: string;
  pooling?: boolean;
  listenerOptions?: AddEventListenerOptions;
}
```

## Use another events instead of pointer

```typescript
import { touchEventsToSinglePointer } from "@cereb/single-pointer";
import { fromTouchEvents, pipe } from "@cereb/stream";

const stream = pipe(
  fromTouchEvents(el),
  touchEventsToSinglePointer()
);
```

```typescript
import { mouseEventsToSinglePointer } from "@cereb/single-pointer";
import { fromMouseEvents, pipe } from "@cereb/stream";

const stream = pipe(
  fromMouseEvents(el),
  mouseEventsToSinglePointer()
);
```

---

## Emitter

For manual event handling.

```typescript
import { createPointerEmitter } from "@cereb/single-pointer";
import { createTouchEmitter } from "@cereb/single-pointer";
import { createMouseEmitter } from "@cereb/single-pointer";
```

```typescript
import { createPointerEmitter } from "@cereb/single-pointer";

const emitter = createPointerEmitter({ pooling: true });

element.addEventListener("pointerdown", (e) => {
  const pointer = emitter.process(e);
  if (pointer) {
    console.log(pointer.x, pointer.y);
  }
});

emitter.dispose();
```

## Pooling

When `pooling: true`, objects are reused to reduce GC pressure. The emitter automatically releases the previous pointer when a new event arrives. No manual release is required.

**Warning**: Do not store pointer references outside the callback. They will be reused on the next event.
