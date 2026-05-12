'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const RING_COUNT = 5;
const RING_STAGGER = 0.11; // seconds between each ring
const RING_DURATION = 1.05; // seconds for each ring to expand
const BURST_TTL = (RING_DURATION + RING_STAGGER * (RING_COUNT - 1)) * 1000 + 400;

let nextBurstId = 0;

function RippleBurst() {
  return (
    <div
      className='fixed inset-0 z-[200] pointer-events-none overflow-hidden'
      aria-hidden='true'
    >
      {/* droplet impact */}
      <motion.div
        className='absolute top-1/2 left-1/2 rounded-full'
        style={{
          translateX: '-50%',
          translateY: '-50%',
          background: 'var(--primary)',
          boxShadow: '0 0 12px 4px var(--primary)',
        }}
        initial={{ width: '0vmax', height: '0vmax', opacity: 0 }}
        animate={{
          width: ['0vmax', '0.6vmax', '0.6vmax', '0vmax'],
          height: ['0vmax', '0.6vmax', '0.6vmax', '0vmax'],
          opacity: [0, 1, 1, 0],
        }}
        transition={{ duration: 0.28, times: [0, 0.25, 0.65, 1], ease: 'easeOut' }}
      />

      {/* expanding rings */}
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <motion.div
          key={i}
          className='absolute top-1/2 left-1/2 rounded-full'
          style={{
            translateX: '-50%',
            translateY: '-50%',
            borderStyle: 'solid',
            borderColor: 'var(--primary)',
            borderWidth: Math.max(0.5, 1.8 - i * 0.22),
            boxShadow: `0 0 ${6 - i}px 0 var(--primary)`,
          }}
          initial={{ width: '0vmax', height: '0vmax', opacity: 0.65 - i * 0.04 }}
          animate={{ width: '160vmax', height: '160vmax', opacity: 0 }}
          transition={{
            duration: RING_DURATION + i * 0.04,
            delay: i * RING_STAGGER,
            ease: [0.1, 0.55, 0.3, 1],
          }}
        />
      ))}
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
      const id = ++nextBurstId;
      setBursts((b) => [...b, id]);
      setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), BURST_TTL);
    }
  }, [pathname]);

  return (
    <>
      {bursts.map((id) => (
        <RippleBurst key={id} />
      ))}
    </>
  );
};
