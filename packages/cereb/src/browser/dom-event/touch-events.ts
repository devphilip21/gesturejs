import { createStream, type Stream } from "../../stream/stream.js";

const TOUCH_EVENTS = ["touchstart", "touchmove", "touchend", "touchcancel"] as const;

export function touchEvents(
  target: EventTarget,
  options?: AddEventListenerOptions,
): Stream<TouchEvent> {
  return createStream((observer) => {
    const handler = (event: Event) => {
      observer.next(event as TouchEvent);
    };

    for (const eventName of TOUCH_EVENTS) {
      target.addEventListener(eventName, handler, options);
    }

    return () => {
      for (const eventName of TOUCH_EVENTS) {
        target.removeEventListener(eventName, handler, options);
      }
    };
  });
}
