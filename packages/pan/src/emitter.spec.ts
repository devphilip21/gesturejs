import type { SinglePointer } from "cereb";
import { describe, expect, it } from "vitest";
import { createPanEmitter } from "./emitter.js";

function createPointer(
  phase: "start" | "move" | "end" | "cancel",
  x: number,
  y: number,
  timestamp = 0,
): SinglePointer {
  return {
    type: "pointer",
    timestamp,
    deviceId: "mouse-1",
    phase,
    x,
    y,
    pageX: x,
    pageY: y + 500,
    pointerType: "mouse",
    button: "primary",
    pressure: 0.5,
  };
}

describe("createPanEmitter", () => {
  it("should create emitter with initial inactive state", () => {
    const emitter = createPanEmitter();

    expect(emitter.isActive).toBe(false);
    expect(emitter.thresholdMet).toBe(false);
  });
});

describe("PanEmitter.process", () => {
  describe("basic pan gesture lifecycle", () => {
    it("should not emit on start phase (only initializes state)", () => {
      const emitter = createPanEmitter();

      const result = emitter.process(createPointer("start", 100, 100));

      expect(result).toBeNull();
      expect(emitter.isActive).toBe(true);
    });

    it("should emit start event when threshold is met", () => {
      const emitter = createPanEmitter({ threshold: 10 });

      emitter.process(createPointer("start", 100, 100, 0));
      const event = emitter.process(createPointer("move", 115, 100, 16));

      expect(event).not.toBeNull();
      expect(event!.phase).toBe("start");
      expect(event!.deltaX).toBe(15);
      expect(event!.deltaY).toBe(0);
      expect(emitter.thresholdMet).toBe(true);
    });

    it("should emit change events after threshold is met", () => {
      const emitter = createPanEmitter({ threshold: 10 });

      emitter.process(createPointer("start", 100, 100, 0));
      emitter.process(createPointer("move", 115, 100, 16));
      const event = emitter.process(createPointer("move", 130, 100, 32));

      expect(event).not.toBeNull();
      expect(event!.phase).toBe("change");
      expect(event!.deltaX).toBe(30);
    });

    it("should emit end event when pointer is released", () => {
      const emitter = createPanEmitter({ threshold: 10 });

      emitter.process(createPointer("start", 100, 100, 0));
      emitter.process(createPointer("move", 120, 100, 16));
      const event = emitter.process(createPointer("end", 120, 100, 32));

      expect(event).not.toBeNull();
      expect(event!.phase).toBe("end");
      expect(emitter.isActive).toBe(false);
    });
  });

  describe("threshold behavior", () => {
    it("should not emit events before threshold is met", () => {
      const emitter = createPanEmitter({ threshold: 20 });

      emitter.process(createPointer("start", 100, 100));
      const event = emitter.process(createPointer("move", 105, 105));

      expect(event).toBeNull();
      expect(emitter.thresholdMet).toBe(false);
    });

    it("should use default threshold of 10", () => {
      const emitter = createPanEmitter();

      emitter.process(createPointer("start", 100, 100));
      const noEvent = emitter.process(createPointer("move", 105, 105));
      const event = emitter.process(createPointer("move", 115, 100));

      expect(noEvent).toBeNull();
      expect(event).not.toBeNull();
      expect(event!.phase).toBe("start");
    });
  });

  describe("direction mode threshold", () => {
    it("should only check horizontal movement with direction=horizontal", () => {
      const emitter = createPanEmitter({ threshold: 10, direction: "horizontal" });

      emitter.process(createPointer("start", 100, 100));
      const noEvent = emitter.process(createPointer("move", 100, 125));
      const event = emitter.process(createPointer("move", 115, 125));

      expect(noEvent).toBeNull();
      expect(event).not.toBeNull();
    });

    it("should only check vertical movement with direction=vertical", () => {
      const emitter = createPanEmitter({ threshold: 10, direction: "vertical" });

      emitter.process(createPointer("start", 100, 100));
      const noEvent = emitter.process(createPointer("move", 125, 100));
      const event = emitter.process(createPointer("move", 125, 115));

      expect(noEvent).toBeNull();
      expect(event).not.toBeNull();
    });
  });

  describe("cancel phase", () => {
    it("should emit cancel event when gesture is cancelled after threshold met", () => {
      const emitter = createPanEmitter({ threshold: 10 });

      emitter.process(createPointer("start", 100, 100));
      emitter.process(createPointer("move", 120, 100));
      const event = emitter.process(createPointer("cancel", 120, 100));

      expect(event).not.toBeNull();
      expect(event!.phase).toBe("cancel");
    });

    it("should not emit cancel if threshold was never met", () => {
      const emitter = createPanEmitter({ threshold: 10 });

      emitter.process(createPointer("start", 100, 100));
      emitter.process(createPointer("move", 102, 100));
      const event = emitter.process(createPointer("cancel", 102, 100));

      expect(event).toBeNull();
    });
  });

  describe("event data", () => {
    it("should include correct position data", () => {
      const emitter = createPanEmitter({ threshold: 10 });

      emitter.process(createPointer("start", 100, 100));
      const event = emitter.process(createPointer("move", 150, 120, 16));

      expect(event!.x).toBe(150);
      expect(event!.y).toBe(120);
      expect(event!.pageX).toBe(150);
      expect(event!.pageY).toBe(620);
    });

    it("should calculate direction correctly", () => {
      const emitter = createPanEmitter({ threshold: 5 });

      emitter.process(createPointer("start", 100, 100));
      const right = emitter.process(createPointer("move", 150, 100));
      expect(right!.direction).toBe("right");

      emitter.reset();
      emitter.process(createPointer("start", 100, 100));
      const left = emitter.process(createPointer("move", 50, 100));
      expect(left!.direction).toBe("left");

      emitter.reset();
      emitter.process(createPointer("start", 100, 100));
      const down = emitter.process(createPointer("move", 100, 150));
      expect(down!.direction).toBe("down");

      emitter.reset();
      emitter.process(createPointer("start", 100, 100));
      const up = emitter.process(createPointer("move", 100, 50));
      expect(up!.direction).toBe("up");
    });

    it("should track cumulative distance", () => {
      const emitter = createPanEmitter({ threshold: 5 });

      emitter.process(createPointer("start", 0, 0));
      emitter.process(createPointer("move", 10, 0));
      const event = emitter.process(createPointer("move", 20, 0));

      expect(event!.distance).toBeGreaterThan(15);
    });

    it("should include deviceId from pointer", () => {
      const emitter = createPanEmitter({ threshold: 5 });

      emitter.process(createPointer("start", 100, 100));
      const event = emitter.process(createPointer("move", 120, 100));

      expect(event!.deviceId).toBe("mouse-1");
    });
  });

  describe("reset", () => {
    it("should reset state to inactive", () => {
      const emitter = createPanEmitter();

      emitter.process(createPointer("start", 100, 100));
      expect(emitter.isActive).toBe(true);

      emitter.reset();
      expect(emitter.isActive).toBe(false);
      expect(emitter.thresholdMet).toBe(false);
    });
  });
});
