import type { ExtendSignalValue, SignalWith } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

/**
 * Required value properties for zoom operator input.
 * A signal must have these properties to be used with zoom().
 */
export interface ZoomInput {
  ratio: number;

  /**
   * Optional phase for session-based zoom (e.g., pinch gestures).
   *
   * When provided:
   * - 'start': Captures baseScale at session start
   * - 'end' or 'cancel': Resets session state for next gesture
   *
   * When not provided, falls back to prevScale-based detection.
   */
  phase?: "start" | "change" | "end" | "cancel" | string;
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
   * Base scale value or a function that returns the current scale.
   *
   * When a function is provided, it is called once at the start of each session
   * (first event after stream creation or after complete). This enables proper
   * synchronization with external state when multiple input sources control zoom.
   *
   * @example
   * ```typescript
   * // Static value (default behavior)
   * zoom({ baseScale: 1.0 })
   *
   * // Dynamic reference to external state
   * zoom({ baseScale: () => zoomManager.getScale() })
   * ```
   *
   * @default 1.0
   */
  baseScale?: number | (() => number);

  /**
   * How ratio is applied to baseScale.
   *
   * - `'multiply'`: scale = baseScale × ratio (default)
   *   Use for pinch gestures where ratio represents a scale factor (1.0 = no change)
   *
   * - `'add'`: scale = baseScale + ratio
   *   Use for delta-based inputs where ratio represents a change amount
   *
   * @example
   * ```typescript
   * // Pinch: ratio is 1.2 means "120% of base" → multiply
   * pinch(el).pipe(zoom({ mode: 'multiply', baseScale: getScale }))
   *
   * // Keyboard: ratio is 0.1 means "+0.1 to base" → add
   * keyboard(el).pipe(
   *   extend(() => ({ ratio: 0.1 })),
   *   zoom({ mode: 'add', baseScale: getScale })
   * )
   * ```
   *
   * @default 'multiply'
   */
  mode?: "multiply" | "add";
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
  const { minScale = 0.1, maxScale = 10.0, baseScale = 1.0, mode = "multiply" } = options;
  const resolveBaseScale = typeof baseScale === "function" ? baseScale : () => baseScale;
  const applyRatio =
    mode === "add"
      ? (base: number, ratio: number) => base + ratio
      : (base: number, ratio: number) => base * ratio;

  type OutputSignal = ExtendSignalValue<T, ZoomValue>;

  return (source) =>
    createStream<OutputSignal>((observer) => {
      let prevScale: number | null = null;
      let sessionBaseScale = 1.0;

      const unsub = source.on({
        next(signal) {
          try {
            const { ratio, phase } = signal.value;

            // Capture baseScale at session start
            // - If phase is provided: capture on 'start'
            // - If phase is not provided: capture on first event (prevScale === null)
            if (phase === "start" || prevScale === null) {
              sessionBaseScale = resolveBaseScale();
              prevScale = sessionBaseScale;
            }

            const rawScale = applyRatio(sessionBaseScale, ratio);
            const scale = clamp(rawScale, minScale, maxScale);
            const deltaScale = scale - prevScale;

            prevScale = scale;

            const value = signal.value as ZoomInput & ZoomValue;
            value.scale = scale;
            value.deltaScale = deltaScale;

            observer.next(signal as unknown as OutputSignal);

            // Reset session on end/cancel for next gesture
            if (phase === "end" || phase === "cancel") {
              prevScale = null;
            }
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          prevScale = null;
          observer.complete?.();
        },
      });

      return () => {
        prevScale = null;
        unsub();
      };
    });
}
