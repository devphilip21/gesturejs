import { createStream, type Stream } from "../../stream/stream.js";

const MOUSE_EVENTS = ["mousedown", "mousemove", "mouseup"] as const;

export function mouseEvents(
  target: EventTarget,
  options?: AddEventListenerOptions,
): Stream<MouseEvent> {
  return createStream((observer) => {
    const handler = (event: Event) => {
      observer.next(event as MouseEvent);
    };

    for (const eventName of MOUSE_EVENTS) {
      target.addEventListener(eventName, handler, options);
    }

    return () => {
      for (const eventName of MOUSE_EVENTS) {
        target.removeEventListener(eventName, handler, options);
      }
    };
  });
}
