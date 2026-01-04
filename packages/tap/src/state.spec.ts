import { describe, expect, it } from "vitest";
import { createInitialTapState, resetCurrentTap, resetTapState } from "./state.js";

describe("createInitialTapState", () => {
  it("should create state with initial values", () => {
    const state = createInitialTapState();

    expect(state.isActive).toBe(false);
    expect(state.startX).toBe(0);
    expect(state.startY).toBe(0);
    expect(state.startPageX).toBe(0);
    expect(state.startPageY).toBe(0);
    expect(state.startTimestamp).toBe(0);
    expect(state.deviceId).toBe("");
    expect(state.pointerType).toBe("unknown");
    expect(state.lastTapEndTimestamp).toBe(0);
    expect(state.lastTapX).toBe(0);
    expect(state.lastTapY).toBe(0);
    expect(state.currentTapCount).toBe(0);
    expect(state.isCancelled).toBe(false);
  });
});

describe("resetCurrentTap", () => {
  it("should reset current tap fields but preserve multi-tap tracking", () => {
    const state = createInitialTapState();
    state.isActive = true;
    state.startX = 100;
    state.startY = 200;
    state.startTimestamp = 1000;
    state.deviceId = "mouse-1";
    state.isCancelled = true;
    state.lastTapEndTimestamp = 500;
    state.lastTapX = 50;
    state.lastTapY = 60;
    state.currentTapCount = 2;

    resetCurrentTap(state);

    expect(state.isActive).toBe(false);
    expect(state.startX).toBe(0);
    expect(state.startY).toBe(0);
    expect(state.isCancelled).toBe(false);
    expect(state.lastTapEndTimestamp).toBe(500);
    expect(state.lastTapX).toBe(50);
    expect(state.lastTapY).toBe(60);
    expect(state.currentTapCount).toBe(2);
  });
});

describe("resetTapState", () => {
  it("should reset all fields to initial values", () => {
    const state = createInitialTapState();
    state.isActive = true;
    state.startX = 100;
    state.startY = 200;
    state.startTimestamp = 1000;
    state.deviceId = "mouse-1";
    state.lastTapEndTimestamp = 500;
    state.lastTapX = 50;
    state.lastTapY = 60;
    state.currentTapCount = 2;

    resetTapState(state);

    expect(state.isActive).toBe(false);
    expect(state.startX).toBe(0);
    expect(state.startY).toBe(0);
    expect(state.lastTapEndTimestamp).toBe(0);
    expect(state.lastTapX).toBe(0);
    expect(state.lastTapY).toBe(0);
    expect(state.currentTapCount).toBe(0);
  });
});
