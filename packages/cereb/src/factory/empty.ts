import { createStream, type Stream } from "../stream/stream.js";

export function empty<T = never>(): Stream<T> {
  return createStream((observer) => {
    observer.complete?.();
    return () => {};
  });
}
