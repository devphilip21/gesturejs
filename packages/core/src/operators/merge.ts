import type { Operator, Stream } from "../stream/stream.js";
import { createStream } from "../stream/stream.js";

export function mergeWith<T, R>(other: Stream<R>): Operator<T, T | R> {
  return (source) =>
    createStream((observer) => {
      let completedCount = 0;

      const checkComplete = () => {
        completedCount++;
        if (completedCount === 2) {
          observer.complete?.();
        }
      };

      const unsub1 = source.subscribe({
        next: (value) => observer.next(value),
        error: observer.error?.bind(observer),
        complete: checkComplete,
      });

      const unsub2 = other.subscribe({
        next: (value) => observer.next(value),
        error: observer.error?.bind(observer),
        complete: checkComplete,
      });

      return () => {
        unsub1();
        unsub2();
      };
    });
}

export function merge<T>(...sources: Stream<T>[]): Stream<T> {
  return createStream((observer) => {
    let completedCount = 0;

    const unsubs = sources.map((source) =>
      source.subscribe({
        next: (value) => observer.next(value),
        error: observer.error?.bind(observer),
        complete: () => {
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
