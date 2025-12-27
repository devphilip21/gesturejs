import { describe, expect, it, vi } from "vitest";
import type {
  MultiPointer,
  MultiPointerSignal,
  PointerInfo,
} from "../browser/multi-pointer/multi-pointer-signal.js";
import type { SinglePointerPhase } from "../browser/single-pointer/types.js";
import type { Signal } from "../core/signal.js";
import { createStream } from "../core/stream.js";
import { multiPointerSession, session } from "./session.js";

type Phase = "start" | "move" | "end" | "cancel";

interface PointerValue {
  phase: Phase;
  x: number;
  y: number;
}

function createPointerSignal(phase: Phase, x = 0, y = 0): Signal<"pointer", PointerValue> {
  return {
    kind: "pointer",
    value: { phase, x, y },
    deviceId: "test",
    createdAt: performance.now(),
  };
}

describe("session", () => {
  it("should emit signals only during active session (start to end)", () => {
    const signals: Signal<"pointer", PointerValue>[] = [];
    const operator = session<Signal<"pointer", PointerValue>>({
      start: (s) => s.value.phase === "start",
      end: (s) => s.value.phase === "end",
    });

    const source = createStream<Signal<"pointer", PointerValue>>((observer) => {
      observer.next(createPointerSignal("move", 0, 0)); // ignored (before session)
      observer.next(createPointerSignal("start", 10, 10)); // session start
      observer.next(createPointerSignal("move", 20, 20)); // emitted
      observer.next(createPointerSignal("move", 30, 30)); // emitted
      observer.next(createPointerSignal("end", 40, 40)); // session end
      observer.next(createPointerSignal("move", 50, 50)); // ignored (after session)
      return () => {};
    });

    operator(source).subscribe({ next: (v) => signals.push(v) });

    expect(signals).toHaveLength(4);
    expect(signals[0].value.phase).toBe("start");
    expect(signals[1].value.phase).toBe("move");
    expect(signals[2].value.phase).toBe("move");
    expect(signals[3].value.phase).toBe("end");
  });

  it("should support multiple sessions", () => {
    const signals: Signal<"pointer", PointerValue>[] = [];
    const operator = session<Signal<"pointer", PointerValue>>({
      start: (s) => s.value.phase === "start",
      end: (s) => s.value.phase === "end" || s.value.phase === "cancel",
    });

    const source = createStream<Signal<"pointer", PointerValue>>((observer) => {
      // First session
      observer.next(createPointerSignal("start", 0, 0));
      observer.next(createPointerSignal("move", 10, 10));
      observer.next(createPointerSignal("end", 20, 20));
      // Gap
      observer.next(createPointerSignal("move", 25, 25)); // ignored
      // Second session
      observer.next(createPointerSignal("start", 30, 30));
      observer.next(createPointerSignal("move", 40, 40));
      observer.next(createPointerSignal("cancel", 50, 50));
      return () => {};
    });

    operator(source).subscribe({ next: (v) => signals.push(v) });

    expect(signals).toHaveLength(6);
    expect(signals.map((s) => s.value.phase)).toEqual([
      "start",
      "move",
      "end",
      "start",
      "move",
      "cancel",
    ]);
  });

  it("should propagate errors from predicates", () => {
    const errorHandler = vi.fn();
    const operator = session<Signal<"pointer", PointerValue>>({
      start: () => {
        throw new Error("predicate error");
      },
      end: () => false,
    });

    const source = createStream<Signal<"pointer", PointerValue>>((observer) => {
      observer.next(createPointerSignal("start"));
      return () => {};
    });

    operator(source).subscribe({ next: () => {}, error: errorHandler });

    expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
  });
});

function createPointerInfo(id: string, phase: SinglePointerPhase, x = 0, y = 0): PointerInfo {
  return {
    id,
    phase,
    x,
    y,
    pageX: x,
    pageY: y,
    pointerType: "touch",
    button: "none",
    pressure: 0.5,
  };
}

function createMultiPointerSignal(pointers: PointerInfo[]): MultiPointerSignal {
  const multiPointer: MultiPointer = {
    phase: pointers.length > 0 ? "active" : "idle",
    pointers,
    count: pointers.length,
  };
  return {
    kind: "multi-pointer",
    value: multiPointer,
    deviceId: "test",
    createdAt: performance.now(),
  };
}

describe("multiPointerSession", () => {
  it("should start session when required count of pointers are working", () => {
    const signals: MultiPointerSignal[] = [];
    const operator = multiPointerSession(2);

    const source = createStream<MultiPointerSignal>((observer) => {
      // 1 pointer - not enough
      observer.next(createMultiPointerSignal([createPointerInfo("p1", "start", 10, 10)]));
      // 2 pointers - session starts
      observer.next(
        createMultiPointerSignal([
          createPointerInfo("p1", "move", 10, 10),
          createPointerInfo("p2", "start", 20, 20),
        ]),
      );
      // move during session
      observer.next(
        createMultiPointerSignal([
          createPointerInfo("p1", "move", 15, 15),
          createPointerInfo("p2", "move", 25, 25),
        ]),
      );
      // end session
      observer.next(
        createMultiPointerSignal([
          createPointerInfo("p1", "end", 15, 15),
          createPointerInfo("p2", "move", 25, 25),
        ]),
      );
      // after session - ignored
      observer.next(createMultiPointerSignal([createPointerInfo("p2", "move", 30, 30)]));
      return () => {};
    });

    operator(source).subscribe({ next: (v) => signals.push(v) });

    expect(signals).toHaveLength(3);
    expect(signals[0].value.count).toBe(2);
    expect(signals[1].value.count).toBe(2);
    expect(signals[2].value.pointers.some((p) => p.phase === "end")).toBe(true);
  });

  it("should ignore additional pointers beyond required count", () => {
    const signals: MultiPointerSignal[] = [];
    const operator = multiPointerSession(2);

    const source = createStream<MultiPointerSignal>((observer) => {
      // 2 pointers - session starts with p1, p2
      observer.next(
        createMultiPointerSignal([
          createPointerInfo("p1", "start", 10, 10),
          createPointerInfo("p2", "start", 20, 20),
        ]),
      );
      // 3rd pointer joins - session continues
      observer.next(
        createMultiPointerSignal([
          createPointerInfo("p1", "move", 10, 10),
          createPointerInfo("p2", "move", 20, 20),
          createPointerInfo("p3", "start", 30, 30),
        ]),
      );
      // 3rd pointer ends - session still active (not tracked)
      observer.next(
        createMultiPointerSignal([
          createPointerInfo("p1", "move", 10, 10),
          createPointerInfo("p2", "move", 20, 20),
          createPointerInfo("p3", "end", 30, 30),
        ]),
      );
      // tracked pointer ends - session ends
      observer.next(
        createMultiPointerSignal([
          createPointerInfo("p1", "end", 10, 10),
          createPointerInfo("p2", "move", 20, 20),
        ]),
      );
      return () => {};
    });

    operator(source).subscribe({ next: (v) => signals.push(v) });

    expect(signals).toHaveLength(4);
  });
});
