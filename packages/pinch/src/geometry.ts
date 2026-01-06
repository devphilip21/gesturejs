import type { Point } from "cereb/geometry";
import type { PinchSourcePointer } from "./pinch-types.js";

/**
 * Calculate Euclidean distance between two points.
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance between two pointers.
 */
export function getPointerDistance(p1: PinchSourcePointer, p2: PinchSourcePointer): number {
  return calculateDistance(p1.cursor[0], p1.cursor[1], p2.cursor[0], p2.cursor[1]);
}

/**
 * Calculate center point between two pointers (client coordinates).
 */
export function getCenter(p1: PinchSourcePointer, p2: PinchSourcePointer): Point {
  return [(p1.cursor[0] + p2.cursor[0]) / 2, (p1.cursor[1] + p2.cursor[1]) / 2];
}

/**
 * Calculate center point between two pointers (page coordinates).
 */
export function getPageCenter(p1: PinchSourcePointer, p2: PinchSourcePointer): Point {
  return [(p1.pageCursor[0] + p2.pageCursor[0]) / 2, (p1.pageCursor[1] + p2.pageCursor[1]) / 2];
}

/**
 * Clamp a value between min and max bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
