import { describe, expect, it } from "vitest";
import { createDefaultPanEvent, isPanEvent, resetPanEvent } from "./event.js";

describe("createDefaultPanEvent", () => {
  it("should create event with default values", () => {
    const event = createDefaultPanEvent();

    expect(event.type).toBe("pan");
    expect(event.timestamp).toBe(0);
    expect(event.deviceId).toBe("");
    expect(event.phase).toBe("start");
    expect(event.deltaX).toBe(0);
    expect(event.deltaY).toBe(0);
    expect(event.distance).toBe(0);
    expect(event.direction).toBe("none");
    expect(event.x).toBe(0);
    expect(event.y).toBe(0);
    expect(event.pageX).toBe(0);
    expect(event.pageY).toBe(0);
  });
});

describe("resetPanEvent", () => {
  it("should reset all fields to default values", () => {
    const event = createDefaultPanEvent();
    event.timestamp = 100;
    event.deviceId = "mouse-1";
    event.phase = "change";
    event.deltaX = 50;
    event.deltaY = 30;
    event.distance = 100;
    event.direction = "right";
    event.x = 150;
    event.y = 130;
    event.pageX = 150;
    event.pageY = 630;

    resetPanEvent(event);

    expect(event.timestamp).toBe(0);
    expect(event.deviceId).toBe("");
    expect(event.phase).toBe("start");
    expect(event.deltaX).toBe(0);
    expect(event.deltaY).toBe(0);
    expect(event.distance).toBe(0);
    expect(event.direction).toBe("none");
    expect(event.x).toBe(0);
    expect(event.y).toBe(0);
    expect(event.pageX).toBe(0);
    expect(event.pageY).toBe(0);
  });
});

describe("isPanEvent", () => {
  it("should return true for pan type event", () => {
    const event = { type: "pan", timestamp: 0, deviceId: "" };

    expect(isPanEvent(event)).toBe(true);
  });

  it("should return false for non-pan event", () => {
    const event = { type: "pointer", timestamp: 0, deviceId: "" };

    expect(isPanEvent(event)).toBe(false);
  });
});
