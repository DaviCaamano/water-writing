import { SettingsColorMap } from '~types/components/settings-modal';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { Button } from '~components/primitives/button';

export const SectionHeading = ({ children }: { children: React.ReactNode }) => {
  return (
    <h3 className='text-[18px] font-semibold mb-4 tracking-tight text-foreground'>{children}</h3>
  );
};

export const FieldLabel = ({ children }: { children: React.ReactNode }) => {
  return <div className='text-[12px] font-medium mb-1.5 pl-1 text-muted'>{children}</div>;
};

export const NeuDivider = () => {
  return <div className='my-6 h-px rounded-full embossed-sm' />;
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
      <Button
        variant='default'
        size='pill-lg'
        type={type}
        onClick={onClick}
        disabled={disabled}
        className='w-full'
        style={{ color: colorMap?.[variant], fontFamily: 'inherit' }}
      >
        {children}
      </Button>
    </WaterRipple>
  );
};
