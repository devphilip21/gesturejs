/**
 * Internal state for tap gesture tracking.
 * Tracks both current tap attempt and history for multi-tap detection.
 */
export interface TapState {
  /** Whether a tap attempt is currently in progress */
  isActive: boolean;

  /** Start position X */
  startX: number;
  /** Start position Y */
  startY: number;
  /** Page coordinates at start */
  startPageX: number;
  startPageY: number;
  /** Timestamp when tap started */
  startTimestamp: number;
  /** Device identifier */
  deviceId: string;
  /** Pointer type (touch, mouse, pen) */
  pointerType: string;

  /** Timestamp of last successful tap end */
  lastTapEndTimestamp: number;
  /** Position of last successful tap */
  lastTapX: number;
  lastTapY: number;
  /** Current consecutive tap count */
  currentTapCount: number;

  /** Whether current tap attempt has been cancelled due to movement/duration */
  isCancelled: boolean;
}

export function createInitialTapState(): TapState {
  return {
    isActive: false,
    startX: 0,
    startY: 0,
    startPageX: 0,
    startPageY: 0,
    startTimestamp: 0,
    deviceId: "",
    pointerType: "unknown",
    lastTapEndTimestamp: 0,
    lastTapX: 0,
    lastTapY: 0,
    currentTapCount: 0,
    isCancelled: false,
  };
}

export function resetCurrentTap(state: TapState): void {
  state.isActive = false;
  state.startX = 0;
  state.startY = 0;
  state.startPageX = 0;
  state.startPageY = 0;
  state.startTimestamp = 0;
  state.deviceId = "";
  state.pointerType = "unknown";
  state.isCancelled = false;
}

export function resetTapState(state: TapState): void {
  resetCurrentTap(state);
  state.lastTapEndTimestamp = 0;
  state.lastTapX = 0;
  state.lastTapY = 0;
  state.currentTapCount = 0;
}
