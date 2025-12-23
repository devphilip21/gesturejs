import { createGestureEventPool } from "@cereb/gesture";
import { createDefaultPanEvent, type PanEvent, resetPanEvent } from "./event.js";

export const panEventPool = createGestureEventPool<PanEvent>(
  createDefaultPanEvent,
  resetPanEvent,
  20, // initialSize
  100, // maxSize
);

export function releasePanEvent(event: PanEvent): void {
  panEventPool.release(event);
}
