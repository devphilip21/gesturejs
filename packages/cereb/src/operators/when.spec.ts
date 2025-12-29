import { describe, expect, it, vi } from "vitest";
import { createSignal, type Signal } from "../core/signal.js";
import { createStream } from "../core/stream.js";
import { pipe } from "../ochestrations/pipe.js";
import { when } from "./when.js";

function createGateSignal(opened: boolean): Signal<string, { opened: boolean }> {
  return createSignal("gate", { opened });
}

function createSourceSignal(value: number): Signal<string, number> {
  return createSignal("source", value);
}

describe("when operator", () => {
  it("should pass through signals when gate is open (held: true)", () => {
    const values: number[] = [];

    let emitGate: (opened: boolean) => void;
    const gate$ = createStream<Signal<string, { opened: boolean }>>((observer) => {
      emitGate = (opened: boolean) => observer.next(createGateSignal(opened));
      return () => {};
    });

    let emitSource: (value: number) => void;
    const source$ = createStream<Signal<string, number>>((observer) => {
      emitSource = (value: number) => observer.next(createSourceSignal(value));
      return () => {};
    });

    pipe(source$, when(gate$)).subscribe((signal) => {
      values.push(signal.value);
    });

    // Open the gate
    emitGate!(true);

    // Emit source signals
    emitSource!(1);
    emitSource!(2);

    expect(values).toEqual([1, 2]);
  });

  it("should block signals when gate is closed (held: false)", () => {
    const values: number[] = [];

    let emitGate: (opened: boolean) => void;
    const gate$ = createStream<Signal<string, { opened: boolean }>>((observer) => {
      emitGate = (opened: boolean) => observer.next(createGateSignal(opened));
      return () => {};
    });

    let emitSource: (value: number) => void;
    const source$ = createStream<Signal<string, number>>((observer) => {
      emitSource = (value: number) => observer.next(createSourceSignal(value));
      return () => {};
    });

    pipe(source$, when(gate$)).subscribe((signal) => {
      values.push(signal.value);
    });

    // Close the gate explicitly
    emitGate!(false);

    // Emit source signals
    emitSource!(1);
    emitSource!(2);

    expect(values).toEqual([]);
  });

  it("should block signals by default when no gate signal received", () => {
    const values: number[] = [];

    const gate$ = createStream<Signal<string, { opened: boolean }>>(() => {
      return () => {};
    });

    let emitSource: (value: number) => void;
    const source$ = createStream<Signal<string, number>>((observer) => {
      emitSource = (value: number) => observer.next(createSourceSignal(value));
      return () => {};
    });

    pipe(source$, when(gate$)).subscribe((signal) => {
      values.push(signal.value);
    });

    emitSource!(1);
    emitSource!(2);

    expect(values).toEqual([]);
  });

  it("should respond to gate state changes", () => {
    const values: number[] = [];

    let emitGate: (opened: boolean) => void;
    const gate$ = createStream<Signal<string, { opened: boolean }>>((observer) => {
      emitGate = (opened: boolean) => observer.next(createGateSignal(opened));
      return () => {};
    });

    let emitSource: (value: number) => void;
    const source$ = createStream<Signal<string, number>>((observer) => {
      emitSource = (value: number) => observer.next(createSourceSignal(value));
      return () => {};
    });

    pipe(source$, when(gate$)).subscribe((signal) => {
      values.push(signal.value);
    });

    // Gate closed - signals blocked
    emitGate!(false);
    emitSource!(1);

    // Gate opened - signals pass through
    emitGate!(true);
    emitSource!(2);
    emitSource!(3);

    // Gate closed again - signals blocked
    emitGate!(false);
    emitSource!(4);

    expect(values).toEqual([2, 3]);
  });

  it("should unsubscribe from both gate and source on cleanup", () => {
    let gateUnsubscribed = false;
    let sourceUnsubscribed = false;

    const gate$ = createStream<Signal<string, { held: boolean }>>(() => {
      return () => {
        gateUnsubscribed = true;
      };
    });

    const source$ = createStream<Signal<string, number>>(() => {
      return () => {
        sourceUnsubscribed = true;
      };
    });

    const unsub = pipe(source$, when(gate$)).subscribe(() => {});

    expect(gateUnsubscribed).toBe(false);
    expect(sourceUnsubscribed).toBe(false);

    unsub();

    expect(gateUnsubscribed).toBe(true);
    expect(sourceUnsubscribed).toBe(true);
  });

  it("should propagate errors from gate stream to observer", () => {
    const errorHandler = vi.fn();
    const testError = new Error("gate error");

    const gate$ = createStream<Signal<string, { opened: boolean }>>((observer) => {
      // Simulate accessing a property that throws
      observer.next({
        value: {
          get opened() {
            throw testError;
          },
        },
      } as Signal<string, { opened: boolean }>);
      return () => {};
    });

    const source$ = createStream<Signal<string, number>>(() => {
      return () => {};
    });

    pipe(source$, when(gate$)).subscribe({
      next: () => {},
      error: errorHandler,
    });

    expect(errorHandler).toHaveBeenCalledWith(testError);
  });

  it("should propagate complete from source stream", () => {
    const completeHandler = vi.fn();

    const gate$ = createStream<Signal<string, { opened: boolean }>>(() => {
      return () => {};
    });

    const source$ = createStream<Signal<string, number>>((observer) => {
      observer.complete?.();
      return () => {};
    });

    pipe(source$, when(gate$)).subscribe({
      next: () => {},
      complete: completeHandler,
    });

    expect(completeHandler).toHaveBeenCalledTimes(1);
  });
});
