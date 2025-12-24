import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interval } from "./interval.js";

describe("interval", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("should emit incrementing values and cleanup", () => {
    const values: number[] = [];
    const unsub = interval(100).subscribe((v) => values.push(v));

    vi.advanceTimersByTime(350);
    unsub();
    vi.advanceTimersByTime(200);

    expect(values).toEqual([0, 1, 2]);
  });
});
