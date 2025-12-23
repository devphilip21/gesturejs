import type { Operator } from "@cereb/stream";
import { createObservable } from "@cereb/stream";
import { type GestureEvent, isPrevented } from "../event.js";

/**
 * Operator that filters out prevented gesture events.
 *
 * Use this after operators that may call event.prevent() to ensure
 * prevented events don't reach downstream subscribers.
 *
 * @example
 * ```typescript
 * pipe(
 *   pan(element, { threshold: 10 }),
 *   tap(event => {
 *     if (shouldPrevent(event)) {
 *       event.prevent();
 *     }
 *   }),
 *   excludePrevented()
 * ).subscribe(event => {
 *   // Only non-prevented events arrive here
 * });
 * ```
 */
export function excludePrevented<T extends GestureEvent>(): Operator<T, T> {
  return (source) =>
    createObservable((observer) => {
      return source.subscribe({
        next(event) {
          if (!isPrevented(event)) {
            observer.next(event);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
