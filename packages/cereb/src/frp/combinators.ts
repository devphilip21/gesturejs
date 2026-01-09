import type { Behavior } from "./behavior.js";

/**
 * Combines multiple Behaviors into one using a combining function.
 * The result updates whenever any source behavior changes.
 *
 * @example
 * const transform = combine(
 *   positionBehavior,
 *   scaleBehavior,
 *   rotationBehavior,
 *   (pos, scale, rot) => ({ pos, scale, rot })
 * );
 */
export function combine<A, B, R>(a: Behavior<A>, b: Behavior<B>, f: (a: A, b: B) => R): Behavior<R>;

export function combine<A, B, C, R>(
  a: Behavior<A>,
  b: Behavior<B>,
  c: Behavior<C>,
  f: (a: A, b: B, c: C) => R,
): Behavior<R>;

export function combine<A, B, C, D, R>(
  a: Behavior<A>,
  b: Behavior<B>,
  c: Behavior<C>,
  d: Behavior<D>,
  f: (a: A, b: B, c: C, d: D) => R,
): Behavior<R>;

export function combine<A, B, C, D, E, R>(
  a: Behavior<A>,
  b: Behavior<B>,
  c: Behavior<C>,
  d: Behavior<D>,
  e: Behavior<E>,
  f: (a: A, b: B, c: C, d: D, e: E) => R,
): Behavior<R>;

