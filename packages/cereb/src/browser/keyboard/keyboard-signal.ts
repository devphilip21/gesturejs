import { createSignal, type Signal } from "../../core/signal.js";

export type KeyboardPhase = "down" | "up";

/**
 * Keyboard event data normalized into a consistent structure.
 * Provides both logical key (what the key represents) and physical code (where the key is).
 */
export interface KeyboardValue {
  phase: KeyboardPhase;
  /** Logical key value (e.g., "+", "-", "a", "Meta", "Control") */
  key: string;
  /** Physical key code (e.g., "Equal", "Minus", "KeyA", "MetaLeft") */
  code: string;
  /** True if this is a repeat event from holding the key down */
  repeat: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  /** Original DOM KeyboardEvent for advanced use cases like preventDefault */
  originalEvent: KeyboardEvent;
}

export interface KeyboardSignal extends Signal<"keyboard", KeyboardValue> {}

export const KEYBOARD_SIGNAL_KIND = "keyboard" as const;

export function createKeyboardSignal(value: KeyboardValue): KeyboardSignal {
  return createSignal(KEYBOARD_SIGNAL_KIND, value);
}

export function createKeyboardSignalFromEvent(
  event: KeyboardEvent,
  phase: KeyboardPhase,
): KeyboardSignal {
  return createKeyboardSignal({
    phase,
    key: event.key,
    code: event.code,
    repeat: event.repeat,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    originalEvent: event,
  });
}
