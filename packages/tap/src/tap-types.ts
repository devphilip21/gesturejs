export type TapPhase = "start" | "end" | "cancel";

export interface TapOptions {
  /** Max movement allowed during tap (default: 10px) */
  movementThreshold?: number;

  /** Max duration for a valid tap (default: 500ms) */
  durationThreshold?: number;

  /** Max distance between consecutive taps (default: movementThreshold) */
  chainMovementThreshold?: number;

  /** Max interval between consecutive taps (default: durationThreshold / 2) */
  chainIntervalThreshold?: number;
}
