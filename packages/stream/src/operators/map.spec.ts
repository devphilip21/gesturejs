import { describe, it, expect, vi } from "vitest";
import { map } from "./map.js";
import { from, of } from "../factory.js";
import { pipe } from "../pipe.js";

describe("map", () => {
  it("should transform values", () => {
    const values: number[] = [];

    pipe(from([1, 2, 3]), map((x) => x * 2)).subscribe((v) => values.push(v));

    expect(values).toEqual([2, 4, 6]);
  });

  it("should catch errors in transform function", () => {
    const error = new Error("transform error");
    const errorFn = vi.fn();

    pipe(
      of(1),
      map(() => {
        throw error;
      })
    ).subscribe({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
