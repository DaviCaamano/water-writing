import * as React from 'react';

import { cn } from '~utils/merge-css-classes';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-lg border border-border bg-temp',
        'px-2.5 py-2 text-base transition-colors outline-none placeholder:text-black md:text-sm',
        'focus-visible:border-border focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:bg-temp/50 disabled:opacity-50',
        'aria-invalid:border-border aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        'dark:bg-temp/30 dark:disabled:bg-temp/80',
        'dark:aria-invalid:border-border/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
