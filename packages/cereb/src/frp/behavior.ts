import type { Signal, Stream } from "../core/index.js";

/**
 * Behavior represents a value that changes continuously over time.
 * Unlike Stream (Event), Behavior always has a current value that can be sampled.
 *
 * Key concepts:
 * - sample(): Get the current value at any point in time
 * - map(): Transform the value (Functor)
 * - ap(): Apply a function behavior to this behavior (Applicative)
 * - onChange(): Subscribe to value changes (Push notification)
 * - dispose(): Clean up resources and subscriptions
 *
 * @typeParam A - The type of the value
 */
export interface Behavior<A> {
  /** Sample the current value */
  sample(): A;

  /** Transform the value (Functor map) */
  map<B>(f: (a: A) => B): Behavior<B>;

  /**
   * Apply a function from another Behavior to this value (Applicative apply)
   * Note: The function behavior is the receiver, value behavior is the argument
   */
  ap<B>(this: Behavior<(b: B) => A>, bb: Behavior<B>): Behavior<A>;

  /** Subscribe to value changes. Returns an unsubscribe function. */
  onChange(callback: (a: A) => void): () => void;

  /** Dispose the behavior and clean up all resources */
  dispose(): void;

  /** Returns true if the behavior has been disposed */
  readonly isDisposed: boolean;
}

/**
 * Internal helper to create a base behavior with common functionality.
 * Manages listener set and disposed state.
 */
function createBaseBehavior<A>(
  getSample: () => A,
  onDispose?: () => void,
): {
  behavior: Omit<Behavior<A>, "map" | "ap">;
  listeners: Set<(a: A) => void>;
  notifyListeners: () => void;
  isDisposed: () => boolean;
} {
  const listeners = new Set<(a: A) => void>();
  let disposed = false;

  const notifyListeners = () => {
    if (disposed) return;
    const value = getSample();
    for (const listener of listeners) {
      listener(value);
    }
  };

  return {
    behavior: {
      sample: () => {
        if (disposed) {
          throw new Error("Cannot sample a disposed Behavior");
        }
        return getSample();
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
        onDispose?.();
      },
      get isDisposed() {
        return disposed;
      },
    },
    listeners,
    notifyListeners,
    isDisposed: () => disposed,
  };
}

/**
 * Creates a constant Behavior that never changes.
 * The value is fixed at creation time.
 *
 * @example
 * const always42 = constant(42);
 * always42.sample(); // 42
 */
