export type PanPhase = "unknown" | "start" | "move" | "end" | "cancel";

export type PanDirection = "up" | "down" | "left" | "right" | "none";

export type PanDirectionMode = "horizontal" | "vertical" | "all";

/**
 * Pointer phase values that PanRecognizer can process.
 */
export type PanSourcePhase = "start" | "move" | "end" | "cancel";

/**
 * Value interface that PanRecognizer requires from input signals.
 * Any signal whose value satisfies this interface can be processed.
 */
export interface PanSourceValue {
  readonly phase: PanSourcePhase;
  readonly cursor: readonly [number, number];
  readonly pageCursor: readonly [number, number];
}

/**
 * Minimal signal interface that PanRecognizer requires.
 * Decoupled from SinglePointerSignal to allow any compatible source.
 */
export interface PanSourceSignal {
  readonly value: PanSourceValue;
  readonly createdAt: number;
  readonly deviceId: string;
}

export interface PanOptions {
  /**
   * Minimum movement required before pan gesture is recognized.
   * Applied per-axis based on direction mode.
   * @default 10
   */
  threshold?: number;

  /**
   * Direction constraint for threshold calculation.
   * - "horizontal": only X movement counts toward threshold
   * - "vertical": only Y movement counts toward threshold
   * - "all": any movement counts
   * @default "all"
   */
  direction?: PanDirectionMode;
}
