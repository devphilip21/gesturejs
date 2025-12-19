import { describe, it, expect } from "vitest";
import { pipe, compose } from "./pipe.js";
import { from } from "./factory.js";
import { map, filter } from "./operators/index.js";

describe("pipe", () => {
  it("should apply operators in order", () => {
    const values: number[] = [];

    pipe(
      from([1, 2, 3, 4, 5]),
      filter((x: number) => x % 2 === 1),
      map((x: number) => x * 10)
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([10, 30, 50]);
  });

  it("should support type transformation", () => {
    const values: string[] = [];

    pipe(
      from([1, 2, 3]),
      map((x: number) => String(x)),
      map((x: string) => x + "!")
    ).subscribe((v) => values.push(v));

    expect(values).toEqual(["1!", "2!", "3!"]);
  });
});

describe("compose", () => {
  it("should compose operators for reuse", () => {
    const tripleOdd = compose(
      filter((x: number) => x % 2 === 1),
      map((x: number) => x * 3)
    );

    const values1: number[] = [];
    const values2: number[] = [];

    tripleOdd(from([1, 2, 3])).subscribe((v) => values1.push(v));
    tripleOdd(from([4, 5, 6])).subscribe((v) => values2.push(v));

    expect(values1).toEqual([3, 9]);
    expect(values2).toEqual([15]);
  });
});
