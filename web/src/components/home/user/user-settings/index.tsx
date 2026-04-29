import { cn } from '~utils/merge-css-classes';
import { ReactNode } from 'react';
import { SettingsColorMap } from '~types/components/settings-modal';
import { WaterRipple } from '~components/visual-effects/WaterRipple';

export const settingsInsetStyle =
  'primary-foreground shadow-[inset_5px_5px_11px_var(--muted),inset_-5px_-5px_11px_var(--background)]';

export const settingsRaisedStyle =
  'primary-foreground shadow-[inset_6px_6px_14px_var(--muted),inset_-6px_-6px_14px_var(--background)]';

export const settingsTrackStyle =
  'primary-foreground shadow-[inset_4px_4px_9px_var(--muted),inset_-4px_-4px_9px_var(--background)]';

export const settingsPillActiveStyle =
  'primary-foreground shadow-[inset_4px_4px_10px_var(--muted),inset_-4px_-4px_10px_var(--background)]';

export const SectionHeading = ({ children }: { children: React.ReactNode }) => {
  return (
    <h3 className='text-[18px] font-semibold mb-4 tracking-tight text-foreground'>{children}</h3>
  );
};

export const FieldLabel = ({ children }: { children: React.ReactNode }) => {
  return <div className='text-[12px] font-medium mb-1.5 pl-1 text-muted'>{children}</div>;
};

export const NeuDivider = () => {
  return <div className={cn('my-6 h-px rounded-full', settingsTrackStyle)} />;
};

export const NeuIconBtn = ({
  children,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  'aria-label': string;
}) => {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'size-8 rounded-full flex items-center justify-center',
        'cursor-pointer transition-transform active:translate-y-px',
        'text-foreground',
        settingsRaisedStyle,
      )}
    >
      {children}
    </button>
  );
};

export const NeuInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-full px-5 py-2.5 text-[14px]',
        'border-none outline-none',
        'text-foreground',
        settingsInsetStyle,
      )}
      style={{ fontFamily: 'inherit' }}
    />
  );
};

export const NeuPillButton = ({
  children,
  className,
  disabled,
  onClick,
  type = 'button',
  variant = 'default',
  colorMap,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'default' | 'destructive' | 'ghost';
  colorMap?: SettingsColorMap;
}) => {
  return (
    <WaterRipple className={`rounded-full ${className ?? ''}`}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'rounded-full px-6 py-2.5 text-[13px] font-semibold',
          'cursor-pointer border-none disabled:opacity-50',
          'transition-transform active:translate-y-px',
          settingsRaisedStyle,
        )}
        style={{
          color: colorMap?.[variant],
          fontFamily: 'inherit',
          width: '100%',
        }}
      >
        {children}
      </button>
    </WaterRipple>
  );
};
