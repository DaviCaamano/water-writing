import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~utils/merge-css-classes';
import { Variant } from '~types';

const inputVariants = cva(
  cn(
    'flex w-full text-sm font-medium',
    'transition-colors outline-none',
    'focus-visible:ring-2 focus-visible:ring-ring/50',
    'disabled:pointer-events-none disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        default:
          'bg-surface text-foreground embossed-lg border-none placeholder:text-foreground/45',
        debossed: 'bg-surface text-foreground debossed border-none placeholder:text-foreground/45',
        bossed: 'bg-surface text-foreground bossed border-none placeholder:text-foreground/45',
        primary:
          'bg-primary text-primary-foreground border-none placeholder:text-primary-foreground/60',
        secondary:
          'bg-secondary text-secondary-foreground border-none placeholder:text-secondary-foreground/60',
        destructive:
          'bg-destructive text-destructive-foreground border-none placeholder:text-destructive-foreground/60',
        accent:
          'bg-accent text-accent-foreground border-none placeholder:text-accent-foreground/60',
      },
      size: {
        default: 'h-9 px-4 rounded-lg',
        sm: 'h-7 px-3 text-xs rounded-md',
        lg: 'h-11 px-6 text-base rounded-lg',
        pill: 'h-9 px-5 rounded-full',
        'pill-sm': 'h-7 px-4 text-xs rounded-full',
        'pill-lg': 'h-11 px-6 text-base rounded-full',
      },
    },
    defaultVariants: {
      variant: Variant.default,
      size: 'default',
    },
  },
);

type InputElementProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

interface InputProps extends InputElementProps, VariantProps<typeof inputVariants> {}

function Input({ className, variant, size, type = 'text', ...props }: InputProps) {
  return (
    <input
      data-slot='input'
      type={type}
      className={cn(inputVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
