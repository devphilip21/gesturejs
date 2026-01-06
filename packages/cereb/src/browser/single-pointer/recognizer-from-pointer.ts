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
  type SinglePointerType,
  toSinglePointerButton,
} from "./types.js";

export function createPointerRecognizer(
  options: SinglePointerOptions = {},
): SinglePointerRecognizer<DomEventSignal<PointerEvent>> {
  function processer(
    domEventSignal: DomEventSignal<PointerEvent>,
    signal: SinglePointerSignal,
  ): boolean {
    const e = domEventSignal.value;

    if (!e.isPrimary) {
      return false;
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

    const v = signal.value as DeepMutable<SinglePointer>;
    v.id = `${e.pointerType}-${e.pointerId}`;
    v.phase = phase;
    v.cursor = [e.clientX, e.clientY];
    v.pageCursor = [e.pageX, e.pageY];
    v.pointerType = normalizePointerType(e.pointerType);
    v.button = button;
    v.pressure = e.pressure;
    return true;
  }

  return createSinglePointerRecognizer(processer, options);
}

export function singlePointerFromPointer(
  options: SinglePointerOptions = {},
): Operator<DomEventSignal<PointerEvent>, SinglePointerSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createPointerRecognizer(options);

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
