import type { Observable, Operator } from "@gesturejs/stream";
import { createObservable, fromEvent, merge, pipe } from "@gesturejs/stream";
import type { SinglePointer } from "./signal.js";
import { singlePointerPool } from "./pool.js";
import {
  eventTypeToPhase,
  normalizePointerType,
  getButton,
  getDeviceId,
} from "./utils.js";

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

export function createPointerEmitter(
  options: PointerEmitterOptions = {}
): PointerEmitter {
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
      pointerType: "unknown",
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
    process(event: PointerEvent): SinglePointer | null {
      if (!event.isPrimary) {
        return current;
      }

      const phase = eventTypeToPhase(event.type);
      const pointer = acquirePointer();

      pointer.timestamp = performance.now();
      pointer.deviceId =
        resolvedDeviceId || (resolvedDeviceId = getDeviceId(event));
      pointer.phase = phase;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.pointerType = normalizePointerType(event.pointerType);
      pointer.button = getButton(event);
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

export type ToSinglePointerOptions = PointerEmitterOptions;

export function pointerEventsToSinglePointer(
  options: ToSinglePointerOptions = {}
): Operator<PointerEvent, SinglePointer> {
  return (source) =>
    createObservable((observer) => {
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

const POINTER_EVENTS = [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
] as const;

export function singlePointer(
  target: EventTarget,
  options: SinglePointerOptions = {}
): Observable<SinglePointer> {
  const { listenerOptions, ...emitterOptions } = options;

  const sources = POINTER_EVENTS.map((eventName) =>
    fromEvent<PointerEvent>(target, eventName, listenerOptions)
  );

  return pipe(merge(...sources), pointerEventsToSinglePointer(emitterOptions));
}
