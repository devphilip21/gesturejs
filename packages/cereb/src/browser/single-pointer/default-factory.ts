import type { Stream } from "../../core/stream.js";
import { pointerEvents } from "../dom-event/pointer-events.js";
import { singlePointerFromPointer } from "./recognizer-from-pointer.js";
import type { SinglePointerSignal } from "./single-pointer-signal.js";
import type { SinglePointerOptions } from "./types.js";

export function singlePointer(
  target: EventTarget,
  options: SinglePointerOptions = {},
): Stream<SinglePointerSignal> {
  const source = pointerEvents(target);
  return singlePointerFromPointer(options)(source);
}
