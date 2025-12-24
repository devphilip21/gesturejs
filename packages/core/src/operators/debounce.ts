import type { Operator } from "../stream/stream.js";
import { createStream } from "../stream/stream.js";

export function debounce<T>(ms: number): Operator<T, T> {
  return (source) =>
    createStream((observer) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const unsub = source.subscribe({
        next(value) {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(() => {
            timeoutId = null;
            observer.next(value);
          }, ms);
        },
        error: observer.error?.bind(observer),
        complete() {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }
          observer.complete?.();
        },
      });

      return () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        unsub();
      };
    });
}
