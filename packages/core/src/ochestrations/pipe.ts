import type { Operator, Stream } from "../stream/stream.js";

export function pipe<T>(source: Stream<T>): Stream<T>;
export function pipe<T, A>(source: Stream<T>, op1: Operator<T, A>): Stream<A>;
export function pipe<T, A, B>(
  source: Stream<T>,
  op1: Operator<T, A>,
  op2: Operator<A, B>,
): Stream<B>;
export function pipe<T, A, B, C>(
  source: Stream<T>,
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
): Stream<C>;
export function pipe<T, A, B, C, D>(
  source: Stream<T>,
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
): Stream<D>;
export function pipe<T, A, B, C, D, E>(
  source: Stream<T>,
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
  op5: Operator<D, E>,
): Stream<E>;
export function pipe<T, A, B, C, D, E, F>(
  source: Stream<T>,
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
  op5: Operator<D, E>,
  op6: Operator<E, F>,
): Stream<F>;
export function pipe<T, A, B, C, D, E, F, G>(
  source: Stream<T>,
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
  op5: Operator<D, E>,
  op6: Operator<E, F>,
  op7: Operator<F, G>,
): Stream<G>;
export function pipe<T, A, B, C, D, E, F, G, H>(
  source: Stream<T>,
  op1: Operator<T, A>,
  op2: Operator<A, B>,
  op3: Operator<B, C>,
  op4: Operator<C, D>,
  op5: Operator<D, E>,
  op6: Operator<E, F>,
  op7: Operator<F, G>,
  op8: Operator<G, H>,
): Stream<H>;
export function pipe<T>(
  source: Stream<T>,
  ...operators: Operator<unknown, unknown>[]
): Stream<unknown>;
export function pipe<T>(
  source: Stream<T>,
  ...operators: Operator<unknown, unknown>[]
): Stream<unknown> {
  return operators.reduce((prev, op) => op(prev), source as Stream<unknown>);
}
