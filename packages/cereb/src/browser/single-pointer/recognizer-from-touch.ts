import type { Operator } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { DomEventSignal } from "../dom-event/dom-event-signal.js";
import { createSinglePointerRecognizer, type SinglePointerRecognizer } from "./recognizer.js";
import type { SinglePointerSignal } from "./single-pointer-signal.js";
import type { SinglePointerOptions, SinglePointerPhase } from "./types.js";

export function createTouchRecognizer(
  options: SinglePointerOptions = {},
): SinglePointerRecognizer<DomEventSignal<TouchEvent>> {
  function processer(event: DomEventSignal<TouchEvent>, signal: SinglePointerSignal): void {
    const e = event.value;
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) {
      return;
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

    signal.value.phase = phase;
    signal.value.x = touch.clientX;
    signal.value.y = touch.clientY;
    signal.value.pageX = touch.pageX;
    signal.value.pageY = touch.pageY;
    signal.value.pointerType = "touch";
    signal.value.button = "none";
    signal.value.pressure = touch.force || 0.5;
  }

  return createSinglePointerRecognizer(processer, options);
}

export function singlePointerFromTouch(
  options: SinglePointerOptions = {},
): Operator<DomEventSignal<TouchEvent>, SinglePointerSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createTouchRecognizer(options);

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
