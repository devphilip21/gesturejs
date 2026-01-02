import type { Signal } from "../core/signal.js";
import type { Operator, Stream, Unsubscribe } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Maps each signal to a Stream, but ignores new signals while an inner
 * stream is still active. Only processes the next signal after the current
 * inner stream completes.
 *
 * Use this to prevent overlapping operations (e.g., form submissions,
 * preventing double-clicks).
 *
 * @param project - Function that maps a signal to a Stream
 * @returns An operator that produces an exhausted stream
 *
 * @example
 * // Prevent duplicate form submissions
 * submitButton$.pipe(
 *   exhaustMap(signal => submitForm(signal.value.data))
 * )
 */
export function exhaustMap<T extends Signal, R extends Signal>(
  project: (signal: T, index: number) => Stream<R>,
): Operator<T, R> {
  return (source: Stream<T>): Stream<R> =>
    createStream((observer) => {
      let currentInnerUnsub: Unsubscribe | null = null;
      let isActive = false;
      let index = 0;
      let sourceCompleted = false;

      const checkComplete = () => {
        if (sourceCompleted && !isActive) {
          observer.complete?.();
        }
      };

      const sourceUnsub = source.on({
        next(signal) {
          // Ignore new signals while an inner stream is active
          if (isActive) return;

          try {
            isActive = true;
            const innerStream = project(signal, index++);

            currentInnerUnsub = innerStream.on({
              next(innerSignal) {
                observer.next(innerSignal);
              },
              error(err) {
                observer.error?.(err);
              },
              complete() {
                isActive = false;
                currentInnerUnsub = null;
                checkComplete();
              },
            });
          } catch (err) {
            isActive = false;
            observer.error?.(err);
          }
        },
        error(err) {
          observer.error?.(err);
        },
        complete() {
          sourceCompleted = true;
          checkComplete();
        },
      });

      return () => {
        sourceUnsub();
        if (currentInnerUnsub) {
          currentInnerUnsub();
        }
      };
    });
}
