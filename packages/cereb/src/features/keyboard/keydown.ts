import { createStream, type Stream } from "../../core/stream.js";
import type { KeyCode } from "./key-code.js";
import type { ModifierKey } from "./keyboard.js";
import type { KeyboardSignal } from "./keyboard-signal.js";
import { getSharedKeydown } from "./shared.js";

export interface KeydownOptions {
  /**
   * Filter by physical key code(s). Uses OR logic if array.
   * @see https://www.w3.org/TR/uievents-code/
   * @example 'KeyZ', 'Space', ['KeyA', 'KeyB']
   */
  code?: KeyCode | KeyCode[];
  /** Filter by modifier keys. Uses OR logic. */
  modifiers?: ModifierKey[];
  /** If true, calls preventDefault() on matching events. @default true */
  preventDefault?: boolean;
  /** If true, allows repeated keydown events. @default false */
  allowRepeat?: boolean;
}

/**
 * Creates a keydown-only signal stream.
 * Shares underlying listeners per EventTarget.
 *
 * @example
 * keydown(window).on(signal => console.log(signal.value.code));
 * keydown(window, { code: 'KeyZ', modifiers: ['meta'] }).on(handleUndo);
 */
export function keydown(target: EventTarget, options?: KeydownOptions): Stream<KeyboardSignal> {
  if (!options) return getSharedKeydown(target);

  const modifiers = options.modifiers;
  const preventDefault = options.preventDefault ?? true;
  const allowRepeat = options.allowRepeat ?? false;

  const codeList = options.code
    ? Array.isArray(options.code)
      ? options.code.map((c) => c.toLowerCase())
      : [options.code.toLowerCase()]
    : null;

  const baseStream = getSharedKeydown(target);

  const matchesCode = (value: KeyboardSignal["value"]): boolean => {
    if (!codeList) return true;
    return codeList.includes(value.code.toLowerCase());
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
        default:
          return false;
      }
    });
  };

  return createStream<KeyboardSignal>((observer) => {
    return baseStream.on({
      next(signal) {
        const { repeat } = signal.value;
        if (!allowRepeat && repeat) return;
        if (!matchesCode(signal.value)) return;
        if (!matchesModifiers(signal.value)) return;
        if (preventDefault) signal.value.originalEvent.preventDefault();
        observer.next(signal);
      },
      error: observer.error?.bind(observer),
      complete: observer.complete?.bind(observer),
    });
  });
}
