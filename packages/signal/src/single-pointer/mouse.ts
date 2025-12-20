import type { Operator } from "@gesturejs/stream";
import { createObservable } from "@gesturejs/stream";
import type { SinglePointer } from "./signal.js";
import { singlePointerPool } from "./pool.js";
import { eventTypeToPhase, getButton, getDeviceId } from "./utils.js";

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

export function createMouseEmitter(
  options: MouseEmitterOptions = {}
): MouseEmitter {
  const { deviceId: customDeviceId, pooling = false } = options;
  let current: SinglePointer | null = null;
  let resolvedDeviceId = customDeviceId ?? "";

  function acquirePointer(): SinglePointer {
    if (pooling) {
      return singlePointerPool.acquire();
    }
    return {
      type: "pointer",
      timestamp: 0,
      deviceId: "",
      phase: "move",
      x: 0,
      y: 0,
      pointerType: "mouse",
      button: "none",
      pressure: 0.5,
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
      const phase = eventTypeToPhase(event.type);
      const pointer = acquirePointer();

      pointer.timestamp = performance.now();
      pointer.deviceId =
        resolvedDeviceId || (resolvedDeviceId = getDeviceId(event));
      pointer.phase = phase;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.pointerType = "mouse";
      pointer.button = getButton(event);
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

export type MouseEventsToSinglePointerOptions = MouseEmitterOptions;

export function mouseEventsToSinglePointer(
  options: MouseEventsToSinglePointerOptions = {}
): Operator<MouseEvent, SinglePointer> {
  return (source) =>
    createObservable((observer) => {
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
