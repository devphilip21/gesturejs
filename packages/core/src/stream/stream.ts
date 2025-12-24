export type Unsubscribe = () => void;

export interface Observer<T> {
  next(value: T): void;
  error?(err: unknown): void;
  complete?(): void;
}

/**
 * Stream is the core reactive abstraction in Cereb.
 * All streams are blockable - when blocked, events are silently dropped.
 * By default, streams support a single observer. Use share() for multicast.
 */
export interface Stream<T> {
  subscribe(observer: Observer<T> | ((value: T) => void)): Unsubscribe;

  /** Block event propagation. Events are dropped, not queued. */
  block(): void;

  /** Unblock event propagation, resuming normal flow. */
  unblock(): void;

  /** Returns true if the stream is currently blocked. */
  readonly isBlocked: boolean;
}

export type Operator<T, R> = (source: Stream<T>) => Stream<R>;

export function toObserver<T>(observerOrNext: Observer<T> | ((value: T) => void)): Observer<T> {
  if (typeof observerOrNext === "function") {
    return { next: observerOrNext };
  }
  return observerOrNext;
}

/**
 * Creates a Stream from a subscribe function.
 * The stream can be blocked/unblocked to control event flow.
 */
export function createStream<T>(
  subscribeFn: (observer: Observer<T>) => Unsubscribe | void,
): Stream<T> {
  let blocked = false;

  return {
    get isBlocked() {
      return blocked;
    },

    block() {
      blocked = true;
    },

    unblock() {
      blocked = false;
    },

    subscribe(observerOrNext) {
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
  };
}
