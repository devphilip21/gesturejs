import type { ExtendSignalValue, SignalWith } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";
import type { Point, Vector } from "../geometry/types.js";

/**
 * Required value properties for translate operator input.
 * Typically provided by pan signals.
 */
export interface TranslateInput {
  delta: Vector;
}

/**
 * Configuration options for translate operator.
 */
export interface TranslateOptions {
  /**
   * Base translation [x, y] or a function that returns the current position.
   * @default [0, 0]
   */
  baseTranslate?: Point | (() => Point);

  /**
   * Sensitivity multiplier applied to delta values.
   * @default 1.0
   */
  sensitivity?: number;
}

/**
 * Values added by translate operator.
 */
export interface TranslateValue {
  /** Current translation position [x, y] */
  translate: Point;
}

/**
 * Creates an operator that converts pan delta to 2D translation coordinates.
 *
 * @example
 * ```typescript
 * pan(element)
 *   .pipe(translate({
 *     baseTranslate: () => getCurrentPosition(),
 *     sensitivity: 1.5,
 *   }))
 *   .on(signal => {
 *     const [x, y] = signal.value.translate;
 *     element.style.transform = `translate(${x}px, ${y}px)`;
 *   });
 * ```
 */
export function translate<T extends SignalWith<TranslateInput>>(
  options: TranslateOptions = {},
): Operator<T, ExtendSignalValue<T, TranslateValue>> {
  const { baseTranslate = [0, 0], sensitivity = 1.0 } = options;
  const resolveBaseTranslate =
    typeof baseTranslate === "function" ? baseTranslate : () => baseTranslate;

  type OutputSignal = ExtendSignalValue<T, TranslateValue>;

  return (source) =>
    createStream<OutputSignal>((observer) => {
      const unsub = source.on({
        next(signal) {
          try {
            const { delta } = signal.value;

            const base = resolveBaseTranslate();
            const baseX = base[0] ?? 0;
            const baseY = base[1] ?? 0;

            const deltaX = delta[0] ?? 0;
            const deltaY = delta[1] ?? 0;

            const x = baseX + deltaX * sensitivity;
            const y = baseY + deltaY * sensitivity;

            const value = signal.value as TranslateInput & TranslateValue;
            value.translate = [x, y];

            observer.next(signal as unknown as OutputSignal);
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });

      return unsub;
    });
}
