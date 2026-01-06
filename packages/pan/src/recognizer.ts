import type { Vector } from "cereb/geometry";
import { calculateDistance, getDirection } from "./geometry.js";
import { createPanSignal, type PanSignal } from "./pan-signal.js";
import type { PanDirectionMode, PanOptions, PanPhase, PanSourceSignal } from "./pan-types.js";
import { createInitialPanState, type PanState, resetPanState } from "./state.js";

const DEFAULT_THRESHOLD = 10;

function calculateVelocity(
  currentX: number,
  currentY: number,
  currentTimestamp: number,
  prevX: number,
  prevY: number,
  prevTimestamp: number,
): Vector {
  const timeDelta = currentTimestamp - prevTimestamp;

  if (timeDelta <= 0) {
    return [0, 0];
  }

  return [(currentX - prevX) / timeDelta, (currentY - prevY) / timeDelta];
}

/**
 * Stateful processor that transforms pointer events into PanSignal.
 * Can be used imperatively or integrated into custom pipelines.
 *
 * Accepts any signal that satisfies PanSourceSignal interface,
 * allowing integration with various input sources beyond SinglePointer.
 */
export interface PanRecognizer {
  process(signal: PanSourceSignal): PanSignal | null;
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
 * Creates a pan gesture recognizer that processes pointer events.
 *
 * The recognizer maintains internal state and can be used:
 * - Imperatively via process() method
 * - With any event source that satisfies PanSourceSignal interface
 * - In Web Workers or other non-DOM contexts
 *
 * @example
 * ```typescript
 * const recognizer = createPanRecognizer({ threshold: 10 });
 *
 * pointerStream.on((signal) => {
 *   const panEvent = recognizer.process(signal);
 *   if (panEvent) {
 *     console.log(panEvent.value.deltaX, panEvent.value.velocityX);
 *   }
 * });
 * ```
 */
export function createPanRecognizer(options: PanOptions = {}): PanRecognizer {
  const { threshold = DEFAULT_THRESHOLD, direction = "all" } = options;
  const state: PanState = createInitialPanState();

  function createPanSignalFromSource(signal: PanSourceSignal, phase: PanPhase): PanSignal {
    const [x, y] = signal.value.cursor;
    const deltaX = x - state.startX;
    const deltaY = y - state.startY;

    const velocity = calculateVelocity(
      x,
      y,
      signal.createdAt,
      state.prevX,
      state.prevY,
      state.prevTimestamp,
    );

    return createPanSignal({
      phase,
      cursor: [x, y],
      pageCursor: [...signal.value.pageCursor],
      delta: [deltaX, deltaY],
      velocity,
      distance: state.totalDistance,
      direction: getDirection(deltaX, deltaY),
    });
  }

  function handleStart(signal: PanSourceSignal): null {
    const [x, y] = signal.value.cursor;
    state.isActive = true;
    state.thresholdMet = false;
    state.startX = x;
    state.startY = y;
    state.startTimestamp = signal.createdAt;
    state.prevX = x;
    state.prevY = y;
    state.prevTimestamp = signal.createdAt;
    state.totalDistance = 0;
    state.deviceId = signal.deviceId;
    return null;
  }

  function handleMove(signal: PanSourceSignal): PanSignal | null {
    if (!state.isActive) return null;

    const [x, y] = signal.value.cursor;
    const deltaX = x - state.startX;
    const deltaY = y - state.startY;

    const segmentDistance = calculateDistance(state.prevX, state.prevY, x, y);
    state.totalDistance += segmentDistance;

    let result: PanSignal | null = null;

    if (!state.thresholdMet) {
      if (isThresholdMet(deltaX, deltaY, threshold, direction)) {
        state.thresholdMet = true;
        result = createPanSignalFromSource(signal, "start");
      }
    } else {
      result = createPanSignalFromSource(signal, "move");
    }

    state.prevX = x;
    state.prevY = y;
    state.prevTimestamp = signal.createdAt;

    return result;
  }

  function handleEnd(signal: PanSourceSignal): PanSignal | null {
    if (!state.isActive) return null;

    let result: PanSignal | null = null;

    if (state.thresholdMet) {
      result = createPanSignalFromSource(signal, "end");
    }

    resetPanState(state);
    return result;
  }

  function handleCancel(signal: PanSourceSignal): PanSignal | null {
    if (!state.isActive) return null;

    let result: PanSignal | null = null;
    if (state.thresholdMet) {
      result = createPanSignalFromSource(signal, "cancel");
    }

    resetPanState(state);
    return result;
  }

  return {
    process(signal: PanSourceSignal): PanSignal | null {
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
