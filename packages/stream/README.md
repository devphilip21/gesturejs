# @gesturejs/stream

Lightweight, zero-dependency reactive stream library with RxJS-like pipe operators for gesturejs

## Installation

```bash
npm install @gesturejs/stream
```

## Quick Start

### Create from Events

```typescript
import { fromEvent, pipe, map } from "@gesturejs/stream";

const clicks = fromEvent<MouseEvent>(document, "click");

pipe(
  clicks,
  map((e) => ({ x: e.clientX, y: e.clientY }))
).subscribe(console.log);
```

### Create and Subscribe

```typescript
import { createSubject } from "@gesturejs/stream";

const stream = createSubject<number>();

const unsubscribe = stream.subscribe((value) => {
  console.log("Received:", value);
});

stream.next(1);
stream.next(2);

unsubscribe();
```

### Use Operators with pipe()

```typescript
import { createSubject, pipe, filter, map, throttle } from "@gesturejs/stream";

const stream = createSubject<number>();

const result = pipe(
  stream,
  filter((n) => n > 0),
  map((n) => n * 2),
  throttle(100)
);

result.subscribe(console.log);
```

## Tree-Shaking

All operators are standalone functions. Import only what you need:

```typescript
import { pipe, filter, map } from "@gesturejs/stream";
```

## Available Operators

### Transformation
- `map(fn)` - Transform values
- `filter(fn)` - Filter values
- `tap(fn)` - Side effects

### Timing
- `throttle(ms)` - Rate limit (first)
- `throttleLast(ms)` - Rate limit (last)
- `debounce(ms)` - Delay until silence

### Filtering
- `take(n)` / `takeWhile(fn)` / `takeUntil(stream)`
- `skip(n)` / `skipWhile(fn)` / `skipUntil(stream)`
- `distinctUntilChanged(fn?)`

### Buffering
- `buffer(count)`
- `bufferTime(ms)`
- `bufferWhen(notifier)`

### Combination
- `merge(...streams)`
- `mergeWith(stream)`
- `combineLatest(...streams)`
- `forkJoin(...streams)`

### Multicasting
- `share()`
- `shareReplay(bufferSize)`

## Creators

- `createSubject<T>()` - Multicast subject
- `createBehaviorSubject<T>(initial)` - Subject with replay
- `fromEvent(target, eventName)` - DOM events
- `fromPromise(promise)` - Promise to stream
- `from(iterable)` - Array/iterable to stream
- `of(value)` - Single value
- `interval(ms)` - Periodic emission
- `timer(delay, interval?)` - Delayed emission

## Documentation

See [Stream API Documentation](./docs/stream.md) for detailed usage.

## License

MIT
