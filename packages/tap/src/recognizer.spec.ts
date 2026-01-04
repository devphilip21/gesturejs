import type { SinglePointerSignal } from "cereb";
import { describe, expect, it } from "vitest";
import { createTapRecognizer } from "./recognizer.js";

function createMockPointerSignal(
  phase: "start" | "move" | "end" | "cancel",
  x: number,
  y: number,
  createdAt: number,
): SinglePointerSignal {
  return {
    kind: "single-pointer",
    value: {
      phase,
      x,
      y,
      pageX: x,
      pageY: y,
      pointerType: "mouse",
      button: "primary",
      pressure: 0.5,
      id: "1",
    },
    deviceId: "test-device",
    createdAt,
  };
}

describe("createTapRecognizer", () => {
  describe("single tap recognition", () => {
    it("should emit start phase on pointer start", () => {
      const recognizer = createTapRecognizer();

      const result = recognizer.process(createMockPointerSignal("start", 100, 100, 0));

      expect(result).not.toBeNull();
      expect(result?.value.phase).toBe("start");
      expect(result?.value.tapCount).toBe(1);
      expect(result?.value.x).toBe(100);
      expect(result?.value.y).toBe(100);
    });

    it("should emit end phase on pointer end within thresholds", () => {
      const recognizer = createTapRecognizer();

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      const result = recognizer.process(createMockPointerSignal("end", 100, 100, 100));

      expect(result).not.toBeNull();
      expect(result?.value.phase).toBe("end");
      expect(result?.value.tapCount).toBe(1);
      expect(result?.value.duration).toBe(100);
    });

    it("should not emit on move within threshold", () => {
      const recognizer = createTapRecognizer({ movementThreshold: 10 });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      const result = recognizer.process(createMockPointerSignal("move", 105, 105, 50));

      expect(result).toBeNull();
    });
  });

  describe("tap cancellation", () => {
    it("should cancel on movement exceeding threshold", () => {
      const recognizer = createTapRecognizer({ movementThreshold: 10 });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      const result = recognizer.process(createMockPointerSignal("move", 120, 100, 50));

      expect(result).not.toBeNull();
      expect(result?.value.phase).toBe("cancel");
      expect(result?.value.tapCount).toBe(0);
    });

    it("should cancel on duration exceeding threshold", () => {
      const recognizer = createTapRecognizer({ durationThreshold: 500 });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      const result = recognizer.process(createMockPointerSignal("move", 100, 100, 600));

      expect(result).not.toBeNull();
      expect(result?.value.phase).toBe("cancel");
    });

    it("should cancel on pointer cancel event", () => {
      const recognizer = createTapRecognizer();

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      const result = recognizer.process(createMockPointerSignal("cancel", 100, 100, 50));

      expect(result).not.toBeNull();
      expect(result?.value.phase).toBe("cancel");
    });

    it("should not emit end after cancellation", () => {
      const recognizer = createTapRecognizer({ movementThreshold: 10 });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      recognizer.process(createMockPointerSignal("move", 120, 100, 50));
      const result = recognizer.process(createMockPointerSignal("end", 120, 100, 100));

      expect(result).toBeNull();
    });
  });

  describe("double tap detection", () => {
    it("should increment tapCount for consecutive taps within interval", () => {
      const recognizer = createTapRecognizer({
        chainIntervalThreshold: 300,
        chainMovementThreshold: 25,
      });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      recognizer.process(createMockPointerSignal("end", 100, 100, 100));

      const startResult = recognizer.process(createMockPointerSignal("start", 105, 105, 200));
      const endResult = recognizer.process(createMockPointerSignal("end", 105, 105, 250));

      expect(startResult?.value.tapCount).toBe(2);
      expect(endResult?.value.tapCount).toBe(2);
    });

    it("should reset tapCount when interval exceeded", () => {
      const recognizer = createTapRecognizer({ chainIntervalThreshold: 300 });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      recognizer.process(createMockPointerSignal("end", 100, 100, 100));

      const startResult = recognizer.process(createMockPointerSignal("start", 100, 100, 500));

      expect(startResult?.value.tapCount).toBe(1);
    });

    it("should reset tapCount when distance exceeded", () => {
      const recognizer = createTapRecognizer({
        chainIntervalThreshold: 300,
        chainMovementThreshold: 25,
      });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      recognizer.process(createMockPointerSignal("end", 100, 100, 100));

      const startResult = recognizer.process(createMockPointerSignal("start", 150, 150, 200));

      expect(startResult?.value.tapCount).toBe(1);
    });
  });

  describe("triple tap and beyond", () => {
    it("should support triple tap", () => {
      const recognizer = createTapRecognizer({
        chainIntervalThreshold: 300,
        chainMovementThreshold: 25,
      });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      recognizer.process(createMockPointerSignal("end", 100, 100, 50));

      recognizer.process(createMockPointerSignal("start", 100, 100, 150));
      recognizer.process(createMockPointerSignal("end", 100, 100, 200));

      const thirdStart = recognizer.process(createMockPointerSignal("start", 100, 100, 300));
      const thirdEnd = recognizer.process(createMockPointerSignal("end", 100, 100, 350));

      expect(thirdStart?.value.tapCount).toBe(3);
      expect(thirdEnd?.value.tapCount).toBe(3);
    });
  });

  describe("reset and dispose", () => {
    it("should reset state", () => {
      const recognizer = createTapRecognizer();

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      expect(recognizer.isActive).toBe(true);

      recognizer.reset();
      expect(recognizer.isActive).toBe(false);
    });

    it("should reset multi-tap tracking on reset", () => {
      const recognizer = createTapRecognizer({ chainIntervalThreshold: 300 });

      recognizer.process(createMockPointerSignal("start", 100, 100, 0));
      recognizer.process(createMockPointerSignal("end", 100, 100, 50));

      recognizer.reset();

      const result = recognizer.process(createMockPointerSignal("start", 100, 100, 100));

      expect(result?.value.tapCount).toBe(1);
    });
  });
});
