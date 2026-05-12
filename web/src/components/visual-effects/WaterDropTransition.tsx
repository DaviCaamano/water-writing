'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Grid config — pre-computed at module load, not per render
const SPACING = 100; // SVG units between dot centres
const R = 2; // dot radius (stroke dominates, this is cosmetic)
const STROKE_FULL = 74; // stroke-width at peak — dots slightly overlap neighbours
const STAGGER = 27; // ms of extra delay per grid-distance unit from centre
const COVER_MS = 290; // each dot's expansion duration
const REVEAL_MS = 250; // each dot's contraction duration

const H_COLS = 10; // grid extends ±H_COLS columns from centre (21 total)
const H_ROWS = 8; // grid extends ±H_ROWS rows from centre (17 total)

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
const COVER_TOTAL = MAX_DELAY + COVER_MS; // ms until screen is fully covered
const BURST_TTL = COVER_TOTAL + 60 + MAX_DELAY + REVEAL_MS + 300;

let nextId = 0;

function Burst() {
  const [sw, setSw] = useState(0);
  const [phase, setPhase] = useState<'cover' | 'reveal'>('cover');

  useEffect(() => {
    // Trigger expansion on next paint so the 0→STROKE_FULL transition fires
    const raf = requestAnimationFrame(() => setSw(STROKE_FULL));

    // Switch to reveal once the screen is fully covered
    const t = setTimeout(() => {
      setPhase('reveal');
      setSw(0);
    }, COVER_TOTAL + 60);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  const dur = phase === 'cover' ? COVER_MS : REVEAL_MS;
  const ease = phase === 'cover' ? 'ease-in' : 'ease-out';

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
}

export const WaterDropTransition = () => {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [bursts, setBursts] = useState<number[]>([]);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    const wasEditor = prev.startsWith('/editor');
    const isEditor = pathname.startsWith('/editor');

    if (wasEditor !== isEditor) {
      const id = ++nextId;
      setBursts((b) => [...b, id]);
      setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), BURST_TTL);
    }
  }, [pathname]);

  return (
    <>
      {bursts.map((id) => (
        <Burst key={id} />
      ))}
    </>
  );
};
