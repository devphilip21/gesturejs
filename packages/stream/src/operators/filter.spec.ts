import { describe, it, expect, vi } from "vitest";
import { filter } from "./filter.js";
import { from, of } from "../factory.js";
import { pipe } from "../pipe.js";

describe("filter", () => {
  it("should filter values based on predicate", () => {
    const values: number[] = [];

    pipe(
      from([1, 2, 3, 4, 5]),
      filter((x) => x % 2 === 0)
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([2, 4]);
  });

  it("should filter complex objects", () => {
    const values: { name: string; age: number }[] = [];

    pipe(
      from([
        { name: "Alice", age: 25 },
        { name: "Bob", age: 17 },
        { name: "Charlie", age: 30 },
      ]),
      filter((user) => user.age >= 18)
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([
      { name: "Alice", age: 25 },
      { name: "Charlie", age: 30 },
    ]);
  });

  it("should catch errors in predicate and propagate to error handler", () => {
    const error = new Error("predicate error");
    const errorFn = vi.fn();

    pipe(
      of(1),
      filter(() => {
        throw error;
      })
    ).subscribe({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
