import type { Signal } from "../core/signal.js";
import type { Operator, Stream } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Passes through source signals only when the gate stream's latest value is true.
 *
 * The gate stream should emit signals with a `held` property indicating the gate state.
 * Source signals are passed through when `held` is true, blocked when false.
 *
 * @param gate - Stream that controls whether source signals pass through
 *
 * @example
 * ```typescript
 * const isZHeld$ = pipe(
 *   keyboard(window),
 *   keyboardFilter({ key: 'z', modifiers: ['meta'] }),
 *   keyboardHeld()
 * );
 *
 * pipe(
 *   keyboard(window),
 *   keyboardFilter({ key: ['+', '-'] }),
 *   when(isZHeld$)  // Only pass through when Z is held
 * ).subscribe(...)
 * ```
 */
export function when<TSource extends Signal>(
  gate: Stream<Signal<string, { held: boolean }>>,
): Operator<TSource, TSource> {
  return (source) =>
    createStream<TSource>((observer) => {
      let isOpen = false;

      const gateUnsub = gate.subscribe({
        next(signal) {
          try {
            isOpen = signal.value.held;
          } catch (err) {
            observer.error?.(err);
          }
        },
      });

      const sourceUnsub = source.subscribe({
        next(signal) {
          if (isOpen) {
            observer.next(signal);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });

      return () => {
        gateUnsub();
        sourceUnsub();
      };
    });
}
