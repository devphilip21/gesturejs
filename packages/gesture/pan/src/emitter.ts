import type { GesturePhase } from "@gesturejs/gesture";
import type { SinglePointer } from "@gesturejs/single-pointer";
import type { PanEvent } from "./event.js";
import { createDefaultPanEvent } from "./event.js";
import { calculateDistance, getDirection } from "./geometry.js";
import { panEventPool } from "./pool.js";
import { createInitialPanState, type PanState, resetPanState } from "./state.js";
import type { PanDirectionMode } from "./types.js";

const DEFAULT_THRESHOLD = 10;

export interface PanEmitterOptions {
  threshold?: number;
  direction?: PanDirectionMode;
  pooling?: boolean;
}

/**
 * Stateful processor that transforms SinglePointer events into PanEvent.
 * Can be used imperatively or integrated into custom pipelines.
 */
export interface PanEmitter {
  process(pointer: SinglePointer): PanEvent | null;
  readonly isActive: boolean;
  readonly thresholdMet: boolean;
  reset(): void;
  dispose(): void;
}

function isThresholdMet(
  deltaX: number,
  deltaY: number,
  threshold: number,
  direction: PanDirectionMode,
): boolean {
  switch (direction) {
    case "horizontal":
      return Math.abs(deltaX) >= threshold;
    case "vertical":
      return Math.abs(deltaY) >= threshold;
    default:
      return Math.abs(deltaX) >= threshold || Math.abs(deltaY) >= threshold;
  }
}

/**
 * Creates a pan gesture emitter that processes SinglePointer events.
 *
 * The emitter maintains internal state and can be used:
 * - Imperatively via process() method
 * - With any event source (not just Observable streams)
 * - In Web Workers or other non-DOM contexts
 *
 * @example
 * ```typescript
 * const emitter = createPanEmitter({ threshold: 10 });
 *
 * element.addEventListener('pointermove', (e) => {
 *   const pointer = toSinglePointer(e);
 *   const panEvent = emitter.process(pointer);
 *   if (panEvent) {
 *     console.log(panEvent.deltaX, panEvent.velocityX);
 *   }
 * });
 * ```
 */
export function createPanEmitter(options: PanEmitterOptions = {}): PanEmitter {
  const { threshold = DEFAULT_THRESHOLD, direction = "all", pooling = false } = options;

  const state: PanState = createInitialPanState();

  function acquireEvent(): PanEvent {
    if (pooling) {
      return panEventPool.acquire();
    }
    return createDefaultPanEvent();
  }

  function createPanEvent(pointer: SinglePointer, phase: GesturePhase): PanEvent {
    const event = acquireEvent();

    const deltaX = pointer.x - state.startX;
    const deltaY = pointer.y - state.startY;

    event.timestamp = pointer.timestamp;
    event.deviceId = state.deviceId;
    event.phase = phase;
    event.deltaX = deltaX;
    event.deltaY = deltaY;
    event.distance = state.totalDistance;
    event.direction = getDirection(deltaX, deltaY);
    event.x = pointer.x;
    event.y = pointer.y;
    event.pageX = pointer.pageX;
    event.pageY = pointer.pageY;

    return event;
  }

  function handleStart(pointer: SinglePointer): null {
    state.isActive = true;
    state.thresholdMet = false;
    state.startX = pointer.x;
    state.startY = pointer.y;
    state.startTimestamp = pointer.timestamp;
    state.prevX = pointer.x;
    state.prevY = pointer.y;
    state.prevTimestamp = pointer.timestamp;
    state.totalDistance = 0;
    state.deviceId = pointer.deviceId;
    return null;
  }

  function handleMove(pointer: SinglePointer): PanEvent | null {
    if (!state.isActive) return null;

    const deltaX = pointer.x - state.startX;
    const deltaY = pointer.y - state.startY;

    const segmentDistance = calculateDistance(state.prevX, state.prevY, pointer.x, pointer.y);
    state.totalDistance += segmentDistance;

    let result: PanEvent | null = null;

    if (!state.thresholdMet) {
      if (isThresholdMet(deltaX, deltaY, threshold, direction)) {
        state.thresholdMet = true;
        result = createPanEvent(pointer, "start");
      }
    } else {
      result = createPanEvent(pointer, "change");
    }

    state.prevX = pointer.x;
    state.prevY = pointer.y;
    state.prevTimestamp = pointer.timestamp;

    return result;
  }

  function handleEnd(pointer: SinglePointer): PanEvent | null {
    if (!state.isActive) return null;

    let result: PanEvent | null = null;

    if (state.thresholdMet) {
      result = createPanEvent(pointer, "end");
    }

    resetPanState(state);
    return result;
  }

  function handleCancel(pointer: SinglePointer): PanEvent | null {
    if (!state.isActive) return null;

    let result: PanEvent | null = null;

    if (state.thresholdMet) {
      result = createPanEvent(pointer, "cancel");
    }

    resetPanState(state);
    return result;
  }

  return {
    process(pointer: SinglePointer): PanEvent | null {
      switch (pointer.phase) {
        case "start":
          return handleStart(pointer);
        case "move":
          return handleMove(pointer);
        case "end":
          return handleEnd(pointer);
        case "cancel":
          return handleCancel(pointer);
        default:
          return null;
      }
    },

    get isActive(): boolean {
      return state.isActive;
    },

    get thresholdMet(): boolean {
      return state.thresholdMet;
    },

    reset(): void {
      resetPanState(state);
    },

    dispose(): void {
      resetPanState(state);
    },
  };
}
