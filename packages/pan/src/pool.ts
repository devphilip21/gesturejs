import { createObjectPool } from "cereb";
import { createDefaultPanSignal, type PanSignal, resetPanSignal } from "./pan-signal.js";

export const panEventPool = createObjectPool<PanSignal>(createDefaultPanSignal, resetPanSignal, {
  initialSize: 20,
  maxSize: 100,
});

export function releasePanSignal(event: PanSignal): void {
  panEventPool.release(event);
}
