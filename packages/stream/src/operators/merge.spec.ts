import { describe, it, expect, vi } from "vitest";
import { merge, mergeWith } from "./merge.js";
import { from } from "../factory.js";
import { pipe } from "../pipe.js";
import { createSubject } from "../subject.js";

describe("merge", () => {
  it("should merge multiple observables", () => {
    const values: number[] = [];

    merge(from([1, 2]), from([3, 4])).subscribe((v) => values.push(v));

    expect(values).toEqual([1, 2, 3, 4]);
  });

  it("should complete when all sources complete", () => {
    const subject1 = createSubject<number>();
    const subject2 = createSubject<number>();
    const complete = vi.fn();

    merge(subject1, subject2).subscribe({ next: vi.fn(), complete });

    subject1.complete();
    expect(complete).not.toHaveBeenCalled();

    subject2.complete();
    expect(complete).toHaveBeenCalled();
  });
});

describe("mergeWith", () => {
  it("should merge with another observable", () => {
    const values: number[] = [];

    pipe(from([1, 2]), mergeWith(from([3, 4]))).subscribe((v) => values.push(v));

    expect(values).toEqual([1, 2, 3, 4]);
  });
});
