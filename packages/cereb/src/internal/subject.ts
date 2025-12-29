import type { Signal } from "../core/signal.js";
import type { Observer, Operator, Stream } from "../core/stream.js";
import { pipeStream, toObserver } from "../core/stream.js";

/**
 * Subject is a multicast Stream that allows pushing values to multiple observers.
 * Unlike regular Stream (single observer), Subject maintains a set of observers.
 */
export interface Subject<T extends Signal> extends Stream<T> {
  next(value: T): void;
  error(err: unknown): void;
  complete(): void;
  readonly closed: boolean;
}

export function createSubject<T extends Signal>(): Subject<T> {
  const observers = new Set<Observer<T>>();
  let closed = false;
  let blocked = false;

  const subject: Subject<T> = {
    get closed() {
      return closed;
    },

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
      if (closed) {
        const obs = toObserver(observerOrNext);
        obs.complete?.();
        return () => {};
      }

      const observer = toObserver(observerOrNext);
      observers.add(observer);

      return () => {
        observers.delete(observer);
      };
    },

    next(value) {
      if (closed || blocked) return;
      for (const observer of observers) {
        observer.next(value);
      }
    },

    error(err) {
      if (closed) return;
      closed = true;
      for (const observer of observers) {
        observer.error?.(err);
      }
      observers.clear();
    },

    complete() {
      if (closed) return;
      closed = true;
      for (const observer of observers) {
        observer.complete?.();
      }
      observers.clear();
    },

    pipe(...operators: Operator<Signal, Signal>[]) {
      return pipeStream(subject, operators);
    },
  };

  return subject;
}

export interface BehaviorSubject<T extends Signal> extends Subject<T> {
  getValue(): T;
}

export function createBehaviorSubject<T extends Signal>(initialValue: T): BehaviorSubject<T> {
  let currentValue = initialValue;
  const observers = new Set<Observer<T>>();
  let closed = false;
  let blocked = false;

  const subject: BehaviorSubject<T> = {
    get closed() {
      return closed;
    },

    get isBlocked() {
      return blocked;
    },

    block() {
      blocked = true;
    },

    unblock() {
      blocked = false;
    },

    getValue() {
      return currentValue;
    },

    on(observerOrNext) {
      const observer = toObserver(observerOrNext);

      if (closed) {
        observer.next(currentValue);
        observer.complete?.();
        return () => {};
      }

      observer.next(currentValue);
      observers.add(observer);

      return () => {
        observers.delete(observer);
      };
    },

    next(value) {
      if (closed || blocked) return;
      currentValue = value;
      for (const observer of observers) {
        observer.next(value);
      }
    },

    error(err) {
      if (closed) return;
      closed = true;
      for (const observer of observers) {
        observer.error?.(err);
      }
      observers.clear();
    },

    complete() {
      if (closed) return;
      closed = true;
      for (const observer of observers) {
        observer.complete?.();
      }
      observers.clear();
    },

    pipe(...operators: Operator<Signal, Signal>[]) {
      return pipeStream(subject, operators);
    },
  };

  return subject;
}
