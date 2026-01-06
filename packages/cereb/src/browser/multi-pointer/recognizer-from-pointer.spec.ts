import { describe, expect, it } from "vitest";
import { createSignal } from "../../core/signal.js";
import type { Observer } from "../../core/stream.js";
import { createStream } from "../../core/stream.js";
import type { DomEventSignal } from "../dom-event/dom-event-signal.js";
import type { MultiPointerSignal } from "./multi-pointer-signal.js";
import { multiPointerFromPointer } from "./recognizer-from-pointer.js";

function createMockPointerEvent(
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  pointerId: number,
  options: Partial<{
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    pointerType: string;
    button: number;
    pressure: number;
    isPrimary: boolean;
  }> = {},
): PointerEvent {
  return {
    type,
    pointerId,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    pageX: options.pageX ?? 0,
    pageY: options.pageY ?? 0,
    pointerType: options.pointerType ?? "touch",
    button: options.button ?? 0,
    pressure: options.pressure ?? 0.5,
    isPrimary: options.isPrimary ?? true,
  } as PointerEvent;
}

function createDomEventSignal<E extends Event>(event: E): DomEventSignal<E> {
  return createSignal("dom-event", event) as DomEventSignal<E>;
}

describe("multiPointerFromPointer", () => {
  it("should track two pointers starting", () => {
    const values: MultiPointerSignal[] = [];
    let observer: Observer<DomEventSignal<PointerEvent>>;

    const source = createStream<DomEventSignal<PointerEvent>>((obs) => {
      observer = obs;
      return () => {};
    });

    const stream = multiPointerFromPointer()(source);
    stream.on((v) => values.push(v));

    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 1)));
    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 2)));

    expect(values).toHaveLength(2);
    expect(values[0].value.count).toBe(1);
    expect(values[1].value.count).toBe(2);
  });

  it("should emit snapshot with all active pointers on each event", () => {
    const values: MultiPointerSignal[] = [];
    let observer: Observer<DomEventSignal<PointerEvent>>;

    const source = createStream<DomEventSignal<PointerEvent>>((obs) => {
      observer = obs;
      return () => {};
    });

    const stream = multiPointerFromPointer()(source);
    stream.on((v) => values.push(v));

    observer!.next(
      createDomEventSignal(createMockPointerEvent("pointerdown", 1, { clientX: 10, clientY: 20 })),
    );
    observer!.next(
      createDomEventSignal(
        createMockPointerEvent("pointerdown", 2, { clientX: 100, clientY: 200 }),
      ),
    );
    observer!.next(
      createDomEventSignal(createMockPointerEvent("pointermove", 1, { clientX: 15, clientY: 25 })),
    );

    expect(values).toHaveLength(3);

    const lastSnapshot = values[2].value;
    expect(lastSnapshot.count).toBe(2);
    expect(lastSnapshot.pointers[0].cursor[0]).toBe(15);
    expect(lastSnapshot.pointers[0].cursor[1]).toBe(25);
    expect(lastSnapshot.pointers[1].cursor[0]).toBe(100);
    expect(lastSnapshot.pointers[1].cursor[1]).toBe(200);
  });

  it("should correctly handle pointer end and removal", () => {
    const values: MultiPointerSignal[] = [];
    let observer: Observer<DomEventSignal<PointerEvent>>;

    const source = createStream<DomEventSignal<PointerEvent>>((obs) => {
      observer = obs;
      return () => {};
    });

    const stream = multiPointerFromPointer()(source);
    stream.on((v) => values.push(v));

    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 1)));
    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 2)));
    observer!.next(createDomEventSignal(createMockPointerEvent("pointerup", 1)));

    expect(values).toHaveLength(3);
    expect(values[2].value.count).toBe(1);
    expect(values[2].value.pointers[0].id).toBe("touch-2");
  });

  it("should respect maxPointers limit", () => {
    const values: MultiPointerSignal[] = [];
    let observer: Observer<DomEventSignal<PointerEvent>>;

    const source = createStream<DomEventSignal<PointerEvent>>((obs) => {
      observer = obs;
      return () => {};
    });

    const stream = multiPointerFromPointer({ maxPointers: 2 })(source);
    stream.on((v) => values.push(v));

    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 1)));
    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 2)));
    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 3)));

    expect(values).toHaveLength(2);
    expect(values[1].value.count).toBe(2);
  });

  it("should transition phase from idle to active when first pointer starts", () => {
    const values: MultiPointerSignal[] = [];
    let observer: Observer<DomEventSignal<PointerEvent>>;

    const source = createStream<DomEventSignal<PointerEvent>>((obs) => {
      observer = obs;
      return () => {};
    });

    const stream = multiPointerFromPointer()(source);
    stream.on((v) => values.push(v));

    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 1)));

    expect(values[0].value.phase).toBe("active");
  });

  it("should transition phase to ended when all pointers end", () => {
    const values: MultiPointerSignal[] = [];
    let observer: Observer<DomEventSignal<PointerEvent>>;

    const source = createStream<DomEventSignal<PointerEvent>>((obs) => {
      observer = obs;
      return () => {};
    });

    const stream = multiPointerFromPointer()(source);
    stream.on((v) => values.push(v));

    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 1)));
    observer!.next(createDomEventSignal(createMockPointerEvent("pointerup", 1)));

    expect(values[0].value.phase).toBe("active");
    expect(values[1].value.phase).toBe("ended");
    expect(values[1].value.count).toBe(0);
  });

  it("should include individual pointer phase in PointerInfo", () => {
    const values: MultiPointerSignal[] = [];
    let observer: Observer<DomEventSignal<PointerEvent>>;

    const source = createStream<DomEventSignal<PointerEvent>>((obs) => {
      observer = obs;
      return () => {};
    });

    const stream = multiPointerFromPointer()(source);
    stream.on((v) => values.push(v));

    observer!.next(createDomEventSignal(createMockPointerEvent("pointerdown", 1)));
    observer!.next(createDomEventSignal(createMockPointerEvent("pointermove", 1)));

    expect(values[0].value.pointers[0].phase).toBe("start");
    expect(values[1].value.pointers[0].phase).toBe("move");
  });
});
