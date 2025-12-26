import type { Operator } from "cereb";
import { createStream } from "cereb";
import type { PanSignal } from "../pan-signal.js";

/**
 * Extension interface for velocity data.
 * Added to PanEvent when using withVelocity() operator.
 */
export interface VelocityExtension {
  /** X velocity in pixels per millisecond */
  velocityX: number;
  /** Y velocity in pixels per millisecond */
  velocityY: number;
}

function calculateVelocity(
  currentX: number,
  currentY: number,
  currentTimestamp: number,
  prevX: number,
  prevY: number,
  prevTimestamp: number,
): { velocityX: number; velocityY: number } {
  const timeDelta = currentTimestamp - prevTimestamp;

  if (timeDelta <= 0) {
    return { velocityX: 0, velocityY: 0 };
  }

  const dx = currentX - prevX;
  const dy = currentY - prevY;

  return {
    velocityX: dx / timeDelta,
    velocityY: dy / timeDelta,
  };
}

/**
 * Augmentation operator that adds velocity calculation to pan events.
 *
 * Transforms PanEvent<T> to PanEvent<T & VelocityExtension>, adding
 * velocityX and velocityY properties to each event.
 *
 * @example
 * ```typescript
 * pipe(
 *   singlePointer(element),
 *   singlePointerToPan({ threshold: 10 }),
 *   withVelocity()
 * ).subscribe(event => {
 *   console.log(event.deltaX, event.velocityX);
 * });
 * ```
 */
export function withVelocity(): Operator<PanSignal, PanSignal> {
  return (source) =>
    createStream((observer) => {
      let prevX = 0;
      let prevY = 0;
      let prevTimestamp = 0;
      let initialized = false;

      const unsub = source.subscribe({
        next(signal) {
          if (signal.value.phase === "start") {
            prevX = signal.value.x;
            prevY = signal.value.y;
            prevTimestamp = signal.createdAt;
            initialized = true;
          }

          const { velocityX, velocityY } = initialized
            ? calculateVelocity(
                signal.value.x,
                signal.value.y,
                signal.createdAt,
                prevX,
                prevY,
                prevTimestamp,
              )
            : { velocityX: 0, velocityY: 0 };

          prevX = signal.value.x;
          prevY = signal.value.y;
          prevTimestamp = signal.createdAt;

          if (signal.value.phase === "end" || signal.value.phase === "cancel") {
            initialized = false;
          }

          const extended = signal as PanSignal<VelocityExtension>;
          extended.value.velocityX = velocityX;
          extended.value.velocityY = velocityY;

          observer.next(extended);
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });

      return () => {
        initialized = false;
        unsub();
      };
    });
}
