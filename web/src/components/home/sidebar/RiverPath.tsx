'use client';

import { useEffect, useRef, useState } from 'react';

const WAVE_AMPLITUDE = 8;
const WAVE_PERIOD = 60;
const STROKE_X = 14;

export const RiverPath = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.height ?? 0;
      setHeight(next);
    });
    observer.observe(node.parentElement ?? node);
    return () => observer.disconnect();
  }, []);

  const path = buildWavyPath(STROKE_X, height);

  return (
    <div
      ref={containerRef}
      className='absolute inset-y-0 left-0 pointer-events-none'
      style={{ width: STROKE_X * 2 }}
    >
      <svg
        width={STROKE_X * 2}
        height={height}
        viewBox={`0 0 ${STROKE_X * 2} ${height}`}
        className='overflow-visible'
      >
        <defs>
          <linearGradient id='river-gradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='var(--muted)' stopOpacity='0.6' />
            <stop offset='50%' stopColor='var(--muted)' stopOpacity='0.9' />
            <stop offset='100%' stopColor='var(--muted)' stopOpacity='0.4' />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill='none'
          stroke='url(#river-gradient)'
          strokeWidth={3}
          strokeLinecap='round'
        >
          <animate
            attributeName='stroke-dashoffset'
            from='0'
            to='-20'
            dur='3s'
            repeatCount='indefinite'
          />
        </path>
        <path
          d={path}
          fill='none'
          stroke='var(--background)'
          strokeWidth={1}
          strokeLinecap='round'
          opacity={0.5}
        />
      </svg>
    </div>
  );
};

const buildWavyPath = (centerX: number, height: number): string => {
  if (height <= 0) return '';
  const segments = Math.ceil(height / WAVE_PERIOD);
  const parts: string[] = [`M ${centerX} 0`];

  for (let i = 0; i < segments; i++) {
    const y0 = i * WAVE_PERIOD;
    const y1 = y0 + WAVE_PERIOD / 2;
    const y2 = y0 + WAVE_PERIOD;
    const dir = i % 2 === 0 ? 1 : -1;
    const cx = centerX + WAVE_AMPLITUDE * dir;
    parts.push(`Q ${cx} ${y1}, ${centerX} ${y2}`);
  }

  return parts.join(' ');
};
