import type { Signal } from "../core/signal.js";
import type { Observer, Operator, Stream, Unsubscribe } from "../core/stream.js";
import { pipeStream, toObserver } from "../core/stream.js";

export function share<T extends Signal>(): Operator<T, T> {
  return (source): Stream<T> => {
    const observers = new Set<Observer<T>>();
    let sourceUnsub: Unsubscribe | null = null;
    let blocked = false;

    const stream: Stream<T> = {
      get isBlocked() {
        return blocked;
      },

      block() {
        blocked = true;
      },

      unblock() {
        blocked = false;
      },

      on(observerOrNext) {
        const observer = toObserver(observerOrNext);
        observers.add(observer);

        if (observers.size === 1) {
          sourceUnsub = source.on({
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

      pipe(...operators: Operator<Signal, Signal>[]) {
        return pipeStream(stream, operators);
      },
    };

    return stream;
  };
}

export function shareReplay<T extends Signal>(bufferSize = 1): Operator<T, T> {
  return (source): Stream<T> => {
    const buffer: T[] = [];
    const observers = new Set<Observer<T>>();
    let sourceUnsub: Unsubscribe | null = null;
    let completed = false;
    let hasError = false;
    let errorValue: unknown;
    let blocked = false;

    const stream: Stream<T> = {
      get isBlocked() {
        return blocked;
      },

      block() {
        blocked = true;
      },

      unblock() {
        blocked = false;
      },

      on(observerOrNext) {
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
          sourceUnsub = source.on({
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

      pipe(...operators: Operator<Signal, Signal>[]) {
        return pipeStream(stream, operators);
      },
    };

    return stream;
  };
}
