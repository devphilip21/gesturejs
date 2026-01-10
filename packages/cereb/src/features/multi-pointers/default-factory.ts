import type { Stream } from "../../core/stream.js";
import { pointer } from "../dom/pointer.js";
import type { MultiPointersSignal } from "./multi-pointers-signal.js";
import { multiPointersFromPointer } from "./recognizer-from-pointer.js";
import type { MultiPointersOptions } from "./types.js";

export function multiPointers(
  target: EventTarget,
  options: MultiPointersOptions = {},
): Stream<MultiPointersSignal> {
  const source = pointer(target);
  return multiPointersFromPointer(options)(source);
}
