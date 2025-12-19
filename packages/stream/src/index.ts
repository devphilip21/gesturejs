/**
 * @gesturejs/stream
 *
 * A lightweight, tree-shakeable Observable implementation.
 *
 * @packageDocumentation
 */

// Core types
export type {
  Observable,
  Observer,
  Operator,
  Unsubscribe,
} from "./observable.js";

export { createObservable, toObserver } from "./observable.js";

// Subject
export type { Subject, BehaviorSubject } from "./subject.js";
export { createSubject, createBehaviorSubject } from "./subject.js";

// Pipe
export { pipe, compose } from "./pipe.js";

// Factory
export {
  fromEvent,
  fromPromise,
  from,
  of,
  empty,
  never,
  interval,
  timer,
  throwError,
  defer,
} from "./factory.js";

// Operators
export * from "./operators/index.js";

// Version
export const VERSION = "0.1.0";
