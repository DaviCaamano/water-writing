'use client';

import { useCallback, useState } from 'react';
import { Dimensions, useViewport } from '~hooks/useViewport';
import { motion, useAnimationControls } from 'framer-motion';
import { ZIndex } from '~constants/z-index';
import { indexArray } from '~utils/indexArray';
import { useSticky } from '~hooks/useSticky';

const RIPPLE_WIDTH = 100;

export const WaterDropTransitionPhase = {
  empty: 'empty', // Transition animation is uncovering the new screen
  fill: 'fill', // Transitoon animation is not active and covers none of the screen.
} as const;
export type WaterDropTransitionPhase = Enum<typeof WaterDropTransitionPhase>;

const ANIMATIONS = {
  [WaterDropTransitionPhase.empty]: { strokeWidth: 0, transition: { duration: 0.2 } },
  [WaterDropTransitionPhase.fill]: { stokeWidth: RIPPLE_WIDTH, transition: { duration: 0.3 } },
} as const;

export interface WaterDropTransitionProps {
  enabled?: boolean;
  phase: WaterDropTransitionPhase;
}
export const WaterDropTransition = ({ enabled = true, phase }: WaterDropTransitionProps) => {
  const [ripples, setRipples] = useState<number>(0);
  const handleResize = useCallback((size: Dimensions) => setRipples(getCircleCount(size)), []);
  const size = useViewport(handleResize);

  const controls = useAnimationControls();

  useSticky(phase, (prevPhase) => {
    if (prevPhase === WaterDropTransitionPhase.empty && phase === WaterDropTransitionPhase.fill) {
      controls.start(WaterDropTransitionPhase.fill);
    } else if (
      prevPhase === WaterDropTransitionPhase.fill &&
      phase === WaterDropTransitionPhase.empty
    ) {
      controls.start(WaterDropTransitionPhase.empty);
    }
  });

  if (!enabled) return null;

  const largestDimension = getDiagonalDistance(size.width ?? 0, size.height ?? 0);

  return (
    <motion.svg
      width='100vw'
      height='100vh'
      viewBox={`0 0 ${size.width} ${size.height}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: ZIndex.top,
        pointerEvents: 'none',
      }}

    >
      {indexArray(ripples, (index) => (
        <motion.circle
          key={index}
          cx='50%'
          cy='50%'
          r={RIPPLE_WIDTH}
          animate={controls}
          variants={ANIMATIONS}
        />
      ))}
      {phase === WaterDropTransitionPhase.fill && (
        <circle
          key='outter-circle'
          cx='50%'
          cy='50%'
          r={largestDimension * 2}
          style={{
            fill: 'none',
            stroke: 'var(--background)',
            strokeWidth: largestDimension,
          }}
        />
      )}
    </motion.svg>
  );
};

const getDiagonalDistance = (width: number, height: number) => {
  return Math.sqrt(width ** 2 + height ** 2);
};

const getCircleCount = (size: Dimensions): number => {
  const largestDimension = getDiagonalDistance(size.width ?? 0, size.height ?? 0);
  return Math.ceil(largestDimension / RIPPLE_WIDTH);
};
