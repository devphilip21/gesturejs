import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { timer } from "./timer.js";

describe("timer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("should emit after delay and complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    timer(100).subscribe({ next: (v) => values.push(v), complete });

    vi.advanceTimersByTime(100);

    expect(values).toEqual([0]);
    expect(complete).toHaveBeenCalled();
  });

  it("should emit at interval after initial delay", () => {
    const values: number[] = [];

    timer(100, 50).subscribe((v) => values.push(v));

    vi.advanceTimersByTime(200);

    expect(values).toEqual([0, 1, 2]);
  });
});
