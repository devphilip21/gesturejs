import { describe, expect, it } from "vitest";
import { from } from "../factory/from.js";
import { filter, map } from "../operators/index.js";
import { pipe } from "./pipe.js";

describe("pipe", () => {
  it("should apply operators in order", () => {
    const values: number[] = [];

    pipe(
      from([1, 2, 3, 4, 5]),
      filter((x: number) => x % 2 === 1),
      map((x: number) => x * 10),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([10, 30, 50]);
  });

  it("should support type transformation", () => {
    const values: string[] = [];

    pipe(
      from([1, 2, 3]),
      map((x: number) => String(x)),
      map((x: string) => `${x}!`),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual(["1!", "2!", "3!"]);
  });
});
