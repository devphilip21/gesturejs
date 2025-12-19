import { describe, it, expect, vi } from "vitest";
import { tap } from "./tap.js";
import { from, of } from "../factory.js";
import { pipe } from "../pipe.js";

describe("tap", () => {
  it("should execute side effect without changing values", () => {
    const sideEffects: number[] = [];
    const values: number[] = [];

    pipe(
      from([1, 2, 3]),
      tap((x) => sideEffects.push(x * 10))
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([1, 2, 3]);
    expect(sideEffects).toEqual([10, 20, 30]);
  });

  it("should catch errors in tap function and propagate to error handler", () => {
    const error = new Error("tap error");
    const errorFn = vi.fn();

    pipe(
      of(1),
      tap(() => {
        throw error;
      })
    ).subscribe({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
