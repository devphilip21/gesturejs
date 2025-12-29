import type { ExtendSignalValue, Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Applies a reducer function over the source stream, extending each signal's value
 * with the accumulated state while preserving signal metadata (kind, deviceId, createdAt).
 *
 * Unlike traditional scan/reduce which replaces the entire value, this operator merges
 * the accumulated state into the original signal's value, following Cereb's signal
 * extension pattern.
 *
 * @param reducer - Function that receives the previous accumulated state and current signal,
 *                  returning the new accumulated state to merge into the signal's value.
 * @param seed - The initial accumulated state.
 *
 * @example
 * ```typescript
 * // Track cumulative distance for zoom
 * pipe(
 *   wheelSignals$,
 *   reduce((acc, signal) => ({
 *     initialDistance: acc.initialDistance,
 *     distance: acc.distance + (-signal.value.deltaY * 0.5),
 *     velocity: (-signal.value.deltaY * 0.5) / 16
 *   }), { initialDistance: 100, distance: 100, velocity: 0 }),
 *   zoom()
 * )
 * ```
 */
export function reduce<T extends Signal, A extends object>(
  reducer: (acc: A, signal: T) => A,
  seed?: A,
): Operator<T, ExtendSignalValue<T, A>> {
  type OutputSignal = ExtendSignalValue<T, A>;

  return (source) =>
    createStream<OutputSignal>((observer) => {
      let acc = seed ?? ({} as A);

      return source.on({
        next(signal) {
          try {
            acc = reducer(acc, signal);

            const value = signal.value as T["value"] & A;
            Object.assign(value, acc);

            observer.next(signal as unknown as OutputSignal);
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
