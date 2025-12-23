import { createSignalPool, type SignalPool } from "@cereb/signal";
import type { GestureEvent } from "./event.js";

/**
 * Create a pool for gesture events.
 * Wraps createSignalPool from @cereb/signal.
 */
export function createGestureEventPool<T extends GestureEvent>(
  factory: () => T,
  reset: (obj: T) => void,
  initialSize = 20,
  maxSize = 100,
): SignalPool<T> {
  return createSignalPool<T>(factory, reset, initialSize, maxSize);
}
