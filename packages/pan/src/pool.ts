import { createObjectPool } from "cereb";
import { createDefaultPanEvent, type PanEvent, resetPanEvent } from "./event.js";

export const panEventPool = createObjectPool<PanEvent>(createDefaultPanEvent, resetPanEvent, {
  initialSize: 20,
  maxSize: 100,
});

export function releasePanEvent(event: PanEvent): void {
  panEventPool.release(event);
}
