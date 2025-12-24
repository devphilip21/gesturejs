import { createStream, type Stream } from "../stream/stream.js";

export function defer<T>(factory: () => Stream<T>): Stream<T> {
  return createStream((observer) => {
    return factory().subscribe(observer);
  });
}
