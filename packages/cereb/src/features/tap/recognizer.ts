import { calculateDistance } from "./geometry.js";
import { createInitialTapState, resetCurrentTap, resetTapState, type TapState } from "./state.js";
import { createTapSignal, type TapSignal } from "./tap-signal.js";
import type { TapOptions, TapPhase, TapSourceSignal } from "./tap-types.js";

const DEFAULT_MOVEMENT_THRESHOLD = 10;
const DEFAULT_DURATION_THRESHOLD = 500;

/**
 * Stateful processor that transforms pointer events into TapSignal.
 * Supports multi-tap detection (double-tap, triple-tap, etc.)
 *
 * Accepts any signal that satisfies TapSourceSignal interface,
 * allowing integration with various input sources beyond SinglePointer.
 */
export interface TapRecognizer {
  process(signal: TapSourceSignal): TapSignal | null;
  readonly isActive: boolean;
  reset(): void;
  dispose(): void;
}

/**
 * Creates a tap gesture recognizer that processes pointer events.
 *
 * The recognizer maintains internal state and can be used:
 * - Imperatively via process() method
 * - With any event source that satisfies TapSourceSignal interface
 *
 * @example
 * ```typescript
 * const recognizer = createTapRecognizer({ durationThreshold: 300 });
 *
 * pointerStream.on((signal) => {
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
    signal: TapSourceSignal,
    phase: TapPhase,
    tapCount: number,
  ): TapSignal {
    const duration = signal.createdAt - state.startTimestamp;

    return createTapSignal({
      phase,
      cursor: [...state.startCursor] as [number, number],
      pageCursor: [...state.startPageCursor] as [number, number],
      tapCount,
      duration: Math.max(0, duration),
      pointerType: signal.value.pointerType,
    });
  }

  function shouldIncrementTapCount(
    currentCursor: readonly [number, number],
    currentTimestamp: number,
  ): boolean {
    if (state.lastTapEndTimestamp === 0) {
      return false;
    }

    const timeSinceLastTap = currentTimestamp - state.lastTapEndTimestamp;
    if (timeSinceLastTap > chainIntervalThreshold) {
      return false;
    }

    const distance = calculateDistance(
      state.lastTapCursor[0],
      state.lastTapCursor[1],
      currentCursor[0],
      currentCursor[1],
    );
    if (distance > chainMovementThreshold) {
      return false;
    }

    return true;
  }

  function handleStart(signal: TapSourceSignal): TapSignal {
    const { cursor, pageCursor, pointerType } = signal.value;

    const continuesMultiTap = shouldIncrementTapCount(cursor, signal.createdAt);

    state.isActive = true;
    state.startCursor = [cursor[0], cursor[1]];
    state.startPageCursor = [pageCursor[0], pageCursor[1]];
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

  function handleMove(signal: TapSourceSignal): TapSignal | null {
    if (!state.isActive || state.isCancelled) return null;

    const { cursor } = signal.value;

    const movement = calculateDistance(
      state.startCursor[0],
      state.startCursor[1],
      cursor[0],
      cursor[1],
    );
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

  function handleEnd(signal: TapSourceSignal): TapSignal | null {
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
    state.lastTapCursor = [state.startCursor[0], state.startCursor[1]];

    const result = createTapSignalFromState(signal, "end", tapCount);
    resetCurrentTap(state);

    return result;
  }

  function handleCancel(signal: TapSourceSignal): TapSignal | null {
    if (!state.isActive) return null;

    state.lastTapEndTimestamp = 0;
    state.currentTapCount = 0;

    const result = state.isCancelled ? null : createTapSignalFromState(signal, "cancel", 0);

    resetCurrentTap(state);
    return result;
  }

  return {
    process(signal: TapSourceSignal): TapSignal | null {
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
