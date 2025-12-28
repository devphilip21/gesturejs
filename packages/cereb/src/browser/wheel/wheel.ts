import { createStream, type Stream } from "../../core/stream.js";
import { createWheelSignalFromEvent, type WheelSignal } from "./wheel-signal.js";

export interface WheelOptions {
  /**
   * Whether to use passive event listener.
   * Set to false if you need to call preventDefault() on the originalEvent.
   * @default true
   */
  passive?: boolean;
}

/**
 * Creates a stream of wheel signals from wheel events on the target.
 *
 * @example
 * ```typescript
 * // Basic usage (passive by default for performance)
 * wheel(element).subscribe(signal => {
 *   console.log(signal.value.deltaY);
 * });
 *
 * // With passive: false to allow preventDefault
 * wheel(element, { passive: false }).subscribe(signal => {
 *   signal.value.originalEvent.preventDefault();
 * });
 * ```
 */
export function wheel(target: EventTarget, options?: WheelOptions): Stream<WheelSignal> {
  const passive = options?.passive ?? true;

  return createStream<WheelSignal>((observer) => {
    const handler = (e: Event) => {
      observer.next(createWheelSignalFromEvent(e as WheelEvent));
    };

    target.addEventListener("wheel", handler, { passive });

    return () => {
      target.removeEventListener("wheel", handler);
    };
  });
}
