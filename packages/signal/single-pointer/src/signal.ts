import type { Signal } from "@cereb/signal";
import type { PointerButton, PointerPhase, PointerType } from "./types.js";

export interface SinglePointer extends Signal<"pointer"> {
  type: "pointer";
  phase: PointerPhase;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
  pointerType: PointerType;
  button: PointerButton;
  /** 0.0 ~ 1.0, default 0.5 if unsupported */
  pressure: number;
}

export function createDefaultSinglePointer(): SinglePointer {
  return {
    type: "pointer",
    timestamp: 0,
    deviceId: "",
    phase: "move",
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
    pointerType: "unknown",
    button: "none",
    pressure: 0.5,
  };
}

export function resetSinglePointer(p: SinglePointer): void {
  p.timestamp = 0;
  p.deviceId = "";
  p.phase = "move";
  p.x = 0;
  p.y = 0;
  p.pageX = 0;
  p.pageY = 0;
  p.pointerType = "unknown";
  p.button = "none";
  p.pressure = 0.5;
}

export function isSinglePointer(signal: Signal): signal is SinglePointer {
  return signal.type === "pointer";
}
