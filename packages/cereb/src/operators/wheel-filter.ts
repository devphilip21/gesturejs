import type { WheelSignal } from "../browser/wheel/wheel-signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";
import type { ModifierKey } from "./keyboard-filter.js";

export interface WheelFilterOptions {
  /**
   * Filter by modifier keys. Uses OR logic (matches if any is pressed).
   * @example ['meta', 'ctrl'] - matches if metaKey OR ctrlKey is pressed
   */
  modifiers?: ModifierKey[];

  /**
   * If true, calls preventDefault() on matching events.
   * Requires wheel source to be created with { passive: false }.
   * @default false
   */
  preventDefault?: boolean;
}

/**
 * Filters wheel signals by modifier keys.
 *
 * @example
 * ```typescript
 * // Filter wheel events with Cmd/Ctrl pressed
 * pipe(
 *   wheel(element, { passive: false }),
 *   wheelFilter({ modifiers: ['meta', 'ctrl'], preventDefault: true })
 * )
 * ```
 */
export function wheelFilter(options: WheelFilterOptions): Operator<WheelSignal, WheelSignal> {
  const { modifiers, preventDefault = false } = options;

  const matchesModifiers = (value: WheelSignal["value"]): boolean => {
    if (!modifiers || modifiers.length === 0) return true;
    return modifiers.some((mod) => {
      switch (mod) {
        case "meta":
          return value.metaKey;
        case "ctrl":
          return value.ctrlKey;
        case "alt":
          return value.altKey;
        case "shift":
          return value.shiftKey;
        default:
          return false;
      }
    });
  };

  return (source) =>
    createStream((observer) => {
      return source.subscribe({
        next(signal) {
          try {
            if (matchesModifiers(signal.value)) {
              if (preventDefault) {
                signal.value.originalEvent.preventDefault();
              }
              observer.next(signal);
            }
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
