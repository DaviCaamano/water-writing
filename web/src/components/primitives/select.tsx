'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';

import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '~utils/merge-css-classes';

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot='select' {...props} />;
}

function SelectGroup({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot='select-group'
      className={cn('scroll-my-1 p-1', className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return (
    <SelectPrimitive.Value
      data-slot='select-value'
      className={cn('flex flex-1 text-left', className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = 'default',
  variant = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
  variant?: 'default' | 'primary';
}) {
  const variantClasses =
    variant === 'primary'
      ? cn(
          'border-none bg-primary text-primary-foreground shadow-shadow shadow',
          'hover:bg-primary/90',
          '*:data-[slot=select-icon]:text-primary-foreground/70',
        )
      : cn('border border-border bg-card text-card-foreground hover:bg-accent/15');

  return (
    <SelectPrimitive.Trigger
      data-slot='select-trigger'
      data-size={size}
      data-variant={variant}
      className={cn(
        'flex w-fit items-center justify-between gap-1.5',
        'rounded-lg py-2 pr-2 pl-2.5',
        'text-sm whitespace-nowrap transition-colors outline-none select-none',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        'data-placeholder:text-muted-foreground',
        'data-[size=default]:h-9 data-[size=sm]:h-7',
        'data-[size=sm]:rounded-md',
        '*:data-[slot=select-value]:line-clamp-1',
        '*:data-[slot=select-value]:flex',
        '*:data-[slot=select-value]:items-center',
        '*:data-[slot=select-value]:gap-1.5',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variantClasses,
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild data-slot='select-icon'>
        <ChevronDownIcon className='pointer-events-none size-4' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  variant?: 'default' | 'primary';
}) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground'
      : 'bg-card text-card-foreground';

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot='select-content'
        data-variant={variant}
        position={position}
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={cn(
          'relative isolate',
          'z-50 max-h-(--radix-select-content-available-height) min-w-36',
          'origin-(--radix-select-content-transform-origin)',
          'overflow-x-hidden overflow-y-auto rounded-lg p-1',
          variantClasses,
          'shadow-md ring-1 ring-foreground/10 duration-100',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'data-[state=closed]:zoom-out-95',
          position === 'popper' && 'w-(--radix-select-trigger-width)',
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className='p-0'>{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot='select-label'
      className={cn('px-1.5 py-1 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot='select-item'
      className={cn(
        'relative flex w-full items-center gap-1.5',
        'cursor-pointer rounded-md py-1.5 pr-8 pl-2',
        'text-sm outline-hidden select-none',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        "[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className={cn('flex flex-1 shrink-0 gap-2 whitespace-nowrap')}>
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator asChild>
        <span
          className={cn(
            'pointer-events-none absolute right-2 flex size-4',
            'items-center justify-center',
          )}
        >
          <CheckIcon className='pointer-events-none' />
        </span>
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot='select-separator'
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot='select-scroll-up-button'
      className={cn(
        'top-0 z-10 flex w-full cursor-pointer items-center justify-center bg-card py-1',
        "[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot='select-scroll-down-button'
      className={cn(
        'bottom-0 z-10 flex w-full cursor-pointer items-center justify-center bg-card py-1',
        "[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
