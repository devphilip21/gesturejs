import { createStream, type Stream } from "../stream/stream.js";

export function throwError(error: unknown): Stream<never> {
  return createStream((observer) => {
    observer.error?.(error);
    return () => {};
  });
}
