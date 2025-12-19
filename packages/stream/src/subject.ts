import type { Observable, Observer } from "./observable.js";
import { toObserver } from "./observable.js";

export interface Subject<T> extends Observable<T> {
  next(value: T): void;
  error(err: unknown): void;
  complete(): void;
  readonly closed: boolean;
}

export function createSubject<T>(): Subject<T> {
  const observers = new Set<Observer<T>>();
  let closed = false;

  return {
    get closed() {
      return closed;
    },

    subscribe(observerOrNext) {
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
      if (closed) return;
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
  };
}

export interface BehaviorSubject<T> extends Subject<T> {
  getValue(): T;
}

export function createBehaviorSubject<T>(initialValue: T): BehaviorSubject<T> {
  let currentValue = initialValue;
  const observers = new Set<Observer<T>>();
  let closed = false;

  return {
    get closed() {
      return closed;
    },

    getValue() {
      return currentValue;
    },

    subscribe(observerOrNext) {
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
      if (closed) return;
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
  };
}
