import { createObservable, type Observable, type Observer } from "@gesturejs/stream";
import { describe, expect, it, vi } from "vitest";
import type { PanEvent } from "../event.js";
import type { PanDirection } from "../types.js";
import { axisLock } from "./axis-lock.js";

function createPanEvent(
  phase: "start" | "change" | "end" | "cancel",
  deltaX: number,
  deltaY: number,
  direction: PanDirection = "none",
): PanEvent {
  return {
    type: "pan",
    timestamp: 0,
    deviceId: "mouse-1",
    phase,
    deltaX,
    deltaY,
    distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
    direction,
    x: 100 + deltaX,
    y: 100 + deltaY,
    pageX: 100 + deltaX,
    pageY: 600 + deltaY,
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

describe("axisLock", () => {
  describe("horizontal axis lock", () => {
    it("should lock to horizontal axis when initial X movement is greater", () => {
      const events = [
        createPanEvent("start", 0, 0),
        createPanEvent("change", 20, 5, "right"),
        createPanEvent("change", 30, 15, "right"),
      ];
      const source = createTestSource(events);
      const results: PanEvent[] = [];

      axisLock()(source).subscribe((event) => results.push(event));

      expect(results[2].deltaY).toBe(0);
      expect(results[2].deltaX).toBe(30);
    });

    it("should zero velocityY when horizontally locked", () => {
      const events = [
        createPanEvent("start", 0, 0),
        { ...createPanEvent("change", 20, 5), velocityX: 1, velocityY: 0.5 },
      ];
      const source = createTestSource(events);
      const results: Array<PanEvent & { velocityY?: number }> = [];

      axisLock()(source).subscribe((event) => results.push(event));

      expect(results[1].velocityY).toBe(0);
    });

    it("should correct direction when locked horizontally", () => {
      const events = [
        createPanEvent("start", 0, 0),
        createPanEvent("change", 20, 5, "right"),
        createPanEvent("change", 30, 25, "down"),
      ];
      const source = createTestSource(events);
      const results: PanEvent[] = [];

      axisLock()(source).subscribe((event) => results.push(event));

      expect(results[2].direction).toBe("right");
    });
  });

  describe("vertical axis lock", () => {
    it("should lock to vertical axis when initial Y movement is greater", () => {
      const events = [
        createPanEvent("start", 0, 0),
        createPanEvent("change", 5, 20, "down"),
        createPanEvent("change", 15, 30, "down"),
      ];
      const source = createTestSource(events);
      const results: PanEvent[] = [];

      axisLock()(source).subscribe((event) => results.push(event));

      expect(results[2].deltaX).toBe(0);
      expect(results[2].deltaY).toBe(30);
    });

    it("should zero velocityX when vertically locked", () => {
      const events = [
        createPanEvent("start", 0, 0),
        { ...createPanEvent("change", 5, 20), velocityX: 0.5, velocityY: 1 },
      ];
      const source = createTestSource(events);
      const results: Array<PanEvent & { velocityX?: number }> = [];

      axisLock()(source).subscribe((event) => results.push(event));

      expect(results[1].velocityX).toBe(0);
    });

    it("should correct direction when locked vertically", () => {
      const events = [
        createPanEvent("start", 0, 0),
        createPanEvent("change", 5, 20, "down"),
        createPanEvent("change", 25, 30, "right"),
      ];
      const source = createTestSource(events);
      const results: PanEvent[] = [];

      axisLock()(source).subscribe((event) => results.push(event));

      expect(results[2].direction).toBe("down");
    });
  });

  describe("lock threshold", () => {
    it("should not determine axis until movement exceeds threshold", () => {
      const events = [
        createPanEvent("start", 0, 0),
        createPanEvent("change", 3, 2),
        createPanEvent("change", 15, 5, "right"),
      ];
      const source = createTestSource(events);
      const results: PanEvent[] = [];

      axisLock({ lockThreshold: 10 })(source).subscribe((event) => results.push(event));

      expect(results[1].deltaX).toBe(3);
      expect(results[1].deltaY).toBe(2);
      expect(results[2].deltaY).toBe(0);
    });
  });

  describe("gesture lifecycle", () => {
    it("should reset lock on new gesture start", () => {
      const events = [
        createPanEvent("start", 0, 0),
        createPanEvent("change", 20, 5, "right"),
        createPanEvent("end", 20, 5),
        createPanEvent("start", 0, 0),
        createPanEvent("change", 5, 20, "down"),
      ];
      const source = createTestSource(events);
      const results: PanEvent[] = [];

      axisLock()(source).subscribe((event) => results.push(event));

      expect(results[1].deltaY).toBe(0);
      expect(results[4].deltaX).toBe(0);
      expect(results[4].deltaY).toBe(20);
    });

    it("should reset lock after cancel", () => {
      const events = [
        createPanEvent("start", 0, 0),
        createPanEvent("change", 20, 5, "right"),
        createPanEvent("cancel", 20, 5),
        createPanEvent("start", 0, 0),
        createPanEvent("change", 5, 20, "down"),
      ];
      const source = createTestSource(events);
      const results: PanEvent[] = [];

      axisLock()(source).subscribe((event) => results.push(event));

      expect(results[4].deltaX).toBe(0);
      expect(results[4].deltaY).toBe(20);
    });
  });

  describe("cleanup", () => {
    it("should cleanup on unsubscribe", () => {
      let observer: Observer<PanEvent> | null = null;
      const source = createObservable((obs: Observer<PanEvent>) => {
        observer = obs;
      });

      const unsub = axisLock()(source).subscribe(() => {});
      observer!.next(createPanEvent("start", 0, 0));
      unsub();

      expect(() => {
        observer!.next(createPanEvent("change", 20, 5));
      }).not.toThrow();
    });
  });
});
