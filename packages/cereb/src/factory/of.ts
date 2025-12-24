import { createStream, type Stream } from "../stream/stream.js";

export function of<T>(value: T): Stream<T> {
  return createStream((observer) => {
    observer.next(value);
    observer.complete?.();
    return () => {};
  });
}
