import { describe, expect, it, vi } from "vitest";
import type { SinglePointerSignal } from "../browser/single-pointer/single-pointer-signal.js";
import { createSinglePointerSignal } from "../browser/single-pointer/single-pointer-signal.js";
import { createSignal, type Signal } from "../core/signal.js";
import { createStream } from "../core/stream.js";
import { type OffsetOperatorResult, offset } from "./offset.js";

type OffsetPointerSignal = OffsetOperatorResult<SinglePointerSignal>;

function createMockPointerSignal(x: number, y: number): SinglePointerSignal {
  return createSinglePointerSignal({
    id: "mouse-1",
    phase: "move",
    cursor: [x, y],
    pageCursor: [x, y],
    pointerType: "mouse",
    button: "none",
    pressure: 0.5,
  });
}

function createMockElement(rect: Partial<DOMRect> = {}): {
  element: Element;
  getBoundingClientRect: ReturnType<typeof vi.fn>;
} {
  const getBoundingClientRect = vi.fn(() => ({
    top: rect.top ?? 100,
    left: rect.left ?? 50,
    right: rect.right ?? 250,
    bottom: rect.bottom ?? 300,
    width: rect.width ?? 200,
    height: rect.height ?? 200,
    x: rect.x ?? 50,
    y: rect.y ?? 100,
    toJSON: () => ({}),
  }));
  return {
    element: { getBoundingClientRect } as unknown as Element,
    getBoundingClientRect,
  };
}

describe("offset operator", () => {
  it("should calculate offset relative to target element", () => {
    const { element } = createMockElement({ top: 100, left: 50 });
    const op = offset<SinglePointerSignal>({ target: element });

    const values: Array<{ offset: [number, number] }> = [];

    const source = createStream<SinglePointerSignal>((observer) => {
      observer.next(createMockPointerSignal(150, 200));
      return () => {};
    });

    source.pipe(op).on((v: OffsetPointerSignal) => {
      values.push({ offset: v.value.offset as [number, number] });
    });

    expect(values[0]).toEqual({ offset: [100, 100] });
  });

  it("should preserve original signal properties", () => {
    const { element } = createMockElement();
    const op = offset<SinglePointerSignal>({ target: element });

    const source = createStream<SinglePointerSignal>((observer) => {
      observer.next(createMockPointerSignal(150, 200));
      return () => {};
    });

    source.pipe(op).on((v: OffsetPointerSignal) => {
      expect(v.value.cursor[0]).toBe(150);
      expect(v.value.cursor[1]).toBe(200);
      expect(v.kind).toBe("single-pointer");
    });
  });

  it("should recalculate rect on every event when recalculate$ is not provided", () => {
    const { element, getBoundingClientRect } = createMockElement();
    const op = offset<SinglePointerSignal>({ target: element });

    const source = createStream<SinglePointerSignal>((observer) => {
      observer.next(createMockPointerSignal(100, 100));
      observer.next(createMockPointerSignal(100, 100));
      return () => {};
    });

    source.pipe(op).on(() => {});

    expect(getBoundingClientRect).toHaveBeenCalledTimes(2);
  });

  it("should cache rect when recalculate$ is provided", () => {
    const { element, getBoundingClientRect } = createMockElement();

    let emitRecalculate: () => void;
    const recalculate$ = createStream<Signal>((observer) => {
      emitRecalculate = () => observer.next(createSignal("recalculate", null));
      return () => {};
    });

    const op = offset<SinglePointerSignal>({ target: element, recalculate$ });

    const source = createStream<SinglePointerSignal>((observer) => {
      observer.next(createMockPointerSignal(100, 100));
      observer.next(createMockPointerSignal(100, 100));
      return () => {};
    });

    source.pipe(op).on(() => {});

    // Should only call once due to caching
    expect(getBoundingClientRect).toHaveBeenCalledTimes(1);

    // Trigger recalculate
    emitRecalculate!();
    expect(getBoundingClientRect).toHaveBeenCalledTimes(2);
  });

  it("should unsubscribe from recalculate$ on cleanup", () => {
    const { element } = createMockElement();

    let unsubscribed = false;
    const recalculate$ = createStream<Signal>(() => {
      return () => {
        unsubscribed = true;
      };
    });

    const op = offset<SinglePointerSignal>({ target: element, recalculate$ });

    const source = createStream<SinglePointerSignal>((observer) => {
      observer.next(createMockPointerSignal(100, 100));
      return () => {};
    });

    const unsub = source.pipe(op).on(() => {});
    expect(unsubscribed).toBe(false);

    unsub();
    expect(unsubscribed).toBe(true);
  });

  it("should throw error if target is null", () => {
    expect(() => offset({ target: null as unknown as Element })).toThrow(
      "offset operator requires a valid target element",
    );
  });
});
