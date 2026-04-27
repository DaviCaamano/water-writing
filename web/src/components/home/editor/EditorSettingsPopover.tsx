'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Popover, PopoverTrigger } from '~components/ui/popover';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { EditorSettings } from '~components/home/editor/EditorSettings';

const WATER_RIPPLE_FADE_DURATION_MS = 600;

export function EditorSettingsPopover() {
  const [open, setOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (next) {
      setOpen(true);
      setWaterOpen(true);
    } else {
      setWaterOpen(false);
      closeTimeoutRef.current = window.setTimeout(
        () => setOpen(false),
        WATER_RIPPLE_FADE_DURATION_MS,
      );
    }
  };

  return (
    <div className="-editor-settings-popover- absolute bottom-4 left-4 z-30">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <WaterRipple className="rounded-full">
          <PopoverTrigger className="p-2 rounded-full cursor-pointer" aria-label="Text settings">
            <Image src="/theme.svg" alt="" width={28} height={28}/>
          </PopoverTrigger>
        </WaterRipple>
        <EditorSettings open={waterOpen} />
      </Popover>
    </div>
  );
}
