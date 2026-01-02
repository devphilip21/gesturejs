import { describe, expect, it, vi } from "vitest";
import type { Stream } from "../core/stream.js";
import { createStream } from "../core/stream.js";
import { createTestSignal, fromArray, ofValue, type TestSignal } from "../internal/test-utils.js";
import { flatMap } from "./flat-map.js";

describe("flatMap", () => {
  it("should flatten inner streams", () => {
    const values: number[] = [];

    fromArray([1, 2])
      .pipe(flatMap((s: TestSignal<number>) => fromArray([s.value * 10, s.value * 10 + 1])))
      .on((v) => values.push(v.value));

    expect(values).toEqual([10, 11, 20, 21]);
  });

  it("should handle single value streams", () => {
    const values: number[] = [];

    ofValue(5)
      .pipe(flatMap((s: TestSignal<number>) => ofValue(s.value * 2)))
      .on((v) => values.push(v.value));

    expect(values).toEqual([10]);
  });

  it("should pass index to project function", () => {
    const indices: number[] = [];

    fromArray([1, 2, 3])
      .pipe(
        flatMap((s: TestSignal<number>, index) => {
          indices.push(index);
          return ofValue(s.value);
        }),
      )
      .on(() => {});

    expect(indices).toEqual([0, 1, 2]);
  });

  it("should catch errors in project function", () => {
    const error = new Error("project error");
    const errorFn = vi.fn();

    ofValue(1)
      .pipe(
        flatMap(() => {
          throw error;
        }),
      )
      .on({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });

  it("should propagate errors from inner stream", () => {
    const error = new Error("inner error");
    const errorFn = vi.fn();

    ofValue(1)
      .pipe(
        flatMap(() =>
          createStream((observer) => {
            observer.error?.(error);
            return () => {};
          }),
        ),
      )
      .on({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });

  it("should cleanup all inner subscriptions on unsubscribe", () => {
    const cleanupCalls: number[] = [];

    const unsub = fromArray([1, 2, 3])
      .pipe(
        flatMap((s: TestSignal<number>) =>
          createStream((observer) => {
            observer.next(createTestSignal(s.value));
            return () => {
              cleanupCalls.push(s.value);
            };
          }),
        ),
      )
      .on(() => {});

    unsub();

    expect(cleanupCalls.sort()).toEqual([1, 2, 3]);
  });

  it("should call complete when source and all inner streams complete", () => {
    const completeFn = vi.fn();

    fromArray([1, 2])
      .pipe(flatMap((s: TestSignal<number>) => ofValue(s.value)))
      .on({ next: () => {}, complete: completeFn });

    expect(completeFn).toHaveBeenCalledTimes(1);
  });
});

describe("flatMap - Monad Laws", () => {
  // Helper: wrap value in stream (return/pure)
  const pure = <V>(value: V): Stream<TestSignal<V>> => ofValue(value);

  // 1. Left Identity: pure(a).flatMap(f) === f(a)
  it("satisfies left identity", () => {
    const a = 42;
    const f = (s: TestSignal<number>) => ofValue(s.value * 2);

    const left: number[] = [];
    const right: number[] = [];

    pure(a)
      .pipe(flatMap(f))
      .on((s) => left.push(s.value));
    f(createTestSignal(a)).on((s) => right.push(s.value));

    expect(left).toEqual(right);
  });

  // 2. Right Identity: m.flatMap(pure) === m
  it("satisfies right identity", () => {
    const values = [1, 2, 3];

    const left: number[] = [];
    const right: number[] = [];

    fromArray(values)
      .pipe(flatMap((s: TestSignal<number>) => pure(s.value)))
      .on((s) => left.push(s.value));

    fromArray(values).on((s) => right.push(s.value));

    expect(left).toEqual(right);
  });

  // 3. Associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))
  it("satisfies associativity", () => {
    const values = [1, 2];
    const f = (s: TestSignal<number>) => fromArray([s.value, s.value + 1]);
    const g = (s: TestSignal<number>) => pure(s.value * 10);

    const left: number[] = [];
    const right: number[] = [];

    fromArray(values)
      .pipe(flatMap(f), flatMap(g))
      .on((s) => left.push(s.value));

    fromArray(values)
      .pipe(flatMap((x: TestSignal<number>) => f(x).pipe(flatMap(g))))
      .on((s) => right.push(s.value));

    expect(left.sort()).toEqual(right.sort());
  });
});
