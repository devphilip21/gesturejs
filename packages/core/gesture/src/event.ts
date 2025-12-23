import type { Signal } from "@cereb/signal";

export type GesturePhase = "start" | "change" | "end" | "cancel";

/** Symbol to store prevented state internally */
export const PREVENTED = Symbol("gesture.prevented");

/**
 * Base gesture event type that combines Signal with gesture lifecycle properties.
 *
 * @typeParam TType - The gesture type identifier (e.g., "pan", "pinch", "rotate")
 * @typeParam TExtension - Additional properties specific to this gesture type
 *
 * @example
 * ```typescript
 * // Define pan-specific properties
 * interface PanData {
 *   deltaX: number;
 *   deltaY: number;
 * }
 *
 * // Create a typed pan event
 * type PanEvent = GestureEvent<"pan", PanData>;
 * ```
 */
export type GestureEvent<
  TType extends string = string,
  TExtension extends object = object,
> = Signal<TType> & {
  /** Current phase of the gesture lifecycle */
  phase: GesturePhase;

  /** Prevent this gesture event from being processed by downstream operators/subscribers */
  prevent(): void;
} & TExtension;

/**
 * Check if a gesture event has been prevented.
 * Used by operators like excludePrevented().
 */
export function isPrevented(event: GestureEvent): boolean {
  return (event as unknown as Record<symbol, boolean>)[PREVENTED] === true;
}
