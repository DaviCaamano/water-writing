import * as React from 'react';

import { cn } from '~utils/merge-css-classes';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-lg border border-temp bg-temp px-2.5 py-2 text-base transition-colors outline-none placeholder:text-black focus-visible:border-temp focus-visible:ring-3 focus-visible:ring-temp/50 disabled:cursor-not-allowed disabled:bg-temp/50 disabled:opacity-50 aria-invalid:border-temp aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-temp/30 dark:disabled:bg-temp/80 dark:aria-invalid:border-temp/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
