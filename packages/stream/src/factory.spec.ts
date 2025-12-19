import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fromEvent,
  fromPromise,
  from,
  of,
  empty,
  never,
  interval,
  timer,
  throwError,
  defer,
} from "./factory.js";

describe("fromEvent", () => {
  it("should emit events and cleanup on unsubscribe", () => {
    const target = new EventTarget();
    const observable = fromEvent(target, "click");
    const values: Event[] = [];

    const unsub = observable.subscribe((v) => values.push(v));
    target.dispatchEvent(new Event("click"));
    target.dispatchEvent(new Event("click"));
    unsub();
    target.dispatchEvent(new Event("click"));

    expect(values).toHaveLength(2);
  });
});

describe("fromPromise", () => {
  it("should emit value on resolve and complete", async () => {
    const values: number[] = [];
    const complete = vi.fn();

    fromPromise(Promise.resolve(42)).subscribe({
      next: (v) => values.push(v),
      complete,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(values).toEqual([42]);
    expect(complete).toHaveBeenCalled();
  });

  it("should emit error on reject", async () => {
    const error = new Error("test");
    const errorFn = vi.fn();

    fromPromise(Promise.reject(error)).subscribe({ next: vi.fn(), error: errorFn });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});

describe("from", () => {
  it("should emit values from iterable and complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    from([1, 2, 3]).subscribe({ next: (v) => values.push(v), complete });

    expect(values).toEqual([1, 2, 3]);
    expect(complete).toHaveBeenCalled();
  });
});

describe("of", () => {
  it("should emit single value and complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    of(42).subscribe({ next: (v) => values.push(v), complete });

    expect(values).toEqual([42]);
    expect(complete).toHaveBeenCalled();
  });
});

describe("empty", () => {
  it("should complete immediately without emitting", () => {
    const next = vi.fn();
    const complete = vi.fn();

    empty().subscribe({ next, complete });

    expect(next).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalled();
  });
});

describe("never", () => {
  it("should never emit or complete", () => {
    const next = vi.fn();
    const complete = vi.fn();

    never().subscribe({ next, complete });

    expect(next).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });
});

describe("interval", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("should emit incrementing values and cleanup", () => {
    const values: number[] = [];
    const unsub = interval(100).subscribe((v) => values.push(v));

    vi.advanceTimersByTime(350);
    unsub();
    vi.advanceTimersByTime(200);

    expect(values).toEqual([0, 1, 2]);
  });
});

describe("timer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("should emit after delay and complete", () => {
    const values: number[] = [];
    const complete = vi.fn();

    timer(100).subscribe({ next: (v) => values.push(v), complete });

    vi.advanceTimersByTime(100);

    expect(values).toEqual([0]);
    expect(complete).toHaveBeenCalled();
  });

  it("should emit at interval after initial delay", () => {
    const values: number[] = [];

    timer(100, 50).subscribe((v) => values.push(v));

    vi.advanceTimersByTime(200);

    expect(values).toEqual([0, 1, 2]);
  });
});

describe("throwError", () => {
  it("should emit error immediately", () => {
    const error = new Error("test");
    const errorFn = vi.fn();

    throwError(error).subscribe({ next: vi.fn(), error: errorFn });

    expect(errorFn).toHaveBeenCalledWith(error);
  });
});

describe("defer", () => {
  it("should create new observable on each subscribe", () => {
    let callCount = 0;
    const observable = defer(() => {
      callCount++;
      return of(callCount);
    });

    const values1: number[] = [];
    const values2: number[] = [];

    observable.subscribe((v) => values1.push(v));
    observable.subscribe((v) => values2.push(v));

    expect(values1).toEqual([1]);
    expect(values2).toEqual([2]);
  });
});
