import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~utils/merge-css-classes';
import { Variant } from '~types';

const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center',
    'border border-transparent text-sm font-medium whitespace-nowrap',
    'transition-all outline-none select-none cursor-pointer',
    'focus-visible:ring-2 focus-visible:ring-ring/50',
    'active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-surface text-foreground embossed-lg',
          'hover:bg-accent/15 active:bg-accent/25',
        ),
        debossed: cn(
          'bg-surface text-foreground debossed',
          'hover:bg-accent/15 active:bg-accent/25',
        ),
        bossed: cn('bg-surface text-foreground bossed', 'hover:bg-accent/15 active:bg-accent/25'),
        primary: cn(
          'bg-primary text-primary-foreground',
          'hover:bg-primary/85 active:bg-primary/70',
        ),
        secondary: cn(
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/85 active:bg-secondary/70',
        ),
        accented: cn('bg-accent text-accent-foreground', 'hover:bg-accent/85 active:bg-accent/70'),
        destructive: cn(
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/85 active:bg-destructive/70',
        ),
        muted: cn('bg-muted text-muted-foreground', 'hover:bg-muted/85 active:bg-muted/70'),
        success: cn(
          'bg-success text-success-foreground',
          'hover:bg-success/85 active:bg-success/70',
        ),
      },
      size: {
        default: 'h-9 px-4 rounded-lg',
        sm: 'h-7 px-3 text-xs rounded-md',
        lg: 'h-11 px-6 text-base rounded-lg',
        icon: 'size-9 rounded-full p-0',
        'icon-sm': 'size-7 rounded-full p-0',
        'icon-lg': 'size-11 rounded-full p-0',
        pill: 'h-9 px-5 rounded-full',
        'pill-sm': 'h-7 px-4 text-xs rounded-full',
        'pill-lg': 'h-11 px-6 text-base font-semibold rounded-full',
      },
    },
    defaultVariants: {
      variant: Variant.default,
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = Variant.default,
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
