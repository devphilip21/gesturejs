import { describe, expect, it, vi } from "vitest";
import { from } from "../factory/index.js";
import { createSubject } from "../internal/subject.js";
import { pipe } from "../ochestrations/pipe.js";
import { take, takeUntil, takeWhile } from "./take.js";

describe("take", () => {
  it("should take first N values and complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    pipe(from([1, 2, 3, 4, 5]), take(3)).subscribe({
      next: (v) => values.push(v),
      complete,
    });

    expect(values).toEqual([1, 2, 3]);
    expect(complete).toHaveBeenCalled();
  });
});

describe("takeWhile", () => {
  it("should take values while predicate is true", () => {
    const values: number[] = [];

    pipe(
      from([1, 2, 3, 4, 5]),
      takeWhile((x) => x < 4),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([1, 2, 3]);
  });
});

describe("takeUntil", () => {
  it("should take values until notifier emits", () => {
    const source = createSubject<number>();
    const notifier = createSubject<void>();
    const values: number[] = [];

    pipe(source, takeUntil(notifier)).subscribe((v) => values.push(v));

    source.next(1);
    source.next(2);
    notifier.next();
    source.next(3);

    expect(values).toEqual([1, 2]);
  });
});
