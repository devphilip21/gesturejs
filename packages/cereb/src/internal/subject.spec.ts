import { describe, expect, it, vi } from "vitest";
import { createBehaviorSubject, createSubject } from "./subject.js";

describe("createSubject", () => {
  it("should multicast to multiple subscribers", () => {
    const subject = createSubject<number>();
    const values1: number[] = [];
    const values2: number[] = [];

    subject.subscribe((v) => values1.push(v));
    subject.subscribe((v) => values2.push(v));
    subject.next(1);
    subject.next(2);

    expect(values1).toEqual([1, 2]);
    expect(values2).toEqual([1, 2]);
  });

  it("should allow unsubscription", () => {
    const subject = createSubject<number>();
    const values: number[] = [];

    const unsub = subject.subscribe((v) => values.push(v));
    subject.next(1);
    unsub();
    subject.next(2);

    expect(values).toEqual([1]);
  });

  it("should not emit after complete", () => {
    const subject = createSubject<number>();
    const next = vi.fn();
    const complete = vi.fn();

    subject.subscribe({ next, complete });
    subject.complete();
    subject.next(1);

    expect(next).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalled();
    expect(subject.closed).toBe(true);
  });

  it("should propagate error to subscribers", () => {
    const subject = createSubject<number>();
    const errorFn = vi.fn();

    subject.subscribe({ next: vi.fn(), error: errorFn });
    subject.error(new Error("test"));

    expect(errorFn).toHaveBeenCalled();
  });

  it("should not emit after error and set closed to true", () => {
    const subject = createSubject<number>();
    const next = vi.fn();
    const errorFn = vi.fn();

    subject.subscribe({ next, error: errorFn });
    subject.error(new Error("test"));
    subject.next(1);

    expect(errorFn).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(subject.closed).toBe(true);
  });
});

describe("createBehaviorSubject", () => {
  it("should emit initial value to new subscriber", () => {
    const subject = createBehaviorSubject(10);
    const values: number[] = [];

    subject.subscribe((v) => values.push(v));

    expect(values).toEqual([10]);
    expect(subject.getValue()).toBe(10);
  });

  it("should emit current value to late subscriber", () => {
    const subject = createBehaviorSubject(0);
    const values: number[] = [];

    subject.next(5);
    subject.next(10);
    subject.subscribe((v) => values.push(v));

    expect(values).toEqual([10]);
    expect(subject.getValue()).toBe(10);
  });

  it("should multicast with late subscriber getting current value", () => {
    const subject = createBehaviorSubject(0);
    const values1: number[] = [];
    const values2: number[] = [];

    subject.subscribe((v) => values1.push(v));
    subject.next(1);
    subject.subscribe((v) => values2.push(v));
    subject.next(2);

    expect(values1).toEqual([0, 1, 2]);
    expect(values2).toEqual([1, 2]);
  });
});
