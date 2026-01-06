import { getCenter, getPageCenter, getPointerDistance } from "./geometry.js";
import { createPinchSignal, type PinchSignal } from "./pinch-signal.js";
import type {
  PinchOptions,
  PinchPhase,
  PinchSourcePointer,
  PinchSourceSignal,
} from "./pinch-types.js";
import { createInitialPinchState, type PinchState, resetPinchState } from "./state.js";

const DEFAULT_THRESHOLD = 0;
const MIN_INITIAL_DISTANCE = 1;

/**
 * Stateful processor that transforms multi-pointer signals into PinchSignal.
 * Can be used imperatively or integrated into custom pipelines.
 *
 * Accepts any signal that satisfies PinchSourceSignal interface,
 * allowing integration with various input sources beyond MultiPointer.
 */
export interface PinchRecognizer {
  process(signal: PinchSourceSignal): PinchSignal | null;
  readonly isActive: boolean;
  readonly thresholdMet: boolean;
  reset(): void;
  dispose(): void;
}

function isThresholdMet(
  currentDistance: number,
  initialDistance: number,
  threshold: number,
): boolean {
  const distanceChange = Math.abs(currentDistance - initialDistance);
  return distanceChange >= threshold;
}

function findTrackedPointers(
  pointers: readonly PinchSourcePointer[],
  id1: string,
  id2: string,
): [PinchSourcePointer, PinchSourcePointer] | null {
  const p1 = pointers.find((p) => p.id === id1);
  const p2 = pointers.find((p) => p.id === id2);
  if (!p1 || !p2) return null;
  return [p1, p2];
}

function hasTrackedPointerEnded(
  pointers: readonly PinchSourcePointer[],
  id1: string,
  id2: string,
): { ended: boolean; cancelled: boolean } {
  for (const p of pointers) {
    if (p.id === id1 || p.id === id2) {
      if (p.phase === "cancel") {
        return { ended: true, cancelled: true };
      }
      if (p.phase === "end") {
        return { ended: true, cancelled: false };
      }
    }
  }
  return { ended: false, cancelled: false };
}

function calculateVelocity(
  currentDistance: number,
  prevDistance: number,
  currentTimestamp: number,
  prevTimestamp: number,
): number {
  const timeDelta = currentTimestamp - prevTimestamp;
  if (timeDelta <= 0) {
    return 0;
  }
  return (currentDistance - prevDistance) / timeDelta;
}

/**
 * Creates a pinch gesture recognizer that processes multi-pointer signals.
 *
 * The recognizer maintains internal state and can be used:
 * - Imperatively via process() method
 * - With any event source that satisfies PinchSourceSignal interface
 * - In Web Workers or other non-DOM contexts
 *
 * @example
 * ```typescript
 * const recognizer = createPinchRecognizer({ threshold: 10 });
 *
 * multiPointerStream.on((signal) => {
 *   const pinchEvent = recognizer.process(signal);
 *   if (pinchEvent) {
 *     console.log(pinchEvent.value.distance, pinchEvent.value.velocity);
 *   }
 * });
 * ```
 */
export function createPinchRecognizer(options: PinchOptions = {}): PinchRecognizer {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;

  const state: PinchState = createInitialPinchState();

  function createPinchSignalFromPointers(
    p1: PinchSourcePointer,
    p2: PinchSourcePointer,
    phase: PinchPhase,
    timestamp: number,
  ): PinchSignal {
    const distance = getPointerDistance(p1, p2);
    const deltaDistance = distance - state.prevDistance;
    const velocity = calculateVelocity(
      distance,
      state.prevDistance,
      timestamp,
      state.prevTimestamp,
    );
    const center = getCenter(p1, p2);
    const pageCenter = getPageCenter(p1, p2);

    state.prevDistance = distance;
    state.prevTimestamp = timestamp;

    return createPinchSignal({
      phase,
      initialDistance: state.initialDistance,
      distance,
      ratio: distance / state.initialDistance,
      deltaDistance,
      velocity,
      center,
      pageCenter,
    });
  }

  function handleSessionStart(
    signal: PinchSourceSignal,
    p1: PinchSourcePointer,
    p2: PinchSourcePointer,
  ): null {
    const distance = getPointerDistance(p1, p2);
    const initialDistance = Math.max(distance, MIN_INITIAL_DISTANCE);

    state.isActive = true;
    state.thresholdMet = false;
    state.pointer1Id = p1.id;
    state.pointer2Id = p2.id;
    state.initialDistance = initialDistance;
    state.prevDistance = initialDistance;
    state.startTimestamp = signal.createdAt;
    state.prevTimestamp = signal.createdAt;
    state.deviceId = signal.deviceId;

    return null;
  }

  function handleMove(
    signal: PinchSourceSignal,
    p1: PinchSourcePointer,
    p2: PinchSourcePointer,
  ): PinchSignal | null {
    if (!state.isActive) return null;

    const currentDistance = getPointerDistance(p1, p2);

    if (!state.thresholdMet) {
      if (isThresholdMet(currentDistance, state.initialDistance, threshold)) {
        state.thresholdMet = true;
        return createPinchSignalFromPointers(p1, p2, "start", signal.createdAt);
      }
      return null;
    }

    return createPinchSignalFromPointers(p1, p2, "change", signal.createdAt);
  }

  function handleEnd(
    signal: PinchSourceSignal,
    p1: PinchSourcePointer,
    p2: PinchSourcePointer,
    isCancelled: boolean,
  ): PinchSignal | null {
    if (!state.isActive) return null;

    let result: PinchSignal | null = null;
    if (state.thresholdMet) {
      result = createPinchSignalFromPointers(
        p1,
        p2,
        isCancelled ? "cancel" : "end",
        signal.createdAt,
      );
    }

    resetPinchState(state);
    return result;
  }

  return {
    process(signal: PinchSourceSignal): PinchSignal | null {
      const pointers = signal.value.pointers;

      const workingPointers = pointers.filter((p) => p.phase === "start" || p.phase === "move");

      if (!state.isActive && workingPointers.length >= 2) {
        return handleSessionStart(signal, workingPointers[0], workingPointers[1]);
      }

      if (!state.isActive) {
        return null;
      }

      const tracked = findTrackedPointers(pointers, state.pointer1Id, state.pointer2Id);
      if (!tracked) {
        resetPinchState(state);
        return null;
      }

      const [p1, p2] = tracked;

      const { ended, cancelled } = hasTrackedPointerEnded(
        pointers,
        state.pointer1Id,
        state.pointer2Id,
      );
      if (ended) {
        return handleEnd(signal, p1, p2, cancelled);
      }

      return handleMove(signal, p1, p2);
    },

    get isActive(): boolean {
      return state.isActive;
    },

    get thresholdMet(): boolean {
      return state.thresholdMet;
    },

    reset(): void {
      resetPinchState(state);
    },

    dispose(): void {
      resetPinchState(state);
    },
  };
}
