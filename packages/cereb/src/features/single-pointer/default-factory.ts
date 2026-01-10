import type { Stream } from "../../core/stream.js";
import { pointer } from "../dom/pointer.js";
import { singlePointerFromPointer } from "./recognizer-from-pointer.js";
import type { SinglePointerSignal } from "./single-pointer-signal.js";
import type { SinglePointerOptions } from "./types.js";

export function singlePointer(
  target: EventTarget,
  options: SinglePointerOptions = {},
): Stream<SinglePointerSignal> {
  const source = pointer(target);
  return singlePointerFromPointer(options)(source);
}
