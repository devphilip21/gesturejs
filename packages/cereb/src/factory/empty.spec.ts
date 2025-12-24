import { describe, expect, it, vi } from "vitest";
import { empty } from "./empty.js";

describe("empty", () => {
  it("should complete immediately without emitting", () => {
    const next = vi.fn();
    const complete = vi.fn();

    empty().subscribe({ next, complete });

    expect(next).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalled();
  });
});
