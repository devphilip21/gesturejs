# Stream API

A lightweight, tree-shakeable Observable implementation.

## Core Concepts

### Observable

An Observable is simply an object with a `subscribe` method:

```typescript
interface Observable<T> {
  subscribe(observer: Observer<T> | ((value: T) => void)): Unsubscribe;
}
```

### pipe()

Compose operators using `pipe()`:

```typescript
import { pipe, filter, map, throttle } from "@cereb/stream";

const result = pipe(
  source,
  filter(x => x > 0),
  map(x => x * 2),
  throttle(100)
);
```

---

## Creating Observables

### createSubject

A Subject can be subscribed to and pushed to:

```typescript
import { createSubject } from "@cereb/stream";

const subject = createSubject<number>();

subject.subscribe(value => console.log(value));

subject.next(1);
subject.next(2);
subject.complete();
```

### createBehaviorSubject

Replays the last value to new subscribers:

```typescript
import { createBehaviorSubject } from "@cereb/stream";

const subject = createBehaviorSubject(0);  // initial value

subject.subscribe(v => console.log(v));  // logs 0 immediately

subject.next(1);  // logs 1
subject.getValue();  // returns 1
```

### fromEvent

```typescript
import { fromEvent } from "@cereb/stream";

const clicks = fromEvent<MouseEvent>(document, "click");
const keydowns = fromEvent<KeyboardEvent>(window, "keydown");
```

### fromPromise

```typescript
import { fromPromise } from "@cereb/stream";

const data = fromPromise(fetch("/api").then(r => r.json()));
```

### of / from

```typescript
import { of, from } from "@cereb/stream";

of(42).subscribe(v => console.log(v));  // 42

from([1, 2, 3]).subscribe(v => console.log(v));  // 1, 2, 3
```

### interval / timer

```typescript
import { interval, timer } from "@cereb/stream";

interval(1000).subscribe(n => console.log(n));  // 0, 1, 2, ...

timer(500).subscribe(() => console.log("done"));
```

---

## Operators

All operators are standalone functions that return an `Operator<T, R>`.

### Transformation

#### filter

```typescript
import { pipe, filter } from "@cereb/stream";

pipe(
  source,
  filter(n => n % 2 === 0)
).subscribe(console.log);
```

#### map

```typescript
import { pipe, map } from "@cereb/stream";

pipe(
  source,
  map(n => n * 2)
).subscribe(console.log);
```

#### tap

Execute side effects without modifying values:

```typescript
import { pipe, tap, map } from "@cereb/stream";

pipe(
  source,
  tap(v => console.log("before:", v)),
  map(v => v * 2),
  tap(v => console.log("after:", v))
).subscribe(console.log);
```

### Timing

#### throttle

Emit at most once per interval (first value):

```typescript
import { pipe, throttle } from "@cereb/stream";

pipe(
  mouseMoves,
  throttle(16)  // ~60fps
).subscribe(handleMove);
```

#### debounce

Emit after silence:

```typescript
import { pipe, debounce } from "@cereb/stream";

pipe(
  searchInput,
  debounce(300)
).subscribe(query => search(query));
```

### Filtering

#### take / takeWhile / takeUntil

```typescript
import { pipe, take, takeUntil } from "@cereb/stream";

pipe(source, take(3)).subscribe(console.log);  // first 3

const stop$ = fromEvent(button, "click");
pipe(source, takeUntil(stop$)).subscribe(console.log);
```

#### skip / skipWhile / skipUntil

```typescript
import { pipe, skip, skipUntil } from "@cereb/stream";

pipe(source, skip(2)).subscribe(console.log);  // skip first 2
```

#### distinctUntilChanged

```typescript
import { pipe, distinctUntilChanged } from "@cereb/stream";

pipe(
  source,
  distinctUntilChanged()
).subscribe(console.log);

// Custom comparator
pipe(
  source,
  distinctUntilChanged((a, b) => a.id === b.id)
).subscribe(console.log);
```

### Buffering

#### buffer / bufferTime

```typescript
import { pipe, buffer, bufferTime } from "@cereb/stream";

pipe(source, buffer(5)).subscribe(arr => console.log(arr));

pipe(source, bufferTime(1000)).subscribe(arr => console.log(arr));
```

### Combination

#### merge

```typescript
import { merge } from "@cereb/stream";

merge(stream1, stream2, stream3).subscribe(console.log);
```

#### combineLatest

```typescript
import { combineLatest } from "@cereb/stream";

combineLatest(stream1, stream2).subscribe(([v1, v2]) => {
  console.log(v1, v2);
});
```

### Multicasting

#### share

Share source among subscribers:

```typescript
import { pipe, share } from "@cereb/stream";

const shared = pipe(expensiveStream, share());

shared.subscribe(v => console.log("A:", v));
shared.subscribe(v => console.log("B:", v));
```

#### shareReplay

Replay last n values to new subscribers:

```typescript
import { pipe, shareReplay } from "@cereb/stream";

const replayed = pipe(source, shareReplay(1));
```

---

## Composing Operators

Use `compose()` to create reusable operator chains:

```typescript
import { compose, filter, map, throttle } from "@cereb/stream";

const processNumbers = compose(
  filter((n: number) => n > 0),
  map(n => n * 2),
  throttle(100)
);

// Use it
pipe(source, processNumbers).subscribe(console.log);
```

---

## Subscription

### Function

```typescript
const unsubscribe = source.subscribe(value => {
  console.log(value);
});

unsubscribe();
```

### Observer Object

```typescript
source.subscribe({
  next: value => console.log(value),
  error: err => console.error(err),
  complete: () => console.log("done"),
});
```
