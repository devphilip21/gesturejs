import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buffer, bufferTime, bufferWhen } from "./buffer.js";
import { from } from "../factory.js";
import { pipe } from "../pipe.js";
import { createSubject } from "../subject.js";

describe("buffer", () => {
  it("should buffer values by count", () => {
    const values: number[][] = [];

    pipe(from([1, 2, 3, 4, 5]), buffer(2)).subscribe((v) => values.push(v));

    expect(values).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe("bufferTime", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("should buffer values by time", () => {
    const source = createSubject<number>();
    const values: number[][] = [];

    pipe(source, bufferTime(100)).subscribe((v) => values.push(v));

    source.next(1);
    source.next(2);
    vi.advanceTimersByTime(100);
    source.next(3);
    vi.advanceTimersByTime(100);

    expect(values).toEqual([[1, 2], [3]]);
  });
});

describe("bufferWhen", () => {
  it("should buffer until notifier emits", () => {
    const source = createSubject<number>();
    const notifier = createSubject<void>();
    const values: number[][] = [];

    pipe(source, bufferWhen(notifier)).subscribe((v) => values.push(v));

    source.next(1);
    source.next(2);
    notifier.next();
    source.next(3);
    notifier.next();

    expect(values).toEqual([[1, 2], [3]]);
  });
});
