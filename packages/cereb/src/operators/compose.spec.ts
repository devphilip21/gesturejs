import { describe, expect, it } from "vitest";
import { fromArray, type TestSignal } from "../internal/test-utils.js";
import { compose } from "./compose.js";
import { filter } from "./filter.js";
import { map } from "./map.js";

describe("compose", () => {
  it("should compose operators for reuse", () => {
    const tripleOdd = compose(
      filter((x: TestSignal<number>) => x.value % 2 === 1),
      map((x: TestSignal<number>) => ({ ...x, value: x.value * 3 })),
    );

    const values1: number[] = [];
    const values2: number[] = [];

    tripleOdd(fromArray([1, 2, 3])).on((v) => values1.push(v.value));
    tripleOdd(fromArray([4, 5, 6])).on((v) => values2.push(v.value));

    expect(values1).toEqual([3, 9]);
    expect(values2).toEqual([15]);
  });
});
