import type { Signal } from "../../core/signal.js";
import { singlePointerPool } from "./pool.js";
import { createSinglePointerSignal, type SinglePointerSignal } from "./single-pointer-signal.js";

export interface SinglePointerRecognizer<InputSignal extends Signal> {
  process(event: InputSignal): SinglePointerSignal;
  readonly isActive: boolean;
  reset(): void;
  dispose(): void;
}

export interface SinglePointerRecognizerOptions {
  pooling?: boolean;
}

export function createSinglePointerRecognizer<InputSignal extends Signal>(
  processor: (inputSignal: InputSignal, pointerSignal: SinglePointerSignal) => void,
  options: SinglePointerRecognizerOptions = {},
): SinglePointerRecognizer<InputSignal> {
  const { pooling = false } = options;
  let current: SinglePointerSignal | null = null;

  function acquireSignal(): SinglePointerSignal {
    if (pooling) {
      return singlePointerPool.acquire();
    }
    return createSinglePointerSignal({
      id: "",
      phase: "move",
      x: 0,
      y: 0,
      pageX: 0,
      pageY: 0,
      pointerType: "mouse",
      button: "none",
      pressure: 0.5,
    });
  }

  function releaseCurrentPointer(): void {
    if (current && pooling) {
      singlePointerPool.release(current);
    }
    current = null;
  }

  return {
    process: (inputSignal) => {
      const signal = acquireSignal();
      processor(inputSignal, signal);
      releaseCurrentPointer();
      current = signal;
      return signal;
    },
    get isActive(): boolean {
      return current !== null;
    },
    reset(): void {
      releaseCurrentPointer();
    },
    dispose(): void {
      this.reset();
    },
  };
}
