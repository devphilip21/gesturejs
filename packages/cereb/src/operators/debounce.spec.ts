import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSubject } from "../internal/subject.js";
import { pipe } from "../ochestrations/index.js";
import { debounce } from "./debounce.js";

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("should emit value after silence period", () => {
    const source = createSubject<number>();
    const values: number[] = [];

    pipe(source, debounce(100)).subscribe((v) => values.push(v));

    source.next(1);
    expect(values).toEqual([]);

    vi.advanceTimersByTime(100);
    expect(values).toEqual([1]);
  });

  it("should reset timer on new value", () => {
    const source = createSubject<number>();
    const values: number[] = [];

    pipe(source, debounce(100)).subscribe((v) => values.push(v));

    source.next(1);
    vi.advanceTimersByTime(50);
    source.next(2);
    vi.advanceTimersByTime(50);
    source.next(3);
    vi.advanceTimersByTime(100);

    expect(values).toEqual([3]);
  });
});
