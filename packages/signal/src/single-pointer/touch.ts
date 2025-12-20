import type { Operator } from "@gesturejs/stream";
import { createObservable } from "@gesturejs/stream";
import type { SinglePointer } from "./signal.js";
import { singlePointerPool } from "./pool.js";
import { eventTypeToPhase, getDeviceId } from "./utils.js";

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

export function createTouchEmitter(
  options: TouchEmitterOptions = {}
): TouchEmitter {
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
      pointerType: "touch",
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
    process(event: TouchEvent): SinglePointer | null {
      const phase = eventTypeToPhase(event.type);
      const touch = event.touches[0] ?? event.changedTouches[0];

      if (!touch) {
        return current;
      }

      const pointer = acquirePointer();

      pointer.timestamp = performance.now();
      pointer.deviceId =
        resolvedDeviceId || (resolvedDeviceId = getDeviceId(event));
      pointer.phase = phase;
      pointer.x = touch.clientX;
      pointer.y = touch.clientY;
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

export type TouchEventsToSinglePointerOptions = TouchEmitterOptions;

export function touchEventsToSinglePointer(
  options: TouchEventsToSinglePointerOptions = {}
): Operator<TouchEvent, SinglePointer> {
  return (source) =>
    createObservable((observer) => {
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

export interface TouchSinglePointerOptions extends TouchEmitterOptions {
  listenerOptions?: AddEventListenerOptions;
}
