import type { SinglePointerSignal } from "cereb";
import { calculateDistance } from "./geometry.js";
import { createInitialTapState, resetCurrentTap, resetTapState, type TapState } from "./state.js";
import { createTapSignal, type TapSignal } from "./tap-signal.js";
import type { TapOptions, TapPhase } from "./tap-types.js";

const DEFAULT_MOVEMENT_THRESHOLD = 10;
const DEFAULT_DURATION_THRESHOLD = 500;

/**
 * Stateful processor that transforms SinglePointer events into TapSignal.
 * Supports multi-tap detection (double-tap, triple-tap, etc.)
 */
export interface TapRecognizer {
  process(pointer: SinglePointerSignal): TapSignal | null;
  readonly isActive: boolean;
  reset(): void;
  dispose(): void;
}

/**
 * Creates a tap gesture recognizer that processes SinglePointer events.
 *
 * The recognizer maintains internal state and can be used:
 * - Imperatively via process() method
 * - With any event source (not just Observable streams)
 *
 * @example
 * ```typescript
 * const recognizer = createTapRecognizer({ durationThreshold: 300 });
 *
 * singlePointerStream.on((signal) => {
 *   const tapEvent = recognizer.process(signal);
 *   if (tapEvent?.value.phase === "end") {
 *     console.log(`Tap ${tapEvent.value.tapCount}!`);
 *   }
 * });
 * ```
 */
export function createTapRecognizer(options: TapOptions = {}): TapRecognizer {
  const {
    movementThreshold = DEFAULT_MOVEMENT_THRESHOLD,
    durationThreshold = DEFAULT_DURATION_THRESHOLD,
  } = options;

  const chainMovementThreshold = options.chainMovementThreshold ?? movementThreshold;
  const chainIntervalThreshold = options.chainIntervalThreshold ?? durationThreshold / 2;

  const state: TapState = createInitialTapState();

  function createTapSignalFromState(
    pointerSignal: SinglePointerSignal,
    phase: TapPhase,
    tapCount: number,
  ): TapSignal {
    const duration = pointerSignal.createdAt - state.startTimestamp;

    return createTapSignal({
      phase,
      x: state.startX,
      y: state.startY,
      pageX: state.startPageX,
      pageY: state.startPageY,
      tapCount,
      duration: Math.max(0, duration),
      pointerType: pointerSignal.value.pointerType,
    });
  }

  function shouldIncrementTapCount(
    currentX: number,
    currentY: number,
    currentTimestamp: number,
  ): boolean {
    if (state.lastTapEndTimestamp === 0) {
      return false;
    }

    const timeSinceLastTap = currentTimestamp - state.lastTapEndTimestamp;
    if (timeSinceLastTap > chainIntervalThreshold) {
      return false;
    }

    const distance = calculateDistance(state.lastTapX, state.lastTapY, currentX, currentY);
    if (distance > chainMovementThreshold) {
      return false;
    }

    return true;
  }

  function handleStart(signal: SinglePointerSignal): TapSignal {
    const { x, y, pageX, pageY, pointerType } = signal.value;

    const continuesMultiTap = shouldIncrementTapCount(x, y, signal.createdAt);

    state.isActive = true;
    state.startX = x;
    state.startY = y;
    state.startPageX = pageX;
    state.startPageY = pageY;
    state.startTimestamp = signal.createdAt;
    state.deviceId = signal.deviceId;
    state.pointerType = pointerType;
    state.isCancelled = false;

    if (continuesMultiTap) {
      state.currentTapCount += 1;
    } else {
      state.currentTapCount = 1;
    }

    return createTapSignalFromState(signal, "start", state.currentTapCount);
  }

  function handleMove(signal: SinglePointerSignal): TapSignal | null {
    if (!state.isActive || state.isCancelled) return null;

    const { x, y } = signal.value;

    const movement = calculateDistance(state.startX, state.startY, x, y);
    if (movement > movementThreshold) {
      state.isCancelled = true;
      state.lastTapEndTimestamp = 0;
      state.currentTapCount = 0;
      return createTapSignalFromState(signal, "cancel", 0);
    }

    const duration = signal.createdAt - state.startTimestamp;
    if (duration > durationThreshold) {
      state.isCancelled = true;
      state.lastTapEndTimestamp = 0;
      state.currentTapCount = 0;
      return createTapSignalFromState(signal, "cancel", 0);
    }

    return null;
  }

  function handleEnd(signal: SinglePointerSignal): TapSignal | null {
    if (!state.isActive) return null;

    if (state.isCancelled) {
      resetCurrentTap(state);
      return null;
    }

    const duration = signal.createdAt - state.startTimestamp;
    if (duration > durationThreshold) {
      state.lastTapEndTimestamp = 0;
      state.currentTapCount = 0;
      const result = createTapSignalFromState(signal, "cancel", 0);
      resetCurrentTap(state);
      return result;
    }

    const tapCount = state.currentTapCount;
    state.lastTapEndTimestamp = signal.createdAt;
    state.lastTapX = state.startX;
    state.lastTapY = state.startY;

    const result = createTapSignalFromState(signal, "end", tapCount);
    resetCurrentTap(state);

    return result;
  }

  function handleCancel(signal: SinglePointerSignal): TapSignal | null {
    if (!state.isActive) return null;

    state.lastTapEndTimestamp = 0;
    state.currentTapCount = 0;

    const result = state.isCancelled ? null : createTapSignalFromState(signal, "cancel", 0);

    resetCurrentTap(state);
    return result;
  }

  return {
    process(signal: SinglePointerSignal): TapSignal | null {
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

    reset(): void {
      resetTapState(state);
    },

    dispose(): void {
      resetTapState(state);
    },
  };
}
