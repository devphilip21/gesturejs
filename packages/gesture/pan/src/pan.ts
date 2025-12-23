import type { SinglePointer, SinglePointerOptions } from "@cereb/single-pointer";
import { singlePointer } from "@cereb/single-pointer";
import type { Observable, Operator } from "@cereb/stream";
import { createObservable, pipe } from "@cereb/stream";
import { createPanEmitter } from "./emitter.js";
import type { PanEvent } from "./event.js";
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
export function singlePointerToPan(options: PanOptions = {}): Operator<SinglePointer, PanEvent> {
  return (source) =>
    createObservable((observer) => {
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

export interface PanGestureOptions extends PanOptions {
  pointer?: SinglePointerOptions;
}

/**
 * Creates a pan gesture observable from an element.
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
export function pan(target: EventTarget, options: PanGestureOptions = {}): Observable<PanEvent> {
  const { pointer: pointerOptions, ...panOptions } = options;

  return pipe(singlePointer(target, pointerOptions), singlePointerToPan(panOptions));
}
