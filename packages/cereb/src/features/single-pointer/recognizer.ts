import type { Signal } from "../../core/signal.js";
import {
  createDefaultSinglePointerSignal,
  type SinglePointerSignal,
} from "./single-pointer-signal.js";
import type { SinglePointerOptions } from "./types.js";

export interface SinglePointerRecognizer<InputSignal extends Signal> {
  process(event: InputSignal): SinglePointerSignal | null;
  readonly isActive: boolean;
  reset(): void;
  dispose(): void;
}

export function createSinglePointerRecognizer<InputSignal extends Signal>(
  processor: (inputSignal: InputSignal, pointerSignal: SinglePointerSignal) => boolean,
  _options: SinglePointerOptions = {},
): SinglePointerRecognizer<InputSignal> {
  let current: SinglePointerSignal | null = null;

  return {
    process: (inputSignal) => {
      const signal = createDefaultSinglePointerSignal();
      const isValid = processor(inputSignal, signal);
      if (!isValid) {
        return null;
      }
      current = signal;
      return signal;
    },
    get isActive(): boolean {
      return current !== null;
    },
    reset(): void {
      current = null;
    },
    dispose(): void {
      this.reset();
    },
  };
}
