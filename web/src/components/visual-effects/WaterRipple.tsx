'use client';

import type { PointerEvent, ReactNode } from 'react';
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
  disabled?: boolean | undefined;
  effectColor?: string;
}

export const WaterRipple = ({
  children,
  className,
  contentClassName,
  disabled = false,
  effectColor = '102, 144, 179',
}: WaterRippleProps) => {
  const reactId = useId();
  const instanceId = useMemo(() => reactId.replace(/:/g, ''), [reactId]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isActive, setIsActive] = useState(false);

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

  const handlePointerLeave = () => {
    setIsActive(false);
    setRipples([]);
  };

  const displayIsActive = !disabled && isActive;

  return (
    <>
      <div
        ref={wrapperRef}
        className={cn('relative isolate inline-flex', 'overflow-hidden rounded-full', className)}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div
          aria-hidden='true'
          className={cn(
            'absolute w-full',
            'pointer-events-none inset-0 rounded-full',
            'opacity-0 transition-all duration-300 ease-out',
            displayIsActive && 'opacity-100',
          )}
          style={{
            background: `radial-gradient(circle, rgba(${effectColor}, 1) 100%, rgba(${effectColor}, 1) 100%)`,
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
                background: `rgba(${effectColor}, 1)`,
                height: ripple.size,
                left: ripple.left,
                top: ripple.top,
                width: ripple.size,
              }}
            />
          ))}

        <div className={cn('w-full relative z-3', contentClassName)}>{children}</div>
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
};
