import { describe, expect, it, vi } from "vitest";
import { from, of } from "../factory/index.js";
import { pipe } from "../ochestrations/pipe.js";
import { spy } from "./spy.js";

describe("tap", () => {
  it("should execute side effect without changing values", () => {
    const sideEffects: number[] = [];
    const values: number[] = [];

    pipe(
      from([1, 2, 3]),
      spy((x) => sideEffects.push(x * 10)),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([1, 2, 3]);
    expect(sideEffects).toEqual([10, 20, 30]);
  });

  it("should catch errors in tap function and propagate to error handler", () => {
    const error = new Error("tap error");
    const errorFn = vi.fn();

    pipe(
      of(1),
      spy(() => {
        throw error;
      }),
    ).subscribe({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
