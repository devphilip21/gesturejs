import { createStream, type Stream } from "../../core/stream.js";
import { createKeyboardSignalFromEvent, type KeyboardSignal } from "./keyboard-signal.js";

/**
 * Creates a stream of keyboard signals from keydown and keyup events on the target.
 *
 * @example
 * ```typescript
 * keyboard(window).subscribe(signal => {
 *   console.log(signal.value.key, signal.value.phase);
 * });
 * ```
 */
export function keyboard(target: EventTarget): Stream<KeyboardSignal> {
  return createStream<KeyboardSignal>((observer) => {
    const handleKeyDown = (e: Event) => {
      observer.next(createKeyboardSignalFromEvent(e as KeyboardEvent, "down"));
    };

    const handleKeyUp = (e: Event) => {
      observer.next(createKeyboardSignalFromEvent(e as KeyboardEvent, "up"));
    };

    target.addEventListener("keydown", handleKeyDown);
    target.addEventListener("keyup", handleKeyUp);

    return () => {
      target.removeEventListener("keydown", handleKeyDown);
      target.removeEventListener("keyup", handleKeyUp);
    };
  });
}
