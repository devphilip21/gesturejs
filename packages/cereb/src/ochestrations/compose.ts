import { pipe } from "../index.js";
import type { Operator } from "../stream/stream.js";

export function compose<T, A>(op1: Operator<T, A>): Operator<T, A>;
export function compose<T, A, B>(op1: Operator<T, A>, op2: Operator<A, B>): Operator<T, B>;
export function compose<T, A, B, C>(
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
): Operator<T, C>;
export function compose<T, A, B, C, D>(
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
): Operator<T, D>;
export function compose<T, A, B, C, D, E>(
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
  op5: Operator<D, E>,
): Operator<T, E>;
export function compose(...operators: Operator<unknown, unknown>[]): Operator<unknown, unknown>;
export function compose(...operators: Operator<unknown, unknown>[]): Operator<unknown, unknown> {
  return (source) => pipe(source, ...operators);
}
