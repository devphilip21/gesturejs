import type { Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export function map<T extends Signal, R extends Signal>(
  transform: (value: T) => R,
): Operator<T, R> {
  return (source) =>
    createStream((observer) => {
      return source.on({
        next(value) {
          try {
            observer.next(transform(value));
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
