import type { Operator } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { DomEventSignal } from "../dom-event/dom-event-signal.js";
import {
  createSinglePointerRecognizer,
  type SinglePointerRecognizer,
  type SinglePointerRecognizerOptions,
} from "./recognizer.js";
import type { SinglePointerSignal } from "./single-pointer-signal.js";
import {
  type SinglePointerButton,
  type SinglePointerPhase,
  toSinglePointerButton,
} from "./types.js";

export function createMouseRecognizer(
  options: SinglePointerRecognizerOptions = {},
): SinglePointerRecognizer<DomEventSignal<MouseEvent>> {
  function processer(
    domEventSignal: DomEventSignal<MouseEvent>,
    signal: SinglePointerSignal,
  ): void {
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

    signal.value.id = "";
    signal.value.phase = phase;
    signal.value.x = e.clientX;
    signal.value.y = e.clientY;
    signal.value.pageX = e.pageX;
    signal.value.pageY = e.pageY;
    signal.value.pointerType = "mouse";
    signal.value.button = button;
    signal.value.pressure = phase === "move" && e.buttons === 0 ? 0 : 0.5;
  }

  return createSinglePointerRecognizer(processer, options);
}

export function singlePointerFromMouse(
  options: SinglePointerRecognizerOptions = {},
): Operator<DomEventSignal<MouseEvent>, SinglePointerSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createMouseRecognizer(options);

      const unsub = source.subscribe({
        next(event) {
          const pointer = recognizer.process(event);
          observer.next(pointer);
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
