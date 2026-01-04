import { describe, expect, it } from "vitest";
import { calculateDistance } from "./geometry.js";

describe("calculateDistance", () => {
  it("should calculate horizontal distance", () => {
    const distance = calculateDistance(0, 0, 100, 0);

    expect(distance).toBe(100);
  });

  it("should calculate vertical distance", () => {
    const distance = calculateDistance(0, 0, 0, 100);

    expect(distance).toBe(100);
  });

  it("should calculate diagonal distance using Pythagorean theorem", () => {
    const distance = calculateDistance(0, 0, 3, 4);

    expect(distance).toBe(5);
  });

  it("should return zero for same points", () => {
    const distance = calculateDistance(50, 50, 50, 50);

    expect(distance).toBe(0);
  });
});
