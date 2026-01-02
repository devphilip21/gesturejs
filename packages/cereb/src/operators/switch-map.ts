import type { Signal } from "../core/signal.js";
import type { Operator, Stream, Unsubscribe } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Maps each signal to a Stream and switches to the new inner stream,
 * unsubscribing from the previous one.
 * Only the most recent inner stream is active at any time.
 *
 * Use this when you only care about the latest value and want to cancel
 * previous operations (e.g., search autocomplete, latest selection).
 *
 * @param project - Function that maps a signal to a Stream
 * @returns An operator that produces a switched stream
 *
 * @example
 * // Only show results for the latest search query
 * searchInput$.pipe(
 *   switchMap(signal => fetchResults(signal.value.query))
 * )
 */
export function switchMap<T extends Signal, R extends Signal>(
  project: (signal: T, index: number) => Stream<R>,
): Operator<T, R> {
  return (source: Stream<T>): Stream<R> =>
    createStream((observer) => {
      let currentInnerUnsub: Unsubscribe | null = null;
      let innerActive = false;
      let index = 0;
      let sourceCompleted = false;

      const checkComplete = () => {
        if (sourceCompleted && !innerActive) {
          observer.complete?.();
        }
      };

      const sourceUnsub = source.on({
        next(signal) {
          try {
            // Unsubscribe from previous inner stream
            if (currentInnerUnsub) {
              currentInnerUnsub();
              currentInnerUnsub = null;
            }
            innerActive = false;

            const innerStream = project(signal, index++);
            innerActive = true;

            currentInnerUnsub = innerStream.on({
              next(innerSignal) {
                observer.next(innerSignal);
              },
              error(err) {
                observer.error?.(err);
              },
              complete() {
                innerActive = false;
                currentInnerUnsub = null;
                checkComplete();
              },
            });
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
        if (currentInnerUnsub) {
          currentInnerUnsub();
        }
      };
    });
}
