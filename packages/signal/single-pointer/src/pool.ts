import { createSignalPool } from "@cereb/signal";
import { createDefaultSinglePointer, resetSinglePointer, type SinglePointer } from "./signal.js";

export const singlePointerPool = createSignalPool<SinglePointer>(
  createDefaultSinglePointer,
  resetSinglePointer,
  20,
  100,
);

export function releaseSinglePointer(pointer: SinglePointer): void {
  singlePointerPool.release(pointer);
}
