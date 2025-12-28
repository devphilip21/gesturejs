import { createSignal, type Signal } from "../../core/signal.js";

export type WheelDeltaMode = "pixel" | "line" | "page";

/**
 * Wheel event data normalized into a consistent structure.
 * Provides scroll deltas and position information.
 */
export interface WheelValue {
  /** Horizontal scroll delta */
  deltaX: number;
  /** Vertical scroll delta (positive = scroll down/zoom out) */
  deltaY: number;
  /** Z-axis scroll delta (rare, used by some 3D mice) */
  deltaZ: number;
  /** Unit of the delta values */
  deltaMode: WheelDeltaMode;
  /** Client X coordinate (viewport-relative) */
  x: number;
  /** Client Y coordinate (viewport-relative) */
  y: number;
  /** Page X coordinate (document-relative) */
  pageX: number;
  /** Page Y coordinate (document-relative) */
  pageY: number;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  /** Original DOM WheelEvent for advanced use cases like preventDefault */
  originalEvent: WheelEvent;
}

export interface WheelSignal extends Signal<"wheel", WheelValue> {}

export const WHEEL_SIGNAL_KIND = "wheel" as const;

export function createWheelSignal(value: WheelValue): WheelSignal {
  return createSignal(WHEEL_SIGNAL_KIND, value);
}

function toDeltaMode(mode: number): WheelDeltaMode {
  switch (mode) {
    case 0:
      return "pixel";
    case 1:
      return "line";
    case 2:
      return "page";
    default:
      return "pixel";
  }
}

export function createWheelSignalFromEvent(event: WheelEvent): WheelSignal {
  return createWheelSignal({
    deltaX: event.deltaX,
    deltaY: event.deltaY,
    deltaZ: event.deltaZ,
    deltaMode: toDeltaMode(event.deltaMode),
    x: event.clientX,
    y: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    originalEvent: event,
  });
}
