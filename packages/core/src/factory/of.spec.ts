import { describe, expect, it, vi } from "vitest";
import { of } from "./of.js";

describe("of", () => {
  it("should emit single value and complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    of(42).subscribe({ next: (v) => values.push(v), complete });

    expect(values).toEqual([42]);
    expect(complete).toHaveBeenCalled();
  });
});
