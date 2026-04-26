'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '~utils/merge-css-classes';

type Ripple = {
  id: string;
  left: number;
  size: number;
  top: number;
};

interface WaterRippleProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  effectColor?: string;
  maxTilt?: number;
}

const RIPPLE_LIFETIME_MS = 700;
const DROPLET_LIFETIME_MS = 500;
const CONTENT_SCALE = 1.03;

export function WaterRipple({
  children,
  className,
  contentClassName,
  disabled = false,
  effectColor = '74, 144, 226',
  maxTilt = 10,
}: WaterRippleProps) {
  const reactId = useId();
  const instanceId = useMemo(() => reactId.replace(/:/g, ''), [reactId]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<CSSProperties>({
    transform: 'perspective(300px) rotateX(0deg) rotateY(0deg)',
  });
  const [contentStyle, setContentStyle] = useState<CSSProperties>({
    transform: 'scale(1)',
  });

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const timeoutId of timeouts) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const scheduleCleanup = (id: string, kind: 'ripple' | 'droplet') => {
    const timeoutId = window.setTimeout(
      () => {
        if (kind === 'ripple') {
          setRipples((current) => current.filter((entry) => entry.id !== id));
          return;
        }
      },
      kind === 'ripple' ? RIPPLE_LIFETIME_MS : DROPLET_LIFETIME_MS,
    );

    timeoutsRef.current.push(timeoutId);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || !wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const rippleId = `${instanceId}-ripple-${crypto.randomUUID()}`;
    const dropletId = `${instanceId}-droplet-${crypto.randomUUID()}`;
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    setRipples((current) => [
      ...current,
      {
        id: rippleId,
        left: localX - size / 2,
        size,
        top: localY - size / 2,
      },
    ]);
    setIsActive(true);
    setContentStyle({
      transform: `scale(${CONTENT_SCALE})`,
    });

    scheduleCleanup(rippleId, 'ripple');
    scheduleCleanup(dropletId, 'droplet');
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || !wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * maxTilt;
    const rotateY = ((centerX - x) / centerX) * maxTilt;

    setTiltStyle({
      transform: `perspective(300px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
    });
  };

  const handlePointerLeave = () => {
    setIsActive(false);
    setTiltStyle({
      transform: 'perspective(300px) rotateX(0deg) rotateY(0deg)',
    });
    setContentStyle({
      transform: 'scale(1)',
    });
  };

  return (
    <>
      <div
        ref={wrapperRef}
        className={cn(
          'relative isolate inline-flex overflow-hidden rounded-[inherit] transition-transform duration-300 ease-out',
          className,
        )}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={tiltStyle}
      >
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-all duration-300 ease-out',
            isActive && 'opacity-100',
          )}
          style={{
            background: `radial-gradient(circle, rgba(${effectColor}, 0.12) 0%, rgba(${effectColor}, 0) 70%)`,
            transform: isActive ? 'scale(1)' : 'scale(0)',
          }}
        />

        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full"
            style={{
              animation: `water-ripple-${instanceId} ${RIPPLE_LIFETIME_MS}ms ease-out forwards`,
              background: `rgba(${effectColor}, 0.2)`,
              height: ripple.size,
              left: ripple.left,
              top: ripple.top,
              width: ripple.size,
            }}
          />
        ))}

        <div
          className={cn(
            'relative z-3 transition-transform duration-300 ease-out',
            contentClassName,
          )}
          style={contentStyle}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes water-ripple-${instanceId} {
          to {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
