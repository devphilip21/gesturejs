import { createStream, type Stream } from "../../core/stream.js";
import { createDomSignal, type DomSignal } from "./dom-signal.js";

const POINTER_EVENTS = [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "pointerleave",
] as const;

export function pointer(
  target: EventTarget,
  options?: AddEventListenerOptions,
): Stream<DomSignal<PointerEvent>> {
  return createStream<DomSignal<PointerEvent>>((observer) => {
    const handler = (event: Event) => {
      observer.next(createDomSignal(event as PointerEvent));
    };

    for (let i = 0; i < POINTER_EVENTS.length; i++) {
      const eventName = POINTER_EVENTS[i];
      target.addEventListener(eventName, handler, options);
    }

    return () => {
      for (let i = 0; i < POINTER_EVENTS.length; i++) {
        const eventName = POINTER_EVENTS[i];
        target.removeEventListener(eventName, handler, options);
      }
    };
  });
}
