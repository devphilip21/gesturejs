import type { Operator, SinglePointerSignal, Stream } from "cereb";
import { createStream, singlePointer } from "cereb";
import type { PanSignal } from "./pan-signal.js";
import type { PanOptions } from "./pan-types.js";
import { createPanRecognizer } from "./recognizer.js";

/**
 * Operator that transforms SinglePointer events into PanEvent events.
 *
 * Use this when you need to compose with other operators or use a custom pointer source.
 *
 * @example
 * ```typescript
 * singlePointer(element)
 *   .pipe(singlePointerToPan({ threshold: 10 }), withVelocity())
 *   .on(pan => console.log(pan.deltaX, pan.velocityX));
 * ```
 */
export function panRecognizer(options: PanOptions = {}): Operator<SinglePointerSignal, PanSignal> {
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
