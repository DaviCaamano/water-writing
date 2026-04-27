'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Popover, PopoverTrigger } from '~components/ui/popover';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { EditorSettings } from '~components/home/editor/EditorSettings';

export function EditorSettingsPopover() {
  const [open, setOpen] = useState(false);

  return (
    <div className="-editor-settings-popover- absolute bottom-4 left-4 z-30">
      <Popover open={open} onOpenChange={setOpen}>
        <WaterRipple className="rounded-full">
          <PopoverTrigger className="p-2 rounded-full cursor-pointer" aria-label="Text settings">
            <Image src="/theme.svg" alt="" width={24} height={24} className="w-6 h-6" />
          </PopoverTrigger>
        </WaterRipple>
        <EditorSettings /> {/* Popover Content */}
      </Popover>
    </div>
  );
}
