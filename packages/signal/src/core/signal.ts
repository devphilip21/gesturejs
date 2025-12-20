export interface Signal<TType extends string = string> {
  type: TType;
  timestamp: number;
  deviceId: string;
}

export interface SignalWithMetadata<TType extends string = string>
  extends Signal<TType> {
  id?: string;
  sequence?: number;
}

export interface CancellableSignal<TType extends string = string>
  extends Signal<TType> {
  cancelled: boolean;
}

export type SignalPhase = "start" | "update" | "end" | "cancel";

export function createSignal<TType extends string>(
  type: TType,
  deviceId: string
): Signal<TType> {
  return {
    type,
    timestamp: performance.now(),
    deviceId,
  };
}
