import type { Operator } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { DeepMutable } from "../../internal/types.js";
import type { DomEventSignal } from "../dom-event/dom-event-signal.js";
import { createSinglePointerRecognizer, type SinglePointerRecognizer } from "./recognizer.js";
import type { SinglePointer, SinglePointerSignal } from "./single-pointer-signal.js";
import {
  type SinglePointerButton,
  type SinglePointerOptions,
  type SinglePointerPhase,
  toSinglePointerButton,
} from "./types.js";

export function createMouseRecognizer(
  options: SinglePointerOptions = {},
): SinglePointerRecognizer<DomEventSignal<MouseEvent>> {
  function processer(
    domEventSignal: DomEventSignal<MouseEvent>,
    signal: SinglePointerSignal,
  ): boolean {
    const e = domEventSignal.value;
    let phase: SinglePointerPhase;
    let button: SinglePointerButton;
    switch (e.type) {
      case "mousedown":
        phase = "start";
        button = toSinglePointerButton(e.button);
        break;
      case "mouseup":
        phase = "end";
        button = toSinglePointerButton(e.button);
        break;
      default:
        phase = "move";
        button = "none";
    }

    const v = signal.value as DeepMutable<SinglePointer>;
    v.id = "";
    v.phase = phase;
    v.cursor = [e.clientX, e.clientY];
    v.pageCursor = [e.pageX, e.pageY];
    v.pointerType = "mouse";
    v.button = button;
    v.pressure = phase === "move" && e.buttons === 0 ? 0 : 0.5;
    return true;
  }

  return createSinglePointerRecognizer(processer, options);
}

export function singlePointerFromMouse(
  options: SinglePointerOptions = {},
): Operator<DomEventSignal<MouseEvent>, SinglePointerSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createMouseRecognizer(options);

      const unsub = source.on({
        next(event) {
          const pointer = recognizer.process(event);
          if (pointer) {
            observer.next(pointer);
          }
        },
        error(err) {
          observer.error?.(err);
        },
        complete() {
          observer.complete?.();
        },
      });

      return () => {
        unsub();
        recognizer.dispose();
      };
    });
}
