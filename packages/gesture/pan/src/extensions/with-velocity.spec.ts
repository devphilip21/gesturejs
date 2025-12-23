import { createObservable, type Observable, type Observer } from "@cereb/stream";
import { describe, expect, it, vi } from "vitest";
import type { PanEvent } from "../event.js";
import { type VelocityExtension, withVelocity } from "./with-velocity.js";

function createPanEvent(
  phase: "start" | "change" | "end" | "cancel",
  x: number,
  y: number,
  timestamp: number,
): PanEvent {
  return {
    type: "pan",
    timestamp,
    deviceId: "mouse-1",
    phase,
    deltaX: x - 100,
    deltaY: y - 100,
    distance: 0,
    direction: "none",
    x,
    y,
    pageX: x,
    pageY: y + 500,
    prevent: vi.fn(),
  };
}

function createTestSource(events: PanEvent[]): Observable<PanEvent> {
  return createObservable((observer: Observer<PanEvent>) => {
    for (const event of events) {
      observer.next(event);
    }
    observer.complete?.();
  });
}

describe("withVelocity", () => {
  it("should add velocityX and velocityY properties to events", () => {
    const events = [createPanEvent("start", 100, 100, 0), createPanEvent("change", 150, 100, 50)];
    const source = createTestSource(events);
    const results: PanEvent<VelocityExtension>[] = [];

    withVelocity()(source).subscribe((event) => results.push(event));

    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty("velocityX");
    expect(results[0]).toHaveProperty("velocityY");
    expect(results[1]).toHaveProperty("velocityX");
    expect(results[1]).toHaveProperty("velocityY");
  });

  it("should calculate velocity for horizontal movement", () => {
    const events = [createPanEvent("start", 100, 100, 0), createPanEvent("change", 200, 100, 100)];
    const source = createTestSource(events);
    const results: PanEvent<VelocityExtension>[] = [];

    withVelocity()(source).subscribe((event) => results.push(event));

    expect(results[1].velocityX).toBe(1);
    expect(results[1].velocityY).toBe(0);
  });

  it("should calculate velocity for vertical movement", () => {
    const events = [createPanEvent("start", 100, 100, 0), createPanEvent("change", 100, 200, 100)];
    const source = createTestSource(events);
    const results: PanEvent<VelocityExtension>[] = [];

    withVelocity()(source).subscribe((event) => results.push(event));

    expect(results[1].velocityX).toBe(0);
    expect(results[1].velocityY).toBe(1);
  });

  it("should reset velocity tracking on new gesture start", () => {
    const events = [
      createPanEvent("start", 100, 100, 0),
      createPanEvent("change", 150, 100, 50),
      createPanEvent("end", 150, 100, 100),
      createPanEvent("start", 200, 200, 1000),
      createPanEvent("change", 250, 200, 1050),
    ];
    const source = createTestSource(events);
    const results: PanEvent<VelocityExtension>[] = [];

    withVelocity()(source).subscribe((event) => results.push(event));

    expect(results[4].velocityX).toBe(1);
    expect(results[4].velocityY).toBe(0);
  });

  it("should return zero velocity on start event", () => {
    const events = [createPanEvent("start", 100, 100, 0)];
    const source = createTestSource(events);
    const results: PanEvent<VelocityExtension>[] = [];

    withVelocity()(source).subscribe((event) => results.push(event));

    expect(results[0].velocityX).toBe(0);
    expect(results[0].velocityY).toBe(0);
  });

  it("should cleanup on unsubscribe", () => {
    let observer: Observer<PanEvent> | null = null;
    const source = createObservable((obs: Observer<PanEvent>) => {
      observer = obs;
    });

    const unsub = withVelocity()(source).subscribe(() => {});
    observer!.next(createPanEvent("start", 100, 100, 0));
    unsub();

    expect(() => {
      observer!.next(createPanEvent("change", 150, 100, 50));
    }).not.toThrow();
  });
});
