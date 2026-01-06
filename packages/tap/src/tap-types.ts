export type TapPhase = "start" | "end" | "cancel";

/**
 * Pointer phase values that TapRecognizer can process.
 * Maps to gesture lifecycle: press → drag → release/cancel.
 */
export type TapSourcePhase = "start" | "move" | "end" | "cancel";

/**
 * Pointer type indicating the input device.
 */
export type TapSourcePointerType = "touch" | "mouse" | "pen" | "unknown";

/**
 * Value interface that TapRecognizer requires from input signals.
 * Any signal whose value satisfies this interface can be processed.
 */
export interface TapSourceValue {
  readonly phase: TapSourcePhase;
  readonly cursor: readonly [number, number];
  readonly pageCursor: readonly [number, number];
  readonly pointerType: TapSourcePointerType;
}

/**
 * Minimal signal interface that TapRecognizer requires.
 * Decoupled from SinglePointerSignal to allow any compatible source.
 */
export interface TapSourceSignal {
  readonly value: TapSourceValue;
  readonly createdAt: number;
  readonly deviceId: string;
}

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
