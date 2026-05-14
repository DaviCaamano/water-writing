'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';

import { Button } from '~components/primitives/button';

export const ColorSwap = () => {
  const [swapped, setSwapped] = useState(false);

  const toggle = () => {
    const root = document.documentElement;
    if (swapped) {
      root.style.removeProperty('--background');
      root.style.removeProperty('--card');
    } else {
      const computed = getComputedStyle(root);
      const bg = computed.getPropertyValue('--background').trim();
      const card = computed.getPropertyValue('--card').trim();
      root.style.setProperty('--background', card);
      root.style.setProperty('--card', bg);
    }
    setSwapped((s) => !s);
  };

  return (
    <Button
      variant='default'
      size='icon'
      onClick={toggle}
      aria-label='Swap background and card colors'
      title='Swap background and card colors'
      aria-pressed={swapped}
      className='fixed top-4 right-4 z-50'
    >
      <Lightbulb className='size-4' />
    </Button>
  );
};
