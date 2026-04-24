'use client';

import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CatalogShellProps {
  eyebrow: string;
  title: string;
  description: string;
  metrics: string[];
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}

export function CatalogShell({
  eyebrow,
  title,
  description,
  metrics,
  addLabel,
  onAdd,
  children,
}: CatalogShellProps) {
  return (
    <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.16),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-8 px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-950 px-6 py-8 text-slate-50 shadow-[0_25px_80px_-28px_rgba(15,23,42,0.6)] sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.25),transparent_30%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">
                {eyebrow}
              </p>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {metrics.map((metric) => (
                  <Badge
                    key={metric}
                    variant="secondary"
                    className="border border-white/10 bg-white/10 px-3 py-1 text-slate-100"
                  >
                    {metric}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              className="bg-white text-slate-950 hover:bg-slate-100"
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
