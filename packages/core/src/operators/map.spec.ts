import { describe, expect, it, vi } from "vitest";
import { from, of } from "../factory/index.js";
import { pipe } from "../ochestrations/pipe.js";
import { map } from "./map.js";

describe("map", () => {
  it("should transform values", () => {
    const values: number[] = [];

    pipe(
      from([1, 2, 3]),
      map((x) => x * 2),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([2, 4, 6]);
  });

  it("should catch errors in transform function", () => {
    const error = new Error("transform error");
    const errorFn = vi.fn();

    pipe(
      of(1),
      map(() => {
        throw error;
      }),
    ).subscribe({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
