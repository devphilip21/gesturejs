import { describe, expect, it, vi } from "vitest";
import { from } from "./from.js";

describe("from", () => {
  it("should emit values from iterable and complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    from([1, 2, 3]).subscribe({ next: (v) => values.push(v), complete });

    expect(values).toEqual([1, 2, 3]);
    expect(complete).toHaveBeenCalled();
  });
});
