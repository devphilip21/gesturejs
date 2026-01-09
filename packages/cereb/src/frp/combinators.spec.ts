import { describe, expect, it, vi } from "vitest";
import { createSignal, createStream, type Signal } from "../core/index.js";
import { constant, stepper } from "./behavior.js";
import { combine, lift, switcher } from "./combinators.js";

type TestSignal = Signal<"test", number>;

function testSignal(value: number): TestSignal {
  return createSignal("test", value);
}

describe("combine", () => {
  it("should combine two behaviors", () => {
    const a = constant(10);
    const b = constant(20);
    const combined = combine(a, b, (x, y) => x + y);

    expect(combined.sample()).toBe(30);
  });

  it("should combine three behaviors", () => {
    const a = constant(1);
    const b = constant(2);
    const c = constant(3);
    const combined = combine(a, b, c, (x, y, z) => x + y + z);

    expect(combined.sample()).toBe(6);
  });

  it("should combine four behaviors", () => {
    const a = constant(1);
    const b = constant(2);
    const c = constant(3);
    const d = constant(4);
    const combined = combine(a, b, c, d, (w, x, y, z) => w + x + y + z);

    expect(combined.sample()).toBe(10);
  });

  it("should update when any source behavior changes", () => {
    let emitA: ((s: TestSignal) => void) | null = null;
    let emitB: ((s: TestSignal) => void) | null = null;

    const streamA = createStream<TestSignal>((observer) => {
      emitA = (s) => observer.next(s);
    });
    const streamB = createStream<TestSignal>((observer) => {
      emitB = (s) => observer.next(s);
    });

    const a = stepper(10, streamA, (s) => s.value);
    const b = stepper(20, streamB, (s) => s.value);
    const combined = combine(a, b, (x, y) => x + y);

    expect(combined.sample()).toBe(30);

    emitA!(testSignal(15));
    expect(combined.sample()).toBe(35);

    emitB!(testSignal(25));
    expect(combined.sample()).toBe(40);
  });

  it("should call onChange when any source changes", () => {
    let emitA: ((s: TestSignal) => void) | null = null;
    let emitB: ((s: TestSignal) => void) | null = null;
    const callback = vi.fn();

    const streamA = createStream<TestSignal>((observer) => {
      emitA = (s) => observer.next(s);
    });
    const streamB = createStream<TestSignal>((observer) => {
      emitB = (s) => observer.next(s);
    });

    const a = stepper(10, streamA, (s) => s.value);
    const b = stepper(20, streamB, (s) => s.value);
    const combined = combine(a, b, (x, y) => x + y);
    combined.onChange(callback);

    emitA!(testSignal(15));
    expect(callback).toHaveBeenCalledWith(35);

    emitB!(testSignal(25));
    expect(callback).toHaveBeenCalledWith(40);
  });

  it("should dispose and cleanup all subscriptions", () => {
    let emitA: ((s: TestSignal) => void) | null = null;
    const callback = vi.fn();

    const streamA = createStream<TestSignal>((observer) => {
      emitA = (s) => observer.next(s);
    });

    const a = stepper(10, streamA, (s) => s.value);
    const b = constant(20);
    const combined = combine(a, b, (x, y) => x + y);
    combined.onChange(callback);

    combined.dispose();

    expect(combined.isDisposed).toBe(true);
    expect(() => combined.sample()).toThrow();

    emitA!(testSignal(15));
    expect(callback).not.toHaveBeenCalled();
  });

  it("should map combined behavior", () => {
    const a = constant(10);
    const b = constant(20);
    const combined = combine(a, b, (x, y) => x + y);
    const doubled = combined.map((x) => x * 2);

    expect(doubled.sample()).toBe(60);
  });
});

