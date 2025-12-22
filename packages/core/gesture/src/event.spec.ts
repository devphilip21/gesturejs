import { describe, expect, it } from "vitest";
import { type GestureEvent, isPrevented, PREVENTED } from "./event.js";

function createMockGestureEvent(prevented = false): GestureEvent<"test"> {
  const event: GestureEvent<"test"> = {
    type: "test",
    timestamp: performance.now(),
    deviceId: "device-1",
    phase: "start",
    prevent() {
      (this as unknown as Record<symbol, boolean>)[PREVENTED] = true;
    },
  };

  if (prevented) {
    (event as unknown as Record<symbol, boolean>)[PREVENTED] = true;
  }

  return event;
}

describe("isPrevented", () => {
  it("should return false for non-prevented event", () => {
    const event = createMockGestureEvent();

    expect(isPrevented(event)).toBe(false);
  });

  it("should return true for prevented event", () => {
    const event = createMockGestureEvent(true);

    expect(isPrevented(event)).toBe(true);
  });

  it("should return true after calling prevent()", () => {
    const event = createMockGestureEvent();

    event.prevent();

    expect(isPrevented(event)).toBe(true);
  });
});

describe("GestureEvent", () => {
  it("should have required Signal properties", () => {
    const event = createMockGestureEvent();

    expect(event.type).toBe("test");
    expect(typeof event.timestamp).toBe("number");
    expect(event.deviceId).toBe("device-1");
  });

  it("should have phase property", () => {
    const event = createMockGestureEvent();

    expect(event.phase).toBe("start");
  });

  it("should have prevent method", () => {
    const event = createMockGestureEvent();

    expect(typeof event.prevent).toBe("function");
  });
});
