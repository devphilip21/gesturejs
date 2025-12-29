import type { Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";

export function compose<T extends Signal, A extends Signal>(op1: Operator<T, A>): Operator<T, A>;
export function compose<T extends Signal, A extends Signal, B extends Signal>(
  op1: Operator<T, A>,
  op2: Operator<A, B>,
): Operator<T, B>;
export function compose<T extends Signal, A extends Signal, B extends Signal, C extends Signal>(
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
): Operator<T, C>;
export function compose<
  T extends Signal,
  A extends Signal,
  B extends Signal,
  C extends Signal,
  D extends Signal,
>(
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
): Operator<T, D>;
export function compose<
  T extends Signal,
  A extends Signal,
  B extends Signal,
  C extends Signal,
  D extends Signal,
  E extends Signal,
>(
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
  op5: Operator<D, E>,
): Operator<T, E>;
export function compose(...operators: Operator<Signal, Signal>[]): Operator<Signal, Signal>;
export function compose(...operators: Operator<Signal, Signal>[]): Operator<Signal, Signal> {
  return (source) => source.pipe(...operators);
}
