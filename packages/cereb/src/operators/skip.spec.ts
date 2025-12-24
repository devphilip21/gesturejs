import { describe, expect, it } from "vitest";
import { from } from "../factory/index.js";
import { createSubject } from "../internal/subject.js";
import { pipe } from "../ochestrations/pipe.js";
import { skip, skipUntil, skipWhile } from "./skip.js";

describe("skip", () => {
  it("should skip first N values", () => {
    const values: number[] = [];

    pipe(from([1, 2, 3, 4, 5]), skip(2)).subscribe((v) => values.push(v));

    expect(values).toEqual([3, 4, 5]);
  });
});

describe("skipWhile", () => {
  it("should skip values while predicate is true", () => {
    const values: number[] = [];

    pipe(
      from([1, 2, 3, 4, 5]),
      skipWhile((x) => x < 3),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([3, 4, 5]);
  });

  it("should not re-evaluate predicate after it returns false", () => {
    const values: number[] = [];

    pipe(
      from([1, 2, 5, 1, 2]),
      skipWhile((x) => x < 3),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([5, 1, 2]);
  });
});

describe("skipUntil", () => {
  it("should skip values until notifier emits", () => {
    const source = createSubject<number>();
    const notifier = createSubject<void>();
    const values: number[] = [];

    pipe(source, skipUntil(notifier)).subscribe((v) => values.push(v));

    source.next(1);
    source.next(2);
    notifier.next();
    source.next(3);
    source.next(4);

    expect(values).toEqual([3, 4]);
  });
});
