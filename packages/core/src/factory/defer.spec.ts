import { describe, expect, it } from "vitest";
import { defer } from "./defer.js";
import { of } from "./of.js";

describe("defer", () => {
  it("should create new observable on each subscribe", () => {
    let callCount = 0;
    const observable = defer(() => {
      callCount++;
      return of(callCount);
    });

    const values1: number[] = [];
    const values2: number[] = [];

    observable.subscribe((v) => values1.push(v));
    observable.subscribe((v) => values2.push(v));

    expect(values1).toEqual([1]);
    expect(values2).toEqual([2]);
  });
});
