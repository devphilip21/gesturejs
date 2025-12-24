import type { PointerButton, PointerPhase, PointerType } from "./types.js";

/**
 * Normalized pointer data representing a single point of contact.
 * Abstracts away differences between mouse, touch, and pointer events.
 */
export interface SinglePointer {
  phase: PointerPhase;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
  pointerType: PointerType;
  button: PointerButton;
  /** 0.0 ~ 1.0, default 0.5 if unsupported */
  pressure: number;
  timestamp: number;
  deviceId: string;
}

export function createDefaultSinglePointer(): SinglePointer {
  return {
    phase: "move",
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
    pointerType: "unknown",
    button: "none",
    pressure: 0.5,
    timestamp: 0,
    deviceId: "",
  };
}

export function resetSinglePointer(p: SinglePointer): void {
  p.phase = "move";
  p.x = 0;
  p.y = 0;
  p.pageX = 0;
  p.pageY = 0;
  p.pointerType = "unknown";
  p.button = "none";
  p.pressure = 0.5;
  p.timestamp = 0;
  p.deviceId = "";
}

export function isSinglePointer(value: unknown): value is SinglePointer {
  return (
    typeof value === "object" &&
    value !== null &&
    "phase" in value &&
    "x" in value &&
    "y" in value &&
    "pointerType" in value
  );
}
