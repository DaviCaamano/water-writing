import { ChevronLeft, Plus } from 'lucide-react';
import { Button } from '~components/primitives/button';

export const SidebarPanel = ({
  header,
  subtitle,
  onAdd,
  addLabel,
  onBack,
  children,
}: {
  header: string;
  subtitle?: string;
  onAdd: () => void;
  addLabel: string;
  onBack?: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className='flex flex-col gap-3 h-full min-h-0'>
      <div className='flex items-center gap-2 px-1'>
        {onBack && (
          <Button variant='default' size='icon' onClick={onBack} aria-label='Back'>
            <ChevronLeft className='size-4' />
          </Button>
        )}
        <div className='flex-1 min-w-0'>
          <h3 className='text-[14px] font-bold text-foreground truncate'>{header}</h3>
          {subtitle && (
            <span className='text-[10px] text-muted-foreground uppercase tracking-wide'>
              {subtitle}
            </span>
          )}
        </div>
        <Button
          variant='default'
          size='icon'
          onClick={onAdd}
          aria-label={addLabel}
          title={addLabel}
        >
          <Plus className='size-4' />
        </Button>
      </div>
      <div className='flex-1 min-h-0'>{children}</div>
    </div>
  );
};
