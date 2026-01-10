import { describe, expect, it } from "vitest";
import { dom } from "./dom.js";

describe("eventStream", () => {
  it("should emit events and cleanup on unsubscribe", () => {
    const target = new EventTarget();
    const source = dom(target, "click");
    const values: Event[] = [];

    const unsub = source.on((v) => values.push(v.value));
    target.dispatchEvent(new Event("click"));
    target.dispatchEvent(new Event("click"));
    unsub();
    target.dispatchEvent(new Event("click"));

    expect(values).toHaveLength(2);
  });

  it("should return EventSource with block/unblock methods", () => {
    const target = new EventTarget();
    const source = dom(target, "click");

    expect(typeof source.block).toBe("function");
    expect(typeof source.unblock).toBe("function");
    expect(source.isBlocked).toBe(false);
  });

  it("should drop events when blocked", () => {
    const target = new EventTarget();
    const source = dom(target, "click");
    const values: Event[] = [];

    source.on((v) => values.push(v.value));

    target.dispatchEvent(new Event("click"));
    source.block();
    target.dispatchEvent(new Event("click"));
    target.dispatchEvent(new Event("click"));

    expect(values).toHaveLength(1);
    expect(source.isBlocked).toBe(true);
  });

  it("should resume emitting after unblock", () => {
    const target = new EventTarget();
    const source = dom(target, "click");
    const values: Event[] = [];

    source.on((v) => values.push(v.value));

    target.dispatchEvent(new Event("click"));
    source.block();
    target.dispatchEvent(new Event("click"));
    source.unblock();
    target.dispatchEvent(new Event("click"));

    expect(values).toHaveLength(2);
  });
});
