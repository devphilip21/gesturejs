export type { PointerType, PointerPhase, PointerButton } from "./types.js";
export { toPointerButton } from "./types.js";

export type { SinglePointer } from "./signal.js";
export {
  createDefaultSinglePointer,
  resetSinglePointer,
  isSinglePointer,
} from "./signal.js";

export { singlePointerPool, releaseSinglePointer } from "./pool.js";

export type {
  PointerEmitterOptions,
  PointerEmitter,
  ToSinglePointerOptions,
  SinglePointerOptions,
} from "./pointer.js";
export {
  createPointerEmitter,
  pointerEventsToSinglePointer,
  singlePointer,
} from "./pointer.js";

export type {
  TouchEmitterOptions,
  TouchEmitter,
  TouchEventsToSinglePointerOptions,
  TouchSinglePointerOptions,
} from "./touch.js";
export {
  createTouchEmitter,
  touchEventsToSinglePointer,
} from "./touch.js";

export type {
  MouseEmitterOptions,
  MouseEmitter,
  MouseEventsToSinglePointerOptions,
} from "./mouse.js";
export {
  createMouseEmitter,
  mouseEventsToSinglePointer,
} from "./mouse.js";

export {
  eventTypeToPhase,
  normalizePointerType,
  getButton,
  getDeviceId,
} from "./utils.js";
