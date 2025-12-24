export type PanPhase = "unknown" | "start" | "move" | "end" | "cancel";

export type PanDirection = "up" | "down" | "left" | "right" | "none";

export type PanDirectionMode = "horizontal" | "vertical" | "all";

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

  /**
   * Enable object pooling for PanEvent objects.
   * @default false
   */
  pooling?: boolean;
}
