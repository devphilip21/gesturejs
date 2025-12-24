import { createStream, type Stream } from "../stream/stream.js";

export function fromPromise<T>(promise: Promise<T>): Stream<T> {
  return createStream((observer) => {
    let cancelled = false;

    promise
      .then((value) => {
        if (!cancelled) {
          observer.next(value);
          observer.complete?.();
        }
      })
      .catch((err) => {
        if (!cancelled) {
          observer.error?.(err);
        }
      });

    return () => {
      cancelled = true;
    };
  });
}
