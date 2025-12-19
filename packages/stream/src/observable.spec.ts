import { describe, it, expect, vi } from "vitest";
import { createObservable, toObserver } from "./observable.js";

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

describe("createObservable", () => {
  it("should emit values and call complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    createObservable<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.complete?.();
    }).subscribe({ next: (v) => values.push(v), complete });

    expect(values).toEqual([1, 2]);
    expect(complete).toHaveBeenCalled();
  });

  it("should call error handler", () => {
    const error = vi.fn();
    const testError = new Error("test");

    createObservable<number>((observer) => {
      observer.error?.(testError);
    }).subscribe({ next: vi.fn(), error });

    expect(error).toHaveBeenCalledWith(testError);
  });

  it("should call cleanup on unsubscribe", () => {
    const cleanup = vi.fn();

    const unsub = createObservable<number>((observer) => {
      observer.next(1);
      return cleanup;
    }).subscribe(vi.fn());

    unsub();

    expect(cleanup).toHaveBeenCalled();
  });
});
