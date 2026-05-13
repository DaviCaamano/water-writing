'use client';

import { useEffect } from 'react';
import { Dimensions, useViewport } from '~hooks/useViewport';
import { motion, useAnimationControls } from 'framer-motion';
import { ZIndex } from '~constants/z-index';
import { indexArray } from '~utils/indexArray';
import { TransitionPhase, usePageTransition } from '~context/PageTransitionContext';

const RIPPLE_WIDTH = 100;
const TRANSITION_DURATION = 0.2;

const ANIMATIONS = {
  [TransitionPhase.idle]: { strokeWidth: 0, transition: { duration: 0 } },
  [TransitionPhase.covering]: {
    strokeWidth: RIPPLE_WIDTH,
    transition: { duration: TRANSITION_DURATION },
  },
  [TransitionPhase.revealing]: { strokeWidth: 0, transition: { duration: TRANSITION_DURATION } },
} as const;

export const WaterDropTransition = () => {
  const { phase, onCoverComplete, onRevealComplete } = usePageTransition();
  const size = useViewport();
  const ripples = getCircleCount(size);
  const controls = useAnimationControls();

  useEffect(() => {
    if (phase === TransitionPhase.covering) {
      requestAnimationFrame(() => controls.start(TransitionPhase.covering).then(onCoverComplete));
    } else if (phase === TransitionPhase.revealing) {
      controls.start(TransitionPhase.revealing).then(onRevealComplete);
    }
  }, [phase, controls, onCoverComplete, onRevealComplete]);

  const largestDimension = getDiagonalDistance(size.width ?? 0, size.height ?? 0);

  return (
    <motion.svg
      width='100vw'
      height='100vh'
      viewBox={`0 0 ${size.width} ${size.height}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: ZIndex.pageTransition,
        pointerEvents: 'none',
      }}
    >
      {indexArray(ripples, (index) => (
        <motion.circle
          key={index}
          cx='50%'
          cy='50%'
          r={RIPPLE_WIDTH * (index + 1)}
          animate={controls}
          variants={ANIMATIONS}
          initial={TransitionPhase.idle}
          stroke='var(--background)'
          style={{ zIndex: ZIndex.pageTransition - (index + 1) }}
          fill='transparent'
        />
      ))}
      {/* Outer circle visible outside the viewport in case the viewport size changes*/}
      {phase === 'covering' && (
        <circle
          key='outter-circle'
          cx='50%'
          cy='50%'
          r={largestDimension * 2}
          style={{
            fill: 'none',
            stroke: 'var(--background)',
            strokeWidth: largestDimension,
            zIndex: ZIndex.pageTransition,
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
