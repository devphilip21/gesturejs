export interface ObjectPool<T> {
  acquire(): T;
  release(item: T): void;
  readonly size: number;
}

export interface ObjectPoolOptions {
  initialSize?: number;
  maxSize?: number;
}

/**
 * Generic object pool for reusing objects and reducing GC pressure.
 * Useful for high-frequency scenarios like pointer/touch events.
 */
export function createObjectPool<T>(
  create: () => T,
  reset: (item: T) => void,
  options: ObjectPoolOptions = {},
): ObjectPool<T> {
  const { initialSize = 0, maxSize = 100 } = options;
  const pool: T[] = [];

  for (let i = 0; i < initialSize; i++) {
    pool.push(create());
  }

  return {
    get size() {
      return pool.length;
    },

    acquire(): T {
      if (pool.length > 0) {
        return pool.pop()!;
      }
      return create();
    },

    release(item: T): void {
      if (pool.length < maxSize) {
        reset(item);
        pool.push(item);
      }
    },
  };
}
