import type { Operator } from "../stream/stream.js";
import { createStream } from "../stream/stream.js";

/**
 * Operator that passes values through unchanged while running a side-effect.
 *
 * In event/gesture pipelines, this is commonly used for:
 * - Debug logging (coordinates, phases, state transitions)
 * - Tracing/metrics (timing, counters)
 * - Applying flags on events (e.g. calling `event.prevent()`), then filtering later (e.g. with `excludePrevented()`)
 *
 * If `fn` throws, the error is forwarded to the downstream `error` handler.
 *
 * @example
 * ```typescript
 * import { eventSource } from "../../source/event-source-factory.js";
 * import { pipe } from "../pipe.js";
 *
 * pipe(
 *   eventSource<PointerEvent>(element, "pointermove"),
 *   spy((e) => {
 *     // Observe without modifying the stream values
 *     console.log(e.clientX, e.clientY);
 *   }),
 * ).subscribe();
 * ```
 */
export function spy<T>(fn: (value: T) => void): Operator<T, T> {
  return (source) =>
    createStream((observer) => {
      return source.subscribe({
        next(value) {
          try {
            fn(value);
            observer.next(value);
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}

/** Alias for spy - RxJS-compatible naming */
export const tap = spy;
