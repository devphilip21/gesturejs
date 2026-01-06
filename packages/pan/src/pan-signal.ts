import type { Signal } from "cereb";
import { createSignal } from "cereb";
import type { Point, Vector } from "cereb/geometry";
import type { PanDirection, PanPhase } from "./pan-types.js";

/**
 * Pan gesture value emitted during pan lifecycle (start, move, end, cancel).
 * Contains position deltas, velocity, cumulative distance, and direction information.
 */
export interface PanValue {
  phase: PanPhase;

  /** Current position [x, y] (client coordinates) */
  cursor: Point;
  /** Current position [pageX, pageY] (page coordinates) */
  pageCursor: Point;

  /** Displacement from start [deltaX, deltaY] */
  delta: Vector;
  /** Velocity [vx, vy] in pixels per millisecond */
  velocity: Vector;

  /** Total cumulative distance traveled */
  distance: number;

  /** Current movement direction */
  direction: PanDirection;
}

export interface PanSignal<T = {}> extends Signal<"pan", PanValue & T> {}

export const PAN_SIGNAL_KIND = "pan" as const;

export function createDefaultPanValue(): PanValue {
  return {
    phase: "unknown",
    cursor: [0, 0],
    pageCursor: [0, 0],
    delta: [0, 0],
    velocity: [0, 0],
    distance: 0,
    direction: "none",
  };
}

export function createDefaultPanSignal(): PanSignal {
  return createSignal(PAN_SIGNAL_KIND, createDefaultPanValue());
}

export function createPanSignal(value: PanValue): PanSignal {
  return createSignal(PAN_SIGNAL_KIND, value);
}