export function constant<A>(value: A): Behavior<A> {
  let disposed = false;

  const behavior: Behavior<A> = {
    sample: () => {
      if (disposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return value;
    },
    map: <B>(f: (a: A) => B): Behavior<B> => {
      if (disposed) {
        throw new Error("Cannot map a disposed Behavior");
      }
      return constant(f(value));
    },
    ap: function <B>(this: Behavior<(b: B) => A>, bb: Behavior<B>): Behavior<A> {
      if (disposed) {
        throw new Error("Cannot apply a disposed Behavior");
      }
      return constant(this.sample()(bb.sample()));
    },
    onChange: () => () => {},
    dispose: () => {
      disposed = true;
    },
    get isDisposed() {
      return disposed;
    },
  };

  return behavior;
}

/**
 * Creates a Behavior from an event stream with an initial value.
 * The behavior holds the latest value from the stream.
 *
 * @param initial - The initial value before any events
 * @param event - The event stream to listen to
 * @param selector - Function to extract the value from each signal
 *
 * @example
 * const position = stepper(
 *   { x: 0, y: 0 },
 *   pointerStream,
 *   (signal) => signal.value.position
 * );
 */
export function stepper<A, S extends Signal>(
  initial: A,
  event: Stream<S>,
  selector: (signal: S) => A,
): Behavior<A> {
  let current = initial;
  let unsub: (() => void) | null = null;

  const { behavior, notifyListeners, isDisposed } = createBaseBehavior(
    () => current,
    () => {
      unsub?.();
      unsub = null;
    },
  );

  unsub = event.on((signal) => {
    if (isDisposed()) return;
    const newValue = selector(signal);
    if (!Object.is(newValue, current)) {
      current = newValue;
      notifyListeners();
    }
  });

  const fullBehavior: Behavior<A> = {
    sample: behavior.sample,
    onChange: behavior.onChange,
    dispose: behavior.dispose,
    get isDisposed() {
      return behavior.isDisposed;
    },
    map: <B>(f: (a: A) => B): Behavior<B> => {
      return mappedBehavior(fullBehavior, f);
    },
    ap: function <B>(this: Behavior<(b: B) => A>, bb: Behavior<B>): Behavior<A> {
      return appliedBehavior(this, bb);
    },
  };

  return fullBehavior;
}

/**
 * Creates a mapped Behavior that transforms values from a source behavior.
 */
function mappedBehavior<A, B>(source: Behavior<A>, f: (a: A) => B): Behavior<B> {
  const { behavior, notifyListeners, isDisposed } = createBaseBehavior(
    () => f(source.sample()),
    () => {
      sourceUnsub?.();
    },
  );

  const sourceUnsub: (() => void) | null = source.onChange(() => {
    if (!isDisposed()) {
      notifyListeners();
    }
  });

  const fullBehavior: Behavior<B> = {
    sample: behavior.sample,
    onChange: behavior.onChange,
    dispose: behavior.dispose,
    get isDisposed() {
      return behavior.isDisposed;
    },
    map: <C>(g: (b: B) => C): Behavior<C> => {
      return mappedBehavior(fullBehavior, g);
    },
    ap: function <C>(this: Behavior<(c: C) => B>, bc: Behavior<C>): Behavior<B> {
      return appliedBehavior(this, bc);
    },
  };

  return fullBehavior;
}

/**
 * Creates an applied Behavior from a function behavior and value behavior.
 */
function appliedBehavior<A, B>(bf: Behavior<(a: A) => B>, ba: Behavior<A>): Behavior<B> {
  const { behavior, notifyListeners, isDisposed } = createBaseBehavior(
    () => bf.sample()(ba.sample()),
    () => {
      unsubF?.();
      unsubA?.();
    },
  );

  const unsubF: (() => void) | null = bf.onChange(() => {
    if (!isDisposed()) {
      notifyListeners();
    }
  });

  const unsubA: (() => void) | null = ba.onChange(() => {
    if (!isDisposed()) {
      notifyListeners();
    }
  });

  const fullBehavior: Behavior<B> = {
    sample: behavior.sample,
    onChange: behavior.onChange,
    dispose: behavior.dispose,
    get isDisposed() {
      return behavior.isDisposed;
    },
    map: <C>(g: (b: B) => C): Behavior<C> => {
      return mappedBehavior(fullBehavior, g);
    },
    ap: function <C>(this: Behavior<(c: C) => B>, bc: Behavior<C>): Behavior<B> {
      return appliedBehavior(this, bc);
    },
  };

  return fullBehavior;
}

/**
 * Creates a Behavior that represents the current time.
 * Each sample() call returns the current timestamp (performance.now()).
 *
 * Note: onChange() is not meaningful for time as it always changes.
 * Use animationFrame() from conversions if you need time-based events.
 *
 * @example
 * const t = time();
 * const now = t.sample(); // current timestamp
 */
export function time(): Behavior<number> {
  let disposed = false;

  const behavior: Behavior<number> = {
    sample: () => {
      if (disposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return performance.now();
    },
    map: <B>(f: (t: number) => B): Behavior<B> => {
      if (disposed) {
        throw new Error("Cannot map a disposed Behavior");
      }
      // Return a new behavior that samples time and transforms
      let innerDisposed = false;
      return {
        sample: () => {
          if (innerDisposed || disposed) {
            throw new Error("Cannot sample a disposed Behavior");
          }
          return f(performance.now());
        },
        map: (g) => behavior.map((t) => g(f(t))),
        ap: function <C>(this: Behavior<(c: C) => B>, bc: Behavior<C>): Behavior<B> {
          return appliedBehavior(this, bc);
        },
        onChange: () => () => {},
        dispose: () => {
          innerDisposed = true;
        },
        get isDisposed() {
          return innerDisposed || disposed;
        },
      };
    },
    ap: function <B>(this: Behavior<(b: B) => number>, bb: Behavior<B>): Behavior<number> {
      return appliedBehavior(this, bb);
    },
    onChange: () => () => {},
    dispose: () => {
      disposed = true;
    },
    get isDisposed() {
      return disposed;
    },
  };

  return behavior;
}
