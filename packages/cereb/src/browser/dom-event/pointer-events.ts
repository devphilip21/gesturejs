import { createStream, type Stream } from "../../stream/stream.js";

const POINTER_EVENTS = ["pointerdown", "pointermove", "pointerup", "pointercancel"] as const;

export function pointerEvents(
  target: EventTarget,
  options?: AddEventListenerOptions,
): Stream<PointerEvent> {
  return createStream((observer) => {
    const handler = (event: Event) => {
      observer.next(event as PointerEvent);
    };

    for (const eventName of POINTER_EVENTS) {
      target.addEventListener(eventName, handler, options);
    }

    return () => {
      for (const eventName of POINTER_EVENTS) {
        target.removeEventListener(eventName, handler, options);
      }
    };
  });
}
