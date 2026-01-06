import type { PointerInfo } from "cereb";
import { describe, expect, it } from "vitest";
import {
  calculateDistance,
  clamp,
  getCenter,
  getPageCenter,
  getPointerDistance,
} from "./geometry.js";

function createPointerInfo(
  overrides: Partial<Omit<PointerInfo, "cursor" | "pageCursor">> & {
    cursor?: [number, number];
    pageCursor?: [number, number];
  } = {},
): PointerInfo {
  return {
    id: "touch-1",
    phase: "move",
    cursor: [0, 0],
    pageCursor: [0, 0],
    pointerType: "touch",
    button: "none",
    pressure: 0.5,
    ...overrides,
  };
}

describe("calculateDistance", () => {
  it("should calculate horizontal distance", () => {
    expect(calculateDistance(0, 0, 10, 0)).toBe(10);
  });

  it("should calculate vertical distance", () => {
    expect(calculateDistance(0, 0, 0, 10)).toBe(10);
  });

  it("should calculate diagonal distance using Pythagorean theorem", () => {
    expect(calculateDistance(0, 0, 3, 4)).toBe(5);
  });

  it("should return zero for same points", () => {
    expect(calculateDistance(5, 5, 5, 5)).toBe(0);
  });

  it("should handle negative coordinates", () => {
    expect(calculateDistance(-5, -5, 5, 5)).toBeCloseTo(14.142, 2);
  });
});

describe("getPointerDistance", () => {
  it("should calculate distance between two PointerInfo objects", () => {
    const p1 = createPointerInfo({ cursor: [0, 0] });
    const p2 = createPointerInfo({ cursor: [3, 4] });

    expect(getPointerDistance(p1, p2)).toBe(5);
  });
});

describe("getCenter", () => {
  it("should calculate center point between two pointers", () => {
    const p1 = createPointerInfo({ cursor: [0, 0] });
    const p2 = createPointerInfo({ cursor: [100, 100] });

    const center = getCenter(p1, p2);
    expect(center[0]).toBe(50);
    expect(center[1]).toBe(50);
  });

  it("should handle pointers at same position", () => {
    const p1 = createPointerInfo({ cursor: [50, 50] });
    const p2 = createPointerInfo({ cursor: [50, 50] });

    const center = getCenter(p1, p2);
    expect(center[0]).toBe(50);
    expect(center[1]).toBe(50);
  });
});

describe("getPageCenter", () => {
  it("should calculate page center between two pointers", () => {
    const p1 = createPointerInfo({ pageCursor: [0, 0] });
    const p2 = createPointerInfo({ pageCursor: [200, 200] });

    const pageCenter = getPageCenter(p1, p2);
    expect(pageCenter[0]).toBe(100);
    expect(pageCenter[1]).toBe(100);
  });
});

describe("clamp", () => {
  it("should return value when within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("should clamp to min when below", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("should clamp to max when above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("should handle equal min and max", () => {
    expect(clamp(5, 5, 5)).toBe(5);
  });
});
