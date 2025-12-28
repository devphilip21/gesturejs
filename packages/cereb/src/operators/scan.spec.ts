import { describe, expect, it, vi } from "vitest";
import { createTestSignal, fromArray, type TestSignal } from "../internal/test-utils.js";
import { pipe } from "../ochestrations/pipe.js";
import { scan } from "./scan.js";

describe("scan", () => {
  it("should accumulate values over time", () => {
    const values: number[] = [];

    pipe(
      fromArray([1, 2, 3, 4]),
      scan(
        (acc: TestSignal<number>, curr: TestSignal<number>) =>
          createTestSignal(acc.value + curr.value),
        createTestSignal(0),
      ),
    ).subscribe((v) => values.push(v.value));

    expect(values).toEqual([1, 3, 6, 10]);
  });

  it("should use seed as initial accumulator", () => {
    const values: number[] = [];

    pipe(
      fromArray([1, 2]),
      scan(
        (acc: TestSignal<number>, curr: TestSignal<number>) =>
          createTestSignal(acc.value + curr.value),
        createTestSignal(100),
      ),
    ).subscribe((v) => values.push(v.value));

    expect(values).toEqual([101, 103]);
  });

  it("should catch errors in accumulator function", () => {
    const error = new Error("accumulator error");
    const errorFn = vi.fn();

    pipe(
      fromArray([1]),
      scan(() => {
        throw error;
      }, createTestSignal(0)),
    ).subscribe({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });

  it("should emit each intermediate result", () => {
    const values: string[] = [];

    pipe(
      fromArray(["a", "b", "c"]),
      scan(
        (acc: TestSignal<string>, curr: TestSignal<string>) =>
          createTestSignal(acc.value + curr.value),
        createTestSignal(""),
      ),
    ).subscribe((v) => values.push(v.value));

    expect(values).toEqual(["a", "ab", "abc"]);
  });
});
