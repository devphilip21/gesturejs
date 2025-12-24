import { describe, expect, it, vi } from "vitest";
import { fromPromise } from "./from-promise.js";

describe("fromPromise", () => {
  it("should emit value on resolve and complete", async () => {
    const values: number[] = [];
    const complete = vi.fn();

    fromPromise(Promise.resolve(42)).subscribe({
      next: (v) => values.push(v),
      complete,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(values).toEqual([42]);
    expect(complete).toHaveBeenCalled();
  });

  it("should emit error on reject", async () => {
    const error = new Error("test");
    const errorFn = vi.fn();

    fromPromise(Promise.reject(error)).subscribe({ next: vi.fn(), error: errorFn });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
