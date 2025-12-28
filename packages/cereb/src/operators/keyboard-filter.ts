import type { KeyboardSignal } from "../browser/keyboard/keyboard-signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export type ModifierKey = "meta" | "ctrl" | "alt" | "shift";

export interface KeyboardFilterOptions {
  /**
   * Filter by key value(s). Uses OR logic if array.
   * Comparison is case-insensitive.
   * @example 'z' or ['+', '-', '=']
   */
  key?: string | string[];

  /**
   * Filter by modifier keys. Uses OR logic (matches if any is pressed).
   * @example ['meta', 'ctrl'] - matches if metaKey OR ctrlKey is pressed
   */
  modifiers?: ModifierKey[];

  /**
   * If true, calls preventDefault() on matching events.
   * @default false
   */
  preventDefault?: boolean;
}

/**
 * Filters keyboard signals by key and/or modifier keys.
 *
 * @example
 * ```typescript
 * // Filter by key only
 * pipe(keyboard(window), keyboardFilter({ key: ['+', '-', '='] }))
 *
 * // Filter by modifiers only
 * pipe(keyboard(window), keyboardFilter({ modifiers: ['meta', 'ctrl'] }))
 *
 * // Filter by both (AND logic)
 * pipe(keyboard(window), keyboardFilter({
 *   key: 'z',
 *   modifiers: ['meta', 'ctrl'],
 *   preventDefault: true
 * }))
 * ```
 */
export function keyboardFilter(
  options: KeyboardFilterOptions,
): Operator<KeyboardSignal, KeyboardSignal> {
  const { key, modifiers, preventDefault = false } = options;

  const keyList = key ? (Array.isArray(key) ? key : [key]) : null;

  const matchesKey = (value: KeyboardSignal["value"]): boolean => {
    if (!keyList) return true;
    return keyList.some((k) => value.key.toLowerCase() === k.toLowerCase());
  };

  const matchesModifiers = (value: KeyboardSignal["value"]): boolean => {
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
      }
      return false;
    });
  };

  return (source) =>
    createStream((observer) => {
      return source.subscribe({
        next(signal) {
          try {
            if (matchesKey(signal.value) && matchesModifiers(signal.value)) {
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
