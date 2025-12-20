import type { PointerPhase, PointerButton } from "./types.js";
import { toPointerButton } from "./types.js";

export function eventTypeToPhase(eventType: string): PointerPhase {
  switch (eventType) {
    case "pointerdown":
    case "mousedown":
    case "touchstart":
      return "start";
    case "pointermove":
    case "mousemove":
    case "touchmove":
      return "move";
    case "pointerup":
    case "mouseup":
    case "touchend":
      return "end";
    case "pointercancel":
    case "touchcancel":
      return "cancel";
    default:
      return "move";
  }
}

export function normalizePointerType(
  type: string
): "touch" | "mouse" | "pen" | "unknown" {
  switch (type) {
    case "mouse":
      return "mouse";
    case "touch":
      return "touch";
    case "pen":
      return "pen";
    default:
      return "unknown";
  }
}

export function getButton(event: PointerEvent | MouseEvent): PointerButton {
  if (event.type.includes("move")) {
    return "none";
  }
  return toPointerButton(event.button);
}

export function getDeviceId(
  event: PointerEvent | TouchEvent | MouseEvent
): string {
  if ("pointerType" in event) {
    return `${event.pointerType}-${event.pointerId}`;
  }
  if ("touches" in event) {
    return "touch-device";
  }
  return "mouse-device";
}

