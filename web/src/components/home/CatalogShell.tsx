'use client';

import { Plus } from 'lucide-react';
import { Badge } from '~components/ui/badge';
import { Button } from '~components/ui/button';
import { cn } from '~utils/merge-css-classes';
import { twGradientBackground, twForegroundGlow } from '~constants/tailwind';

interface CatalogShellProps {
    addLabel: string;
    children: React.ReactNode;
    className?: string;
    description: string;
    eyebrow: string;
    metrics: string[];
    onAdd: () => void;
    title: string;
}

export function CatalogShell({
    addLabel,
    children,
    className,
    description,
    eyebrow,
    metrics,
    onAdd,
    title,
}: CatalogShellProps) {
    return (
        <div className={cn('flex-1 overflow-auto rounded-2xl border border-primary-foreground', className)}>
            <div
                className={cn(
                    'mx-auto flex max-w-7xl min-h-full ',
                    'flex-col gap-8',
                    'px-4 pb-8 pt-20 sm:px-6 lg:px-8',
                )}
            >
                <section
                    className={cn(
                        'relative overflow-hidden bg-foreground',
                        'rounded-[32px] border border-primary',
                        'px-6 py-8 sm:px-8',
                        'text-primary-foreground',
                    )}
                >
                    <div
                        className={cn('-catalog-shell-div- absolute inset-0 ', twForegroundGlow)}
                    />
                    <div className='relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
                        <div className='max-w-3xl space-y-4'>
                            <p className='text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80'>
                                {eyebrow}
                            </p>
                            <div className='space-y-3'>
                                <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>
                                    {title}
                                </h1>
                                <p className='max-w-2xl text-sm leading-6 text-slate-300 sm:text-base'>
                                    {description}
                                </p>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {metrics.map((metric) => (
                                    <Badge
                                        key={metric}
                                        variant='secondary'
                                        className='border border-white/10 bg-white/10 px-3 py-1 text-slate-100'
                                    >
                                        {metric}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Button
                            type='button'
                            size='lg'
                            className='bg-white text-slate-950 hover:bg-slate-100'
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
}
