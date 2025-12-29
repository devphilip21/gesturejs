import { createStream, type Stream } from "../../core/stream.js";
import type { KeyboardSignal } from "./keyboard-signal.js";
import { getSharedKeyboard, getSharedKeyboardForKey } from "./shared.js";

export type ModifierKey = "meta" | "ctrl" | "alt" | "shift";

export interface KeyboardOptions {
  /** Filter by key value(s). Case-insensitive. Uses OR logic if array. */
  key?: string | string[];
  /** Filter by modifier keys. Uses OR logic. */
  modifiers?: ModifierKey[];
  /** If true, calls preventDefault() on matching events. @default false */
  preventDefault?: boolean;
  /** If true, allows repeated keydown events. @default false */
  allowRepeat?: boolean;
}

/**
 * Creates a keyboard signal stream. Shares underlying listeners per EventTarget.
 *
 * @example
 * keyboard(window).subscribe(signal => console.log(signal.value.key));
 * keyboard(window, { key: 'z', modifiers: ['meta'] }).subscribe(handleUndo);
 */
export function keyboard(target: EventTarget, options?: KeyboardOptions): Stream<KeyboardSignal> {
  if (!options) return getSharedKeyboard(target);

  const modifiers = options.modifiers;
  const preventDefault = options.preventDefault ?? false;
  const allowRepeat = options.allowRepeat ?? false;

  const isSingleKey = typeof options.key === "string";
  const keyList = options.key
    ? Array.isArray(options.key)
      ? options.key.map((k) => k.toLowerCase())
      : null
    : null;

  const baseStream = isSingleKey
    ? getSharedKeyboardForKey(target, options.key as string)
    : getSharedKeyboard(target);

  if (isSingleKey && !modifiers && !preventDefault && !allowRepeat) {
    return baseStream;
  }

  const matchesKey = (key: string): boolean => {
    if (!keyList) return true;
    return keyList.includes(key.toLowerCase());
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
    return baseStream.subscribe({
      next(signal) {
        const { key, repeat } = signal.value;
        if (!allowRepeat && repeat) return;
        if (!matchesKey(key)) return;
        if (!matchesModifiers(signal.value)) return;
        if (preventDefault) signal.value.originalEvent.preventDefault();
        observer.next(signal);
      },
      error: observer.error?.bind(observer),
      complete: observer.complete?.bind(observer),
    });
  });
}
