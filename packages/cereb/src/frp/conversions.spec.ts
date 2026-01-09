import { describe, expect, it, vi } from "vitest";
import { createSignal, createStream, type Signal } from "../core/index.js";
import { constant, stepper } from "./behavior.js";
import { changes, sample, sampleOn } from "./conversions.js";

type TestSignal = Signal<"test", number>;

function testSignal(value: number): TestSignal {
  return createSignal("test", value);
}

describe("changes", () => {
  it("should emit when behavior value changes", () => {
    let emit: ((s: TestSignal) => void) | null = null;
    const values: number[] = [];

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(0, stream, (s) => s.value);
    const changeStream = changes(b);

    changeStream.on((signal) => {
      values.push(signal.value);
    });

    emit!(testSignal(10));
    emit!(testSignal(20));
    emit!(testSignal(30));

    expect(values).toEqual([10, 20, 30]);
  });

  it("should emit signals with correct kind", () => {
    let emit: ((s: TestSignal) => void) | null = null;

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(0, stream, (s) => s.value);
    const changeStream = changes(b);

    let receivedSignal: Signal | null = null;
    changeStream.on((signal) => {
      receivedSignal = signal;
    });

    emit!(testSignal(10));

    expect(receivedSignal).not.toBeNull();
    expect(receivedSignal!.kind).toBe("behavior-change");
    expect(receivedSignal!.value).toBe(10);
  });

  it("should not emit for constant behavior", () => {
    const callback = vi.fn();
    const b = constant(42);
    const changeStream = changes(b);

    changeStream.on(callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should cleanup on unsubscribe", () => {
    let emit: ((s: TestSignal) => void) | null = null;
    const callback = vi.fn();

    const stream = createStream<TestSignal>((observer) => {
      emit = (s) => observer.next(s);
    });

    const b = stepper(0, stream, (s) => s.value);
    const changeStream = changes(b);

    const unsub = changeStream.on(callback);

    emit!(testSignal(10));
    expect(callback).toHaveBeenCalledTimes(1);

    unsub();

    emit!(testSignal(20));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("sample (interval)", () => {
  it("should sample behavior at intervals", async () => {
    const b = constant(42);
    const values: number[] = [];

    const sampleStream = sample(b, 50);
    const unsub = sampleStream.on((signal) => {
      values.push(signal.value);
    });

    await new Promise((resolve) => setTimeout(resolve, 175));

    unsub();

    expect(values.length).toBeGreaterThanOrEqual(3);
    expect(values.every((v) => v === 42)).toBe(true);
  });

  it("should emit signals with correct kind", async () => {
    const b = constant(42);
    let receivedSignal: Signal | null = null;

    const sampleStream = sample(b, 50);
    const unsub = sampleStream.on((signal) => {
      receivedSignal = signal;
    });

    await new Promise((resolve) => setTimeout(resolve, 75));
    unsub();

    expect(receivedSignal).not.toBeNull();
    expect(receivedSignal!.kind).toBe("sampled");
  });

  it("should cleanup interval on unsubscribe", async () => {
    const b = constant(42);
    const callback = vi.fn();

    const sampleStream = sample(b, 50);
    const unsub = sampleStream.on(callback);

    await new Promise((resolve) => setTimeout(resolve, 75));
    const countBefore = callback.mock.calls.length;

    unsub();

    await new Promise((resolve) => setTimeout(resolve, 100));
    const countAfter = callback.mock.calls.length;

    expect(countAfter).toBe(countBefore);
  });
});

describe("sampleOn", () => {
  it("should sample behavior when trigger fires", () => {
    let emitBehavior: ((s: TestSignal) => void) | null = null;
    let emitTrigger: ((s: Signal<"trigger", string>) => void) | null = null;

    const behaviorStream = createStream<TestSignal>((observer) => {
      emitBehavior = (s) => observer.next(s);
    });
    const triggerStream = createStream<Signal<"trigger", string>>((observer) => {
      emitTrigger = (s) => observer.next(s);
    });

    const b = stepper(0, behaviorStream, (s) => s.value);
    const sampledStream = sampleOn(b, triggerStream);

    const results: Array<{ value: number; trigger: Signal<"trigger", string> }> = [];
    sampledStream.on((signal) => {
      results.push(signal.value);
    });

    emitBehavior!(testSignal(10));
    emitTrigger!(createSignal("trigger", "click1"));

    expect(results.length).toBe(1);
    expect(results[0].value).toBe(10);
    expect(results[0].trigger.value).toBe("click1");

    emitBehavior!(testSignal(20));
    emitTrigger!(createSignal("trigger", "click2"));

    expect(results.length).toBe(2);
    expect(results[1].value).toBe(20);
  });

  it("should emit signals with correct kind", () => {
    let emitTrigger: ((s: Signal<"trigger", string>) => void) | null = null;

    const triggerStream = createStream<Signal<"trigger", string>>((observer) => {
      emitTrigger = (s) => observer.next(s);
    });

    const b = constant(42);
    const sampledStream = sampleOn(b, triggerStream);

    let receivedSignal: Signal | null = null;
    sampledStream.on((signal) => {
      receivedSignal = signal;
    });

    emitTrigger!(createSignal("trigger", "click"));

    expect(receivedSignal).not.toBeNull();
    expect(receivedSignal!.kind).toBe("sampled-on");
  });

  it("should cleanup on unsubscribe", () => {
    type TriggerObserver = { next: (s: Signal<"trigger", string>) => void } | null;
    let activeObserver: TriggerObserver = null;
    const callback = vi.fn();

    const triggerStream = createStream<Signal<"trigger", string>>((observer) => {
      activeObserver = observer;
      return () => {
        activeObserver = null;
      };
    });

    const emitTrigger = (s: Signal<"trigger", string>) => activeObserver?.next(s);

    const b = constant(42);
    const sampledStream = sampleOn(b, triggerStream);

    const unsub = sampledStream.on(callback);

    emitTrigger(createSignal("trigger", "click1"));
    expect(callback).toHaveBeenCalledTimes(1);

    unsub();

    emitTrigger(createSignal("trigger", "click2"));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
