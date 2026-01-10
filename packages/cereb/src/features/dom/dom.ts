import { createStream, type Stream } from "../../core/stream.js";
import { createDomSignal, type DomSignal } from "./dom-signal.js";

type AnyEventMap = Record<string, Event>;

/**
 * Strongly-typed event target for custom event maps.
 * Useful for non-DOM EventTargets that still have named events.
 */
export type TypedEventTarget<M extends AnyEventMap> = EventTarget & {
  addEventListener<K extends keyof M>(
    type: K,
    listener: (event: M[K]) => void,
    options?: AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof M>(
    type: K,
    listener: (event: M[K]) => void,
    options?: AddEventListenerOptions,
  ): void;
};

export function dom<K extends keyof WindowEventMap>(
  target: Window,
  eventName: K,
  options?: AddEventListenerOptions,
): Stream<DomSignal<WindowEventMap[K]>>;
export function dom<K extends keyof DocumentEventMap>(
  target: Document,
  eventName: K,
  options?: AddEventListenerOptions,
): Stream<DomSignal<DocumentEventMap[K]>>;
export function dom<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  eventName: K,
  options?: AddEventListenerOptions,
): Stream<DomSignal<HTMLElementEventMap[K]>>;
export function dom<K extends keyof SVGElementEventMap>(
  target: SVGElement,
  eventName: K,
  options?: AddEventListenerOptions,
): Stream<DomSignal<SVGElementEventMap[K]>>;
export function dom<M extends AnyEventMap, K extends keyof M>(
  target: TypedEventTarget<M>,
  eventName: K,
  options?: AddEventListenerOptions,
): Stream<DomSignal<M[K]>>;
export function dom<E extends Event = Event>(
  target: EventTarget,
  eventName: string,
  options?: AddEventListenerOptions,
): Stream<DomSignal<E>>;
export function dom<E extends Event = Event>(
  target: EventTarget,
  eventName: string,
  options?: AddEventListenerOptions,
): Stream<DomSignal<E>> {
  return createStream<DomSignal<E>>((observer) => {
    // NOTE: EventTarget's base signature expects an EventListener (Event),
    // so we accept Event and cast to the inferred event type for the signal.
    const handler: EventListener = (event) => {
      observer.next(createDomSignal(event as E));
    };

    target.addEventListener(eventName, handler, options);

    return () => {
      target.removeEventListener(eventName, handler, options);
    };
  });
}
