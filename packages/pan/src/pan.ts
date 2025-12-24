import type { Operator, SinglePointerSignal, Stream } from "cereb";
import { createStream, pipe, singlePointer } from "cereb";
import { createPanEmitter } from "./emitter.js";
import type { PanSignal } from "./pan-signal.js";
import type { PanOptions } from "./types.js";

/**
 * Operator that transforms SinglePointer events into PanEvent events.
 *
 * Use this when you need to compose with other operators or use a custom pointer source.
 *
 * @example
 * ```typescript
 * pipe(
 *   singlePointer(element),
 *   singlePointerToPan({ threshold: 10 }),
 *   withVelocity()
 * ).subscribe(pan => console.log(pan.deltaX, pan.velocityX));
 * ```
 */
export function panFromSinglePointer(
  options: PanOptions = {},
): Operator<SinglePointerSignal, PanSignal> {
  return (source) =>
    createStream((observer) => {
      const emitter = createPanEmitter(options);

      const unsub = source.subscribe({
        next(pointer) {
          const event = emitter.process(pointer);
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
        emitter.dispose();
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
 * pipe(
 *   pan(element, { threshold: 10 }),
 *   withVelocity()
 * ).subscribe(event => console.log(event.deltaX, event.velocityX));
 * ```
 */
export function pan(target: EventTarget): Stream<PanSignal> {
  return pipe(singlePointer(target), panFromSinglePointer());
}
