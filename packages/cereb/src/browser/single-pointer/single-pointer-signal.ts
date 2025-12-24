import { createSignal, type Signal } from "../../core/signal.js";
import type { SinglePointerButton, SinglePointerPhase, SinglePointerType } from "./types.js";

export interface SinglePointerSignal extends Signal<"single-pointer", SinglePointer> {}

export const SINGLE_POINTER_SIGNAL_KIND = "single-pointer" as const;

/**
 * Normalized pointer data representing a single point of contact.
 * Abstracts away differences between mouse, touch, and pointer events.
 */
export interface SinglePointer {
  phase: SinglePointerPhase;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
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
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
    pointerType: "unknown",
    button: "none",
    pressure: 0.5,
  });
}

export function resetSinglePointerSignal(p: SinglePointerSignal): void {
  p.value.phase = "move";
  p.value.x = 0;
  p.value.y = 0;
  p.value.pageX = 0;
  p.value.pageY = 0;
  p.value.pointerType = "unknown";
  p.value.button = "none";
  p.value.pressure = 0.5;
  p.updatedAt = performance.now();
}
