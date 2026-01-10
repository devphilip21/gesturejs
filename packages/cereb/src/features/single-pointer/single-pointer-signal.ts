import { createSignal, type Signal } from "../../core/signal.js";
import type { Point } from "../../geometry/types.js";
import type { SinglePointerButton, SinglePointerPhase, SinglePointerType } from "./types.js";

export interface SinglePointerSignal extends Signal<"single-pointer", SinglePointer> {}

export const SINGLE_POINTER_SIGNAL_KIND = "single-pointer" as const;

/**
 * Normalized pointer data representing a single point of contact.
 * Abstracts away differences between mouse, touch, and pointer events.
 */
export interface SinglePointer {
  phase: SinglePointerPhase;
  cursor: Point;
  pageCursor: Point;
  pointerType: SinglePointerType;
  button: SinglePointerButton;
  /** 0.0 ~ 1.0, default 0.5 if unsupported */
  pressure: number;
  id: string;
}

export function createSinglePointerSignal(pointer: SinglePointer): SinglePointerSignal {
  return createSignal(SINGLE_POINTER_SIGNAL_KIND, pointer);
}

export function createDefaultSinglePointerSignal(): SinglePointerSignal {
  return createSinglePointerSignal({
    id: "",
    phase: "move",
    cursor: [0, 0],
    pageCursor: [0, 0],
    pointerType: "unknown",
    button: "none",
    pressure: 0.5,
  });
}
