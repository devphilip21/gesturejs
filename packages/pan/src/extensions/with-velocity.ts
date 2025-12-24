import type { Operator } from "cereb";
import { createStream } from "cereb";
import type { PanEvent } from "../event.js";

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
export function withVelocity<T extends {}>(): Operator<
  PanEvent<T>,
  PanEvent<T & VelocityExtension>
> {
  return (source) =>
    createStream((observer) => {
      let prevX = 0;
      let prevY = 0;
      let prevTimestamp = 0;
      let initialized = false;

      const unsub = source.subscribe({
        next(event) {
          if (event.phase === "start") {
            prevX = event.x;
            prevY = event.y;
            prevTimestamp = event.timestamp;
            initialized = true;
          }

          const { velocityX, velocityY } = initialized
            ? calculateVelocity(event.x, event.y, event.timestamp, prevX, prevY, prevTimestamp)
            : { velocityX: 0, velocityY: 0 };

          prevX = event.x;
          prevY = event.y;
          prevTimestamp = event.timestamp;

          if (event.phase === "end" || event.phase === "cancel") {
            initialized = false;
          }

          const extended = event as PanEvent<T & VelocityExtension>;
          extended.velocityX = velocityX;
          extended.velocityY = velocityY;

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
