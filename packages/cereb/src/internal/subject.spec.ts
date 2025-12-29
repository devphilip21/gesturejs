import { describe, expect, it, vi } from "vitest";
import { createBehaviorSubject, createSubject } from "./subject.js";
import { createTestSignal, type TestSignal } from "./test-utils.js";

describe("createSubject", () => {
  it("should multicast to multiple subscribers", () => {
    const subject = createSubject<TestSignal<number>>();
    const values1: number[] = [];
    const values2: number[] = [];

    subject.on((v) => values1.push(v.value));
    subject.on((v) => values2.push(v.value));
    subject.next(createTestSignal(1));
    subject.next(createTestSignal(2));

    expect(values1).toEqual([1, 2]);
    expect(values2).toEqual([1, 2]);
  });

  it("should allow unsubscription", () => {
    const subject = createSubject<TestSignal<number>>();
    const values: number[] = [];

    const unsub = subject.on((v) => values.push(v.value));
    subject.next(createTestSignal(1));
    unsub();
    subject.next(createTestSignal(2));

    expect(values).toEqual([1]);
  });

  it("should not emit after complete", () => {
    const subject = createSubject<TestSignal<number>>();
    const next = vi.fn();
    const complete = vi.fn();

    subject.on({ next, complete });
    subject.complete();
    subject.next(createTestSignal(1));

    expect(next).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalled();
    expect(subject.closed).toBe(true);
  });

  it("should propagate error to subscribers", () => {
    const subject = createSubject<TestSignal<number>>();
    const errorFn = vi.fn();

    subject.on({ next: vi.fn(), error: errorFn });
    subject.error(new Error("test"));

    expect(errorFn).toHaveBeenCalled();
  });

  it("should not emit after error and set closed to true", () => {
    const subject = createSubject<TestSignal<number>>();
    const next = vi.fn();
    const errorFn = vi.fn();

    subject.on({ next, error: errorFn });
    subject.error(new Error("test"));
    subject.next(createTestSignal(1));

    expect(errorFn).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(subject.closed).toBe(true);
  });
});

describe("createBehaviorSubject", () => {
  it("should emit initial value to new subscriber", () => {
    const subject = createBehaviorSubject(createTestSignal(10));
    const values: number[] = [];

    subject.on((v) => values.push(v.value));

    expect(values).toEqual([10]);
    expect(subject.getValue().value).toBe(10);
  });

  it("should emit current value to late subscriber", () => {
    const subject = createBehaviorSubject(createTestSignal(0));
    const values: number[] = [];

    subject.next(createTestSignal(5));
    subject.next(createTestSignal(10));
    subject.on((v) => values.push(v.value));

    expect(values).toEqual([10]);
    expect(subject.getValue().value).toBe(10);
  });

  it("should multicast with late subscriber getting current value", () => {
    const subject = createBehaviorSubject(createTestSignal(0));
    const values1: number[] = [];
    const values2: number[] = [];

    subject.on((v) => values1.push(v.value));
    subject.next(createTestSignal(1));
    subject.on((v) => values2.push(v.value));
    subject.next(createTestSignal(2));

    expect(values1).toEqual([0, 1, 2]);
    expect(values2).toEqual([1, 2]);
  });
});
