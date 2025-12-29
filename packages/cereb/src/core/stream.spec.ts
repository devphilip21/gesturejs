import { describe, expect, it, vi } from "vitest";
import { filter, map } from "../operators/index.js";
import { createSignal, type Signal } from "./signal.js";
import { createStream, toObserver } from "./stream.js";

type TestSignal = Signal<"test", number>;

function testSignal(value: number): TestSignal {
  return createSignal("test", value);
}

describe("toObserver", () => {
  it("should convert function to observer", () => {
    const fn = vi.fn();
    const observer = toObserver(fn);

    expect(observer.next).toBe(fn);
  });

  it("should return observer as-is", () => {
    const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
    expect(toObserver(observer)).toBe(observer);
  });
});

describe("createStream", () => {
  it("should emit values and call complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    createStream<TestSignal>((observer) => {
      observer.next(testSignal(1));
      observer.next(testSignal(2));
      observer.complete?.();
    }).on({ next: (v) => values.push(v.value), complete });

    expect(values).toEqual([1, 2]);
    expect(complete).toHaveBeenCalled();
  });

  it("should call error handler", () => {
    const error = vi.fn();
    const testError = new Error("test");

    createStream<TestSignal>((observer) => {
      observer.error?.(testError);
    }).on({ next: vi.fn(), error });

    expect(error).toHaveBeenCalledWith(testError);
  });

  it("should call cleanup on unsubscribe", () => {
    const cleanup = vi.fn();

    const unsub = createStream<TestSignal>((observer) => {
      observer.next(testSignal(1));
      return cleanup;
    }).on(vi.fn());

    unsub();

    expect(cleanup).toHaveBeenCalled();
  });

  describe("pipe method", () => {
    it("should apply operators in order", () => {
      const values: number[] = [];

      createStream<TestSignal>((observer) => {
        for (const v of [1, 2, 3, 4, 5]) {
          observer.next(testSignal(v));
        }
        observer.complete?.();
      })
        .pipe(
          filter((x: TestSignal) => x.value % 2 === 1),
          map((x: TestSignal) => ({ ...x, value: x.value * 10 })),
        )
        .on((v) => values.push(v.value));

      expect(values).toEqual([10, 30, 50]);
    });

    it("should return the same stream when no operators are provided", () => {
      const values: number[] = [];

      createStream<TestSignal>((observer) => {
        for (const v of [1, 2, 3]) {
          observer.next(testSignal(v));
        }
        observer.complete?.();
      })
        .pipe()
        .on((v) => values.push(v.value));

      expect(values).toEqual([1, 2, 3]);
    });

    it("should support nested pipe calls", () => {
      const values: number[] = [];

      createStream<TestSignal>((observer) => {
        for (const v of [1, 2, 3, 4, 5]) {
          observer.next(testSignal(v));
        }
        observer.complete?.();
      })
        .pipe(filter((x: TestSignal) => x.value % 2 === 1))
        .pipe(map((x: TestSignal) => ({ ...x, value: x.value * 10 })))
        .on((v) => values.push(v.value));

      expect(values).toEqual([10, 30, 50]);
    });

    it("should support type transformation", () => {
      const values: string[] = [];

      createStream<TestSignal>((observer) => {
        for (const v of [1, 2, 3]) {
          observer.next(testSignal(v));
        }
        observer.complete?.();
      })
        .pipe(
          map((x: TestSignal) => ({ ...x, value: String(x.value) }) as Signal<"test", string>),
          map((x: Signal<"test", string>) => ({ ...x, value: `${x.value}!` })),
        )
        .on((v) => values.push(v.value));

      expect(values).toEqual(["1!", "2!", "3!"]);
    });
  });
});
