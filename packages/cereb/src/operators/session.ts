import type { MultiPointerSignal } from "../browser/multi-pointer/multi-pointer-signal.js";
import type { SinglePointerSignal } from "../browser/single-pointer/single-pointer-signal.js";
import type { Signal } from "../core/signal.js";
import type { Operator } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export interface SessionOptions<T extends Signal> {
  start: (signal: T) => boolean;
  end: (signal: T) => boolean;
}

/**
 * Filters signals to only emit during active sessions.
 * A session begins when the start predicate returns true and ends when the end predicate returns true.
 * Both start and end signals are included in the output.
 * Sessions can repeat: after an end, the next start begins a new session.
 */
export function session<T extends Signal>(options: SessionOptions<T>): Operator<T, T> {
  return (source) =>
    createStream((observer) => {
      let active = false;

      return source.subscribe({
        next(value) {
          try {
            if (!active) {
              if (options.start(value)) {
                active = true;
                observer.next(value);
              }
            } else {
              observer.next(value);
              if (options.end(value)) {
                active = false;
              }
            }
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}

export function singlePointerSession(): Operator<SinglePointerSignal, SinglePointerSignal> {
  return session({
    start: (signal) => signal.value.phase === "start",
    end: (signal) => signal.value.phase === "end" || signal.value.phase === "cancel",
  });
}

/**
 * Filters multi-pointer signals to only emit during active sessions.
 * A session begins when the required number of pointers are in working state (start/move).
 * A session ends when any of the tracked pointers ends or cancels.
 * Additional pointers beyond requiredCount are ignored; only the initial tracked pointers matter.
 */
export function multiPointerSession(
  requiredCount: number,
): Operator<MultiPointerSignal, MultiPointerSignal> {
  return (source) =>
    createStream((observer) => {
      let active = false;
      let trackedPointerIds: Set<string> = new Set();

      return source.subscribe({
        next(signal) {
          try {
            const pointers = signal.value.pointers;

            if (!active) {
              const workingPointers = pointers.filter(
                (p) => p.phase === "start" || p.phase === "move",
              );
              if (workingPointers.length >= requiredCount) {
                active = true;
                trackedPointerIds = new Set(
                  workingPointers.slice(0, requiredCount).map((p) => p.id),
                );
                observer.next(signal);
              }
            } else {
              observer.next(signal);
              const hasEnded = pointers.some(
                (p) => trackedPointerIds.has(p.id) && (p.phase === "end" || p.phase === "cancel"),
              );
              if (hasEnded) {
                active = false;
                trackedPointerIds.clear();
              }
            }
          } catch (err) {
            observer.error?.(err);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });
    });
}
