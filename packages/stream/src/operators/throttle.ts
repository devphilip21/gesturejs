import type { Operator } from "../observable.js";
import { createObservable } from "../observable.js";

export function throttle<T>(ms: number): Operator<T, T> {
  return (source) =>
    createObservable((observer) => {
      let lastTime: number | null = null;

      return source.subscribe({
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

export function throttleLast<T>(ms: number): Operator<T, T> {
  return (source) =>
    createObservable((observer) => {
      let lastValue: T | undefined;
      let hasValue = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const unsub = source.subscribe({
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
