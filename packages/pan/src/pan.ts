import type { Operator, Signal, Stream } from "cereb";
import { createStream, singlePointer } from "cereb";
import type { PanSignal } from "./pan-signal.js";
import type { PanOptions, PanSourceValue } from "./pan-types.js";
import { createPanRecognizer } from "./recognizer.js";

/**
 * Operator that transforms pointer events into PanSignal events.
 *
 * Accepts any Signal whose value satisfies PanSourceValue interface.
 *
 * Use this when you need to compose with other operators or use a custom pointer source.
 *
 * @example
 * ```typescript
 * singlePointer(element)
 *   .pipe(panRecognizer({ threshold: 10 }))
 *   .on(pan => console.log(pan.value.deltaX, pan.value.velocityX));
 * ```
 */
export function panRecognizer<T extends Signal<string, PanSourceValue>>(
  options: PanOptions = {},
): Operator<T, PanSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createPanRecognizer(options);

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
 * Creates a pan gesture stream from an element.
 *
 * This is a convenience function that combines singlePointer and pan gesture processing.
 *
 * @example
 * ```typescript
 * pan(element, { threshold: 10 })
 *   .pipe(withVelocity())
 *   .on(event => console.log(event.deltaX, event.velocityX));
 * ```
 */
export function pan(target: EventTarget, options: PanOptions = {}): Stream<PanSignal> {
  return singlePointer(target).pipe(panRecognizer(options));
}
