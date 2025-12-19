import { describe, it, expect, vi } from "vitest";
import { combineLatest, forkJoin } from "./combine.js";
import { from, empty } from "../factory.js";
import { createSubject } from "../subject.js";

describe("combineLatest", () => {
  it("should combine latest values from all sources", () => {
    const source1 = createSubject<number>();
    const source2 = createSubject<string>();
    const values: [number, string][] = [];

    combineLatest(source1, source2).subscribe((v) =>
      values.push(v as [number, string])
    );

    source1.next(1);
    expect(values).toEqual([]);

    source2.next("a");
    expect(values).toEqual([[1, "a"]]);

    source1.next(2);
    expect(values).toEqual([
      [1, "a"],
      [2, "a"],
    ]);
  });
});

describe("forkJoin", () => {
  it("should emit array of last values when all sources complete", () => {
    const values: [number, string][] = [];

    forkJoin(from([1, 2, 3]), from(["a", "b", "c"])).subscribe((v) =>
      values.push(v as [number, string])
    );

    expect(values).toEqual([[3, "c"]]);
  });

  it("should not emit if any source completes without emitting", () => {
    const values: unknown[] = [];
    const complete = vi.fn();

    forkJoin(from([1, 2, 3]), empty<string>()).subscribe({
      next: (v) => values.push(v),
      complete,
    });

    expect(values).toEqual([]);
    expect(complete).toHaveBeenCalled();
  });
});
