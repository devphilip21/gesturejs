import type { KeyboardSignal } from "../browser/keyboard/keyboard-signal.js";
import type { Signal } from "../core/signal.js";
import { createSignal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export interface HeldValue {
  held: boolean;
}

export interface HeldSignal extends Signal<"held", HeldValue> {}

export const HELD_SIGNAL_KIND = "held" as const;

/**
 * Converts keyboard signals to a boolean stream based on phase.
 * Emits { held: true } on keydown, { held: false } on keyup.
 *
 * Useful for tracking whether a key is currently being held down.
 *
 * @example
 * ```typescript
 * // Track if 'z' key is held
 * const isZHeld$ = pipe(
 *   keyboard(window),
 *   keyboardFilter({ key: 'z' }),
 *   keyboardHeld()
 * );
 *
 * // Use with when() operator
 * pipe(
 *   someStream$,
 *   when(isZHeld$)
 * ).subscribe(...)
 * ```
 */
export function keyboardHeld(): Operator<KeyboardSignal, HeldSignal> {
  return (source) =>
    createStream((observer) => {
      return source.subscribe({
        next(signal) {
          try {
            const held = signal.value.phase === "down";
            observer.next(createSignal(HELD_SIGNAL_KIND, { held }));
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
