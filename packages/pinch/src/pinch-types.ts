export type PinchPhase = "unknown" | "start" | "change" | "end" | "cancel";

/**
 * Pointer phase values that PinchRecognizer can process.
 */
export type PinchSourcePhase = "start" | "move" | "end" | "cancel";

/**
 * Pointer info interface that PinchRecognizer requires.
 * Represents a single pointer in a multi-pointer signal.
 */
export interface PinchSourcePointer {
  readonly id: string;
  readonly phase: PinchSourcePhase;
  readonly cursor: readonly [number, number];
  readonly pageCursor: readonly [number, number];
}

/**
 * Value interface that PinchRecognizer requires from input signals.
 * Any signal whose value satisfies this interface can be processed.
 */
export interface PinchSourceValue {
  readonly pointers: readonly PinchSourcePointer[];
}

/**
 * Minimal signal interface that PinchRecognizer requires.
 * Decoupled from MultiPointerSignal to allow any compatible source.
 */
export interface PinchSourceSignal {
  readonly value: PinchSourceValue;
  readonly createdAt: number;
  readonly deviceId: string;
}

export interface PinchOptions {
  /**
   * Minimum distance change (in pixels) required before pinch gesture is recognized.
   * @default 0
   */
  threshold?: number;
}
