import type { Operator, Signal, Stream } from "../../core/index.js";
import { createStream } from "../../core/index.js";
import { multiPointersSession } from "../../operators/index.js";
import { multiPointers } from "../multi-pointers/index.js";
import type { PinchSignal } from "./pinch-signal.js";
import type { PinchOptions, PinchSourceValue } from "./pinch-types.js";
import { createPinchRecognizer } from "./recognizer.js";

/**
 * Operator that transforms multi-pointer signals into PinchSignal events.
 *
 * Accepts any Signal whose value satisfies PinchSourceValue interface.
 *
 * Use this when composing with other operators or using a custom pointer source.
 *
 * @example
 * ```typescript
 * multiPointers(element, { maxPointers: 2 })
 *   .pipe(
 *     multiPointersSession(2),
 *     pinchRecognizer({ threshold: 10 }),
 *     zoom({ minScale: 0.5, maxScale: 3.0 }),
 *   )
 *   .on(pinch => console.log(pinch.value.distance, pinch.value.scale));
 * ```
 */
export function pinchRecognizer<T extends Signal<string, PinchSourceValue>>(
  options: PinchOptions = {},
): Operator<T, PinchSignal> {
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
 * This is a convenience function that combines multiPointer, multiPointersSession,
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
  return multiPointers(target, { maxPointers: 2 }).pipe(
    multiPointersSession(2),
    pinchRecognizer(options),
  );
}
