import type { ExtendSignalValue, SignalWith } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Required value properties for zoom operator input.
 * A signal must have these properties to be used with zoom().
 */
export interface ZoomInput {
  ratio: number;
  phase?: "start" | "move" | "end" | "cancel" | string;
}

/**
 * Configuration options for zoom operator.
 * Note: minScale/maxScale are not enforced by the operator.
 * Consumer is responsible for clamping after accumulating delta.
 */
export type ZoomOptions = {};

/**
 * Values added by zoom() operator.
 */
export interface ZoomValue {
  /**
   * Frame-by-frame scale delta.
   * Consumer should accumulate this value to get absolute scale.
   */
  scale: number;

  /**
   * Same as scale. Provided for backward compatibility.
   * @deprecated Use `scale` instead
   */
  deltaScale: number;
}

/**
 * Converts ratio input to scale delta.
 *
 * Outputs frame-by-frame scale change (delta), not absolute scale.
 * Consumer is responsible for accumulating the scale values.
 *
 * @example
 * ```typescript
 * let scale = 1.0;
 * const MIN_SCALE = 0.5, MAX_SCALE = 3.0;
 *
 * pinch(element)
 *   .pipe(zoom())
 *   .on(signal => {
 *     scale += signal.value.scale;
 *     scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
 *     element.style.transform = `scale(${scale})`;
 *   });
 * ```
 */
export function zoom<T extends SignalWith<ZoomInput>>(
  _options: ZoomOptions = {},
): Operator<T, ExtendSignalValue<T, ZoomValue>> {
  type OutputSignal = ExtendSignalValue<T, ZoomValue>;

  return (source) =>
    createStream<OutputSignal>((observer) => {
      // Track previous ratio to compute frame delta
      let prevRaw: number | null = null;

      const unsub = source.on({
        next(signal) {
          try {
            const { ratio, phase } = signal.value;

            // Use ratio directly as raw scale (no base transformation)
            const rawScale = ratio;

            // Frame delta = current raw - previous raw
            const deltaScale = prevRaw !== null ? rawScale - prevRaw : 0;

            prevRaw = rawScale;

            const value = signal.value as ZoomInput & ZoomValue;
            value.scale = deltaScale;
            value.deltaScale = deltaScale;

            observer.next(signal as unknown as OutputSignal);

            // Reset on session end for next gesture
            if (phase === "end" || phase === "cancel") {
              prevRaw = null;
            }
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          prevRaw = null;
          observer.complete?.();
        },
      });

      return () => {
        prevRaw = null;
        unsub();
      };
    });
}
