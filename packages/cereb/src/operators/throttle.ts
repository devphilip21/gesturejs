import type { Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export function throttle<T extends Signal>(ms: number): Operator<T, T> {
  return (source) =>
    createStream((observer) => {
      let lastTime: number | null = null;

      return source.on({
        next(value) {
          const now = performance.now();
          if (lastTime === null || now - lastTime >= ms) {
            lastTime = now;
            observer.next(value);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}

export function throttleLast<T extends Signal>(ms: number): Operator<T, T> {
  return (source) =>
    createStream((observer) => {
      let lastValue: T | undefined;
      let hasValue = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const unsub = source.on({
        next(value) {
          lastValue = value;
          hasValue = true;

          if (timeoutId === null) {
            timeoutId = setTimeout(() => {
              if (hasValue) {
                observer.next(lastValue!);
                hasValue = false;
              }
              timeoutId = null;
            }, ms);
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            if (hasValue) {
              observer.next(lastValue!);
            }
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
