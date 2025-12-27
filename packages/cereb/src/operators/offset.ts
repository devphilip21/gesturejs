import type { ExtendSignalValue, Signal, SignalWith } from "../core/signal.js";
import type { Operator, Stream } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export interface OffsetOptions {
  target: Element;
  /**
   * Optional stream that triggers rect recalculation.
   * When provided, the operator caches the rect and only recalculates when this stream emits.
   * When not provided, getBoundingClientRect() is called on every signal (always accurate).
   *
   * @example
   * // Cache rect, recalculate on window resize
   * const resize$ = domEvent(window, 'resize');
   * offset({ target: el, recalculate$: resize$ })
   *
   * @example
   * // Always calculate (no caching, always accurate)
   * offset({ target: el })
   */
  recalculate$?: Stream<Signal>;
}

export interface PointerValue {
  x: number;
  y: number;
}

export interface OffsetValue {
  offsetX: number;
  offsetY: number;
}

export type OffsetOperatorResult<T extends SignalWith<PointerValue>> = ExtendSignalValue<
  T,
  OffsetValue
>;

/**
 * Creates an operator that adds element-relative offset coordinates to pointer signals.
 * Uses getBoundingClientRect() to calculate offsetX and offsetY relative to the target element.
 *
 * @param options.target - The element to calculate offset relative to
 * @param options.recalculate$ - Optional stream that triggers rect recalculation for caching
 */
export function offset<T extends SignalWith<PointerValue>>(
  options: OffsetOptions,
): Operator<T, ExtendSignalValue<T, OffsetValue>> {
  const { target, recalculate$ } = options;
  if (!target) {
    throw new Error("offset operator requires a valid target element");
  }

  type OutputSignal = ExtendSignalValue<T, OffsetValue>;

  return (source) =>
    createStream<OutputSignal>((observer) => {
      let cachedRect: DOMRect | null = null;

      function getRect(): DOMRect {
        // If recalculate$ is provided, use caching
        if (recalculate$) {
          if (!cachedRect) {
            cachedRect = target.getBoundingClientRect();
          }
          return cachedRect;
        }
        // No recalculate$ means always calculate fresh
        return target.getBoundingClientRect();
      }

      // Subscribe to recalculate$ if provided
      let recalculateUnsub: (() => void) | undefined;
      if (recalculate$) {
        recalculateUnsub = recalculate$.subscribe({
          next() {
            cachedRect = target.getBoundingClientRect();
          },
        });
      }

      const unsub = source.subscribe({
        next(signal) {
          try {
            const rect = getRect();
            const value = signal.value as PointerValue & OffsetValue;

            value.offsetX = value.x - rect.left;
            value.offsetY = value.y - rect.top;

            observer.next(signal as unknown as OutputSignal);
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          observer.complete?.();
        },
      });

      return () => {
        unsub();
        recalculateUnsub?.();
      };
    });
}
