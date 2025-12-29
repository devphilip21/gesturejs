import type { Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export function debounce<T extends Signal>(ms: number): Operator<T, T> {
  return (source) =>
    createStream((observer) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const unsub = source.on({
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
