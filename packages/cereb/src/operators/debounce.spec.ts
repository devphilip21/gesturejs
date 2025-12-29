import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSubject } from "../internal/subject.js";
import { createTestSignal, type TestSignal } from "../internal/test-utils.js";
import { debounce } from "./debounce.js";

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("should emit value after silence period", () => {
    const source = createSubject<TestSignal<number>>();
    const values: number[] = [];

    source.pipe(debounce(100)).on((v) => values.push(v.value));

    source.next(createTestSignal(1));
    expect(values).toEqual([]);

    vi.advanceTimersByTime(100);
    expect(values).toEqual([1]);
  });

  it("should reset timer on new value", () => {
    const source = createSubject<TestSignal<number>>();
    const values: number[] = [];

    source.pipe(debounce(100)).on((v) => values.push(v.value));

    source.next(createTestSignal(1));
    vi.advanceTimersByTime(50);
    source.next(createTestSignal(2));
    vi.advanceTimersByTime(50);
    source.next(createTestSignal(3));
    vi.advanceTimersByTime(100);

    expect(values).toEqual([3]);
  });
});
