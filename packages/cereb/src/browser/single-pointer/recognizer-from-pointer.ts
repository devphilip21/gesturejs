import type { Operator } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { DomEventSignal } from "../dom-event/dom-event-signal.js";
import { createSinglePointerRecognizer, type SinglePointerRecognizer } from "./recognizer.js";
import type { SinglePointerSignal } from "./single-pointer-signal.js";
import {
  type SinglePointerButton,
  type SinglePointerOptions,
  type SinglePointerPhase,
  type SinglePointerType,
  toSinglePointerButton,
} from "./types.js";

export function createPointerRecognizer(
  options: SinglePointerOptions = {},
): SinglePointerRecognizer<DomEventSignal<PointerEvent>> {
  function processer(
    domEventSignal: DomEventSignal<PointerEvent>,
    signal: SinglePointerSignal,
  ): void {
    const e = domEventSignal.value;

    if (!e.isPrimary) {
      return;
    }

    let phase: SinglePointerPhase;
    let button: SinglePointerButton;
    switch (e.type) {
      case "pointerdown":
        phase = "start";
        button = toSinglePointerButton(e.button);
        break;
      case "pointerup":
        phase = "end";
        button = toSinglePointerButton(e.button);
        break;
      case "pointercancel":
        phase = "cancel";
        button = "none";
        break;
      default:
        phase = "move";
        button = "none";
    }

    signal.value.id = `${e.pointerType}-${e.pointerId}`;
    signal.value.phase = phase;
    signal.value.x = e.clientX;
    signal.value.y = e.clientY;
    signal.value.pageX = e.pageX;
    signal.value.pageY = e.pageY;
    signal.value.pointerType = normalizePointerType(e.pointerType);
    signal.value.button = button;
    signal.value.pressure = e.pressure;
  }

  return createSinglePointerRecognizer(processer, options);
}

export function singlePointerFromPointer(
  options: SinglePointerOptions = {},
): Operator<DomEventSignal<PointerEvent>, SinglePointerSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createPointerRecognizer(options);

      const unsub = source.subscribe({
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

function normalizePointerType(type: string): SinglePointerType {
  switch (type) {
    case "mouse":
      return "mouse";
    case "touch":
      return "touch";
    case "pen":
      return "pen";
    default:
      return "unknown";
  }
}
