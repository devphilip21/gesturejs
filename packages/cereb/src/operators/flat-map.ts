import type { Signal } from "../core/signal.js";
import type { Operator, Stream, Unsubscribe } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Maps each signal to a Stream and flattens all inner streams concurrently.
 * All inner streams remain active simultaneously (mergeMap behavior).
 *
 * Use this when you want to handle all inner streams without cancellation.
 *
 * @param project - Function that maps a signal to a Stream
 * @returns An operator that produces a flattened stream
 *
 * @example
 * // Handle multiple concurrent gesture streams
 * gestureType$.pipe(
 *   flatMap(signal =>
 *     signal.value.type === 'pan' ? pan(el) : pinch(el)
 *   )
 * )
 */
export function flatMap<T extends Signal, R extends Signal>(
  project: (signal: T, index: number) => Stream<R>,
): Operator<T, R> {
  return (source: Stream<T>): Stream<R> =>
    createStream((observer) => {
      const activeSubscriptions = new Set<Unsubscribe>();
      let index = 0;
      let sourceCompleted = false;

      const checkComplete = () => {
        if (sourceCompleted && activeSubscriptions.size === 0) {
          observer.complete?.();
        }
      };

      const sourceUnsub = source.on({
        next(signal) {
          try {
            const innerStream = project(signal, index++);

            const innerUnsub = innerStream.on({
              next(innerSignal) {
                observer.next(innerSignal);
              },
              error(err) {
                observer.error?.(err);
              },
              complete() {
                activeSubscriptions.delete(innerUnsub);
                checkComplete();
              },
            });

            activeSubscriptions.add(innerUnsub);
          } catch (err) {
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
        for (const unsub of activeSubscriptions) {
          unsub();
        }
        activeSubscriptions.clear();
      };
    });
}

/**
 * Alias for flatMap (RxJS naming convention)
 */
export const mergeMap = flatMap;
