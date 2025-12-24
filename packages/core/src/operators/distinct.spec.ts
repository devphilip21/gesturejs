import { describe, expect, it } from "vitest";
import { from } from "../factory/from.js";
import { pipe } from "../ochestrations/index.js";
import { distinctUntilChanged, distinctUntilKeyChanged } from "./distinct.js";

describe("distinctUntilChanged", () => {
  it("should emit only distinct consecutive values", () => {
    const values: number[] = [];

    pipe(from([1, 1, 2, 2, 2, 3, 1, 1]), distinctUntilChanged()).subscribe((v) => values.push(v));

    expect(values).toEqual([1, 2, 3, 1]);
  });

  it("should use custom comparator", () => {
    const values: { x: number; y: number }[] = [];

    pipe(
      from([
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 1 },
      ]),
      distinctUntilChanged((a, b) => a.x === b.x),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]);
  });
});

describe("distinctUntilKeyChanged", () => {
  it("should emit only when key value changes", () => {
    const values: { id: number; name: string }[] = [];

    pipe(
      from([
        { id: 1, name: "Alice" },
        { id: 1, name: "Bob" },
        { id: 2, name: "Charlie" },
      ]),
      distinctUntilKeyChanged((x) => x.id),
    ).subscribe((v) => values.push(v));

    expect(values).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Charlie" },
    ]);
  });
});
