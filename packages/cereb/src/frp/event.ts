import type { Signal, Stream } from "../core/index.js";

/**
 * Event represents discrete occurrences over time.
 * This is a semantic alias for Stream<Signal> to align with FRP terminology.
 *
 * In FRP theory:
 * - Event = discrete occurrences (clicks, key presses, gesture signals)
 * - Behavior = continuous values over time (position, scale)
 *
 * Event uses all existing Stream operations: pipe(), filter(), map(), etc.
 *
 * @typeParam S - The Signal type for this event stream
 */
export type Event<S extends Signal> = Stream<S>;
