/**
 * Internal state for pinch gesture tracking.
 * Managed via closure within the pinch emitter.
 */
export interface PinchState {
  /** Whether gesture is currently active (2 pointers working) */
  isActive: boolean;

  /** Whether threshold has been met */
  thresholdMet: boolean;

  /** Distance between pointers at gesture start */
  initialDistance: number;

  /** Previous distance value */
  prevDistance: number;

  /** First tracked pointer ID */
  pointer1Id: string;

  /** Second tracked pointer ID */
  pointer2Id: string;

  /** Start timestamp */
  startTimestamp: number;

  /** Previous timestamp (for velocity calculation) */
  prevTimestamp: number;

  /** Device identifier */
  deviceId: string;
}

export function createInitialPinchState(): PinchState {
  return {
    isActive: false,
    thresholdMet: false,
    initialDistance: 0,
    prevDistance: 0,
    pointer1Id: "",
    pointer2Id: "",
    startTimestamp: 0,
    prevTimestamp: 0,
    deviceId: "",
  };
}

export function resetPinchState(state: PinchState): void {
  state.isActive = false;
  state.thresholdMet = false;
  state.initialDistance = 0;
  state.prevDistance = 0;
  state.pointer1Id = "";
  state.pointer2Id = "";
  state.startTimestamp = 0;
  state.prevTimestamp = 0;
  state.deviceId = "";
}
