import { describe, expect, it, vi } from "vitest";
import { createStream } from "../core/stream.js";
import { createTestSignal, fromArray, ofValue, type TestSignal } from "../internal/test-utils.js";
import { switchMap } from "./switch-map.js";

describe("switchMap", () => {
  it("should switch to new inner stream", () => {
    const values: number[] = [];

    fromArray([1, 2])
      .pipe(switchMap((s: TestSignal<number>) => ofValue(s.value * 10)))
      .on((v) => values.push(v.value));

    // Only last stream's value for sync case
    expect(values).toEqual([10, 20]);
  });

  it("should unsubscribe from previous inner stream", () => {
    const cleanupCalls: number[] = [];
    let emitCount = 0;

    fromArray([1, 2, 3])
      .pipe(
        switchMap((s: TestSignal<number>) =>
          createStream((observer) => {
            emitCount++;
            observer.next(createTestSignal(s.value));
            return () => {
              cleanupCalls.push(s.value);
            };
          }),
        ),
      )
      .on(() => {});

    // Each new source signal should cleanup the previous inner stream
    // For sync source, cleanup happens for all but the last
    expect(cleanupCalls).toEqual([1, 2]);
    expect(emitCount).toBe(3);
  });

  it("should pass index to project function", () => {
    const indices: number[] = [];

    fromArray([1, 2, 3])
      .pipe(
        switchMap((s: TestSignal<number>, index) => {
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
        switchMap(() => {
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
        switchMap(() =>
          createStream((observer) => {
            observer.error?.(error);
            return () => {};
          }),
        ),
      )
      .on({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });

  it("should cleanup inner subscription on unsubscribe", () => {
    let cleaned = false;

    const unsub = ofValue(1)
      .pipe(
        switchMap(() =>
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

  it("should call complete when source and current inner stream complete", () => {
    const completeFn = vi.fn();

    fromArray([1, 2])
      .pipe(switchMap((s: TestSignal<number>) => ofValue(s.value)))
      .on({ next: () => {}, complete: completeFn });

    expect(completeFn).toHaveBeenCalledTimes(1);
  });

  it("should handle async inner streams correctly", async () => {
    const values: number[] = [];
    const completeFn = vi.fn();

    // Create a delayed stream
    const delayedStream = (value: number, delay: number) =>
      createStream<TestSignal<number>>((observer) => {
        const timeoutId = setTimeout(() => {
          observer.next(createTestSignal(value));
          observer.complete?.();
        }, delay);
        return () => clearTimeout(timeoutId);
      });

    fromArray([1, 2, 3])
      .pipe(switchMap((s: TestSignal<number>) => delayedStream(s.value * 10, 10)))
      .on({ next: (v) => values.push(v.value), complete: completeFn });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Only the last inner stream should emit (30)
    expect(values).toEqual([30]);
    expect(completeFn).toHaveBeenCalledTimes(1);
  });
});
