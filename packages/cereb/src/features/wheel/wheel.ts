import { createStream, type Stream } from "../../core/stream.js";
import { share } from "../../operators/share.js";
import type { ModifierKey } from "../keyboard/keyboard.js";
import { createWheelSignalFromEvent, type WheelSignal } from "./wheel-signal.js";

export interface WheelOptions {
  /**
   * Whether to use passive event listener.
   * Set to false if you need to call preventDefault() on the originalEvent.
   * @default true
   */
  passive?: boolean;

  /**
   * Filter by modifier keys. Uses OR logic (matches if any is pressed).
   * @example ['meta', 'ctrl'] - matches if metaKey OR ctrlKey is pressed
   */
  modifiers?: ModifierKey[];

  /**
   * If true, calls preventDefault() on matching events.
   * Requires passive: false to work.
   * @default false
   */
  preventDefault?: boolean;
}

/**
 * Cache for shared wheel streams per EventTarget and passive option.
 * Using WeakMap ensures streams are garbage collected when targets are removed.
 */
const sharedWheelStreams = new WeakMap<EventTarget, Map<boolean, Stream<WheelSignal>>>();

function getSharedWheel(target: EventTarget, passive: boolean): Stream<WheelSignal> {
  let passiveMap = sharedWheelStreams.get(target);
  if (!passiveMap) {
    passiveMap = new Map();
    sharedWheelStreams.set(target, passiveMap);
  }

  let stream = passiveMap.get(passive);
  if (!stream) {
    stream = share<WheelSignal>()(createWheelStream(target, passive));
    passiveMap.set(passive, stream);
  }
  return stream;
}

function createWheelStream(target: EventTarget, passive: boolean): Stream<WheelSignal> {
  return createStream<WheelSignal>((observer) => {
    const handler = (e: Event) => {
      observer.next(createWheelSignalFromEvent(e as WheelEvent));
    };

    target.addEventListener("wheel", handler, { passive });

    return () => {
      target.removeEventListener("wheel", handler);
    };
  });
}

/**
 * Creates a stream of wheel signals from wheel events on the target.
 * Automatically shares the wheel stream for the same EventTarget and passive option.
 *
 * @example
 * ```typescript
 * // Basic usage (passive by default for performance)
 * wheel(element).on(signal => {
 *   console.log(signal.value.deltaY);
 * });
 *
 * // With modifier filter and preventDefault
 * wheel(element, {
 *   passive: false,
 *   modifiers: ['meta', 'ctrl'],
 *   preventDefault: true
 * }).on(signal => {
 *   // Only fires when Ctrl or Cmd is held
 * });
 * ```
 */
export function wheel(target: EventTarget, options?: WheelOptions): Stream<WheelSignal> {
  const passive = options?.passive ?? true;
  const modifiers = options?.modifiers;
  const preventDefault = options?.preventDefault ?? false;

  const source = getSharedWheel(target, passive);

  // If no filtering needed, return shared stream directly
  if (!modifiers?.length && !preventDefault) {
    return source;
  }

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

  return createStream<WheelSignal>((observer) => {
    return source.on({
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
