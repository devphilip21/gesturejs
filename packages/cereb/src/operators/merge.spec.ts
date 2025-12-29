import { describe, expect, it, vi } from "vitest";
import { createSubject } from "../internal/subject.js";
import { fromArray, type TestSignal } from "../internal/test-utils.js";
import { merge, mergeWith } from "./merge.js";

describe("merge", () => {
  it("should merge multiple observables", () => {
    const values: number[] = [];

    merge(fromArray([1, 2]), fromArray([3, 4])).on((v) => values.push(v.value));

    expect(values).toEqual([1, 2, 3, 4]);
  });

  it("should complete when all sources complete", () => {
    const subject1 = createSubject<TestSignal<number>>();
    const subject2 = createSubject<TestSignal<number>>();
    const complete = vi.fn();

    merge(subject1, subject2).on({ next: vi.fn(), complete });

    subject1.complete();
    expect(complete).not.toHaveBeenCalled();

    subject2.complete();
    expect(complete).toHaveBeenCalled();
  });
});

describe("mergeWith", () => {
  it("should merge with another observable", () => {
    const values: number[] = [];

    fromArray([1, 2])
      .pipe(mergeWith(fromArray([3, 4])))
      .on((v) => values.push(v.value));

    expect(values).toEqual([1, 2, 3, 4]);
  });
});
