import type { Signal } from "../core/signal.js";
import type { Operator, Stream } from "../core/stream.js";
import { createStream } from "../core/stream.js";

export interface SessionJoinOptions<TGate extends Signal> {
  /**
   * Predicate that determines when the gate becomes active.
   * When this returns true, source signals will start passing through.
   */
  gateActive: (signal: TGate) => boolean;

  /**
   * Predicate that determines when the gate becomes inactive.
   * When this returns true, source signals will stop passing through.
   */
  gateInactive: (signal: TGate) => boolean;
}

/**
 * Filters source signals based on a gate stream's session state.
 * Source signals only pass through when the gate is "active".
 *
 * This is useful for implementing modifier key combinations:
 * - Gate: Command/Ctrl key (active on keydown, inactive on keyup)
 * - Source: Action keys like +/- (only emit while Command is held)
 *
 * @param gate - The stream that controls whether source signals pass through
 * @param options - Predicates to determine gate active/inactive states
 *
 * @example
 * ```typescript
 * const kb$ = pipe(keyboard(window), share());
 *
 * const modifierKey$ = pipe(
 *   kb$,
 *   filter(s => ["MetaLeft", "MetaRight"].includes(s.value.code))
 * );
 *
 * pipe(
 *   kb$,
 *   filter(s => s.value.phase === "down" && ["+", "-"].includes(s.value.key)),
 *   sessionJoin(modifierKey$, {
 *     gateActive: s => s.value.phase === "down",
 *     gateInactive: s => s.value.phase === "up"
 *   })
 * ).subscribe(handleZoomKey);
 * ```
 */
export function sessionJoin<TSource extends Signal, TGate extends Signal>(
  gate: Stream<TGate>,
  options: SessionJoinOptions<TGate>,
): Operator<TSource, TSource> {
  return (source) =>
    createStream<TSource>((observer) => {
      let gateActive = false;

      const gateUnsub = gate.subscribe({
        next(signal) {
          try {
            if (options.gateActive(signal)) {
              gateActive = true;
            } else if (options.gateInactive(signal)) {
              gateActive = false;
            }
          } catch (err) {
            observer.error?.(err);
          }
        },
      });

      const sourceUnsub = source.subscribe({
        next(signal) {
          if (gateActive) {
            observer.next(signal);
          }
        },
        error: observer.error?.bind(observer),
        complete: observer.complete?.bind(observer),
      });

      return () => {
        gateUnsub();
        sourceUnsub();
      };
    });
}
