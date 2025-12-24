/**
 * Internal state for pan gesture tracking.
 * Managed via closure within the pan operator.
 */
export interface PanState {
  /** Whether gesture is currently active */
  isActive: boolean;
  /** Whether threshold has been met */
  thresholdMet: boolean;

  /** Start position X (set on pointer start) */
  startX: number;
  /** Start position Y */
  startY: number;
  /** Start timestamp */
  startTimestamp: number;

  /** Previous position X (for velocity calculation) */
  prevX: number;
  /** Previous position Y */
  prevY: number;
  /** Previous timestamp */
  prevTimestamp: number;

  /** Cumulative distance traveled */
  totalDistance: number;

  /** Device identifier */
  deviceId: string;
}

export function createInitialPanState(): PanState {
  return {
    isActive: false,
    thresholdMet: false,
    startX: 0,
    startY: 0,
    startTimestamp: 0,
    prevX: 0,
    prevY: 0,
    prevTimestamp: 0,
    totalDistance: 0,
    deviceId: "",
  };
}

export function resetPanState(state: PanState): void {
  state.isActive = false;
  state.thresholdMet = false;
  state.startX = 0;
  state.startY = 0;
  state.startTimestamp = 0;
  state.prevX = 0;
  state.prevY = 0;
  state.prevTimestamp = 0;
  state.totalDistance = 0;
  state.deviceId = "";
}
