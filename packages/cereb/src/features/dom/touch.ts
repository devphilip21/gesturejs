import { createStream, type Stream } from "../../core/stream.js";
import { createDomSignal, type DomSignal } from "./dom-signal.js";

const TOUCH_EVENTS = ["touchstart", "touchmove", "touchend", "touchcancel"] as const;

export function touch(
  target: EventTarget,
  options?: AddEventListenerOptions,
): Stream<DomSignal<TouchEvent>> {
  return createStream((observer) => {
    const handler = (event: Event) => {
      observer.next(createDomSignal(event as TouchEvent));
    };

    for (let i = 0; i < TOUCH_EVENTS.length; i++) {
      const eventName = TOUCH_EVENTS[i];
      target.addEventListener(eventName, handler, options);
    }

    return () => {
      for (let i = 0; i < TOUCH_EVENTS.length; i++) {
        const eventName = TOUCH_EVENTS[i];
        target.removeEventListener(eventName, handler, options);
      }
    };
  });
}
