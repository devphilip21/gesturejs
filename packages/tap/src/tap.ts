import type { Operator, SinglePointerSignal, Stream } from "cereb";
import { createStream, singlePointer } from "cereb";
import { createTapRecognizer } from "./recognizer.js";
import type { TapSignal } from "./tap-signal.js";
import type { TapOptions } from "./tap-types.js";

/**
 * Operator that transforms SinglePointer events into TapSignal events.
 * Emits "start", "end", and "cancel" phases for full tap lifecycle visibility.
 *
 * Use this when you need to:
 * - Show visual feedback on tap start
 * - Handle tap cancellation
 * - Compose with other operators
 *
 * @example
 * ```typescript
 * singlePointer(element)
 *   .pipe(tapRecognizer({ maxDuration: 300 }))
 *   .on((signal) => {
 *     if (signal.value.phase === "start") {
 *       element.classList.add("pressed");
 *     } else {
 *       element.classList.remove("pressed");
 *     }
 *   });
 * ```
 */
export function tapRecognizer(options: TapOptions = {}): Operator<SinglePointerSignal, TapSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createTapRecognizer(options);

      const unsub = source.on({
        next(pointer) {
          const event = recognizer.process(pointer);
          if (event) {
            observer.next(event);
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          observer.complete?.();
        },
      });

      return () => {
        recognizer.dispose();
        unsub();
      };
    });
}

/**
 * Operator that only emits successful tap events (phase === "end").
 * Filters out "start" and "cancel" phases for simpler tap handling.
 *
 * @example
 * ```typescript
 * singlePointer(element)
 *   .pipe(tapEndOnly({ multiTapInterval: 300 }))
 *   .on((signal) => {
 *     if (signal.value.tapCount === 2) {
 *       console.log("Double tap detected!");
 *     }
 *   });
 * ```
 */
export function tapEndOnly(options: TapOptions = {}): Operator<SinglePointerSignal, TapSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createTapRecognizer(options);

      const unsub = source.on({
        next(pointer) {
          const event = recognizer.process(pointer);
          if (event && event.value.phase === "end") {
            observer.next(event);
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          observer.complete?.();
        },
      });

      return () => {
        recognizer.dispose();
        unsub();
      };
    });
}

/**
 * Creates a tap gesture stream from an element.
 * Only emits successful tap events (phase === "end").
 *
 * This is a convenience function that combines singlePointer and tap recognition.
 *
 * @example
 * ```typescript
 * tap(button, { multiTapInterval: 300 })
 *   .on((signal) => {
 *     console.log(`Tap count: ${signal.value.tapCount}`);
 *   });
 * ```
 */
export function tap(target: EventTarget, options: TapOptions = {}): Stream<TapSignal> {
  return singlePointer(target).pipe(tapEndOnly(options));
}
