/**
 * KeyboardEvent.code values for physical key identification.
 * Based on W3C UI Events KeyboardEvent code Values specification.
 *
 * @see https://www.w3.org/TR/uievents-code/
 */

/** Alphanumeric keys (US QWERTY writing system) */
type AlphaKey =
  | "KeyA"
  | "KeyB"
  | "KeyC"
  | "KeyD"
  | "KeyE"
  | "KeyF"
  | "KeyG"
  | "KeyH"
  | "KeyI"
  | "KeyJ"
  | "KeyK"
  | "KeyL"
  | "KeyM"
  | "KeyN"
  | "KeyO"
  | "KeyP"
  | "KeyQ"
  | "KeyR"
  | "KeyS"
  | "KeyT"
  | "KeyU"
  | "KeyV"
  | "KeyW"
  | "KeyX"
  | "KeyY"
  | "KeyZ";

type DigitKey =
  | "Digit0"
  | "Digit1"
  | "Digit2"
  | "Digit3"
  | "Digit4"
  | "Digit5"
  | "Digit6"
  | "Digit7"
  | "Digit8"
  | "Digit9";

/** Punctuation and special character keys */
type PunctuationKey =
  | "Backquote" // `~
  | "Minus" // -_
  | "Equal" // =+
  | "BracketLeft" // [{
  | "BracketRight" // ]}
  | "Backslash" // \|
  | "Semicolon" // ;:
  | "Quote" // '"
  | "Comma" // ,<
  | "Period" // .>
  | "Slash" // /?
  | "IntlBackslash"
  | "IntlRo"
  | "IntlYen";

/** Function keys */
type FunctionKey =
  | "Escape"
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "F8"
  | "F9"
  | "F10"
  | "F11"
  | "F12"
  | "F13"
  | "F14"
  | "F15"
  | "F16"
  | "F17"
  | "F18"
  | "F19"
  | "F20"
  | "F21"
  | "F22"
  | "F23"
  | "F24"
  | "PrintScreen"
  | "ScrollLock"
  | "Pause";

/** Navigation keys */
type NavigationKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown";

/** Editing keys */
type EditingKey =
  | "Backspace"
  | "Tab"
  | "Enter"
  | "CapsLock"
  | "Space"
  | "Insert"
  | "Delete"
  | "NumLock";

/** Modifier keys */
type ModifierKeyCode =
  | "ShiftLeft"
  | "ShiftRight"
  | "ControlLeft"
  | "ControlRight"
  | "AltLeft"
  | "AltRight"
  | "MetaLeft"
  | "MetaRight"
  | "ContextMenu";

/** Numpad keys */
type NumpadKey =
  | "Numpad0"
  | "Numpad1"
  | "Numpad2"
  | "Numpad3"
  | "Numpad4"
  | "Numpad5"
  | "Numpad6"
  | "Numpad7"
  | "Numpad8"
  | "Numpad9"
  | "NumpadAdd"
  | "NumpadSubtract"
  | "NumpadMultiply"
  | "NumpadDivide"
  | "NumpadDecimal"
  | "NumpadEnter"
  | "NumpadEqual"
  | "NumpadComma"
  | "NumpadParenLeft"
  | "NumpadParenRight";

/**
 * All valid KeyboardEvent.code values.
 * Use this type for physical key identification regardless of keyboard layout.
 *
 * @see https://www.w3.org/TR/uievents-code/
 * @example
 * keydown(window, { code: 'KeyZ' })  // Physical Z key position
 * keydown(window, { code: 'Space' }) // Spacebar
 */
export type KeyCode =
  | AlphaKey
  | DigitKey
  | PunctuationKey
  | FunctionKey
  | NavigationKey
  | EditingKey
  | ModifierKeyCode
  | NumpadKey;
