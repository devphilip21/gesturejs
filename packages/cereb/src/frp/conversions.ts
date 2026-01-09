import { createSignal, createStream, type Signal, type Stream } from "../core/index.js";
import type { Behavior } from "./behavior.js";

/**
 * Signal type for behavior change events
 */
export type BehaviorChangeSignal<A> = Signal<"behavior-change", A>;

/**
 * Signal type for sampled values
 */
export type SampledSignal<A> = Signal<"sampled", A>;

/**
 * Signal type for animation frame samples
 */
export type FrameSignal<A> = Signal<"frame", { value: A; timestamp: number }>;

/**
 * Converts a Behavior to an Event (Stream) that fires when the value changes.
 * This is the Behavior → Event conversion.
 *
 * @param behavior - The behavior to observe
 * @returns A stream that emits signals whenever the behavior's value changes
 *
 * @example
 * const positionChanges = changes(positionBehavior);
 * positionChanges.on(signal => {
 *   console.log('Position changed to:', signal.value);
 * });
 */
export function changes<A>(behavior: Behavior<A>): Stream<BehaviorChangeSignal<A>> {
  return createStream((observer) => {
    const unsub = behavior.onChange((value) => {
      observer.next(createSignal("behavior-change", value));
    });

    return () => {
      unsub();
    };
  });
}

/**
 * Samples a Behavior at regular intervals.
 *
 * @param behavior - The behavior to sample
 * @param intervalMs - The sampling interval in milliseconds
 * @returns A stream that emits the sampled value at each interval
 *
 * @example
 * const positionSamples = sample(positionBehavior, 16); // ~60fps
 * positionSamples.on(signal => {
 *   updateDisplay(signal.value);
 * });
 */
export function sample<A>(behavior: Behavior<A>, intervalMs: number): Stream<SampledSignal<A>> {
  return createStream((observer) => {
    const id = setInterval(() => {
      if (!behavior.isDisposed) {
        observer.next(createSignal("sampled", behavior.sample()));
      }
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  });
}

/**
 * Samples a Behavior whenever another event occurs.
 * Useful for getting the current state at specific moments.
 *
 * @param behavior - The behavior to sample
 * @param trigger - The trigger event stream
 * @returns A stream that emits the sampled value along with the trigger signal
 *
 * @example
 * const positionOnClick = sampleOn(positionBehavior, clickStream);
 * positionOnClick.on(signal => {
 *   console.log('Position at click:', signal.value.value);
 *   console.log('Click event:', signal.value.trigger);
 * });
 */
export function sampleOn<A, S extends Signal>(
  behavior: Behavior<A>,
  trigger: Stream<S>,
): Stream<Signal<"sampled-on", { value: A; trigger: S }>> {
  return createStream((observer) => {
    const unsub = trigger.on((signal) => {
      if (!behavior.isDisposed) {
        observer.next(
          createSignal("sampled-on", {
            value: behavior.sample(),
            trigger: signal,
          }),
        );
      }
    });

    return unsub;
  });
}

/**
 * Samples a Behavior on every animation frame using requestAnimationFrame.
 * Ideal for rendering loops and smooth animations.
 *
 * @param behavior - The behavior to sample
 * @returns A stream that emits on each animation frame with the sampled value and timestamp
 *
 * @example
 * const frameStream = animationFrame(transformBehavior);
 * frameStream.on(({ value }) => {
 *   element.style.transform = `translate(${value.x}px, ${value.y}px)`;
 * });
 */
export function animationFrame<A>(behavior: Behavior<A>): Stream<FrameSignal<A>> {
  return createStream((observer) => {
    let running = true;
    let frameId: number;

    const loop = (timestamp: number) => {
      if (!running) return;

      if (!behavior.isDisposed) {
        observer.next(
          createSignal("frame", {
            value: behavior.sample(),
            timestamp,
          }),
        );
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  });
}

/**
 * Creates a Behavior that tracks elapsed time since creation.
 * The elapsed time is updated on each animation frame.
 *
 * Note: This returns both a Behavior and a dispose function.
 * Call dispose() when you no longer need the elapsed time tracking.
 *
 * @returns Object containing the elapsed behavior and dispose function
 *
 * @example
 * const { elapsed, dispose } = elapsedTime();
 * // Use elapsed.sample() to get time since creation
 * // Call dispose() when done
 */
export function elapsedTime(): { elapsed: Behavior<number>; dispose: () => void } {
  const startTime = performance.now();
  let currentElapsed = 0;
  let disposed = false;
  let frameId: number;
  const listeners = new Set<(value: number) => void>();

  const loop = () => {
    if (disposed) return;
    currentElapsed = performance.now() - startTime;
    for (const listener of listeners) {
      listener(currentElapsed);
    }
    frameId = requestAnimationFrame(loop);
  };

  frameId = requestAnimationFrame(loop);

  const elapsed: Behavior<number> = {
    sample: () => {
      if (disposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return performance.now() - startTime;
    },
    map: <B>(f: (t: number) => B): Behavior<B> => {
      return mappedElapsed(elapsed, f);
    },
    ap: function <B>(this: Behavior<(b: B) => number>, bb: Behavior<B>): Behavior<number> {
      return appliedElapsed(this, bb);
    },
    onChange: (callback) => {
      if (disposed) return () => {};
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frameId);
      listeners.clear();
    },
    get isDisposed() {
      return disposed;
    },
  };

  return {
    elapsed,
    dispose: () => elapsed.dispose(),
  };
}

function mappedElapsed<A, B>(source: Behavior<A>, f: (a: A) => B): Behavior<B> {
  let disposed = false;
  const listeners = new Set<(value: B) => void>();

  const unsub = source.onChange((value) => {
    if (disposed) return;
    const mapped = f(value);
    for (const listener of listeners) {
      listener(mapped);
    }
  });

  const behavior: Behavior<B> = {
    sample: () => {
      if (disposed || source.isDisposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return f(source.sample());
    },
    map: <C>(g: (b: B) => C): Behavior<C> => {
      return mappedElapsed(behavior, g);
    },
    ap: function <C>(this: Behavior<(c: C) => B>, bc: Behavior<C>): Behavior<B> {
      return appliedElapsed(this, bc);
    },
    onChange: (callback) => {
      if (disposed) return () => {};
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      unsub();
      listeners.clear();
    },
    get isDisposed() {
      return disposed;
    },
  };

  return behavior;
}

function appliedElapsed<A, B>(bf: Behavior<(a: A) => B>, ba: Behavior<A>): Behavior<B> {
  let disposed = false;
  const listeners = new Set<(value: B) => void>();

  const notify = () => {
    if (disposed) return;
    const value = bf.sample()(ba.sample());
    for (const listener of listeners) {
      listener(value);
    }
  };

  const unsubF = bf.onChange(notify);
  const unsubA = ba.onChange(notify);

  const behavior: Behavior<B> = {
    sample: () => {
      if (disposed) {
        throw new Error("Cannot sample a disposed Behavior");
      }
      return bf.sample()(ba.sample());
    },
    map: <C>(g: (b: B) => C): Behavior<C> => {
      return mappedElapsed(behavior, g);
    },
    ap: function <C>(this: Behavior<(c: C) => B>, bc: Behavior<C>): Behavior<B> {
      return appliedElapsed(this, bc);
    },
    onChange: (callback) => {
      if (disposed) return () => {};
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      unsubF();
      unsubA();
      listeners.clear();
    },
    get isDisposed() {
      return disposed;
    },
  };

  return behavior;
}
