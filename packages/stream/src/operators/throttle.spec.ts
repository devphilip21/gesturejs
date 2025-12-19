import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { throttle, throttleLast } from "./throttle.js";
import { pipe } from "../pipe.js";
import { createSubject } from "../subject.js";

describe("throttle", () => {
  let mockTime = 0;

  beforeEach(() => {
    mockTime = 0;
    vi.spyOn(performance, "now").mockImplementation(() => mockTime);
  });

  afterEach(() => vi.restoreAllMocks());

  const advanceTime = (ms: number) => {
    mockTime += ms;
  };

  it("should emit first value immediately and throttle within time window", () => {
    const source = createSubject<number>();
    const values: number[] = [];

    pipe(source, throttle(100)).subscribe((v) => values.push(v));

    source.next(1); // Emitted immediately (first value)
    advanceTime(50);
    source.next(2); // Throttled (within 100ms)
    advanceTime(50);
    source.next(3); // Emitted (100ms passed)

    expect(values).toEqual([1, 3]);
  });
});

describe("throttleLast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("should emit last value after time window", () => {
    const source = createSubject<number>();
    const values: number[] = [];

    pipe(source, throttleLast(100)).subscribe((v) => values.push(v));

    source.next(1);
    source.next(2);
    source.next(3);
    vi.advanceTimersByTime(100);

    expect(values).toEqual([3]);
  });

  it("should emit last value on complete if pending", () => {
    const source = createSubject<number>();
    const values: number[] = [];

    pipe(source, throttleLast(100)).subscribe((v) => values.push(v));

    source.next(1);
    source.next(2);
    source.complete();

    expect(values).toEqual([2]);
  });
});
