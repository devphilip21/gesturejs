import { getCerebDeviceId } from "./meta.js";

export interface Signal<K extends string = string, V = unknown> {
  kind: K;
  value: V;
  deviceId: string;
  createdAt: number;
  updatedAt?: number;
}

export function createSignal<K extends string = string, V = unknown>(
  kind: K,
  value: V,
): Signal<K, V> {
  return {
    kind,
    value,
    deviceId: getCerebDeviceId(),
    createdAt: performance.now(),
  };
}
