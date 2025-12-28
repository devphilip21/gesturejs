import { describe, expect, it, vi } from "vitest";
import type { Signal } from "../core/signal.js";
import { createStream, type Observer, type Stream } from "../core/stream.js";
import { createTestSignal, type TestSignal } from "../internal/test-utils.js";
import { pipe } from "../ochestrations/pipe.js";
import { sessionJoin } from "./session-join.js";

interface MockObserver<T extends Signal> {
  observer: Observer<T> | null;
  emit: (value: T) => void;
  stream: Stream<T>;
}

function createMockStream<T extends Signal>(): MockObserver<T> {
  let observer: Observer<T> | null = null;

  const stream = createStream<T>((obs) => {
    observer = obs;
    return () => {
      observer = null;
    };
  });

  return {
    get observer() {
      return observer;
    },
    emit: (value: T) => observer?.next(value),
    stream,
  };
}

describe("sessionJoin", () => {
  it("should pass signals when gate is active", () => {
    const values: string[] = [];
    const gate = createMockStream<TestSignal<{ phase: "down" | "up" }>>();
    const source = createMockStream<TestSignal<string>>();

    pipe(
      source.stream,
      sessionJoin(gate.stream, {
        gateActive: (s) => s.value.phase === "down",
        gateInactive: (s) => s.value.phase === "up",
      }),
    ).subscribe((v) => values.push(v.value));

    // Signal before gate is active should be blocked
    source.emit(createTestSignal("blocked1"));
    expect(values).toEqual([]);

    // Activate gate
    gate.emit(createTestSignal({ phase: "down" }));

    // Signal after gate is active should pass
    source.emit(createTestSignal("passed1"));
    source.emit(createTestSignal("passed2"));
    expect(values).toEqual(["passed1", "passed2"]);

    // Deactivate gate
    gate.emit(createTestSignal({ phase: "up" }));

    // Signal after gate is inactive should be blocked
    source.emit(createTestSignal("blocked2"));
    expect(values).toEqual(["passed1", "passed2"]);
  });

  it("should handle multiple gate cycles", () => {
    const values: number[] = [];
    const gate = createMockStream<TestSignal<boolean>>();
    const source = createMockStream<TestSignal<number>>();

    pipe(
      source.stream,
      sessionJoin(gate.stream, {
        gateActive: (s) => s.value === true,
        gateInactive: (s) => s.value === false,
      }),
    ).subscribe((v) => values.push(v.value));

    source.emit(createTestSignal(1)); // blocked
    gate.emit(createTestSignal(true));
    source.emit(createTestSignal(2)); // passed
    gate.emit(createTestSignal(false));
    source.emit(createTestSignal(3)); // blocked
    gate.emit(createTestSignal(true));
    source.emit(createTestSignal(4)); // passed
    gate.emit(createTestSignal(false));
    source.emit(createTestSignal(5)); // blocked

    expect(values).toEqual([2, 4]);
  });

  it("should cleanup both subscriptions", () => {
    const gateCleanup = vi.fn();
    const sourceCleanup = vi.fn();

    const gate = createStream<TestSignal<boolean>>(() => gateCleanup);
    const source = createStream<TestSignal<number>>(() => sourceCleanup);

    const unsub = pipe(
      source,
      sessionJoin(gate, {
        gateActive: (s) => s.value === true,
        gateInactive: (s) => s.value === false,
      }),
    ).subscribe({ next: vi.fn() });

    unsub();

    expect(gateCleanup).toHaveBeenCalled();
    expect(sourceCleanup).toHaveBeenCalled();
  });

  it("should handle errors in gate predicates", () => {
    const error = new Error("predicate error");
    const errorFn = vi.fn();
    const gate = createMockStream<TestSignal<boolean>>();
    const source = createMockStream<TestSignal<number>>();

    pipe(
      source.stream,
      sessionJoin(gate.stream, {
        gateActive: () => {
          throw error;
        },
        gateInactive: () => false,
      }),
    ).subscribe({ next: vi.fn(), error: errorFn });

    gate.emit(createTestSignal(true));

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});
