'use client';

import { useEffect, useState } from 'react';
import { usePageTransition } from '~context/PageTransitionContext';

const SPACING = 100;
const R = 2;
const STROKE_FULL = 74;
const STAGGER = 27;
const COVER_MS = 290;
const REVEAL_MS = 250;

const H_COLS = 10;
const H_ROWS = 8;

interface Dot {
  x: number;
  y: number;
  delay: number;
}

const DOTS: Dot[] = [];
let MAX_DELAY = 0;

for (let r = -H_ROWS; r <= H_ROWS; r++) {
  for (let c = -H_COLS; c <= H_COLS; c++) {
    const delay = Math.sqrt(c * c + r * r) * STAGGER;
    if (delay > MAX_DELAY) MAX_DELAY = delay;
    DOTS.push({ x: c * SPACING, y: r * SPACING, delay });
  }
}

const VB_W = (2 * H_COLS + 1) * SPACING;
const VB_H = (2 * H_ROWS + 1) * SPACING;
const COVER_TOTAL = MAX_DELAY + COVER_MS;
const REVEAL_TOTAL = MAX_DELAY + REVEAL_MS;

export const WaterDropTransition = () => {
  const { phase, onCoverComplete, onRevealComplete } = usePageTransition();
  const [sw, setSw] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (phase === 'covering') {
      setVisible(true);
      const raf = requestAnimationFrame(() => setSw(STROKE_FULL));
      const t = setTimeout(onCoverComplete, COVER_TOTAL + 60);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    } else if (phase === 'revealing') {
      setSw(0);
      const t = setTimeout(() => {
        onRevealComplete();
        setVisible(false);
      }, REVEAL_TOTAL + 50);
      return () => clearTimeout(t);
    }
  }, [phase, onCoverComplete, onRevealComplete]);

  if (!visible) return null;

  const dur = phase === 'covering' ? COVER_MS : REVEAL_MS;
  const ease = phase === 'covering' ? 'ease-in' : 'ease-out';

  return (
    <div className='fixed inset-0 z-[200] pointer-events-none' aria-hidden='true'>
      <svg
        width='100%'
        height='100%'
        viewBox={`${-VB_W / 2} ${-VB_H / 2} ${VB_W} ${VB_H}`}
        preserveAspectRatio='xMidYMid slice'
      >
        {DOTS.map(({ x, y, delay }, i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={R}
            style={{
              fill: 'none',
              stroke: 'var(--primary)',
              strokeWidth: sw,
              transition: `stroke-width ${dur}ms ${ease}`,
              transitionDelay: `${delay}ms`,
            }}
          />
        ))}
      </svg>
    </div>
  );
};