describe("switcher", () => {
  it("should select ifTrue when condition is true", () => {
    const condition = constant(true);
    const ifTrue = constant("yes");
    const ifFalse = constant("no");
    const result = switcher(condition, ifTrue, ifFalse);

    expect(result.sample()).toBe("yes");
  });

  it("should select ifFalse when condition is false", () => {
    const condition = constant(false);
    const ifTrue = constant("yes");
    const ifFalse = constant("no");
    const result = switcher(condition, ifTrue, ifFalse);

    expect(result.sample()).toBe("no");
  });

  it("should switch when condition changes", () => {
    let emitCond: ((s: Signal<"test", boolean>) => void) | null = null;

    const condStream = createStream<Signal<"test", boolean>>((observer) => {
      emitCond = (s) => observer.next(s);
    });

    const condition = stepper(true, condStream, (s) => s.value);
    const ifTrue = constant("yes");
    const ifFalse = constant("no");
    const result = switcher(condition, ifTrue, ifFalse);

    expect(result.sample()).toBe("yes");

    emitCond!(createSignal("test", false));
    expect(result.sample()).toBe("no");

    emitCond!(createSignal("test", true));
    expect(result.sample()).toBe("yes");
  });

  it("should update when selected branch changes", () => {
    let emitTrue: ((s: TestSignal) => void) | null = null;
    let emitFalse: ((s: TestSignal) => void) | null = null;
    const callback = vi.fn();

    const trueStream = createStream<TestSignal>((observer) => {
      emitTrue = (s) => observer.next(s);
    });
    const falseStream = createStream<TestSignal>((observer) => {
      emitFalse = (s) => observer.next(s);
    });

    const condition = constant(true);
    const ifTrue = stepper(10, trueStream, (s) => s.value);
    const ifFalse = stepper(20, falseStream, (s) => s.value);
    const result = switcher(condition, ifTrue, ifFalse);
    result.onChange(callback);

    emitTrue!(testSignal(15));
    expect(callback).toHaveBeenCalledWith(15);

    // ifFalse changes but condition is true, should not notify
    callback.mockClear();
    emitFalse!(testSignal(25));
    expect(callback).not.toHaveBeenCalled();
  });

  it("should dispose properly", () => {
    const condition = constant(true);
    const ifTrue = constant("yes");
    const ifFalse = constant("no");
    const result = switcher(condition, ifTrue, ifFalse);

    result.dispose();

    expect(result.isDisposed).toBe(true);
    expect(() => result.sample()).toThrow();
  });
});

describe("lift", () => {
  it("should lift unary function", () => {
    const double = (x: number) => x * 2;
    const liftedDouble = lift(double);

    const b = constant(5);
    const result = liftedDouble(b);

    expect(result.sample()).toBe(10);
  });

  it("should lift binary function", () => {
    const add = (a: number, b: number) => a + b;
    const liftedAdd = lift(add);

    const ba = constant(3);
    const bb = constant(4);
    const result = liftedAdd(ba, bb);

    expect(result.sample()).toBe(7);
  });

  it("should lift ternary function", () => {
    const sum3 = (a: number, b: number, c: number) => a + b + c;
    const liftedSum3 = lift(sum3);

    const ba = constant(1);
    const bb = constant(2);
    const bc = constant(3);
    const result = liftedSum3(ba, bb, bc);

    expect(result.sample()).toBe(6);
  });
});

describe("glitch behavior (push-based FRP limitation)", () => {
  it("combine notifies for each source change separately", () => {
    // This test documents the expected glitch behavior in push-based FRP.
    // When multiple sources change "simultaneously", onChange is called
    // for each change, exposing intermediate states.
    let emitA: ((s: TestSignal) => void) | null = null;
    let emitB: ((s: TestSignal) => void) | null = null;

    const streamA = createStream<TestSignal>((observer) => {
      emitA = (s) => observer.next(s);
    });
    const streamB = createStream<TestSignal>((observer) => {
      emitB = (s) => observer.next(s);
    });

    const a = stepper(1, streamA, (s) => s.value);
    const b = stepper(2, streamB, (s) => s.value);
    const sum = combine(a, b, (x, y) => x + y);

    const values: number[] = [];
    sum.onChange((v) => values.push(v));

    // Initial: a=1, b=2, sum=3
    expect(sum.sample()).toBe(3);

    // Update both sources
    emitA!(testSignal(10)); // a=10, b=2, sum=12 (intermediate)
    emitB!(testSignal(20)); // a=10, b=20, sum=30 (final)

    // Glitch: two separate notifications with intermediate state
    expect(values).toEqual([12, 30]);

    // However, sample() always returns the correct current value
    expect(sum.sample()).toBe(30);
  });
});
