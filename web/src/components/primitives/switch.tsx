'use client';

import * as React from 'react';

import { cn } from '~utils/merge-css-classes';

interface SwitchProps {
  /** Label for the off (false) state */
  offLabel: string;
  /** Label for the on (true) state */
  onLabel: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

function Switch({
  offLabel,
  onLabel,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
  ...rest
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
  const value = isControlled ? checked : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const next = !value;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  };

  return (
    <button
      type='button'
      role='switch'
      aria-checked={value}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        'inline-flex gap-1 rounded-full p-1 embossed-sm',
        'cursor-pointer outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {[
        { v: false, label: offLabel },
        { v: true, label: onLabel },
      ].map(({ v, label }) => {
        const isActive = value === v;
        return (
          <span
            key={label}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground font-semibold'
                : 'bg-transparent text-muted-foreground font-medium',
            )}
          >
            {label}
          </span>
        );
      })}
    </button>
  );
}

export { Switch };
