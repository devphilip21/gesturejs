import type { Stream } from "../stream/stream.js";
import { createStream } from "../stream/stream.js";

export function combineLatest<T extends unknown[]>(
  ...sources: { [K in keyof T]: Stream<T[K]> }
): Stream<T> {
  return createStream((observer) => {
    const values: unknown[] = new Array(sources.length);
    const hasValue: boolean[] = new Array(sources.length).fill(false);
    let completedCount = 0;

    const unsubs = sources.map((source, i) =>
      source.subscribe({
        next(value) {
          values[i] = value;
          hasValue[i] = true;

          if (hasValue.every(Boolean)) {
            observer.next([...values] as T);
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          completedCount++;
          if (completedCount === sources.length) {
            observer.complete?.();
          }
        },
      }),
    );

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  });
}

export function forkJoin<T extends unknown[]>(
  ...sources: { [K in keyof T]: Stream<T[K]> }
): Stream<T> {
  return createStream((observer) => {
    const values: unknown[] = new Array(sources.length);
    const hasValue: boolean[] = new Array(sources.length).fill(false);
    let completedCount = 0;

    const unsubs = sources.map((source, i) =>
      source.subscribe({
        next(value) {
          values[i] = value;
          hasValue[i] = true;
        },
        error: observer.error?.bind(observer),
        complete() {
          completedCount++;
          if (completedCount === sources.length) {
            if (hasValue.every(Boolean)) {
              observer.next([...values] as T);
            }
            observer.complete?.();
          }
        },
      }),
    );

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  });
}
