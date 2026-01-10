import { createStream, type Stream } from "../../core/stream.js";
import { share } from "../../operators/share.js";
import { createKeyboardSignalFromEvent, type KeyboardSignal } from "./keyboard-signal.js";

const sharedKeyboardStreams = new WeakMap<EventTarget, Stream<KeyboardSignal>>();
const sharedKeydownStreams = new WeakMap<EventTarget, Stream<KeyboardSignal>>();

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

function createRawKeydownStream(target: EventTarget): Stream<KeyboardSignal> {
  return createStream<KeyboardSignal>((observer) => {
    const handleKeyDown = (e: Event) => {
      observer.next(createKeyboardSignalFromEvent(e as KeyboardEvent, "down"));
    };

    target.addEventListener("keydown", handleKeyDown);

    return () => {
      target.removeEventListener("keydown", handleKeyDown);
    };
  });
}

/** Shared keydown stream for the given target. */
export function getSharedKeydown(target: EventTarget): Stream<KeyboardSignal> {
  let stream = sharedKeydownStreams.get(target);
  if (!stream) {
    stream = share<KeyboardSignal>()(createRawKeydownStream(target));
    sharedKeydownStreams.set(target, stream);
  }
  return stream;
}
