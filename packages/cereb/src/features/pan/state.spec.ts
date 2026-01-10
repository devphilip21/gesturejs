import { describe, expect, it } from "vitest";
import { createInitialPanState, resetPanState } from "./state.js";

describe("createInitialPanState", () => {
  it("should create state with initial values", () => {
    const state = createInitialPanState();

    expect(state.isActive).toBe(false);
    expect(state.thresholdMet).toBe(false);
    expect(state.startX).toBe(0);
    expect(state.startY).toBe(0);
    expect(state.startTimestamp).toBe(0);
    expect(state.prevX).toBe(0);
    expect(state.prevY).toBe(0);
    expect(state.prevTimestamp).toBe(0);
    expect(state.totalDistance).toBe(0);
    expect(state.deviceId).toBe("");
  });
});

describe("resetPanState", () => {
  it("should reset all fields to initial values", () => {
    const state = createInitialPanState();
    state.isActive = true;
    state.thresholdMet = true;
    state.startX = 100;
    state.startY = 200;
    state.startTimestamp = 1000;
    state.prevX = 150;
    state.prevY = 250;
    state.prevTimestamp = 1016;
    state.totalDistance = 75;
    state.deviceId = "mouse-1";

    resetPanState(state);

    expect(state.isActive).toBe(false);
    expect(state.thresholdMet).toBe(false);
    expect(state.startX).toBe(0);
    expect(state.startY).toBe(0);
    expect(state.startTimestamp).toBe(0);
    expect(state.prevX).toBe(0);
    expect(state.prevY).toBe(0);
    expect(state.prevTimestamp).toBe(0);
    expect(state.totalDistance).toBe(0);
    expect(state.deviceId).toBe("");
  });
});
