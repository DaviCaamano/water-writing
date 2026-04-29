import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

type RippleFilterProps = {
  children: React.ReactNode;
  rippleImageUrl: string;
  className?: string;
  trigger?: 'mount' | 'hover' | 'click' | 'manual';
  duration?: number;
  maxScale?: number;
};

export function RippleFilter({
  children,
  rippleImageUrl,
  className,
  trigger = 'hover',
  duration = 1.2,
  maxScale = 90,
}: RippleFilterProps) {
  const reactId = useId();
  const safeId = useMemo(() => reactId.replace(/:/g, ''), [reactId]);

  const filterId = `ripple-filter-${safeId}`;
  const displacementId = `displacement-map-${safeId}`;

  const feImageRef = useRef<SVGFEImageElement | null>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function convertToDataURL(url: string) {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });

      img.src = url;
      const loadedImg = await loaded;

      const canvas = document.createElement('canvas');
      canvas.width = loadedImg.width;
      canvas.height = loadedImg.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(loadedImg, 0, 0);
      const url64 = canvas.toDataURL('image/png');

      if (!cancelled) {
        setDataUrl(url64);
      }
    }

    convertToDataURL(rippleImageUrl).catch((err) => {
      console.error('Failed to convert ripple image to base64:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [rippleImageUrl]);

  useEffect(() => {
    if (!dataUrl || !feImageRef.current || !displacementRef.current) return;

    feImageRef.current.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);

    gsap.set(displacementRef.current, { attr: { scale: 0 } });
    gsap.set(feImageRef.current, {
      attr: { x: 50, y: 50, width: '0%', height: '0%' },
    });

    const tl = gsap.timeline({ paused: true });

    tl.fromTo(
      displacementRef.current,
      { attr: { scale: maxScale } },
      { attr: { scale: 0 }, duration, ease: 'power2.out' },
      0,
    ).fromTo(
      feImageRef.current,
      { attr: { x: 50, y: 50, width: '0%', height: '0%' } },
      {
        attr: { x: -25, y: -25, width: '150%', height: '150%' },
        duration,
        ease: 'power2.out',
      },
      0,
    );

    tlRef.current = tl;

    if (trigger === 'mount') {
      tl.restart();
    }

    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [dataUrl, duration, maxScale, trigger]);

  const play = () => {
    tlRef.current?.restart();
  };

  return (
    <>
      <svg
        width='0'
        height='0'
        aria-hidden='true'
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <defs>
          <filter id={filterId} x='-20%' y='-20%' width='140%' height='140%'>
            <feImage ref={feImageRef} x='50' y='50' width='0%' height='0%' result='rippleImage' />
            <feDisplacementMap
              ref={displacementRef}
              id={displacementId}
              in='SourceGraphic'
              in2='rippleImage'
              xChannelSelector='R'
              yChannelSelector='G'
              colorInterpolationFilters='sRGB'
              scale='0'
            />
            <feComposite operator='in' in2='rippleImage' />
          </filter>
        </defs>
      </svg>

      <div
        ref={wrapperRef}
        className={className}
        style={{ filter: `url(#${filterId})`, display: 'inline-block' }}
        onMouseEnter={trigger === 'hover' ? play : undefined}
        onClick={trigger === 'click' ? play : undefined}
      >
        {children}
      </div>
    </>
  );
}
