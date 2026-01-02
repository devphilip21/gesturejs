import { describe, expect, it, vi } from "vitest";
import { createStream } from "../core/stream.js";
import { createTestSignal, fromArray, ofValue, type TestSignal } from "../internal/test-utils.js";
import { exhaustMap } from "./exhaust-map.js";

describe("exhaustMap", () => {
  it("should map and flatten when no active stream", () => {
    const values: number[] = [];

    // With sync streams, each completes before the next starts
    fromArray([1, 2, 3])
      .pipe(exhaustMap((s: TestSignal<number>) => ofValue(s.value * 10)))
      .on((v) => values.push(v.value));

    expect(values).toEqual([10, 20, 30]);
  });

  it("should ignore signals while inner stream is active", async () => {
    const values: number[] = [];
    const projectCalls: number[] = [];

    // Create a delayed stream that doesn't complete immediately
    const delayedStream = (value: number) =>
      createStream<TestSignal<number>>((observer) => {
        projectCalls.push(value);
        const timeoutId = setTimeout(() => {
          observer.next(createTestSignal(value * 10));
          observer.complete?.();
        }, 50);
        return () => clearTimeout(timeoutId);
      });

    // Emit signals rapidly
    const source = createStream<TestSignal<number>>((observer) => {
      observer.next(createTestSignal(1));
      setTimeout(() => observer.next(createTestSignal(2)), 10);
      setTimeout(() => observer.next(createTestSignal(3)), 20);
      setTimeout(() => observer.complete?.(), 100);
      return () => {};
    });

    source
      .pipe(exhaustMap((s: TestSignal<number>) => delayedStream(s.value)))
      .on((v) => values.push(v.value));

    // Wait for all async operations
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Only first signal should be processed (2 and 3 ignored while 1 is active)
    expect(projectCalls).toEqual([1]);
    expect(values).toEqual([10]);
  });

  it("should pass index to project function", () => {
    const indices: number[] = [];

    fromArray([1, 2, 3])
      .pipe(
        exhaustMap((s: TestSignal<number>, index) => {
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
        exhaustMap(() => {
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
        exhaustMap(() =>
          createStream((observer) => {
            observer.error?.(error);
            return () => {};
          }),
        ),
      )
      .on({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });

  it("should reset active state on error in project", () => {
    const values: number[] = [];
    let callCount = 0;

    fromArray([1, 2])
      .pipe(
        exhaustMap((s: TestSignal<number>) => {
          callCount++;
          if (s.value === 1) {
            throw new Error("first error");
          }
          return ofValue(s.value * 10);
        }),
      )
      .on({ next: (v) => values.push(v.value), error: () => {} });

    // After error, should be able to process next signal
    expect(callCount).toBe(2);
    expect(values).toEqual([20]);
  });

  it("should cleanup inner subscription on unsubscribe", () => {
    let cleaned = false;

    const unsub = ofValue(1)
      .pipe(
        exhaustMap(() =>
          createStream((observer) => {
            observer.next(createTestSignal(1));
            return () => {
              cleaned = true;
            };
          }),
        ),
      )
      .on(() => {});

    unsub();

    expect(cleaned).toBe(true);
  });

  it("should call complete when source completes and no active stream", () => {
    const completeFn = vi.fn();

    fromArray([1, 2])
      .pipe(exhaustMap((s: TestSignal<number>) => ofValue(s.value)))
      .on({ next: () => {}, complete: completeFn });

    expect(completeFn).toHaveBeenCalledTimes(1);
  });

  it("should process new signals after inner stream completes", async () => {
    const values: number[] = [];
    const projectCalls: number[] = [];

    const delayedStream = (value: number, delay: number) =>
      createStream<TestSignal<number>>((observer) => {
        projectCalls.push(value);
        const timeoutId = setTimeout(() => {
          observer.next(createTestSignal(value * 10));
          observer.complete?.();
        }, delay);
        return () => clearTimeout(timeoutId);
      });

    // Emit signals with enough time between them
    const source = createStream<TestSignal<number>>((observer) => {
      observer.next(createTestSignal(1));
      setTimeout(() => observer.next(createTestSignal(2)), 60); // After first completes
      setTimeout(() => observer.complete?.(), 150);
      return () => {};
    });

    source
      .pipe(exhaustMap((s: TestSignal<number>) => delayedStream(s.value, 30)))
      .on((v) => values.push(v.value));

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Both signals should be processed (with gap between them)
    expect(projectCalls).toEqual([1, 2]);
    expect(values).toEqual([10, 20]);
  });
});
