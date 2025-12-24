import type { Operator } from "../stream/stream.js";
import { createStream } from "../stream/stream.js";

export function map<T, R>(transform: (value: T) => R): Operator<T, R> {
  return (source) =>
    createStream((observer) => {
      return source.subscribe({
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
