import type { SinglePointerSignal } from "cereb";
import { calculateDistance, getDirection } from "./geometry.js";
import { createDefaultPanSignal, type PanSignal } from "./pan-signal.js";
import { panEventPool } from "./pool.js";
import { createInitialPanState, type PanState, resetPanState } from "./state.js";
import type { PanDirectionMode, PanOptions, PanPhase } from "./types.js";

const DEFAULT_THRESHOLD = 10;

/**
 * Stateful processor that transforms SinglePointer events into PanEvent.
 * Can be used imperatively or integrated into custom pipelines.
 */
export interface PanEmitter {
  process(pointer: SinglePointerSignal): PanSignal | null;
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
export function createPanEmitter(options: PanOptions = {}): PanEmitter {
  const { threshold = DEFAULT_THRESHOLD, direction = "all", pooling = false } = options;
  const state: PanState = createInitialPanState();

  function acquireSignal(): PanSignal {
    if (pooling) {
      return panEventPool.acquire();
    }
    return createDefaultPanSignal();
  }

  function createPanSignal(pointerSignal: SinglePointerSignal, phase: PanPhase): PanSignal {
    const signal = acquireSignal();

    const deltaX = pointerSignal.value.x - state.startX;
    const deltaY = pointerSignal.value.y - state.startY;

    signal.value.phase = phase;
    signal.value.deltaX = deltaX;
    signal.value.deltaY = deltaY;
    signal.value.distance = state.totalDistance;
    signal.value.direction = getDirection(deltaX, deltaY);
    signal.value.x = pointerSignal.value.x;
    signal.value.y = pointerSignal.value.y;
    signal.value.pageX = pointerSignal.value.pageX;
    signal.value.pageY = pointerSignal.value.pageY;

    return signal;
  }

  function handleStart(signal: SinglePointerSignal): null {
    state.isActive = true;
    state.thresholdMet = false;
    state.startX = signal.value.x;
    state.startY = signal.value.y;
    state.startTimestamp = signal.createdAt;
    state.prevX = signal.value.x;
    state.prevY = signal.value.y;
    state.prevTimestamp = signal.createdAt;
    state.totalDistance = 0;
    state.deviceId = signal.deviceId;
    return null;
  }

  function handleMove(signal: SinglePointerSignal): PanSignal | null {
    if (!state.isActive) return null;

    const deltaX = signal.value.x - state.startX;
    const deltaY = signal.value.y - state.startY;

    const segmentDistance = calculateDistance(
      state.prevX,
      state.prevY,
      signal.value.x,
      signal.value.y,
    );
    state.totalDistance += segmentDistance;

    let result: PanSignal | null = null;

    if (!state.thresholdMet) {
      if (isThresholdMet(deltaX, deltaY, threshold, direction)) {
        state.thresholdMet = true;
        result = createPanSignal(signal, "start");
      }
    } else {
      result = createPanSignal(signal, "move");
    }

    state.prevX = signal.value.x;
    state.prevY = signal.value.y;
    state.prevTimestamp = signal.createdAt;

    return result;
  }

  function handleEnd(signal: SinglePointerSignal): PanSignal | null {
    if (!state.isActive) return null;

    let result: PanSignal | null = null;

    if (state.thresholdMet) {
      result = createPanSignal(signal, "end");
    }

    resetPanState(state);
    return result;
  }

  function handleCancel(signal: SinglePointerSignal): PanSignal | null {
    if (!state.isActive) return null;

    let result: PanSignal | null = null;
    if (state.thresholdMet) {
      result = createPanSignal(signal, "cancel");
    }

    resetPanState(state);
    return result;
  }

  return {
    process(signal: SinglePointerSignal): PanSignal | null {
      switch (signal.value.phase) {
        case "start":
          return handleStart(signal);
        case "move":
          return handleMove(signal);
        case "end":
          return handleEnd(signal);
        case "cancel":
          return handleCancel(signal);
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
