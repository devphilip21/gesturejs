import type { Operator } from "../../stream/stream.js";
import { createStream } from "../../stream/stream.js";
import { singlePointerPool } from "./pool.js";
import type { SinglePointer } from "./single-pointer.js";
import type { PointerButton, PointerPhase } from "./types.js";
import { toPointerButton } from "./types.js";

export interface MouseEmitterOptions {
  deviceId?: string;
  pooling?: boolean;
}

export interface MouseEmitter {
  process(event: MouseEvent): SinglePointer;
  readonly isActive: boolean;
  reset(): void;
  dispose(): void;
}

export function createMouseEmitter(options: MouseEmitterOptions = {}): MouseEmitter {
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
      pointerType: "mouse",
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
    process(event: MouseEvent): SinglePointer {
      let phase: PointerPhase;
      let button: PointerButton;
      switch (event.type) {
        case "mousedown":
          phase = "start";
          button = toPointerButton(event.button);
          break;
        case "mouseup":
          phase = "end";
          button = toPointerButton(event.button);
          break;
        default:
          phase = "move";
          button = "none";
      }

      const pointer = acquirePointer();

      pointer.timestamp = performance.now();
      pointer.deviceId = resolvedDeviceId || (resolvedDeviceId = "mouse-device");
      pointer.phase = phase;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.pageX = event.pageX;
      pointer.pageY = event.pageY;
      pointer.pointerType = "mouse";
      pointer.button = button;
      pointer.pressure = phase === "move" && event.buttons === 0 ? 0 : 0.5;

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

export function mouseToSinglePointer(
  options: MouseEmitterOptions = {},
): Operator<MouseEvent, SinglePointer> {
  return (source) =>
    createStream((observer) => {
      const emitter = createMouseEmitter(options);

      const unsub = source.subscribe({
        next(event) {
          const pointer = emitter.process(event);
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
        emitter.dispose();
      };
    });
}
