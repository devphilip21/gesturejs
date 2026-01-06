import type { Point, Tuple, Vector } from "./types.js";

export function add(a: Tuple, b: Tuple): Tuple {
  const len = Math.max(a.length, b.length);
  const result: number[] = [];
  for (let i = 0; i < len; i++) {
    result[i] = (a[i] ?? 0) + (b[i] ?? 0);
  }
  return result;
}

export function subtract(a: Tuple, b: Tuple): Tuple {
  const len = Math.max(a.length, b.length);
  const result: number[] = [];
  for (let i = 0; i < len; i++) {
    result[i] = (a[i] ?? 0) - (b[i] ?? 0);
  }
  return result;
}

export function scale(v: Tuple, scalar: number): Tuple {
  return v.map((c) => c * scalar);
}

export function magnitude(v: Vector): number {
  return Math.sqrt(v.reduce((sum, c) => sum + c * c, 0));
}

export function normalize(v: Vector): Vector {
  const mag = magnitude(v);
  if (mag === 0) return v.map(() => 0);
  return v.map((c) => c / mag);
}

export function dot(a: Tuple, b: Tuple): number {
  const len = Math.min(a.length, b.length);
  let result = 0;
  for (let i = 0; i < len; i++) {
    result += a[i] * b[i];
  }
  return result;
}

export function negate(v: Tuple): Tuple {
  return v.map((c) => -c);
}

export function translate(point: Point, vector: Vector): Point {
  return add(point, vector);
}

export function difference(from: Point, to: Point): Vector {
  return subtract(to, from);
}

export function distance(a: Point, b: Point): number {
  return magnitude(difference(a, b));
}

export function midpoint(a: Point, b: Point): Point {
  return a.map((c, i) => (c + (b[i] ?? 0)) / 2);
}

export function lerp(a: Tuple, b: Tuple, t: number): Tuple {
  const len = Math.max(a.length, b.length);
  const result: number[] = [];
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    result[i] = ai + (bi - ai) * t;
  }
  return result;
}
