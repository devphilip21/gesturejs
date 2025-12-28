import type { Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Applies an accumulator function over the source stream, returning each intermediate result.
 * Similar to Array.reduce, but emits each accumulated value as it arrives.
 *
 * This is useful for stateful transformations where you need to track values across emissions.
 *
 * @param accumulator - Function that receives the previous accumulated value and current signal,
 *                      and returns the new accumulated signal.
 * @param seed - The initial accumulated value, emitted on first source emission.
 *
 * @example
 * ```typescript
 * // Track cumulative distance for zoom
 * pipe(
 *   wheelSignals$,
 *   scan((acc, signal) => {
 *     const delta = -signal.value.deltaY * 0.5;
 *     return createSignal("zoom-input", {
 *       initialDistance: 100,
 *       distance: acc.value.distance + delta,
 *       velocity: delta / 16
 *     });
 *   }, createSignal("zoom-input", { initialDistance: 100, distance: 100, velocity: 0 })),
 *   zoom()
 * )
 * ```
 */
export function scan<T extends Signal, R extends Signal>(
  accumulator: (acc: R, value: T) => R,
  seed: R,
): Operator<T, R> {
  return (source) =>
    createStream<R>((observer) => {
      let acc = seed;

      return source.subscribe({
        next(value) {
          try {
            acc = accumulator(acc, value);
            observer.next(acc);
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
