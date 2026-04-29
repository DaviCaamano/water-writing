import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~utils/merge-css-classes';

const buttonVariants = cva(
  cn(
    'group/button inline-flex shrink-0 items-center justify-center rounded-lg',
    'border border-transparent bg-temp text-sm font-medium whitespace-nowrap',
    'transition-all outline-none select-none cursor-pointer',
    'focus-visible:border-border focus-visible:ring-3 focus-visible:ring-ring/50',
    'active:not-aria-[haspopup]:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:border-border aria-invalid:ring-3 aria-invalid:ring-destructive/20',
    'dark:aria-invalid:border-border/50 dark:aria-invalid:ring-destructive/40',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary text-primary-foreground hover:bg-primary/80',
          'aria-expanded:bg-primary/80 aria-expanded:text-primary-foreground/80',
        ),
        outline: cn(
          'bg-muted/20 border-border',
          'hover:bg-muted/50 hover:text-muted-forground',
          'aria-expanded:bg-muted aria-expanded:text-muted-foreground',
        ),
        secondary: cn(
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          'aria-expanded:bg-secondary/80 aria-expanded:text-secondary-foreground/80',
        ),
        accented: cn(
          'hover:bg-accent hover:text-accent-foreground',
          'aria-expanded:bg-accent/80 aria-expanded:text-accent-foreground/80',
        ),
        ghost: cn(
          'hover:bg-accent hover:text-accent-foreground',
          'aria-expanded:bg-accent/80 aria-expanded:text-accent-foreground/80',
        ),
        destructive: cn(
          'bg-destructive/10 text-destructive-foreground hover:bg-destructive/20',
          'focus-visible:border-border/40 focus-visible:ring-destructive/20',
        ),
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: cn(
          'h-8 gap-1.5 px-2.5',
          'has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        ),
        xs: cn(
          'h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs',
          'in-data-[slot=button-group]:rounded-lg',
          'has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
          "[&_svg:not([class*='size-'])]:size-3",
        ),
        sm: cn(
          'h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem]',
          'in-data-[slot=button-group]:rounded-lg',
          'has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
          "[&_svg:not([class*='size-'])]:size-3.5",
        ),
        lg: cn(
          'h-9 gap-1.5 px-2.5',
          'has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        ),
        icon: 'size-8',
        'icon-xs': cn(
          'size-6 rounded-[min(var(--radius-md),10px)]',
          'in-data-[slot=button-group]:rounded-lg',
          "[&_svg:not([class*='size-'])]:size-3",
        ),
        'icon-sm': cn(
          'size-7 rounded-[min(var(--radius-md),12px)]',
          'in-data-[slot=button-group]:rounded-lg',
        ),
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
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
