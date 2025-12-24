import { describe, expect, it } from "vitest";
import { from } from "../factory/from.js";
import { filter, map } from "../operators/index.js";
import { compose } from "./compose.js";

describe("compose", () => {
  it("should compose operators for reuse", () => {
    const tripleOdd = compose(
      filter((x: number) => x % 2 === 1),
      map((x: number) => x * 3),
    );

    const values1: number[] = [];
    const values2: number[] = [];

    tripleOdd(from([1, 2, 3])).subscribe((v) => values1.push(v));
    tripleOdd(from([4, 5, 6])).subscribe((v) => values2.push(v));

    expect(values1).toEqual([3, 9]);
    expect(values2).toEqual([15]);
  });
});
