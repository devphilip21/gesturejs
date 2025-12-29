import type { Signal } from "../../core/signal.js";
import { createSignal } from "../../core/signal.js";
import type { Stream } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { ModifierKey } from "./keyboard.js";
import type { KeyboardSignal } from "./keyboard-signal.js";
import { getSharedKeyboard, getSharedKeyboardForKey } from "./shared.js";

interface HeldValue {
  opened: boolean;
}

export interface HeldSignal extends Signal<"keyboard-held", HeldValue> {}

export const HELD_SIGNAL_KIND = "keyboard-held" as const;

export interface KeyboardHeldOptions {
  /**
   * The key to track. Case-insensitive.
   * @example 'z', 'Space', 'Escape'
   */
  key: string;

  /**
   * Modifier keys that must also be held. Uses OR logic.
   *
   * ⚠️ WARNING: On macOS, OS-level modifiers (especially Meta/Command) can swallow
   * keyup events. This is a known platform limitation, not a bug. For reliable
   * "hold to activate" behavior, prefer using non-modifier keys (Space, Shift, etc.)
   * as the primary key instead of relying on modifier combinations.
   *
   * @example ['meta', 'ctrl'] - matches if metaKey OR ctrlKey is pressed
   */
  modifiers?: ModifierKey[];
}

/**
 * Tracks whether a specific key (with optional modifiers) is being held down.
 * Emits only when state changes.
 *
 * @example
 * ```typescript
 * // Prefer: use non-modifier key for reliable hold detection
 * const spaceHeld$ = keyboardHeld(window, { key: 'Space' });
 *
 * // Caution: modifier combos may miss keyup on macOS
 * const cmdZHeld$ = keyboardHeld(window, { key: 'z', modifiers: ['meta'] });
 * ```
 */
export function keyboardHeld(
  target: EventTarget,
  options: KeyboardHeldOptions,
): Stream<HeldSignal> {
  const { key, modifiers } = options;
  const keyLower = key.toLowerCase();
  const hasModifiers = modifiers && modifiers.length > 0;

  // With modifiers, use base stream to receive modifier keyup events
  const source = hasModifiers ? getSharedKeyboard(target) : getSharedKeyboardForKey(target, key);

  const modifierKeyNames = new Set<string>();
  if (modifiers) {
    for (const mod of modifiers) {
      if (mod === "meta") modifierKeyNames.add("meta");
      if (mod === "ctrl") modifierKeyNames.add("control");
      if (mod === "alt") modifierKeyNames.add("alt");
      if (mod === "shift") modifierKeyNames.add("shift");
    }
  }

  const isModifierKey = (eventKey: string): boolean => {
    return modifierKeyNames.has(eventKey.toLowerCase());
  };

  const checkModifiers = (value: KeyboardSignal["value"]): boolean => {
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

  return createStream((observer) => {
    let keyHeld = false;
    let lastEmittedHeld: boolean | undefined;

    const emitIfChanged = (held: boolean) => {
      if (held !== lastEmittedHeld) {
        lastEmittedHeld = held;
        observer.next(createSignal(HELD_SIGNAL_KIND, { opened: held }));
      }
    };

    return source.on({
      next(signal) {
        try {
          const { key: eventKey, phase, repeat } = signal.value;
          if (repeat) return;

          const eventKeyLower = eventKey.toLowerCase();
          const isTargetKey = eventKeyLower === keyLower;
          const isModifier = isModifierKey(eventKey);

          if (isTargetKey) {
            keyHeld = phase === "down";
          } else if (phase === "down" || (isModifier && phase === "up")) {
            // Reset on any other keydown or modifier keyup (handles missing keyup on macOS)
            keyHeld = false;
          }

          const modifierHeld = checkModifiers(signal.value);
          const held = keyHeld && modifierHeld;
          emitIfChanged(held);
        } catch (err) {
          observer.error?.(err);
        }
      },
      error: observer.error?.bind(observer),
      complete: observer.complete?.bind(observer),
    });
  });
}
