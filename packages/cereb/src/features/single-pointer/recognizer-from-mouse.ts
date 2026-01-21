import type { Operator } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { DeepMutable } from "../../internal/types.js";
import type { DomSignal } from "../dom/dom-signal.js";
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
): SinglePointerRecognizer<DomSignal<MouseEvent>> {
  let isMouseDown = false;

  function processer(domSignal: DomSignal<MouseEvent>, signal: SinglePointerSignal): boolean {
    const e = domSignal.value;
    let phase: SinglePointerPhase;
    let button: SinglePointerButton;
    switch (e.type) {
      case "mousedown":
        isMouseDown = true;
        phase = "start";
        button = toSinglePointerButton(e.button);
        break;
      case "mouseup":
        isMouseDown = false;
        phase = "end";
        button = toSinglePointerButton(e.button);
        break;
      case "mouseleave":
        isMouseDown = false;
        phase = "cancel";
        button = "none";
        break;
      default:
        // mousemove: ignore if mouse is not pressed
        if (!isMouseDown) {
          return false;
        }
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
): Operator<DomSignal<MouseEvent>, SinglePointerSignal> {
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
