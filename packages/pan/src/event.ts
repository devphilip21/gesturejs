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
export interface BasePanEvent {
  type: "pan";
  timestamp: number;
  deviceId: string;
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

export type PanEvent<TExtensions extends object = object> = BasePanEvent & TExtensions;

export function createDefaultPanEvent(): PanEvent {
  return {
    type: "pan",
    timestamp: 0,
    deviceId: "",
    phase: "start",
    deltaX: 0,
    deltaY: 0,
    distance: 0,
    direction: "none",
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
  };
}

export function resetPanEvent(event: PanEvent): void {
  event.timestamp = 0;
  event.deviceId = "";
  event.phase = "start";
  event.deltaX = 0;
  event.deltaY = 0;
  event.distance = 0;
  event.direction = "none";
  event.x = 0;
  event.y = 0;
  event.pageX = 0;
  event.pageY = 0;
}

export function isPanEvent(event: { type: string }): event is PanEvent {
  return event.type === "pan";
}
