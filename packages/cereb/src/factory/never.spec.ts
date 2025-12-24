import { describe, expect, it, vi } from "vitest";
import { never } from "./never.js";

describe("never", () => {
  it("should never emit or complete", () => {
    const next = vi.fn();
    const complete = vi.fn();

    never().subscribe({ next, complete });

    expect(next).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });
});
