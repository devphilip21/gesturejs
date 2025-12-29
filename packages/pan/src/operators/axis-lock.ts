import type { Operator } from "cereb";
import { createStream } from "cereb";
import type { PanSignal } from "../pan-signal.js";

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
 * Should be piped after pan().
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
 *   singlePointerToPan({ threshold: 10 }),
 *   axisLock()
 * ).on(event => {
 *   // After axis is determined, one of deltaX/deltaY will always be 0
 *   element.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px)`;
 * });
 * ```
 */
export function axisLock(options: AxisLockOptions = {}): Operator<PanSignal, PanSignal> {
  const { lockThreshold = 0 } = options;

  return (source) =>
    createStream((observer) => {
      let lockedAxis: LockedAxis = null;
      let lockDetermined = false;

      function determineAxis(signal: PanSignal): LockedAxis {
        const absX = Math.abs(signal.value.deltaX);
        const absY = Math.abs(signal.value.deltaY);

        if (absX <= lockThreshold && absY <= lockThreshold) {
          return null; // Not enough movement to determine
        }

        return absX > absY ? "horizontal" : "vertical";
      }

      function applyAxisLock(signal: PanSignal): void {
        if (lockedAxis === "horizontal") {
          signal.value.deltaY = 0;
          if ("velocityY" in signal.value) {
            (signal.value as { velocityY: number }).velocityY = 0;
          }
          if (signal.value.direction === "up" || signal.value.direction === "down") {
            signal.value.direction =
              signal.value.deltaX > 0 ? "right" : signal.value.deltaX < 0 ? "left" : "none";
          }
        } else if (lockedAxis === "vertical") {
          signal.value.deltaX = 0;
          if ("velocityX" in signal.value) {
            (signal.value as { velocityX: number }).velocityX = 0;
          }
          if (signal.value.direction === "left" || signal.value.direction === "right") {
            signal.value.direction =
              signal.value.deltaY > 0 ? "down" : signal.value.deltaY < 0 ? "up" : "none";
          }
        }
      }

      const unsub = source.on({
        next(signal) {
          if (signal.value.phase === "start") {
            lockedAxis = null;
            lockDetermined = false;
          }

          if (!lockDetermined && signal.value.phase !== "cancel") {
            const axis = determineAxis(signal);
            if (axis !== null) {
              lockedAxis = axis;
              lockDetermined = true;
            }
          }

          if (lockDetermined) {
            applyAxisLock(signal);
          }

          observer.next(signal);

          if (signal.value.phase === "end" || signal.value.phase === "cancel") {
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
