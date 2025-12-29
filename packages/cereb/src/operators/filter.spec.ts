import { describe, expect, it, vi } from "vitest";
import { fromArray, ofValue, type TestSignal } from "../internal/test-utils.js";
import { filter } from "./filter.js";

describe("filter", () => {
  it("should filter values based on predicate", () => {
    const values: number[] = [];

    fromArray([1, 2, 3, 4, 5])
      .pipe(filter((x: TestSignal<number>) => x.value % 2 === 0))
      .on((v) => values.push(v.value));

    expect(values).toEqual([2, 4]);
  });

  it("should filter complex objects", () => {
    const values: { name: string; age: number }[] = [];

    fromArray([
      { name: "Alice", age: 25 },
      { name: "Bob", age: 17 },
      { name: "Charlie", age: 30 },
    ])
      .pipe(filter((x: TestSignal<{ name: string; age: number }>) => x.value.age >= 18))
      .on((v) => values.push(v.value));

    expect(values).toEqual([
      { name: "Alice", age: 25 },
      { name: "Charlie", age: 30 },
    ]);
  });

  it("should catch errors in predicate and propagate to error handler", () => {
    const error = new Error("predicate error");
    const errorFn = vi.fn();

    ofValue(1)
      .pipe(
        filter(() => {
          throw error;
        }),
      )
      .on({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
