import type { Operator } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { DomEventSignal } from "../dom-event/dom-event-signal.js";
import type {
  SinglePointerButton,
  SinglePointerPhase,
  SinglePointerType,
} from "../single-pointer/types.js";
import { toSinglePointerButton } from "../single-pointer/types.js";
import type { MultiPointerSignal, PointerInfo } from "./multi-pointer-signal.js";
import {
  createMultiPointerRecognizer,
  type MultiPointerRecognizer,
  type PointerUpdateResult,
} from "./recognizer.js";
import type { MultiPointerOptions } from "./types.js";

export function createPointerRecognizer(
  options: MultiPointerOptions = {},
): MultiPointerRecognizer<DomEventSignal<PointerEvent>> {
  function processor(
    domEventSignal: DomEventSignal<PointerEvent>,
    pointerMap: Map<string, PointerInfo>,
    opts: Required<MultiPointerOptions>,
  ): PointerUpdateResult | null {
    const e = domEventSignal.value;
    const id = `${e.pointerType}-${e.pointerId}`;
    const endedPointerIds: string[] = [];

    switch (e.type) {
      case "pointerdown": {
        if (pointerMap.size >= opts.maxPointers) {
          return null;
        }
        pointerMap.set(id, createPointerInfo(e, "start"));
        break;
      }

      case "pointermove": {
        if (!pointerMap.has(id)) {
          return null;
        }
        pointerMap.set(id, createPointerInfo(e, "move"));
        break;
      }

      case "pointerup": {
        if (!pointerMap.has(id)) {
          return null;
        }
        pointerMap.set(id, createPointerInfo(e, "end"));
        endedPointerIds.push(id);
        break;
      }

      case "pointercancel": {
        if (!pointerMap.has(id)) {
          return null;
        }
        pointerMap.set(id, createPointerInfo(e, "cancel"));
        endedPointerIds.push(id);
        break;
      }

      default:
        return null;
    }

    return { pointers: pointerMap, endedPointerIds };
  }

  return createMultiPointerRecognizer(processor, options);
}

export function multiPointerFromPointer(
  options: MultiPointerOptions = {},
): Operator<DomEventSignal<PointerEvent>, MultiPointerSignal> {
  return (source) =>
    createStream((observer) => {
      const recognizer = createPointerRecognizer(options);

      const unsub = source.on({
        next(event) {
          const signal = recognizer.process(event);
          if (signal) {
            observer.next(signal);
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

function createPointerInfo(e: PointerEvent, phase: SinglePointerPhase): PointerInfo {
  const button: SinglePointerButton =
    phase === "start" || phase === "end" ? toSinglePointerButton(e.button) : "none";

  return {
    id: `${e.pointerType}-${e.pointerId}`,
    phase,
    cursor: [e.clientX, e.clientY],
    pageCursor: [e.pageX, e.pageY],
    pointerType: normalizePointerType(e.pointerType),
    button,
    pressure: e.pressure,
  };
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
