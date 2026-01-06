import type { Signal } from "cereb";
import { createSignal } from "cereb";
import type { Point } from "cereb/geometry";
import type { TapPhase, TapSourcePointerType } from "./tap-types.js";

/**
 * Tap gesture value emitted during tap lifecycle (start, end, cancel).
 * Contains position, timing, and consecutive tap count information.
 */
export interface TapValue {
  phase: TapPhase;

  /** Tap position (client coordinates) */
  cursor: Point;

  /** Tap position (page coordinates) */
  pageCursor: Point;

  /**
   * Number of consecutive taps (1=single, 2=double, 3=triple, etc.)
   * Increments if taps occur within multiTapInterval and multiTapDistance.
   */
  tapCount: number;

  /** How long the pointer was pressed (ms) */
  duration: number;

  /** Type of pointer that performed the tap */
  pointerType: TapSourcePointerType;
}

export interface TapSignal<T = {}> extends Signal<"tap", TapValue & T> {}

export const TAP_SIGNAL_KIND = "tap" as const;

export function createDefaultTapValue(): TapValue {
  return {
    phase: "end",
    cursor: [0, 0],
    pageCursor: [0, 0],
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
