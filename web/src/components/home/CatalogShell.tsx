'use client';

import { Plus } from 'lucide-react';
import { Badge } from '~components/ui/badge';
import { Button } from '~components/ui/button';
import { cn } from '~utils/merge-css-classes';
import { CSSProperties } from 'react';

interface CatalogShellProps {
  addLabel: string;
  children: React.ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  metrics: string[];
  onAdd: () => void;
  style?: CSSProperties;
  title: string;
}

export const CatalogShell = ({
  addLabel,
  children,
  className,
  description,
  eyebrow,
  metrics,
  onAdd,
  style,
  title,
}: CatalogShellProps) => {
  return (
    <div
      className={cn(
        '-catalog-shell- embossed',
        'flex-1 min-h-[calc(100vh-2rem)] overflow-auto rounded-2xl border border-border my-4',
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          '-catalog-shell-content-',
          'mx-auto flex max-w-7xl min-h-full ',
          'flex-col gap-8',
          'px-4 pb-8 pt-20 sm:px-6 lg:px-8',
        )}
      >
        <section
          className={cn(
            '-catalog-shell-header- debossed',
            'relative overflow-hidden bg-linear-to-r from-primary to-primary/50',
            'rounded-[32px] border border-border',
            'px-6 py-8 sm:px-8',
            'text-foreground',
          )}
        >
          <div className={cn('-catalog-shell-div- absolute inset-0 ')} />
          <div className='relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-3xl space-y-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.35em] text-foreground/80'>
                {eyebrow}
              </p>
              <div className='space-y-3'>
                <h1 className='text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'>
                  {title}
                </h1>
                <p className='max-w-2xl text-sm leading-6 text-foreground sm:text-base'>{description}</p>
              </div>
              <div className='flex flex-wrap gap-2'>
                {metrics.map((metric) => (
                  <Badge
                    key={metric}
                    variant='secondary'
                    className='border border-border/10 bg-primary-foreground/10 px-3 py-1 text-foreground'
                  >
                    {metric}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              type='button'
              size='lg'
              className='bg-card text-foreground hover:bg-card/80'
              onClick={onAdd}
            >
              <Plus />
              {addLabel}
            </Button>
          </div>
        </section>

        {children}
      </div>
    </div>
  );
};
