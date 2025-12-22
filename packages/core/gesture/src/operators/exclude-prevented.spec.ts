import { from, pipe } from "@gesturejs/stream";
import { describe, expect, it, vi } from "vitest";
import { type GestureEvent, type GesturePhase, PREVENTED } from "../event.js";
import { excludePrevented } from "./exclude-prevented.js";

function createMockGestureEvent(phase: GesturePhase, prevented = false): GestureEvent<"test"> {
  const event: GestureEvent<"test"> = {
    type: "test",
    timestamp: performance.now(),
    deviceId: "device-1",
    phase,
    prevent() {
      (this as unknown as Record<symbol, boolean>)[PREVENTED] = true;
    },
  };

  if (prevented) {
    (event as unknown as Record<symbol, boolean>)[PREVENTED] = true;
  }

  return event;
}

describe("excludePrevented", () => {
  it("should pass through non-prevented events", () => {
    const events = [
      createMockGestureEvent("start"),
      createMockGestureEvent("change"),
      createMockGestureEvent("end"),
    ];
    const received: GestureEvent<"test">[] = [];

    pipe(from(events), excludePrevented()).subscribe((e) => received.push(e));

    expect(received).toHaveLength(3);
    expect(received.map((e) => e.phase)).toEqual(["start", "change", "end"]);
  });

  it("should filter out prevented events", () => {
    const events = [
      createMockGestureEvent("start"),
      createMockGestureEvent("change", true),
      createMockGestureEvent("end"),
    ];
    const received: GestureEvent<"test">[] = [];

    pipe(from(events), excludePrevented()).subscribe((e) => received.push(e));

    expect(received).toHaveLength(2);
    expect(received.map((e) => e.phase)).toEqual(["start", "end"]);
  });

  it("should filter out all events if all are prevented", () => {
    const events = [
      createMockGestureEvent("start", true),
      createMockGestureEvent("change", true),
      createMockGestureEvent("end", true),
    ];
    const received: GestureEvent<"test">[] = [];

    pipe(from(events), excludePrevented()).subscribe((e) => received.push(e));

    expect(received).toHaveLength(0);
  });

  it("should propagate errors from source", () => {
    const error = new Error("source error");
    const errorFn = vi.fn();
    const nextFn = vi.fn();

    const errorSource = {
      subscribe(observer: {
        next: (v: GestureEvent<"test">) => void;
        error?: (e: unknown) => void;
      }) {
        observer.error?.(error);
        return () => {};
      },
    };

    pipe(errorSource, excludePrevented()).subscribe({
      next: nextFn,
      error: errorFn,
    });

    expect(errorFn).toHaveBeenCalledWith(error);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it("should call complete when source completes", () => {
    const completeFn = vi.fn();

    pipe(from([createMockGestureEvent("start")]), excludePrevented()).subscribe({
      next: () => {},
      complete: completeFn,
    });

    expect(completeFn).toHaveBeenCalled();
  });
});
