import { createStream, type Stream } from "../stream/stream.js";

export function timer(delay: number, period?: number): Stream<number> {
  return createStream((observer) => {
    let count = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const timeoutId = setTimeout(() => {
      observer.next(count++);

      if (period !== undefined) {
        intervalId = setInterval(() => {
          observer.next(count++);
        }, period);
      } else {
        observer.complete?.();
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  });
}
