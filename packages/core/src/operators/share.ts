import type { Observer, Operator, Stream, Unsubscribe } from "../stream/stream.js";
import { toObserver } from "../stream/stream.js";

export function share<T>(): Operator<T, T> {
  return (source): Stream<T> => {
    const observers = new Set<Observer<T>>();
    let sourceUnsub: Unsubscribe | null = null;
    let blocked = false;

    return {
      get isBlocked() {
        return blocked;
      },

      block() {
        blocked = true;
      },

      unblock() {
        blocked = false;
      },

      subscribe(observerOrNext) {
        const observer = toObserver(observerOrNext);
        observers.add(observer);

        if (observers.size === 1) {
          sourceUnsub = source.subscribe({
            next(value) {
              if (blocked) return;
              for (const obs of observers) {
                obs.next(value);
              }
            },
            error(err) {
              for (const obs of observers) {
                obs.error?.(err);
              }
            },
            complete() {
              for (const obs of observers) {
                obs.complete?.();
              }
              observers.clear();
              sourceUnsub = null;
            },
          });
        }

        return () => {
          observers.delete(observer);
          if (observers.size === 0 && sourceUnsub) {
            sourceUnsub();
            sourceUnsub = null;
          }
        };
      },
    };
  };
}

export function shareReplay<T>(bufferSize = 1): Operator<T, T> {
  return (source): Stream<T> => {
    const buffer: T[] = [];
    const observers = new Set<Observer<T>>();
    let sourceUnsub: Unsubscribe | null = null;
    let completed = false;
    let hasError = false;
    let errorValue: unknown;
    let blocked = false;

    return {
      get isBlocked() {
        return blocked;
      },

      block() {
        blocked = true;
      },

      unblock() {
        blocked = false;
      },

      subscribe(observerOrNext) {
        const observer = toObserver(observerOrNext);

        for (const value of buffer) {
          observer.next(value);
        }

        if (completed) {
          observer.complete?.();
          return () => {};
        }
        if (hasError) {
          observer.error?.(errorValue);
          return () => {};
        }

        observers.add(observer);

        if (observers.size === 1 && !sourceUnsub) {
          sourceUnsub = source.subscribe({
            next(value) {
              buffer.push(value);
              if (buffer.length > bufferSize) {
                buffer.shift();
              }
              if (blocked) return;
              for (const obs of observers) {
                obs.next(value);
              }
            },
            error(err) {
              hasError = true;
              errorValue = err;
              for (const obs of observers) {
                obs.error?.(err);
              }
              observers.clear();
              sourceUnsub = null;
            },
            complete() {
              completed = true;
              for (const obs of observers) {
                obs.complete?.();
              }
              observers.clear();
              sourceUnsub = null;
            },
          });
        }

        return () => {
          observers.delete(observer);
          if (observers.size === 0 && sourceUnsub && !completed && !hasError) {
            sourceUnsub();
            sourceUnsub = null;
          }
        };
      },
    };
  };
}
