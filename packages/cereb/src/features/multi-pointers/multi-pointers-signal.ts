import { createSignal, type Signal } from "../../core/signal.js";
import type { Point } from "../../geometry/types.js";
import type {
  SinglePointerButton,
  SinglePointerPhase,
  SinglePointerType,
} from "../single-pointer/types.js";

export interface MultiPointersSignal extends Signal<"multi-pointers", MultiPointers> {}

export const MULTI_POINTERS_SIGNAL_KIND = "multi-pointers" as const;

/**
 * Represents the complete state of all active pointers at a given moment.
 * Emitted as a snapshot whenever any pointer changes state.
 */
export interface MultiPointers {
  /** Session-level phase: tracks the overall multi-pointers interaction lifecycle */
  phase: MultiPointersPhase;
  /** Array of currently active pointers */
  pointers: readonly PointerInfo[];
  /** Total number of active pointers */
  count: number;
}

/**
 * Session-level phase for multi-pointers interactions:
 * - "idle": No active pointers
 * - "active": One or more pointers are active
 * - "ended": All pointers have ended (transition state)
 */
export type MultiPointersPhase = "idle" | "active" | "ended";

/**
 * Information about a single pointer within a multi-pointers context.
 */
export interface PointerInfo {
  id: string;
  phase: SinglePointerPhase;
  cursor: Point;
  pageCursor: Point;
  pointerType: SinglePointerType;
  button: SinglePointerButton;
  /** 0.0 ~ 1.0, default 0.5 if unsupported */
  pressure: number;
}

export function createMultiPointersSignal(multiPointers: MultiPointers): MultiPointersSignal {
  return createSignal(MULTI_POINTERS_SIGNAL_KIND, multiPointers);
}

export function createDefaultPointerInfo(): PointerInfo {
  return {
    id: "",
    phase: "move",
    cursor: [0, 0],
    pageCursor: [0, 0],
    pointerType: "unknown",
    button: "none",
    pressure: 0.5,
  };
}
