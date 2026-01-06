/**
 * Tuple-based geometric types providing semantic distinction between
 * positions (Point) and displacements (Vector) with unified 2D/3D support.
 */

export type Tuple = number[];

/** A position in space: [x, y] or [x, y, z] */
export type Point = Tuple;

/** A direction and magnitude: [dx, dy] or [dx, dy, dz] */
export type Vector = Tuple;
