'use client';
import { useEffect, useState } from 'react';

export type Dimensions = { width: number; height: number };
export const useViewport = (onResizeCallback?: (size: Dimensions) => void) => {
  const [size, setSize] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const onResize = () => {
      const dimensions = { width: window.innerWidth, height: window.innerHeight };
      setSize(dimensions);
      onResizeCallback?.(dimensions);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [onResizeCallback]);

  return size;
};
