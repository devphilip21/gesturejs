import { createSignal, type Signal } from "../../core/signal.js";
import type { Point } from "../../geometry/types.js";
import type {
  SinglePointerButton,
  SinglePointerPhase,
  SinglePointerType,
} from "../single-pointer/types.js";

export interface MultiPointerSignal extends Signal<"multi-pointer", MultiPointer> {}

export const MULTI_POINTER_SIGNAL_KIND = "multi-pointer" as const;

/**
 * Represents the complete state of all active pointers at a given moment.
 * Emitted as a snapshot whenever any pointer changes state.
 */
export interface MultiPointer {
  /** Session-level phase: tracks the overall multi-pointer interaction lifecycle */
  phase: MultiPointerPhase;
  /** Array of currently active pointers */
  pointers: readonly PointerInfo[];
  /** Total number of active pointers */
  count: number;
}

/**
 * Session-level phase for multi-pointer interactions:
 * - "idle": No active pointers
 * - "active": One or more pointers are active
 * - "ended": All pointers have ended (transition state)
 */
export type MultiPointerPhase = "idle" | "active" | "ended";

/**
 * Information about a single pointer within a multi-pointer context.
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

export function createMultiPointerSignal(multiPointer: MultiPointer): MultiPointerSignal {
  return createSignal(MULTI_POINTER_SIGNAL_KIND, multiPointer);
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
