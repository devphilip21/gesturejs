import type { MultiPointerSignal, Operator, Stream } from "cereb";
import { createStream, multiPointer } from "cereb";
import { multiPointerSession } from "cereb/operators";
import type { PinchSignal } from "./pinch-signal.js";
import type { PinchOptions } from "./pinch-types.js";
import { createPinchRecognizer } from "./recognizer.js";

/**
 * Operator that transforms MultiPointer signals into PinchSignal events.
 *
 * Use this when composing with other operators or using a custom pointer source.
 *
 * @example
 * ```typescript
 * multiPointer(element, { maxPointers: 2 })
 *   .pipe(
 *     multiPointerSession(2),
 *     pinchRecognizer({ threshold: { ratio: 0.05 } }),
 *     zoom({ minScale: 0.5, maxScale: 3.0 }),
 *   )
 *   .on(pinch => console.log(pinch.value.distance, pinch.value.scale));
 * ```
 */
export function pinchRecognizer(
  options: PinchOptions = {},
): Operator<MultiPointerSignal, PinchSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createPinchRecognizer(options);

      const unsub = source.on({
        next(signal) {
          const event = recognizer.process(signal);
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
 * Creates a pinch gesture stream from an element.
 *
 * This is a convenience function that combines multiPointer, multiPointerSession,
 * and pinch recognition.
 *
 * @example
 * ```typescript
 * pinch(element, { threshold: { ratio: 0.05 } })
 *   .pipe(zoom({ minScale: 0.5, maxScale: 3.0 }))
 *   .on(event => console.log(event.value.distance, event.value.scale));
 * ```
 */
export function pinch(target: EventTarget, options: PinchOptions = {}): Stream<PinchSignal> {
  return multiPointer(target, { maxPointers: 2 }).pipe(
    multiPointerSession(2),
    pinchRecognizer(options),
  );
}
