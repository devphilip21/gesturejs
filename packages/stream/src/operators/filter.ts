import type { Operator } from "../observable.js";
import { createObservable } from "../observable.js";

export function filter<T>(
  predicate: (value: T) => boolean
): Operator<T, T> {
  return (source) =>
    createObservable((observer) => {
      return source.subscribe({
        next(value) {
          try {
            if (predicate(value)) {
              observer.next(value);
            }
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
