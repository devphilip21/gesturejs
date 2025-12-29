import { describe, expect, it, vi } from "vitest";
import { fromArray, ofValue, type TestSignal } from "../internal/test-utils.js";
import { map } from "./map.js";

describe("map", () => {
  it("should transform values", () => {
    const values: number[] = [];

    fromArray([1, 2, 3])
      .pipe(map((x: TestSignal<number>) => ({ ...x, value: x.value * 2 })))
      .on((v) => values.push(v.value));

    expect(values).toEqual([2, 4, 6]);
  });

  it("should catch errors in transform function", () => {
    const error = new Error("transform error");
    const errorFn = vi.fn();

    ofValue(1)
      .pipe(
        map(() => {
          throw error;
        }),
      )
      .on({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
