import type { Signal, SinglePointerType } from "cereb";
import { createSignal } from "cereb";
import type { TapPhase } from "./tap-types.js";

/**
 * Tap gesture value emitted during tap lifecycle (start, end, cancel).
 * Contains position, timing, and consecutive tap count information.
 */
export interface TapValue {
  phase: TapPhase;

  /** Tap position X (client coordinates) */
  x: number;
  /** Tap position Y (client coordinates) */
  y: number;

  /** Tap position X (page coordinates) */
  pageX: number;
  /** Tap position Y (page coordinates) */
  pageY: number;

  /**
   * Number of consecutive taps (1=single, 2=double, 3=triple, etc.)
   * Increments if taps occur within multiTapInterval and multiTapDistance.
   */
  tapCount: number;

  /** How long the pointer was pressed (ms) */
  duration: number;

  /** Type of pointer that performed the tap */
  pointerType: SinglePointerType;
}

export interface TapSignal<T = {}> extends Signal<"tap", TapValue & T> {}

export const TAP_SIGNAL_KIND = "tap" as const;

export function createDefaultTapValue(): TapValue {
  return {
    phase: "end",
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
    tapCount: 1,
    duration: 0,
    pointerType: "unknown",
  };
}

export function createDefaultTapSignal(): TapSignal {
  return createSignal(TAP_SIGNAL_KIND, createDefaultTapValue());
}

export function createTapSignal(value: TapValue): TapSignal {
  return createSignal(TAP_SIGNAL_KIND, value);
}
