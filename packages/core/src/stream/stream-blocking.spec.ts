import { describe, expect, it, vi } from "vitest";
import { createStream } from "../stream/stream.js";

describe("Stream blocking", () => {
  it("should emit values when not blocked", () => {
    const values: number[] = [];

    const source = createStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
    });

    source.subscribe((v) => values.push(v));

    expect(values).toEqual([1, 2, 3]);
  });

  it("should drop events when blocked", () => {
    const values: number[] = [];
    let emit: (v: number) => void = () => {};

    const source = createStream<number>((observer) => {
      emit = (v) => observer.next(v);
    });

    source.subscribe((v) => values.push(v));

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

    const source = createStream<number>((observer) => {
      emit = (v) => observer.next(v);
    });

    source.subscribe((v) => values.push(v));

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

    const source = createStream<number>((observer) => {
      observer.error?.(testError);
    });

    source.block();
    source.subscribe({ next: vi.fn(), error });

    expect(error).toHaveBeenCalledWith(testError);
  });

  it("should not block complete signals", () => {
    const complete = vi.fn();

    const source = createStream<number>((observer) => {
      observer.complete?.();
    });

    source.block();
    source.subscribe({ next: vi.fn(), complete });

    expect(complete).toHaveBeenCalled();
  });

  it("should call cleanup on unsubscribe", () => {
    const cleanup = vi.fn();

    const unsub = createStream<number>((observer) => {
      observer.next(1);
      return cleanup;
    }).subscribe(vi.fn());

    unsub();

    expect(cleanup).toHaveBeenCalled();
  });
});
