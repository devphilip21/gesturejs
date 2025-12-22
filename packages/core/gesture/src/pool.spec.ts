import { describe, expect, it, vi } from "vitest";
import { type GestureEvent, PREVENTED } from "./event.js";
import { createGestureEventPool } from "./pool.js";

interface TestGestureEvent extends GestureEvent<"test"> {
  deltaX: number;
  deltaY: number;
}

describe("createGestureEventPool", () => {
  const factory = (): TestGestureEvent => ({
    type: "test",
    timestamp: 0,
    deviceId: "",
    phase: "start",
    deltaX: 0,
    deltaY: 0,
    prevent() {
      (this as unknown as Record<symbol, boolean>)[PREVENTED] = true;
    },
  });

  const reset = (obj: TestGestureEvent) => {
    obj.timestamp = 0;
    obj.deviceId = "";
    obj.phase = "start";
    obj.deltaX = 0;
    obj.deltaY = 0;
    (obj as unknown as Record<symbol, boolean>)[PREVENTED] = false;
  };

  it("should create a pool with initial size", () => {
    const pool = createGestureEventPool(factory, reset, 5);

    expect(pool.size).toBe(5);
    expect(pool.active).toBe(0);
  });

  it("should acquire gesture events from pool", () => {
    const pool = createGestureEventPool(factory, reset, 3);

    const event = pool.acquire();

    expect(event.type).toBe("test");
    expect(event.phase).toBe("start");
    expect(pool.size).toBe(2);
    expect(pool.active).toBe(1);
  });

  it("should release gesture events back to pool", () => {
    const pool = createGestureEventPool(factory, reset, 1);

    const event = pool.acquire();
    event.deltaX = 100;
    event.deltaY = 200;
    event.deviceId = "device-1";
    pool.release(event);

    expect(event.deltaX).toBe(0);
    expect(event.deltaY).toBe(0);
    expect(event.deviceId).toBe("");
    expect(pool.size).toBe(1);
    expect(pool.active).toBe(0);
  });

  it("should create new event when pool is empty", () => {
    const factorySpy = vi.fn(factory);
    const pool = createGestureEventPool(factorySpy, reset, 1);

    pool.acquire();
    pool.acquire();

    expect(factorySpy).toHaveBeenCalledTimes(2);
  });

  it("should respect maxSize on release", () => {
    const pool = createGestureEventPool(factory, reset, 0, 2);

    const e1 = pool.acquire();
    const e2 = pool.acquire();
    const e3 = pool.acquire();

    pool.release(e1);
    pool.release(e2);
    pool.release(e3);

    expect(pool.size).toBe(2);
  });
});
