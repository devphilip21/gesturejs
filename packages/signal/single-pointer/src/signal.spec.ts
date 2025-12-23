import type { Signal } from "@cereb/signal";
import { describe, expect, it } from "vitest";
import { createDefaultSinglePointer, isSinglePointer, resetSinglePointer } from "./signal.js";

describe("createDefaultSinglePointer", () => {
  it("should create pointer with default values", () => {
    const pointer = createDefaultSinglePointer();

    expect(pointer).toEqual({
      type: "pointer",
      timestamp: 0,
      deviceId: "",
      phase: "move",
      x: 0,
      y: 0,
      pageX: 0,
      pageY: 0,
      pointerType: "unknown",
      button: "none",
      pressure: 0.5,
    });
  });
});

describe("resetSinglePointer", () => {
  it("should reset pointer to default values", () => {
    const pointer = createDefaultSinglePointer();
    pointer.timestamp = 100;
    pointer.deviceId = "mouse-1";
    pointer.phase = "start";
    pointer.x = 150;
    pointer.y = 200;
    pointer.pageX = 150;
    pointer.pageY = 700;
    pointer.pointerType = "mouse";
    pointer.button = "primary";
    pointer.pressure = 1.0;

    resetSinglePointer(pointer);

    expect(pointer.timestamp).toBe(0);
    expect(pointer.deviceId).toBe("");
    expect(pointer.phase).toBe("move");
    expect(pointer.x).toBe(0);
    expect(pointer.y).toBe(0);
    expect(pointer.pageX).toBe(0);
    expect(pointer.pageY).toBe(0);
    expect(pointer.pointerType).toBe("unknown");
    expect(pointer.button).toBe("none");
    expect(pointer.pressure).toBe(0.5);
  });
});

describe("isSinglePointer", () => {
  it("should return true for pointer type signal", () => {
    const signal: Signal = { type: "pointer", timestamp: 0, deviceId: "" };

    expect(isSinglePointer(signal)).toBe(true);
  });

  it("should return false for non-pointer signal", () => {
    const signal: Signal = { type: "gesture", timestamp: 0, deviceId: "" };

    expect(isSinglePointer(signal)).toBe(false);
  });
});
