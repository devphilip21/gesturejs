import { describe, expect, it } from "vitest";
import { createInitialPinchState, resetPinchState } from "./state.js";

describe("createInitialPinchState", () => {
  it("should create state with initial values", () => {
    const state = createInitialPinchState();

    expect(state.isActive).toBe(false);
    expect(state.thresholdMet).toBe(false);
    expect(state.initialDistance).toBe(0);
    expect(state.prevDistance).toBe(0);
    expect(state.pointer1Id).toBe("");
    expect(state.pointer2Id).toBe("");
    expect(state.startTimestamp).toBe(0);
    expect(state.prevTimestamp).toBe(0);
    expect(state.deviceId).toBe("");
  });
});

describe("resetPinchState", () => {
  it("should reset all fields to initial values", () => {
    const state = createInitialPinchState();

    state.isActive = true;
    state.thresholdMet = true;
    state.initialDistance = 100;
    state.prevDistance = 250;
    state.pointer1Id = "touch-1";
    state.pointer2Id = "touch-2";
    state.startTimestamp = 1000;
    state.prevTimestamp = 2000;
    state.deviceId = "device-1";

    resetPinchState(state);

    expect(state.isActive).toBe(false);
    expect(state.thresholdMet).toBe(false);
    expect(state.initialDistance).toBe(0);
    expect(state.prevDistance).toBe(0);
    expect(state.pointer1Id).toBe("");
    expect(state.pointer2Id).toBe("");
    expect(state.startTimestamp).toBe(0);
    expect(state.prevTimestamp).toBe(0);
    expect(state.deviceId).toBe("");
  });
});
