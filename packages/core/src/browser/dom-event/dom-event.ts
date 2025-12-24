import { createStream, type Stream } from "../../stream/stream.js";

export function domEvent<T extends Event>(
  target: EventTarget,
  eventName: string,
  options?: AddEventListenerOptions,
): Stream<T> {
  return createStream((observer) => {
    const handler = (event: Event) => {
      observer.next(event as T);
    };

    target.addEventListener(eventName, handler, options);

    return () => {
      target.removeEventListener(eventName, handler, options);
    };
  });
}
