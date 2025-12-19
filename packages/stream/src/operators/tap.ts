import type { Operator } from "../observable.js";
import { createObservable } from "../observable.js";

export function tap<T>(fn: (value: T) => void): Operator<T, T> {
  return (source) =>
    createObservable((observer) => {
      return source.subscribe({
        next(value) {
          try {
            fn(value);
            observer.next(value);
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
