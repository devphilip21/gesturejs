import type { Operator } from "../stream/stream.js";
import { createStream } from "../stream/stream.js";

export function filter<T>(predicate: (value: T) => boolean): Operator<T, T> {
  return (source) =>
    createStream((observer) => {
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
