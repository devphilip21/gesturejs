import { createSignal, type Signal } from "../../core/signal.js";

export interface DomSignal<E extends Event> extends Signal<"dom", E> {}

export const DOM_SIGNAL_KIND = "dom" as const;

export function createDomSignal<E extends Event>(event: E): DomSignal<E> {
  return createSignal(DOM_SIGNAL_KIND, event);
}
