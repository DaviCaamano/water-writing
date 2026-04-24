'use client';

import Image from 'next/image';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '~components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~components/ui/card';
import { cn } from '~lib/utils';

interface CatalogCardProps {
  itemLabel: string;
  title: string;
  description: string;
  meta: string;
  badgeText: string;
  coverImage: string | null;
  accentClassName: string;
  Icon: LucideIcon;
  onOpen: () => void;
  onUploadCover: (coverImage: string) => void;
  menuContent: (helpers: { openCoverPicker: () => void }) => ReactNode;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read the selected image.'));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read the selected image.'));
    };

    reader.readAsDataURL(file);
  });
}

export function CatalogCard({
  itemLabel,
  title,
  description,
  meta,
  badgeText,
  coverImage,
  accentClassName,
  Icon,
  onOpen,
  onUploadCover,
  menuContent,
}: CatalogCardProps) {
  const coverInputId = useId();

  const openCoverPicker = () => {
    document.getElementById(coverInputId)?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const coverImageDataUrl = await readFileAsDataUrl(file);
      onUploadCover(coverImageDataUrl);
    } catch (error) {
      console.error(`Failed to upload ${itemLabel.toLowerCase()} cover:`, error);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <Card className="h-full overflow-hidden border border-slate-200/80 bg-white/85 shadow-[0_24px_65px_-36px_rgba(15,23,42,0.55)] backdrop-blur transition-transform duration-300 hover:-translate-y-1">
      <input
        id={coverInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        role="button"
        tabIndex={0}
        className="flex h-full cursor-pointer flex-col outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        onClick={onOpen}
        onKeyDown={handleKeyDown}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`${title} cover`}
              fill
              unoptimized
              sizes="(min-width: 1280px) 24vw, (min-width: 768px) 42vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-end justify-between bg-gradient-to-br p-5 text-white',
                accentClassName,
              )}
            >
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">{itemLabel}</p>
                <div className="max-w-[14rem] text-xl font-semibold leading-tight">{title}</div>
              </div>
              <Icon className="h-12 w-12 text-white/85" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
          <div className="absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3">
            <Badge className="bg-white/90 text-slate-900 shadow-sm">{badgeText}</Badge>
            <div
              className="pointer-events-auto"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {menuContent({ openCoverPicker })}
            </div>
          </div>
        </div>

        <CardHeader className="space-y-3">
          <div className="space-y-2">
            <CardTitle className="line-clamp-2 text-lg">{title}</CardTitle>
            <p className="min-h-[3rem] text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </CardHeader>

        <CardContent className="mt-auto pt-0">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            {meta}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
