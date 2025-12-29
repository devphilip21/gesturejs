import { describe, expect, it, vi } from "vitest";
import { fromArray, ofValue, type TestSignal } from "../internal/test-utils.js";
import { spy } from "./spy.js";

describe("tap", () => {
  it("should execute side effect without changing values", () => {
    const sideEffects: number[] = [];
    const values: number[] = [];

    fromArray([1, 2, 3])
      .pipe(spy((x: TestSignal<number>) => sideEffects.push(x.value * 10)))
      .on((v) => values.push(v.value));

    expect(values).toEqual([1, 2, 3]);
    expect(sideEffects).toEqual([10, 20, 30]);
  });

  it("should catch errors in tap function and propagate to error handler", () => {
    const error = new Error("tap error");
    const errorFn = vi.fn();

    ofValue(1)
      .pipe(
        spy(() => {
          throw error;
        }),
      )
      .on({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
