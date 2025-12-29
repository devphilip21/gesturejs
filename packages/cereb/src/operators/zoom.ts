import type { ExtendSignalValue, SignalWith } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Required value properties for zoom operator input.
 * A signal must have these properties to be used with zoom().
 */
export interface ZoomInput {
  ratio: number;
}

export interface ZoomOptions {
  /**
   * Minimum allowed scale value.
   * Scale below this will be clamped.
   * @default 0.1
   */
  minScale?: number;

  /**
   * Maximum allowed scale value.
   * Scale above this will be clamped.
   * @default 10.0
   */
  maxScale?: number;

  /**
   * Base scale multiplier.
   * Applied to calculated scale: finalScale = baseScale * calculatedScale
   * Useful for accumulating zoom across gesture sessions.
   * @default 1.0
   */
  baseScale?: number;
}

/**
 * Zoom values added by zoom() operator.
 */
export interface ZoomValue {
  /** Current scale factor (1.0 = initial, >1 = zoom in, <1 = zoom out) */
  scale: number;

  /** Scale change since last event */
  deltaScale: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Creates an operator that adds scale/zoom calculations to distance-based signals.
 *
 * This operator transforms raw distance data into scale values, handling:
 * - Scale calculation from distance ratio
 * - Min/max scale clamping
 * - Delta scale computation
 * - Scale velocity computation
 *
 * @example
 * ```typescript
 * pipe(
 *   pinch(element),
 *   zoom({ minScale: 0.5, maxScale: 3.0 })
 * ).on(event => {
 *   console.log(event.value.scale);         // 0.5 ~ 3.0
 *   console.log(event.value.scaleVelocity); // scale change per ms
 * });
 * ```
 */
export function zoom<T extends SignalWith<ZoomInput>>(
  options: ZoomOptions = {},
): Operator<T, ExtendSignalValue<T, ZoomValue>> {
  const { minScale = 0.1, maxScale = 10.0, baseScale = 1.0 } = options;

  type OutputSignal = ExtendSignalValue<T, ZoomValue>;

  return (source) =>
    createStream<OutputSignal>((observer) => {
      let prevScale = baseScale;

      const unsub = source.on({
        next(signal) {
          try {
            const { ratio } = signal.value;

            const rawScale = ratio * baseScale;
            const scale = clamp(rawScale, minScale, maxScale);
            const deltaScale = scale - prevScale;

            prevScale = scale;

            const value = signal.value as ZoomInput & ZoomValue;
            value.scale = scale;
            value.deltaScale = deltaScale;

            observer.next(signal as unknown as OutputSignal);
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          prevScale = baseScale;
          observer.complete?.();
        },
      });

      return () => {
        prevScale = baseScale;
        unsub();
      };
    });
}
