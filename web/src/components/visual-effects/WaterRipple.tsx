'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { useId, useMemo, useRef, useState } from 'react';
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

const NEUTRAL_TILT_STYLE: CSSProperties = {
  transform: 'perspective(300px) rotateX(0deg) rotateY(0deg)',
};
const NEUTRAL_CONTENT_STYLE: CSSProperties = {
  transform: 'scale(1)',
};

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

  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<CSSProperties>(NEUTRAL_TILT_STYLE);
  const [contentStyle, setContentStyle] = useState<CSSProperties>(NEUTRAL_CONTENT_STYLE);

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || !wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const rippleId = `${instanceId}-ripple-${crypto.randomUUID()}`;
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    setRipples([
      {
        id: rippleId,
        left: localX - size / 2,
        size,
        top: localY - size / 2,
      },
    ]);
    setIsActive(true);
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
    setRipples([]);
    setTiltStyle(NEUTRAL_TILT_STYLE);
    setContentStyle(NEUTRAL_CONTENT_STYLE);
  };

  const displayIsActive = !disabled && isActive;
  const displayTiltStyle = disabled ? NEUTRAL_TILT_STYLE : tiltStyle;
  const displayContentStyle = disabled ? NEUTRAL_CONTENT_STYLE : contentStyle;

  return (
    <>
      <div
        ref={wrapperRef}
        className={cn(
          'relative isolate inline-flex',
          'overflow-hidden rounded-[inherit]',
          'transition-transform duration-300 ease-out',
          className,
        )}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={displayTiltStyle}
      >
        <div
          aria-hidden='true'
          className={cn(
            'absolute w-full',
            'pointer-events-none inset-0 rounded-[inherit]',
            'opacity-0 transition-all duration-300 ease-out',
            displayIsActive && 'opacity-100',
          )}
          style={{
            background: `radial-gradient(circle, rgba(${effectColor}, 0.12) 0%, rgba(${effectColor}, 0) 70%)`,
            transform: displayIsActive ? 'scale(1)' : 'scale(0)',
          }}
        />

        {displayIsActive &&
          ripples.map((ripple) => (
            <span
              key={ripple.id}
              aria-hidden='true'
              className='pointer-events-none absolute rounded-full'
              style={{
                animation: `water-ripple-${instanceId} 700ms ease-out forwards`,
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
            'w-full relative z-3 transition-transform duration-300 ease-out',
            contentClassName,
          )}
          style={displayContentStyle}
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
