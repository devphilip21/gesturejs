import type { Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";
import type { PanDirection } from "../features/pan/pan-types.js";

export type LockedAxis = "horizontal" | "vertical" | null;

export interface AxisLockOptions {
  /**
   * Minimum movement required to determine lock axis.
   * @default 0 (lock on first movement)
   */
  lockThreshold?: number;
}

interface AxisLockableValue {
  phase: "start" | "move" | "end" | "cancel";
  delta: [number, number];
  velocity: [number, number];
  direction: PanDirection;
}

function isAxisLockable(value: unknown): value is AxisLockableValue {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.phase === "string" &&
    Array.isArray(v.delta) &&
    v.delta.length === 2 &&
    Array.isArray(v.velocity) &&
    v.velocity.length === 2 &&
    typeof v.direction === "string"
  );
}

/**
 * Axis lock operator - locks gesture to the initially detected axis.
 *
 * Works with any signal that has delta, velocity, direction, and phase properties.
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
export function axisLock<T extends Signal>(options: AxisLockOptions = {}): Operator<T, T> {
  const { lockThreshold = 0 } = options;

  return (source) =>
    createStream((observer) => {
      let lockedAxis: LockedAxis = null;
      let lockDetermined = false;

      function determineAxis(delta: [number, number]): LockedAxis {
        const [deltaX, deltaY] = delta;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX <= lockThreshold && absY <= lockThreshold) {
          return null;
        }

        return absX > absY ? "horizontal" : "vertical";
      }

      function applyAxisLock(value: AxisLockableValue): void {
        const [deltaX, deltaY] = value.delta;
        const [vx, vy] = value.velocity;

        if (lockedAxis === "horizontal") {
          value.delta = [deltaX, 0];
          value.velocity = [vx, 0];
          if (value.direction === "up" || value.direction === "down") {
            value.direction = deltaX > 0 ? "right" : deltaX < 0 ? "left" : "none";
          }
        } else if (lockedAxis === "vertical") {
          value.delta = [0, deltaY];
          value.velocity = [0, vy];
          if (value.direction === "left" || value.direction === "right") {
            value.direction = deltaY > 0 ? "down" : deltaY < 0 ? "up" : "none";
          }
        }
      }

      const unsub = source.on({
        next(signal) {
          if (!isAxisLockable(signal.value)) {
            observer.next(signal);
            return;
          }

          const value = signal.value;

          if (value.phase === "start") {
            lockedAxis = null;
            lockDetermined = false;
          }

          if (!lockDetermined && value.phase !== "cancel") {
            const axis = determineAxis(value.delta);
            if (axis !== null) {
              lockedAxis = axis;
              lockDetermined = true;
            }
          }

          if (lockDetermined) {
            applyAxisLock(value);
          }

          observer.next(signal);

          if (value.phase === "end" || value.phase === "cancel") {
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
