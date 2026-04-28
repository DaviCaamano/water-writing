import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~utils/merge-css-classes';

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-temp focus-visible:ring-[3px] focus-visible:ring-temp/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-temp aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-temp text-black [a]:hover:bg-temp/80',
        secondary: 'bg-temp text-black [a]:hover:bg-temp/80',
        destructive:
          'bg-temp/10 text-destructive focus-visible:ring-destructive/20 dark:bg-temp/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-temp/20',
        outline: 'border-temp text-foreground [a]:hover:bg-temp [a]:hover:text-black',
        ghost: 'hover:bg-temp hover:text-black dark:hover:bg-temp/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
