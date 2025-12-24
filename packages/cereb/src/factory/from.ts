import { createStream, type Stream } from "../stream/stream.js";

export function from<T>(values: Iterable<T>): Stream<T> {
  return createStream((observer) => {
    for (const value of values) {
      observer.next(value);
    }
    observer.complete?.();
    return () => {};
  });
}
