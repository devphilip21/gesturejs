import { describe, expect, it, vi } from "vitest";
import { createStream } from "../core/stream.js";
import { createSubject } from "../internal/subject.js";
import { createTestSignal, type TestSignal } from "../internal/test-utils.js";
import { share, shareReplay } from "./share.js";

describe("share", () => {
  it("should share single subscription among multiple subscribers", () => {
    let subscribeCount = 0;
    const source = createStream<TestSignal<number>>((observer) => {
      subscribeCount++;
      observer.next(createTestSignal(1));
    });
    const shared = source.pipe(share());

    shared.on(vi.fn());
    shared.on(vi.fn());

    expect(subscribeCount).toBe(1);
  });

  it("should multicast values to all subscribers", () => {
    const source = createSubject<TestSignal<number>>();
    const shared = source.pipe(share());
    const values1: number[] = [];
    const values2: number[] = [];

    shared.on((v) => values1.push(v.value));
    shared.on((v) => values2.push(v.value));
    source.next(createTestSignal(1));
    source.next(createTestSignal(2));

    expect(values1).toEqual([1, 2]);
    expect(values2).toEqual([1, 2]);
  });
});

describe("shareReplay", () => {
  it("should replay last value to new subscribers", () => {
    const source = createSubject<TestSignal<number>>();
    const shared = source.pipe(shareReplay(1));
    const values1: number[] = [];
    const values2: number[] = [];

    shared.on((v) => values1.push(v.value));
    source.next(createTestSignal(1));
    source.next(createTestSignal(2));
    shared.on((v) => values2.push(v.value));
    source.next(createTestSignal(3));

    expect(values1).toEqual([1, 2, 3]);
    expect(values2).toEqual([2, 3]);
  });

  it("should replay multiple values based on buffer size", () => {
    const source = createSubject<TestSignal<number>>();
    const shared = source.pipe(shareReplay(3));
    const values1: number[] = [];
    const values2: number[] = [];

    shared.on((v) => values1.push(v.value)); // First subscriber triggers source subscription
    source.next(createTestSignal(1));
    source.next(createTestSignal(2));
    source.next(createTestSignal(3));
    source.next(createTestSignal(4));
    shared.on((v) => values2.push(v.value)); // Late subscriber gets replayed values

    expect(values1).toEqual([1, 2, 3, 4]);
    expect(values2).toEqual([2, 3, 4]);
  });

  it("should unsubscribe from source when all subscribers unsubscribe", () => {
    const cleanup = vi.fn();
    const source = createStream<TestSignal<number>>((observer) => {
      observer.next(createTestSignal(1));
      return cleanup;
    });
    const shared = source.pipe(shareReplay(1));

    const unsub1 = shared.on(vi.fn());
    const unsub2 = shared.on(vi.fn());

    unsub1();
    expect(cleanup).not.toHaveBeenCalled();

    unsub2();
    expect(cleanup).toHaveBeenCalled();
  });
});
