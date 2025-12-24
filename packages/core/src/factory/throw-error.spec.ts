import { describe, expect, it, vi } from "vitest";
import { throwError } from "./throw-error.js";

describe("throwError", () => {
  it("should emit error immediately", () => {
    const error = new Error("test");
    const errorFn = vi.fn();

    throwError(error).subscribe({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
