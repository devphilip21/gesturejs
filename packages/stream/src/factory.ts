import type { Observable } from "./observable.js";
import { createObservable } from "./observable.js";

export function fromEvent<T extends Event>(
  target: EventTarget,
  eventName: string,
  options?: AddEventListenerOptions
): Observable<T> {
  return createObservable((observer) => {
    const handler = (event: Event) => {
      observer.next(event as T);
    };

    target.addEventListener(eventName, handler, options);

    return () => {
      target.removeEventListener(eventName, handler, options);
    };
  });
}

export function fromPromise<T>(promise: Promise<T>): Observable<T> {
  return createObservable((observer) => {
    let cancelled = false;

    promise
      .then((value) => {
        if (!cancelled) {
          observer.next(value);
          observer.complete?.();
        }
      })
      .catch((err) => {
        if (!cancelled) {
          observer.error?.(err);
        }
      });

    return () => {
      cancelled = true;
    };
  });
}

export function from<T>(values: Iterable<T>): Observable<T> {
  return createObservable((observer) => {
    for (const value of values) {
      observer.next(value);
    }
    observer.complete?.();
    return () => {};
  });
}

export function of<T>(value: T): Observable<T> {
  return createObservable((observer) => {
    observer.next(value);
    observer.complete?.();
    return () => {};
  });
}

export function empty<T = never>(): Observable<T> {
  return createObservable((observer) => {
    observer.complete?.();
    return () => {};
  });
}

export function never<T = never>(): Observable<T> {
  return createObservable(() => {
    return () => {};
  });
}

export function interval(ms: number): Observable<number> {
  return createObservable((observer) => {
    let count = 0;
    const id = setInterval(() => {
      observer.next(count++);
    }, ms);

    return () => {
      clearInterval(id);
    };
  });
}

export function timer(delay: number, intervalMs?: number): Observable<number> {
  return createObservable((observer) => {
    let count = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      observer.next(count++);

      if (intervalMs !== undefined) {
        intervalId = setInterval(() => {
          observer.next(count++);
        }, intervalMs);
      } else {
        observer.complete?.();
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  });
}

export function throwError(error: unknown): Observable<never> {
  return createObservable((observer) => {
    observer.error?.(error);
    return () => {};
  });
}

export function defer<T>(
  factory: () => Observable<T>
): Observable<T> {
  return createObservable((observer) => {
    return factory().subscribe(observer);
  });
}
