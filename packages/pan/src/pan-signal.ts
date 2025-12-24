import type { Signal } from "cereb";
import { createSignal } from "../../cereb/src/core/signal.js";
import type { PanDirection, PanPhase } from "./types.js";

/**
 * Pan gesture event emitted during pan lifecycle (start, change, end, cancel).
 * Contains position deltas, cumulative distance, and direction information.
 *
 * Use withVelocity() operator to add velocity data:
 * @example
 * ```typescript
 * pipe(source, singlePointerToPan(), withVelocity()).subscribe(event => {
 *   console.log(event.velocityX); // available after withVelocity()
 * });
 * ```
 */
export interface PanValue {
  phase: PanPhase;

  /** X displacement from start point */
  deltaX: number;
  /** Y displacement from start point */
  deltaY: number;

  /** Total cumulative distance traveled */
  distance: number;

  /** Current movement direction */
  direction: PanDirection;

  /** Current clientX */
  x: number;
  /** Current clientY */
  y: number;
  /** Current pageX */
  pageX: number;
  /** Current pageY */
  pageY: number;
}

export interface PanSignal<T = {}> extends Signal<"pan", PanValue & T> {}

export const PAN_SIGNAL_KIND = "pan";

export function createDefaultPanSignal(): PanSignal {
  return createSignal(PAN_SIGNAL_KIND, {
    phase: "unknown",
    deltaX: 0,
    deltaY: 0,
    distance: 0,
    direction: "none",
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
  });
}

export function resetPanSignal(signal: PanSignal): void {
  signal.value.phase = "unknown";
  signal.value.deltaX = 0;
  signal.value.deltaY = 0;
  signal.value.distance = 0;
  signal.value.direction = "none";
  signal.value.x = 0;
  signal.value.y = 0;
  signal.value.pageX = 0;
  signal.value.pageY = 0;
}
