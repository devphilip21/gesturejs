import { createObjectPool } from "../core/pool.js";
import {
  createDefaultSinglePointer,
  resetSinglePointer,
  type SinglePointer,
} from "./signal.js";

export const singlePointerPool = createObjectPool<SinglePointer>(
  createDefaultSinglePointer,
  resetSinglePointer,
  20,
  100
);

export function releaseSinglePointer(pointer: SinglePointer): void {
  singlePointerPool.release(pointer);
}
