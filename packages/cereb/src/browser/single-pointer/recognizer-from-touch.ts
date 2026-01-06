import type { Operator } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { DeepMutable } from "../../internal/types.js";
import type { DomEventSignal } from "../dom-event/dom-event-signal.js";
import { createSinglePointerRecognizer, type SinglePointerRecognizer } from "./recognizer.js";
import type { SinglePointer, SinglePointerSignal } from "./single-pointer-signal.js";
import type { SinglePointerOptions, SinglePointerPhase } from "./types.js";

export function createTouchRecognizer(
  options: SinglePointerOptions = {},
): SinglePointerRecognizer<DomEventSignal<TouchEvent>> {
  function processer(event: DomEventSignal<TouchEvent>, signal: SinglePointerSignal): boolean {
    const e = event.value;
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) {
      return false;
    }

    let phase: SinglePointerPhase;
    switch (e.type) {
      case "touchstart":
        phase = "start";
        break;
      case "touchend":
        phase = "end";
        break;
      case "touchcancel":
        phase = "cancel";
        break;
      default:
        phase = "move";
    }

    const v = signal.value as DeepMutable<SinglePointer>;
    v.phase = phase;
    v.cursor = [touch.clientX, touch.clientY];
    v.pageCursor = [touch.pageX, touch.pageY];
    v.pointerType = "touch";
    v.button = "none";
    v.pressure = touch.force || 0.5;
    return true;
  }

  return createSinglePointerRecognizer(processer, options);
}

export function singlePointerFromTouch(
  options: SinglePointerOptions = {},
): Operator<DomEventSignal<TouchEvent>, SinglePointerSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createTouchRecognizer(options);

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
