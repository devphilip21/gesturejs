import type { ExtendSignalValue, Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export function extend<T extends Signal, A extends object>(
  extender: (signal: T) => A,
): Operator<T, ExtendSignalValue<T, A>> {
  type OutputSignal = ExtendSignalValue<T, A>;

  return (source) =>
    createStream<OutputSignal>((observer) => {
      return source.on({
        next(signal) {
          try {
            const a = extender(signal);

            const value = signal.value as T["value"] & A;
            Object.assign(value, a);
            observer.next(signal as unknown as OutputSignal);
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
