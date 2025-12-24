import type { Operator } from "../../stream/stream.js";
import { createStream } from "../../stream/stream.js";
import { singlePointerPool } from "./pool.js";
import type { SinglePointer } from "./single-pointer.js";
import type { PointerPhase } from "./types.js";

export interface TouchEmitterOptions {
  deviceId?: string;
  pooling?: boolean;
}

export interface TouchEmitter {
  process(event: TouchEvent): SinglePointer | null;
  readonly isActive: boolean;
  reset(): void;
  dispose(): void;
}

export function createTouchEmitter(options: TouchEmitterOptions = {}): TouchEmitter {
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
      pointerType: "touch",
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
    process(event: TouchEvent): SinglePointer | null {
      let phase: PointerPhase;
      switch (event.type) {
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

      const touch = event.touches[0] ?? event.changedTouches[0];

      if (!touch) {
        return current;
      }

      const pointer = acquirePointer();

      pointer.timestamp = performance.now();
      pointer.deviceId = resolvedDeviceId || (resolvedDeviceId = "touch-device");
      pointer.phase = phase;
      pointer.x = touch.clientX;
      pointer.y = touch.clientY;
      pointer.pageX = touch.pageX;
      pointer.pageY = touch.pageY;
      pointer.pointerType = "touch";
      pointer.button = "none";
      pointer.pressure = touch.force || 0.5;

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

export function singlePointerEmitter(
  options: TouchEmitterOptions = {},
): Operator<TouchEvent, SinglePointer> {
  return (source) =>
    createStream((observer) => {
      const emitter = createTouchEmitter(options);

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
