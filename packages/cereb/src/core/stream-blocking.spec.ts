import { describe, expect, it, vi } from "vitest";
import { createSignal, type Signal } from "./signal.js";
import { createStream } from "./stream.js";

type TestSignal = Signal<"test", number>;

function testSignal(value: number): TestSignal {
  return createSignal("test", value);
}

describe("Stream blocking", () => {
  it("should emit values when not blocked", () => {
    const values: number[] = [];

    const source = createStream<TestSignal>((observer) => {
      observer.next(testSignal(1));
      observer.next(testSignal(2));
      observer.next(testSignal(3));
    });

    source.on((v) => values.push(v.value));

    expect(values).toEqual([1, 2, 3]);
  });

  it("should drop events when blocked", () => {
    const values: number[] = [];
    let emit: (v: number) => void = () => {};

    const source = createStream<TestSignal>((observer) => {
      emit = (v) => observer.next(testSignal(v));
    });

    source.on((v) => values.push(v.value));

    emit(1);
    source.block();
    emit(2);
    emit(3);

    expect(values).toEqual([1]);
    expect(source.isBlocked).toBe(true);
  });

  it("should resume emitting after unblock", () => {
    const values: number[] = [];
    let emit: (v: number) => void = () => {};

    const source = createStream<TestSignal>((observer) => {
      emit = (v) => observer.next(testSignal(v));
    });

    source.on((v) => values.push(v.value));

    emit(1);
    source.block();
    emit(2);
    source.unblock();
    emit(3);

    expect(values).toEqual([1, 3]);
    expect(source.isBlocked).toBe(false);
  });

  it("should not block error signals", () => {
    const error = vi.fn();
    const testError = new Error("test");

    const source = createStream<TestSignal>((observer) => {
      observer.error?.(testError);
    });

    source.block();
    source.on({ next: vi.fn(), error });

    expect(error).toHaveBeenCalledWith(testError);
  });

  it("should not block complete signals", () => {
    const complete = vi.fn();

    const source = createStream<TestSignal>((observer) => {
      observer.complete?.();
    });

    source.block();
    source.on({ next: vi.fn(), complete });

    expect(complete).toHaveBeenCalled();
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
});
