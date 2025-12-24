import { createObjectPool } from "../../internal/object-pool.js";
import {
  createDefaultSinglePointer,
  resetSinglePointer,
  type SinglePointer,
} from "./single-pointer.js";

export const singlePointerPool = createObjectPool(createDefaultSinglePointer, resetSinglePointer, {
  initialSize: 20,
  maxSize: 100,
});

export function releaseSinglePointer(pointer: SinglePointer): void {
  singlePointerPool.release(pointer);
}
