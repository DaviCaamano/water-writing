'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '~utils/merge-css-classes';

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default';
}) {
  return (
      <SwitchPrimitive.Root
          data-slot='switch'
          data-size={size}
          className={cn(
              'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-temp focus-visible:ring-3 focus-visible:ring-temp/50 aria-invalid:border-temp aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-temp/50 dark:aria-invalid:ring-destructive/40 data-[state=checked]:bg-temp data-[state=unchecked]:bg-temp dark:data-[state=unchecked]:bg-temp/80 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
              className,
          )}
          {...props}
      >
          <SwitchPrimitive.Thumb
              data-slot='switch-thumb'
              className='pointer-events-none block rounded-full bg-temp ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-[state=checked]:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-[state=checked]:translate-x-[calc(100%-2px)] dark:data-[state=checked]:bg-temp group-data-[size=default]/switch:data-[state=unchecked]:translate-x-0 group-data-[size=sm]/switch:data-[state=unchecked]:translate-x-0 dark:data-[state=unchecked]:bg-temp'
          />
      </SwitchPrimitive.Root>
  );
}
// text-[^\s\/\[]+
export { Switch };
