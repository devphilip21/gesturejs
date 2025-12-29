import { describe, expect, it, vi } from "vitest";
import type { Signal } from "../core/signal.js";
import { createStream, type Stream } from "../core/stream.js";
import { reduce } from "./reduce.js";

interface InputValue {
  delta: number;
}

interface TestInputSignal extends Signal<"test-input", InputValue> {
  kind: "test-input";
  value: InputValue;
}

function createInputSignal(delta: number): TestInputSignal {
  return {
    kind: "test-input",
    value: { delta },
    deviceId: "test-device",
    createdAt: Date.now(),
  };
}

function fromDeltas(deltas: number[]): Stream<TestInputSignal> {
  return createStream((observer) => {
    for (const delta of deltas) {
      observer.next(createInputSignal(delta));
    }
    observer.complete?.();
    return () => {};
  });
}

interface AccumulatedValue {
  sum: number;
  count: number;
}

describe("reduce", () => {
  it("should accumulate values over time", () => {
    const results: AccumulatedValue[] = [];

    fromDeltas([1, 2, 3, 4])
      .pipe(
        reduce<TestInputSignal, AccumulatedValue>(
          (acc, signal) => ({
            sum: acc.sum + signal.value.delta,
            count: acc.count + 1,
          }),
          { sum: 0, count: 0 },
        ),
      )
      .on((signal) => {
        results.push({ sum: signal.value.sum, count: signal.value.count });
      });

    expect(results).toEqual([
      { sum: 1, count: 1 },
      { sum: 3, count: 2 },
      { sum: 6, count: 3 },
      { sum: 10, count: 4 },
    ]);
  });

  it("should use seed as initial accumulator", () => {
    const values: number[] = [];

    fromDeltas([1, 2])
      .pipe(
        reduce<TestInputSignal, { sum: number }>(
          (acc, signal) => ({ sum: acc.sum + signal.value.delta }),
          { sum: 100 },
        ),
      )
      .on((signal) => values.push(signal.value.sum));

    expect(values).toEqual([101, 103]);
  });

  it("should preserve original signal kind", () => {
    const kinds: string[] = [];

    fromDeltas([1, 2, 3])
      .pipe(
        reduce<TestInputSignal, { sum: number }>(
          (acc, signal) => ({ sum: acc.sum + signal.value.delta }),
          { sum: 0 },
        ),
      )
      .on((signal) => kinds.push(signal.kind));

    expect(kinds).toEqual(["test-input", "test-input", "test-input"]);
  });

  it("should preserve original signal deviceId", () => {
    const deviceIds: string[] = [];

    fromDeltas([1, 2])
      .pipe(
        reduce<TestInputSignal, { sum: number }>(
          (acc, signal) => ({ sum: acc.sum + signal.value.delta }),
          { sum: 0 },
        ),
      )
      .on((signal) => deviceIds.push(signal.deviceId));

    expect(deviceIds).toEqual(["test-device", "test-device"]);
  });

  it("should preserve original signal createdAt", () => {
    const startTime = Date.now();

    fromDeltas([1, 2])
      .pipe(
        reduce<TestInputSignal, { sum: number }>(
          (acc, signal) => ({ sum: acc.sum + signal.value.delta }),
          { sum: 0 },
        ),
      )
      .on((signal) => {
        expect(signal.createdAt).toBeGreaterThanOrEqual(startTime);
      });
  });

  it("should extend value with accumulated properties while preserving original", () => {
    fromDeltas([5])
      .pipe(
        reduce<TestInputSignal, { doubled: number }>(
          (_acc, signal) => ({ doubled: signal.value.delta * 2 }),
          { doubled: 0 },
        ),
      )
      .on((signal) => {
        // Original value preserved
        expect(signal.value.delta).toBe(5);
        // Accumulated value extended
        expect(signal.value.doubled).toBe(10);
      });
  });

  it("should catch errors in reducer function", () => {
    const error = new Error("reducer error");
    const errorFn = vi.fn();

    fromDeltas([1])
      .pipe(
        reduce<TestInputSignal, { sum: number }>(
          () => {
            throw error;
          },
          { sum: 0 },
        ),
      )
      .on({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });

  it("should emit each intermediate result", () => {
    const values: number[] = [];

    fromDeltas([1, 2, 3])
      .pipe(
        reduce<TestInputSignal, { total: number }>(
          (acc, signal) => ({ total: acc.total + signal.value.delta }),
          { total: 0 },
        ),
      )
      .on((signal) => values.push(signal.value.total));

    expect(values).toEqual([1, 3, 6]);
  });

  it("should have access to full signal in reducer", () => {
    const receivedSignals: TestInputSignal[] = [];

    fromDeltas([42])
      .pipe(
        reduce<TestInputSignal, { seen: boolean }>(
          (_acc, signal) => {
            receivedSignals.push(signal);
            return { seen: true };
          },
          { seen: false },
        ),
      )
      .on(() => {});

    expect(receivedSignals).toHaveLength(1);
    expect(receivedSignals[0].kind).toBe("test-input");
    expect(receivedSignals[0].value.delta).toBe(42);
    expect(receivedSignals[0].deviceId).toBe("test-device");
  });
});
