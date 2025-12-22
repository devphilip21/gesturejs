import type { Operator } from "@gesturejs/stream";
import { createObservable } from "@gesturejs/stream";
import type { PanEvent } from "../event.js";

export type LockedAxis = "horizontal" | "vertical" | null;

export interface AxisLockOptions {
  /**
   * Minimum movement required to determine lock axis.
   * @default 0 (lock on first movement)
   */
  lockThreshold?: number;
}

/**
 * Axis lock operator - locks pan gesture to the initially detected axis.
 * Should be piped after panGesture().
 *
 * After the axis is determined based on initial movement direction,
 * values for the opposite axis are zeroed out.
 *
 * Preserves any extensions (like velocity) added via withVelocity() or other operators.
 *
 * @example
 * ```typescript
 * pipe(
 *   singlePointer(element),
 *   panGesture({ threshold: 10 }),
 *   axisLock()
 * ).subscribe(pan => {
 *   // After axis is determined, one of deltaX/deltaY will always be 0
 *   element.style.transform = `translate(${pan.deltaX}px, ${pan.deltaY}px)`;
 * });
 * ```
 */
export function axisLock<T extends {}>(
  options: AxisLockOptions = {},
): Operator<PanEvent<T>, PanEvent<T>> {
  const { lockThreshold = 0 } = options;

  return (source) =>
    createObservable((observer) => {
      let lockedAxis: LockedAxis = null;
      let lockDetermined = false;

      function determineAxis(event: PanEvent<T>): LockedAxis {
        const absX = Math.abs(event.deltaX);
        const absY = Math.abs(event.deltaY);

        if (absX <= lockThreshold && absY <= lockThreshold) {
          return null; // Not enough movement to determine
        }

        return absX > absY ? "horizontal" : "vertical";
      }

      function applyAxisLock(event: PanEvent<T>): void {
        if (lockedAxis === "horizontal") {
          event.deltaY = 0;
          if ("velocityY" in event) {
            (event as { velocityY: number }).velocityY = 0;
          }
          if (event.direction === "up" || event.direction === "down") {
            event.direction = event.deltaX > 0 ? "right" : event.deltaX < 0 ? "left" : "none";
          }
        } else if (lockedAxis === "vertical") {
          event.deltaX = 0;
          if ("velocityX" in event) {
            (event as { velocityX: number }).velocityX = 0;
          }
          if (event.direction === "left" || event.direction === "right") {
            event.direction = event.deltaY > 0 ? "down" : event.deltaY < 0 ? "up" : "none";
          }
        }
      }

      const unsub = source.subscribe({
        next(event) {
          if (event.phase === "start") {
            lockedAxis = null;
            lockDetermined = false;
          }

          if (!lockDetermined && event.phase !== "cancel") {
            const axis = determineAxis(event);
            if (axis !== null) {
              lockedAxis = axis;
              lockDetermined = true;
            }
          }

          if (lockDetermined) {
            applyAxisLock(event);
          }

          observer.next(event);

          if (event.phase === "end" || event.phase === "cancel") {
            lockedAxis = null;
            lockDetermined = false;
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });

      return () => {
        lockedAxis = null;
        lockDetermined = false;
        unsub();
      };
    });
}
