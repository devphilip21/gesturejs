import type { ExtendSignalValue, SignalWith } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";
import type { Vector } from "../geometry/types.js";

/**
 * Required value properties for rotate3d operator input.
 * Typically provided by pan signals.
 */
export interface Rotate3DInput {
  delta: Vector;
  phase?: "start" | "move" | "end" | "cancel" | string;
}

/**
 * Configuration options for rotate3d operator.
 */
export interface Rotate3DOptions {
  /**
   * Sensitivity multiplier for X-axis rotation (from vertical pan movement).
   * 1.0 = default sensitivity (~0.5° per pixel)
   * @default 1.0
   */
  sensitivityX?: number;

  /**
   * Sensitivity multiplier for Y-axis rotation (from horizontal pan movement).
   * 1.0 = default sensitivity (~0.5° per pixel)
   * @default 1.0
   */
  sensitivityY?: number;

  /**
   * Invert X-axis rotation direction.
   * @default false
   */
  invertX?: boolean;

  /**
   * Invert Y-axis rotation direction.
   * @default false
   */
  invertY?: boolean;
}

/**
 * Values added by rotate3d operator.
 */
export interface Rotate3DValue {
  /**
   * Frame-by-frame rotation delta in radians [deltaRx, deltaRy, deltaRz].
   * Consumer should accumulate this value to get absolute rotation.
   */
  rotation: Vector;

  /**
   * Same as rotation. Provided for backward compatibility.
   * @deprecated Use `rotation` instead
   */
  deltaRotation: Vector;
}

/**
 * Converts pan delta to 3D rotation delta.
 *
 * Outputs frame-by-frame rotation change (delta), not absolute rotation.
 * Consumer is responsible for accumulating the rotation values.
 *
 * Maps 2D pan movement to 3D rotation:
 * - Horizontal pan (deltaX) -> Y-axis rotation (yaw)
 * - Vertical pan (deltaY) -> X-axis rotation (pitch)
 *
 * @example
 * ```typescript
 * let rotation = [0, 0, 0];
 *
 * pan(element)
 *   .pipe(rotate3d({ sensitivityX: 1.0 }))
 *   .on(signal => {
 *     const [drx, dry, drz] = signal.value.rotation;
 *     rotation[0] += drx;
 *     rotation[1] += dry;
 *     rotation[2] += drz;
 *     element.style.transform = `rotateX(${rotation[0]}rad) rotateY(${rotation[1]}rad)`;
 *   });
 * ```
 */
export function rotate3d<T extends SignalWith<Rotate3DInput>>(
  options: Rotate3DOptions = {},
): Operator<T, ExtendSignalValue<T, Rotate3DValue>> {
  const { sensitivityX = 1.0, sensitivityY = 1.0, invertX = false, invertY = false } = options;

  // Base rate: ~0.5° per pixel (π/360 ≈ 0.00873 rad/px)
  const BASE_SENSITIVITY = Math.PI / 360;

  const xRate = BASE_SENSITIVITY * sensitivityX * (invertX ? -1 : 1);
  const yRate = BASE_SENSITIVITY * sensitivityY * (invertY ? -1 : 1);

  type OutputSignal = ExtendSignalValue<T, Rotate3DValue>;

  return (source) =>
    createStream<OutputSignal>((observer) => {
      // Track previous cumulative rotation to compute frame delta
      let prevRaw: Vector | null = null;

      const unsub = source.on({
        next(signal) {
          try {
            const { delta, phase } = signal.value;

            const deltaX = delta[0] ?? 0;
            const deltaY = delta[1] ?? 0;

            // Compute raw rotation from cumulative pan delta (no base)
            const rawRx = deltaY * xRate;
            const rawRy = deltaX * yRate;
            const rawRz = 0;

            // Frame delta = current raw - previous raw
            const rotation: Vector = prevRaw
              ? [rawRx - prevRaw[0], rawRy - prevRaw[1], rawRz - prevRaw[2]]
              : [rawRx, rawRy, rawRz];

            prevRaw = [rawRx, rawRy, rawRz];

            const value = signal.value as Rotate3DInput & Rotate3DValue;
            value.rotation = rotation;
            value.deltaRotation = rotation;

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
