import { createSignal, type Signal } from "../../core/signal.js";

export interface DomEventSignal<E extends Event> extends Signal<"dom-event", E> {}

export const DOM_EVENT_SIGNAL_KIND = "dom-event" as const;

export function createDomEventSignal<E extends Event>(event: E): DomEventSignal<E> {
  return createSignal(DOM_EVENT_SIGNAL_KIND, event);
}
