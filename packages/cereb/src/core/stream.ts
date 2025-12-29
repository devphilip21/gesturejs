import type { Signal } from "./signal.js";

export type Unsubscribe = () => void;

export interface Observer<T extends Signal> {
  next(value: T): void;
  error?(err: unknown): void;
  complete?(): void;
}

export type Operator<T extends Signal, R extends Signal> = (source: Stream<T>) => Stream<R>;

/**
 * Stream is the core reactive abstraction in Cereb.
 * All streams are blockable - when blocked, events are silently dropped.
 * By default, streams support a single observer. Use share() for multicast.
 */
export interface Stream<T extends Signal> {
  on(observer: Observer<T> | ((value: T) => void)): Unsubscribe;

  /** Block event propagation. Events are dropped, not queued. */
  block(): void;

  /** Unblock event propagation, resuming normal flow. */
  unblock(): void;

  /** Returns true if the stream is currently blocked. */
  readonly isBlocked: boolean;

  /** Chain operators to transform this stream. */
  pipe(): Stream<T>;
  pipe<A extends Signal>(op1: Operator<T, A>): Stream<A>;
  pipe<A extends Signal, B extends Signal>(op1: Operator<T, A>, op2: Operator<A, B>): Stream<B>;
  pipe<A extends Signal, B extends Signal, C extends Signal>(
    op1: Operator<T, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
  ): Stream<C>;
  pipe<A extends Signal, B extends Signal, C extends Signal, D extends Signal>(
    op1: Operator<T, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
  ): Stream<D>;
  pipe<A extends Signal, B extends Signal, C extends Signal, D extends Signal, E extends Signal>(
    op1: Operator<T, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
  ): Stream<E>;
  pipe<
    A extends Signal,
    B extends Signal,
    C extends Signal,
    D extends Signal,
    E extends Signal,
    F extends Signal,
  >(
    op1: Operator<T, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
    op6: Operator<E, F>,
  ): Stream<F>;
  pipe<
    A extends Signal,
    B extends Signal,
    C extends Signal,
    D extends Signal,
    E extends Signal,
    F extends Signal,
    G extends Signal,
  >(
    op1: Operator<T, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
    op6: Operator<E, F>,
    op7: Operator<F, G>,
  ): Stream<G>;
  pipe<
    A extends Signal,
    B extends Signal,
    C extends Signal,
    D extends Signal,
    E extends Signal,
    F extends Signal,
    G extends Signal,
    H extends Signal,
  >(
    op1: Operator<T, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
    op6: Operator<E, F>,
    op7: Operator<F, G>,
    op8: Operator<G, H>,
  ): Stream<H>;
  pipe(...operators: Operator<Signal, Signal>[]): Stream<Signal>;
}

export function toObserver<T extends Signal>(
  observerOrNext: Observer<T> | ((value: T) => void),
): Observer<T> {
  if (typeof observerOrNext === "function") {
    return { next: observerOrNext };
  }
  return observerOrNext;
}

export function pipeStream<T extends Signal>(
  stream: Stream<T>,
  operators: Operator<Signal, Signal>[],
): Stream<Signal> {
  return operators.reduce((prev, op) => op(prev), stream as Stream<Signal>);
}

/**
 * Creates a Stream from a subscribe function.
 * The stream can be blocked/unblocked to control event flow.
 */
export function createStream<T extends Signal>(
  subscribeFn: (observer: Observer<T>) => Unsubscribe | void,
): Stream<T> {
  let blocked = false;

  const stream: Stream<T> = {
    get isBlocked() {
      return blocked;
    },

    block() {
      blocked = true;
    },

    unblock() {
      blocked = false;
    },

    on(observerOrNext) {
      const observer = toObserver(observerOrNext);

      const wrappedObserver: Observer<T> = {
        next(value) {
          if (!blocked) {
            observer.next(value);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      };

      const cleanup = subscribeFn(wrappedObserver);
      return cleanup ?? (() => {});
    },

    pipe(...operators: Operator<Signal, Signal>[]) {
      return pipeStream(stream, operators);
    },
  };

  return stream;
}
