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
  type SinglePointerType,
  toSinglePointerButton,
} from "./types.js";

export function createPointerRecognizer(
  options: SinglePointerOptions = {},
): SinglePointerRecognizer<DomSignal<PointerEvent>> {
  let isPointerDown = false;

  function processer(domSignal: DomSignal<PointerEvent>, signal: SinglePointerSignal): boolean {
    const e = domSignal.value;

    if (!e.isPrimary) {
      return false;
    }

    let phase: SinglePointerPhase;
    let button: SinglePointerButton;
    switch (e.type) {
      case "pointerdown":
        isPointerDown = true;
        phase = "start";
        button = toSinglePointerButton(e.button);
        break;
      case "pointerup":
        isPointerDown = false;
        phase = "end";
        button = toSinglePointerButton(e.button);
        break;
      case "pointercancel":
      case "pointerleave":
        isPointerDown = false;
        phase = "cancel";
        button = "none";
        break;
      default:
        // pointermove: ignore if pointer is not pressed
        if (!isPointerDown) {
          return false;
        }
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
): Operator<DomSignal<PointerEvent>, SinglePointerSignal> {
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
