import { createStream, type Stream } from "../../core/stream.js";
import { share } from "../../operators/share.js";
import { createKeyboardSignalFromEvent, type KeyboardSignal } from "./keyboard-signal.js";

const sharedKeyboardStreams = new WeakMap<EventTarget, Stream<KeyboardSignal>>();
const sharedKeyStreams = new WeakMap<EventTarget, Map<string, Stream<KeyboardSignal>>>();

function createRawKeyboardStream(target: EventTarget): Stream<KeyboardSignal> {
  return createStream<KeyboardSignal>((observer) => {
    const handleKeyDown = (e: Event) => {
      observer.next(createKeyboardSignalFromEvent(e as KeyboardEvent, "down"));
    };

    const handleKeyUp = (e: Event) => {
      observer.next(createKeyboardSignalFromEvent(e as KeyboardEvent, "up"));
    };

    target.addEventListener("keydown", handleKeyDown);
    target.addEventListener("keyup", handleKeyUp);

    return () => {
      target.removeEventListener("keydown", handleKeyDown);
      target.removeEventListener("keyup", handleKeyUp);
    };
  });
}

/** Shared keyboard stream for the given target. */
export function getSharedKeyboard(target: EventTarget): Stream<KeyboardSignal> {
  let stream = sharedKeyboardStreams.get(target);
  if (!stream) {
    stream = share<KeyboardSignal>()(createRawKeyboardStream(target));
    sharedKeyboardStreams.set(target, stream);
  }
  return stream;
}

/** Shared keyboard stream filtered by a specific key. Filters out repeated events. */
export function getSharedKeyboardForKey(target: EventTarget, key: string): Stream<KeyboardSignal> {
  const keyLower = key.toLowerCase();

  let keyMap = sharedKeyStreams.get(target);
  if (!keyMap) {
    keyMap = new Map();
    sharedKeyStreams.set(target, keyMap);
  }

  let stream = keyMap.get(keyLower);
  if (!stream) {
    const baseStream = getSharedKeyboard(target);
    const filteredStream = createStream<KeyboardSignal>((observer) => {
      return baseStream.subscribe({
        next(signal) {
          if (signal.value.repeat) return;
          if (signal.value.key.toLowerCase() !== keyLower) return;
          observer.next(signal);
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
    stream = share<KeyboardSignal>()(filteredStream);
    keyMap.set(keyLower, stream);
  }

  return stream;
}
