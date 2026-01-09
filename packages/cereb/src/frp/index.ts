// Behavior - continuous time-varying values
export { type Behavior, constant, stepper, time } from "./behavior.js";
// Combinators - composing behaviors
export { combine, lift, switcher } from "./combinators.js";
// Conversions - Behavior ↔ Event transformations
export {
  animationFrame,
  type BehaviorChangeSignal,
  changes,
  elapsedTime,
  type FrameSignal,
  type SampledSignal,
  sample,
  sampleOn,
} from "./conversions.js";
// Event - discrete occurrences (alias for Stream)
export type { Event } from "./event.js";
