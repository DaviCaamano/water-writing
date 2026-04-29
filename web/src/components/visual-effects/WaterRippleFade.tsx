'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '~utils/merge-css-classes';

interface WaterRippleFadeProps {
  open: boolean;
  children: ReactNode;
  className?: string;
  /** Total duration of the fade animation in ms. Default: 600 */
  durationMs?: number;
  /** Maximum displacement scale at peak ripple (start of fade-in / end of fade-out). Default: 40 */
  maxScale?: number;
  /** Whether to keep the turbulence shifting while visible (subtle continuous water movement). Default: true */
  liveTurbulence?: boolean;
  /** Displacement scale used while fully visible so liveTurbulence stays perceptible. Default: 6 */
  liveScale?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

export function WaterRippleFade({
  open,
  children,
  className,
  durationMs = 600,
  maxScale = 100,
  liveTurbulence = false,
  liveScale = 6,
}: WaterRippleFadeProps) {
  const reactId = useId();
  const id = useMemo(() => reactId.replace(/:/g, ''), [reactId]);
  const filterId = `wrf-${id}`;

  const [scale, setScale] = useState(maxScale);
  const [opacity, setOpacity] = useState(0);
  const [seedOffset, setSeedOffset] = useState(0);

  const animRafRef = useRef<number | null>(null);
  const liveRafRef = useRef<number | null>(null);

  // Drive the enter / exit animation — all setState calls happen inside the async rAF tick
  useEffect(() => {
    if (animRafRef.current !== null) cancelAnimationFrame(animRafRef.current);

    const startTime = performance.now();
    const startScale = scale;
    const startOpacity = opacity;
    const targetScale = open ? 0 : maxScale;
    const targetOpacity = open ? 1 : 0;
    const ease = open ? easeOutCubic : easeInCubic;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const e = ease(t);
      setScale(startScale + (targetScale - startScale) * e);
      setOpacity(startOpacity + (targetOpacity - startOpacity) * e);
      if (t < 1) {
        animRafRef.current = requestAnimationFrame(tick);
      } else {
        animRafRef.current = null;
      }
    };

    animRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRafRef.current !== null) {
        cancelAnimationFrame(animRafRef.current);
        animRafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Drive a slow continuous turbulence shift while the popover is open
  useEffect(() => {
    if (!liveTurbulence || !open) return;

    const start = performance.now();
    const tick = (now: number) => {
      setSeedOffset((now - start) * 0.0006);
      liveRafRef.current = requestAnimationFrame(tick);
    };
    liveRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (liveRafRef.current !== null) {
        cancelAnimationFrame(liveRafRef.current);
        liveRafRef.current = null;
      }
    };
  }, [open, liveTurbulence]);

  // Invisible and not animating toward visible — skip rendering entirely
  if (opacity === 0 && !open) return null;

  // Animate baseFrequency a touch with the seed for a "water moving" feel
  const baseFreqX = 0.018 + 0.004 * Math.sin(seedOffset);
  const baseFreqY = 0.032 + 0.004 * Math.cos(seedOffset * 1.3);
  // Keep a minimum displacement while visible so liveTurbulence remains perceptible
  const displayScale = open && liveTurbulence ? Math.max(scale, liveScale) : scale;

  return (
    <>
      <svg
        width={0}
        height={0}
        aria-hidden='true'
        style={{ position: 'absolute', overflow: 'hidden' }}
      >
        <defs>
          <filter id={filterId} x='-20%' y='-20%' width='140%' height='140%'>
            <feTurbulence
              type='turbulence'
              baseFrequency={`${baseFreqX} ${baseFreqY}`}
              numOctaves={3}
              seed={4}
              result='noise'
            />
            <feDisplacementMap
              in='SourceGraphic'
              in2='noise'
              scale={displayScale}
              xChannelSelector='R'
              yChannelSelector='G'
            />
          </filter>
        </defs>
      </svg>
      <div
        className={cn('will-change-[opacity,filter]', className)}
        style={{
          opacity,
          filter: `url(#${filterId})`,
        }}
      >
        {children}
      </div>
    </>
  );
}
