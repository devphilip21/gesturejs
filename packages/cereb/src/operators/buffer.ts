import type { Operator, Stream } from "../stream/stream.js";
import { createStream } from "../stream/stream.js";

export function buffer<T>(count: number): Operator<T, T[]> {
  return (source) =>
    createStream((observer) => {
      let buffer: T[] = [];

      return source.subscribe({
        next(value) {
          buffer.push(value);
          if (buffer.length >= count) {
            observer.next(buffer);
            buffer = [];
          }
        },
        error: observer.error?.bind(observer),
        complete() {
          if (buffer.length > 0) {
            observer.next(buffer);
          }
          observer.complete?.();
        },
      });
    });
}

export function bufferTime<T>(ms: number): Operator<T, T[]> {
  return (source) =>
    createStream((observer) => {
      let buffer: T[] = [];

      const intervalId = setInterval(() => {
        if (buffer.length > 0) {
          observer.next(buffer);
          buffer = [];
        }
      }, ms);

      const unsub = source.subscribe({
        next(value) {
          buffer.push(value);
        },
        error: observer.error?.bind(observer),
        complete() {
          clearInterval(intervalId);
          if (buffer.length > 0) {
            observer.next(buffer);
          }
          observer.complete?.();
        },
      });

      return () => {
        clearInterval(intervalId);
        unsub();
      };
    });
}

export function bufferWhen<T>(notifier: Stream<unknown>): Operator<T, T[]> {
  return (source) =>
    createStream((observer) => {
      let buffer: T[] = [];

      const notifierUnsub = notifier.subscribe(() => {
        if (buffer.length > 0) {
          observer.next(buffer);
          buffer = [];
        }
      });

      const sourceUnsub = source.subscribe({
        next(value) {
          buffer.push(value);
        },
        error: observer.error?.bind(observer),
        complete() {
          notifierUnsub();
          if (buffer.length > 0) {
            observer.next(buffer);
          }
          observer.complete?.();
        },
      });

      return () => {
        notifierUnsub();
        sourceUnsub();
      };
    });
}