export function combine(...args: unknown[]): Behavior<unknown> {
  const behaviors = args.slice(0, -1) as Behavior<unknown>[];
  const f = args[args.length - 1] as (...values: unknown[]) => unknown;

  let disposed = false;
  const listeners = new Set<(value: unknown) => void>();
  const unsubscribes: (() => void)[] = [];

  const sample = () => f(...behaviors.map((b) => b.sample()));

  const notifyListeners = () => {
    if (disposed) return;
    const value = sample();
    for (const listener of listeners) {
      listener(value);
    }
  };

  // Subscribe to all source behaviors
  for (const behavior of behaviors) {
    const unsub = behavior.onChange(() => {
      notifyListeners();
    });
    unsubscribes.push(unsub);
  }

  const combinedBehavior: Behavior<unknown> = {
    sample: () => {
      if (disposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return sample();
    },

    map: <B>(g: (r: unknown) => B): Behavior<B> => {
      return mappedCombine(combinedBehavior, g);
    },

    ap: function <B>(this: Behavior<(b: B) => unknown>, bb: Behavior<B>): Behavior<unknown> {
      return appliedCombine(this, bb);
    },

    onChange: (callback) => {
      if (disposed) return () => {};
      listeners.add(callback);
      return () => listeners.delete(callback);
    },

    dispose: () => {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      for (const unsub of unsubscribes) {
        unsub();
      }
      unsubscribes.length = 0;
    },

    get isDisposed() {
      return disposed;
    },
  };

  return combinedBehavior;
}

/**
 * Helper for mapping a combined behavior
 */
function mappedCombine<A, B>(source: Behavior<A>, f: (a: A) => B): Behavior<B> {
  let disposed = false;
  const listeners = new Set<(value: B) => void>();

  const sample = () => f(source.sample());

  const notifyListeners = () => {
    if (disposed) return;
    const value = sample();
    for (const listener of listeners) {
      listener(value);
    }
  };

  const unsub = source.onChange(() => notifyListeners());

  const behavior: Behavior<B> = {
    sample: () => {
      if (disposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return sample();
    },
    map: <C>(g: (b: B) => C): Behavior<C> => {
      return mappedCombine(behavior, g);
    },
    ap: function <C>(this: Behavior<(c: C) => B>, bc: Behavior<C>): Behavior<B> {
      return appliedCombine(this, bc);
    },
    onChange: (callback) => {
      if (disposed) return () => {};
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      unsub();
    },
    get isDisposed() {
      return disposed;
    },
  };

  return behavior;
}

/**
 * Helper for ap on combined behaviors
 */
function appliedCombine<A, B>(bf: Behavior<(a: A) => B>, ba: Behavior<A>): Behavior<B> {
  let disposed = false;
  const listeners = new Set<(value: B) => void>();

  const sample = () => bf.sample()(ba.sample());

  const notifyListeners = () => {
    if (disposed) return;
    const value = sample();
    for (const listener of listeners) {
      listener(value);
    }
  };

  const unsubF = bf.onChange(() => notifyListeners());
  const unsubA = ba.onChange(() => notifyListeners());

  const behavior: Behavior<B> = {
    sample: () => {
      if (disposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return sample();
    },
    map: <C>(g: (b: B) => C): Behavior<C> => {
      return appliedCombine(
        bf.map((f) => (a: A) => g(f(a))),
        ba,
      );
    },
    ap: function <C>(this: Behavior<(c: C) => B>, bc: Behavior<C>): Behavior<B> {
      return appliedCombine(this, bc);
    },
    onChange: (callback) => {
      if (disposed) return () => {};
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      unsubF();
      unsubA();
    },
    get isDisposed() {
      return disposed;
    },
  };

  return behavior;
}

/**
 * Selects between two Behaviors based on a boolean condition Behavior.
 * When condition is true, samples from ifTrue; otherwise from ifFalse.
 *
 * @example
 * const displayValue = switcher(
 *   isEditMode,
 *   editableValue,
 *   readonlyValue
 * );
 */
export function switcher<A>(
  condition: Behavior<boolean>,
  ifTrue: Behavior<A>,
  ifFalse: Behavior<A>,
): Behavior<A> {
  let disposed = false;
  const listeners = new Set<(value: A) => void>();

  const sample = () => (condition.sample() ? ifTrue.sample() : ifFalse.sample());

  const notifyListeners = () => {
    if (disposed) return;
    const value = sample();
    for (const listener of listeners) {
      listener(value);
    }
  };

  const unsubCond = condition.onChange(() => notifyListeners());
  const unsubTrue = ifTrue.onChange(() => {
    if (condition.sample()) notifyListeners();
  });
  const unsubFalse = ifFalse.onChange(() => {
    if (!condition.sample()) notifyListeners();
  });

  const behavior: Behavior<A> = {
    sample: () => {
      if (disposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return sample();
    },
    map: <B>(f: (a: A) => B): Behavior<B> => {
      return switcher(condition, ifTrue.map(f), ifFalse.map(f));
    },
    ap: function <B>(this: Behavior<(b: B) => A>, bb: Behavior<B>): Behavior<A> {
      return appliedCombine(this, bb);
    },
    onChange: (callback) => {
      if (disposed) return () => {};
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      unsubCond();
      unsubTrue();
      unsubFalse();
    },
    get isDisposed() {
      return disposed;
    },
  };

  return behavior;
}

/**
 * Lifts a pure function to work with Behaviors.
 * Equivalent to combining behaviors and applying a function.
 *
 * @example
 * const add = (a: number, b: number) => a + b;
 * const sumBehavior = lift(add)(behaviorA, behaviorB);
 */
export function lift<A, R>(f: (a: A) => R): (ba: Behavior<A>) => Behavior<R>;
export function lift<A, B, R>(
  f: (a: A, b: B) => R,
): (ba: Behavior<A>, bb: Behavior<B>) => Behavior<R>;
export function lift<A, B, C, R>(
  f: (a: A, b: B, c: C) => R,
): (ba: Behavior<A>, bb: Behavior<B>, bc: Behavior<C>) => Behavior<R>;

export function lift(f: (...args: unknown[]) => unknown) {
  return (...behaviors: Behavior<unknown>[]) => {
    if (behaviors.length === 1) {
      return behaviors[0].map(f);
    }
    // Use explicit overload calls to avoid spread type issues
    if (behaviors.length === 2) {
      return combine(behaviors[0], behaviors[1], (a, b) => f(a, b));
    }
    if (behaviors.length === 3) {
      return combine(behaviors[0], behaviors[1], behaviors[2], (a, b, c) => f(a, b, c));
    }
    // For 4+ arguments, fall through to variadic combine
    // This requires explicit handling due to TypeScript limitations
    throw new Error("lift supports up to 3 behaviors. Use combine() directly for more.");
  };
}
