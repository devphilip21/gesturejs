import { createStream, type Stream } from "../stream/stream.js";

export function never<T = never>(): Stream<T> {
  return createStream(() => {
    return () => {};
  });
}
