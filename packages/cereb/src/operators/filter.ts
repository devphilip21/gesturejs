import type { Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export function filter<T extends Signal>(predicate: (value: T) => boolean): Operator<T, T> {
  return (source) =>
    createStream((observer) => {
      return source.on({
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
