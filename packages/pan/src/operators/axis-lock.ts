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
 * @example
 * ```typescript
 * pan(element, { threshold: 10 })
 *   .pipe(axisLock())
 *   .on((signal) => {
 *     const [dx, dy] = signal.value.delta;
 *     // After axis is determined, one of dx/dy will always be 0
 *     element.style.transform = `translate(${dx}px, ${dy}px)`;
 *   });
 * ```
 */
export function axisLock(options: AxisLockOptions = {}): Operator<PanSignal, PanSignal> {
  const { lockThreshold = 0 } = options;

  return (source) =>
    createStream((observer) => {
      let lockedAxis: LockedAxis = null;
      let lockDetermined = false;

      function determineAxis(signal: PanSignal): LockedAxis {
        const [deltaX, deltaY] = signal.value.delta;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX <= lockThreshold && absY <= lockThreshold) {
          return null; // Not enough movement to determine
        }

        return absX > absY ? "horizontal" : "vertical";
      }

      function applyAxisLock(signal: PanSignal): void {
        const [deltaX, deltaY] = signal.value.delta;
        const [vx, vy] = signal.value.velocity;

        if (lockedAxis === "horizontal") {
          signal.value.delta = [deltaX, 0];
          signal.value.velocity = [vx, 0];
          if (signal.value.direction === "up" || signal.value.direction === "down") {
            signal.value.direction = deltaX > 0 ? "right" : deltaX < 0 ? "left" : "none";
          }
        } else if (lockedAxis === "vertical") {
          signal.value.delta = [0, deltaY];
          signal.value.velocity = [0, vy];
          if (signal.value.direction === "left" || signal.value.direction === "right") {
            signal.value.direction = deltaY > 0 ? "down" : deltaY < 0 ? "up" : "none";
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
