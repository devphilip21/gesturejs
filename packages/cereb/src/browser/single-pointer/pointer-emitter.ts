import type { Operator, Stream } from "../../stream/stream.js";
import { createStream } from "../../stream/stream.js";
import { pointerEvents } from "../dom-event/pointer-events.js";
import { singlePointerPool } from "./pool.js";
import type { SinglePointer } from "./single-pointer.js";
import type { PointerButton, PointerPhase, PointerType } from "./types.js";
import { toPointerButton } from "./types.js";

export interface PointerEmitterOptions {
  deviceId?: string;
  pooling?: boolean;
}

export interface PointerEmitter {
  process(event: PointerEvent): SinglePointer | null;
  readonly isActive: boolean;
  reset(): void;
  dispose(): void;
}

export function createPointerEmitter(options: PointerEmitterOptions = {}): PointerEmitter {
  const { deviceId: customDeviceId, pooling = false } = options;
  let current: SinglePointer | null = null;
  let resolvedDeviceId = customDeviceId ?? "";

  function acquirePointer(): SinglePointer {
    if (pooling) {
      return singlePointerPool.acquire();
    }
    return {
      phase: "move",
      x: 0,
      y: 0,
      pageX: 0,
      pageY: 0,
      pointerType: "unknown",
      button: "none",
      pressure: 0.5,
      timestamp: 0,
      deviceId: "",
    };
  }

  function releaseCurrentPointer(): void {
    if (current && pooling) {
      singlePointerPool.release(current);
    }
    current = null;
  }

  return {
    process(event: PointerEvent): SinglePointer | null {
      if (!event.isPrimary) {
        return current;
      }

      let phase: PointerPhase;
      let button: PointerButton;
      switch (event.type) {
        case "pointerdown":
          phase = "start";
          button = toPointerButton(event.button);
          break;
        case "pointerup":
          phase = "end";
          button = toPointerButton(event.button);
          break;
        case "pointercancel":
          phase = "cancel";
          button = "none";
          break;
        default:
          phase = "move";
          button = "none";
      }

      const pointer = acquirePointer();

      pointer.timestamp = performance.now();
      pointer.deviceId =
        resolvedDeviceId || (resolvedDeviceId = `${event.pointerType}-${event.pointerId}`);
      pointer.phase = phase;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.pageX = event.pageX;
      pointer.pageY = event.pageY;
      pointer.pointerType = normalizePointerType(event.pointerType);
      pointer.button = button;
      pointer.pressure = event.pressure;

      releaseCurrentPointer();
      current = pointer;
      return pointer;
    },

    get isActive(): boolean {
      return current !== null;
    },

    reset(): void {
      releaseCurrentPointer();
      resolvedDeviceId = customDeviceId ?? "";
    },

    dispose(): void {
      this.reset();
    },
  };
}

export function toSinglePointer(
  options: PointerEmitterOptions = {},
): Operator<PointerEvent, SinglePointer> {
  return (source) =>
    createStream((observer) => {
      const emitter = createPointerEmitter(options);

      const unsub = source.subscribe({
        next(event) {
          const pointer = emitter.process(event);
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
        emitter.dispose();
      };
    });
}

export interface SinglePointerOptions extends PointerEmitterOptions {
  listenerOptions?: AddEventListenerOptions;
}

export function singlePointer(
  target: EventTarget,
  options: SinglePointerOptions = {},
): Stream<SinglePointer> {
  const { listenerOptions, ...emitterOptions } = options;
  const source = pointerEvents(target, listenerOptions);
  return toSinglePointer(emitterOptions)(source);
}

function normalizePointerType(type: string): PointerType {
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
