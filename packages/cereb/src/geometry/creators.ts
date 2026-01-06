import type { Point, Vector } from "./types.js";

export function point2D(x: number, y: number): Point {
  return [x, y];
}

export function point3D(x: number, y: number, z: number): Point {
  return [x, y, z];
}

export function origin(dimensions: number = 2): Point {
  return Array(dimensions).fill(0);
}

export function vector2D(dx: number, dy: number): Vector {
  return [dx, dy];
}

export function vector3D(dx: number, dy: number, dz: number): Vector {
  return [dx, dy, dz];
}

export function zero(dimensions: number = 2): Vector {
  return Array(dimensions).fill(0);
}
