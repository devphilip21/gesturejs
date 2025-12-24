import { describe, expect, it } from "vitest";
import { createObjectPool } from "./object-pool.js";

describe("createObjectPool", () => {
  it("should create pool with initial size", () => {
    const pool = createObjectPool(
      () => ({ value: 0 }),
      (obj) => {
        obj.value = 0;
      },
      { initialSize: 5 },
    );

    expect(pool.size).toBe(5);
  });

  it("should acquire and release objects", () => {
    const pool = createObjectPool(
      () => ({ value: 0 }),
      (obj) => {
        obj.value = 0;
      },
      { initialSize: 2 },
    );

    const obj1 = pool.acquire();
    expect(pool.size).toBe(1);

    obj1.value = 42;
    pool.release(obj1);
    expect(pool.size).toBe(2);

    const obj2 = pool.acquire();
    expect(obj2.value).toBe(0);
  });

  it("should create new objects when pool is empty", () => {
    const pool = createObjectPool(
      () => ({ value: 0 }),
      (obj) => {
        obj.value = 0;
      },
      { initialSize: 0 },
    );

    expect(pool.size).toBe(0);
    const obj = pool.acquire();
    expect(obj).toEqual({ value: 0 });
  });

  it("should respect maxSize", () => {
    const pool = createObjectPool(
      () => ({ value: 0 }),
      (obj) => {
        obj.value = 0;
      },
      { initialSize: 0, maxSize: 2 },
    );

    const obj1 = pool.acquire();
    const obj2 = pool.acquire();
    const obj3 = pool.acquire();

    pool.release(obj1);
    pool.release(obj2);
    pool.release(obj3);

    expect(pool.size).toBe(2);
  });
});
