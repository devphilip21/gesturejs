import { describe, expect, it, vi } from "vitest";
import { createSignal, createStream, type Signal } from "../core/index.js";
import { constant, stepper, time } from "./behavior.js";

type TestSignal = Signal<"test", number>;

function testSignal(value: number): TestSignal {
  return createSignal("test", value);
}

describe("constant", () => {
  it("should always return the same value", () => {
    const b = constant(42);

    expect(b.sample()).toBe(42);
    expect(b.sample()).toBe(42);
  });

  it("should map values", () => {
    const b = constant(10);
    const doubled = b.map((x) => x * 2);

    expect(doubled.sample()).toBe(20);
  });

  it("should apply functions with ap", () => {
    const bf = constant((x: number) => x + 1);
    const ba = constant(5);

    const result = bf.ap(ba);
    expect(result.sample()).toBe(6);
  });

  it("should never call onChange callback", () => {
    const callback = vi.fn();
    const b = constant(42);

    b.onChange(callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should dispose properly", () => {
    const b = constant(42);
    expect(b.isDisposed).toBe(false);

    b.dispose();
    expect(b.isDisposed).toBe(true);
    expect(() => b.sample()).toThrow("Cannot sample a disposed Behavior");
  });
});

describe("stepper", () => {
  it("should return initial value before any events", () => {
    const stream = createStream<TestSignal>(() => {});
    const b = stepper(0, stream, (s) => s.value);

    expect(b.sample()).toBe(0);
  });

  it("should update value when events occur", () => {
    let emit: ((s: TestSignal) => void) | null = null;

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(0, stream, (s) => s.value);

    expect(b.sample()).toBe(0);

    emit!(testSignal(10));
    expect(b.sample()).toBe(10);

    emit!(testSignal(20));
    expect(b.sample()).toBe(20);
  });

  it("should call onChange when value changes", () => {
    let emit: ((s: TestSignal) => void) | null = null;
    const callback = vi.fn();

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(0, stream, (s) => s.value);
    b.onChange(callback);

    emit!(testSignal(10));
    expect(callback).toHaveBeenCalledWith(10);

    emit!(testSignal(20));
    expect(callback).toHaveBeenCalledWith(20);
  });

  it("should not call onChange when value is the same", () => {
    let emit: ((s: TestSignal) => void) | null = null;
    const callback = vi.fn();

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(10, stream, (s) => s.value);
    b.onChange(callback);

    emit!(testSignal(10)); // Same as initial
    expect(callback).not.toHaveBeenCalled();

    emit!(testSignal(20));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should map values", () => {
    let emit: ((s: TestSignal) => void) | null = null;

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(5, stream, (s) => s.value);
    const doubled = b.map((x) => x * 2);

    expect(doubled.sample()).toBe(10);

    emit!(testSignal(10));
    expect(doubled.sample()).toBe(20);
  });

  it("should unsubscribe onChange listener", () => {
    let emit: ((s: TestSignal) => void) | null = null;
    const callback = vi.fn();

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(0, stream, (s) => s.value);
    const unsub = b.onChange(callback);

    emit!(testSignal(10));
    expect(callback).toHaveBeenCalledTimes(1);

    unsub();

    emit!(testSignal(20));
    expect(callback).toHaveBeenCalledTimes(1); // Not called again
  });

  it("should dispose and cleanup", () => {
    let emit: ((s: TestSignal) => void) | null = null;
    const callback = vi.fn();

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(0, stream, (s) => s.value);
    b.onChange(callback);

    b.dispose();

    expect(b.isDisposed).toBe(true);
    expect(() => b.sample()).toThrow("Cannot sample a disposed Behavior");

    // Events after dispose should not trigger callback
    emit!(testSignal(10));
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("time", () => {
  it("should return current timestamp", () => {
    const t = time();
    const now = performance.now();

    const sampled = t.sample();
    expect(sampled).toBeGreaterThanOrEqual(now);
    expect(sampled).toBeLessThan(now + 100);
  });

  it("should return different values on each sample", async () => {
    const t = time();
    const first = t.sample();

    await new Promise((resolve) => setTimeout(resolve, 10));

    const second = t.sample();
    expect(second).toBeGreaterThan(first);
  });

  it("should map time values", () => {
    const t = time();
    const seconds = t.map((ms) => ms / 1000);

    const sampled = seconds.sample();
    expect(sampled).toBeGreaterThan(0);
  });

  it("should dispose properly", () => {
    const t = time();
    t.dispose();

    expect(t.isDisposed).toBe(true);
    expect(() => t.sample()).toThrow("Cannot sample a disposed Behavior");
  });
});

describe("Applicative Laws", () => {
  it("satisfies identity: pure(id).ap(v) === v", () => {
    const v = constant(42);
    const id = <A>(x: A) => x;
    const result = constant(id).ap(v);

    expect(result.sample()).toBe(v.sample());
  });

  it("satisfies homomorphism: pure(f).ap(pure(x)) === pure(f(x))", () => {
    const f = (x: number) => x * 2;
    const x = 21;

    const left = constant(f).ap(constant(x));
    const right = constant(f(x));

    expect(left.sample()).toBe(right.sample());
  });

  it("satisfies interchange: u.ap(pure(x)) === pure(f => f(x)).ap(u)", () => {
    const u = constant((x: number) => x + 10);
    const x = 5;

    const left = u.ap(constant(x));
    const right = constant((f: (n: number) => number) => f(x)).ap(u);

    expect(left.sample()).toBe(right.sample());
  });

  it("satisfies composition: pure(compose).ap(u).ap(v).ap(w) === u.ap(v.ap(w))", () => {
    const compose =
      <A, B, C>(f: (b: B) => C) =>
      (g: (a: A) => B) =>
      (a: A): C =>
        f(g(a));
    const u = constant((x: number) => x + 1);
    const v = constant((x: number) => x * 2);
    const w = constant(5);

    // Left: pure(compose).ap(u).ap(v).ap(w)
    const left = constant(compose).ap(u).ap(v).ap(w);
    // Right: u.ap(v.ap(w))
    const right = u.ap(v.ap(w));

    expect(left.sample()).toBe(right.sample());
  });
});

describe("Functor Laws", () => {
  it("satisfies identity: b.map(x => x) === b", () => {
    const b = constant(42);
    const result = b.map((x) => x);

    expect(result.sample()).toBe(b.sample());
  });

  it("satisfies composition: b.map(f).map(g) === b.map(x => g(f(x)))", () => {
    const b = constant(5);
    const f = (x: number) => x * 2;
    const g = (x: number) => x + 1;

    const left = b.map(f).map(g);
    const right = b.map((x) => g(f(x)));

    expect(left.sample()).toBe(right.sample());
  });
});
