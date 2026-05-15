import { useEffect, useRef } from 'react';

const deepEqual = (a: unknown, b: unknown, seen = new WeakSet()): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  if (seen.has(a as object)) return true;
  seen.add(a as object);

  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp) return a.toString() === b.toString();

  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (!b.has(key) || !deepEqual(val, b.get(key), seen)) return false;
    }
    return true;
  }

  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const val of a) {
      if (!b.has(val)) return false;
    }
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i], seen));
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], seen),
  );
};

export const useSticky = <T>(
  value: T,
  callback: (prev?: T, current?: T) => void | Promise<void>,
) => {
  const previousValue = useRef<T>(value);

  useEffect(() => {
    if (!deepEqual(previousValue.current, value)) {
      void callback(previousValue.current, value);
      previousValue.current = value;
    }
  }, [value, callback]);
};
