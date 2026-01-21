import { createStream, type Stream } from "../../core/stream.js";
import { createDomSignal, type DomSignal } from "./dom-signal.js";

const MOUSE_EVENTS = ["mousedown", "mousemove", "mouseup", "mouseleave"] as const;

export function mouse(
  target: EventTarget,
  options?: AddEventListenerOptions,
): Stream<DomSignal<MouseEvent>> {
  return createStream<DomSignal<MouseEvent>>((observer) => {
    const handler = (event: Event) => {
      observer.next(createDomSignal(event as MouseEvent));
    };

    for (let i = 0; i < MOUSE_EVENTS.length; i++) {
      const eventName = MOUSE_EVENTS[i];
      target.addEventListener(eventName, handler, options);
    }

    return () => {
      for (let i = 0; i < MOUSE_EVENTS.length; i++) {
        const eventName = MOUSE_EVENTS[i];
        target.removeEventListener(eventName, handler, options);
      }
    };
  });
}
