import { useEffect, useRef } from 'react';

export const useSticky = <T>(value: T, callback: (stickyValue?: T) => void | Promise<void>) => {
  const previousValue = useRef<T>(value);

  useEffect(() => {
    const isDifferent =
      typeof value !== 'object' && typeof value !== 'function'
        ? previousValue.current !== value
        : !Object.is(previousValue.current, value);

    if (isDifferent) {
      void callback(previousValue.current);
      previousValue.current = value;
    }
  }, [value, callback]);
};
