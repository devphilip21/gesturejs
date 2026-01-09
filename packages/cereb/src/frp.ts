/**
 * FRP (Functional Reactive Programming) module for Cereb.
 *
 * This module introduces the classic FRP concepts:
 * - Behavior: Continuous time-varying values (always has a current value)
 * - Event: Discrete occurrences (alias for Stream)
 *
 * Key differences from Stream:
 * - Behavior.sample() - Get current value anytime
 * - Behavior.onChange() - Subscribe to value changes
 * - Behavior.dispose() - Clean up resources
 *
 * Use cases:
 * - Animation frames that need current position/scale/rotation
 * - VR headset tracking with continuous position sampling
 * - Combining multiple input sources into a unified transform
 *
 * @module cereb/frp
 */
export * from "./frp/index.js";
