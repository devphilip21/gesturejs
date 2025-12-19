import { describe, it, expect, vi } from "vitest";
import { share, shareReplay } from "./share.js";
import { pipe } from "../pipe.js";
import { createSubject } from "../subject.js";
import { createObservable } from "../observable.js";

describe("share", () => {
  it("should share single subscription among multiple subscribers", () => {
    let subscribeCount = 0;
    const source = createObservable<number>((observer) => {
      subscribeCount++;
      observer.next(1);
    });
    const shared = pipe(source, share());

    shared.subscribe(vi.fn());
    shared.subscribe(vi.fn());

    expect(subscribeCount).toBe(1);
  });

  it("should multicast values to all subscribers", () => {
    const source = createSubject<number>();
    const shared = pipe(source, share());
    const values1: number[] = [];
    const values2: number[] = [];

    shared.subscribe((v) => values1.push(v));
    shared.subscribe((v) => values2.push(v));
    source.next(1);
    source.next(2);

    expect(values1).toEqual([1, 2]);
    expect(values2).toEqual([1, 2]);
  });
});

describe("shareReplay", () => {
  it("should replay last value to new subscribers", () => {
    const source = createSubject<number>();
    const shared = pipe(source, shareReplay(1));
    const values1: number[] = [];
    const values2: number[] = [];

    shared.subscribe((v) => values1.push(v));
    source.next(1);
    source.next(2);
    shared.subscribe((v) => values2.push(v));
    source.next(3);

    expect(values1).toEqual([1, 2, 3]);
    expect(values2).toEqual([2, 3]);
  });

  it("should replay multiple values based on buffer size", () => {
    const source = createSubject<number>();
    const shared = pipe(source, shareReplay(3));
    const values1: number[] = [];
    const values2: number[] = [];

    shared.subscribe((v) => values1.push(v)); // First subscriber triggers source subscription
    source.next(1);
    source.next(2);
    source.next(3);
    source.next(4);
    shared.subscribe((v) => values2.push(v)); // Late subscriber gets replayed values

    expect(values1).toEqual([1, 2, 3, 4]);
    expect(values2).toEqual([2, 3, 4]);
  });

  it("should unsubscribe from source when all subscribers unsubscribe", () => {
    const cleanup = vi.fn();
    const source = createObservable<number>((observer) => {
      observer.next(1);
      return cleanup;
    });
    const shared = pipe(source, shareReplay(1));

    const unsub1 = shared.subscribe(vi.fn());
    const unsub2 = shared.subscribe(vi.fn());

    unsub1();
    expect(cleanup).not.toHaveBeenCalled();

    unsub2();
    expect(cleanup).toHaveBeenCalled();
  });
});
