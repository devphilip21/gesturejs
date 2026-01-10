import type { Signal } from "../../core/signal.js";
import { createSignal } from "../../core/signal.js";
import type { Stream } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { KeyCode } from "./key-code.js";
import { getSharedKeyboard } from "./shared.js";

interface KeyheldValue {
  held: boolean;
}

export interface KeyheldSignal extends Signal<"keyheld", KeyheldValue> {}

export const KEYHELD_SIGNAL_KIND = "keyheld" as const;

export interface KeyheldOptions {
  /**
   * The physical key code to track.
   * @see https://www.w3.org/TR/uievents-code/
   * @example 'KeyZ', 'Space', 'Escape'
   */
  code: KeyCode;
}

/**
 * Tracks whether a specific key is being held down.
 * Emits only when state changes.
 *
 * @example
 * ```typescript
 * const spaceHeld$ = keyheld(window, { code: 'Space' });
 * spaceHeld$.on(signal => {
 *   if (signal.value.held) {
 *     console.log('Space is held');
 *   }
 * });
 * ```
 */
export function keyheld(target: EventTarget, options: KeyheldOptions): Stream<KeyheldSignal> {
  const { code } = options;
  const targetCode = code.toLowerCase();

  const source = getSharedKeyboard(target);

  return createStream((observer) => {
    let lastHeld: boolean | undefined;

    const emitIfChanged = (held: boolean) => {
      if (held !== lastHeld) {
        lastHeld = held;
        observer.next(createSignal(KEYHELD_SIGNAL_KIND, { held }));
      }
    };

    return source.on({
      next(signal) {
        const { code: eventCode, phase, repeat } = signal.value;
        if (repeat) return;

        if (eventCode.toLowerCase() === targetCode) {
          emitIfChanged(phase === "down");
        }
      },
      error: observer.error?.bind(observer),
      complete: observer.complete?.bind(observer),
    });
  });
}
