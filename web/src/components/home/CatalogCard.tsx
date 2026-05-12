'use client';

import Image from 'next/image';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { useId } from 'react';
import { Badge } from '~components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~components/ui/card';
import { cn } from '~utils/merge-css-classes';

interface CatalogCardProps {
  itemLabel: string;
  title: string;
  description: string;
  meta: string;
  badgeText: string;
  coverImage: string | null;
  accentClassName: string;
  Icon: ReactNode;
  onOpen: () => void;
  onUploadCover: (coverImage: string) => void;
  menuContent: (helpers: { openCoverPicker: () => void }) => ReactNode;
}

const readFileAsDataUrl = (file: File): Promise<string> => {
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
};

export const CatalogCard = ({
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
}: CatalogCardProps) => {
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
    <Card className='h-full overflow-hidden border border-border/80 bg-card/85 shadow-[var(--ww-shadow-card)] backdrop-blur transition-transform duration-300 hover:-translate-y-1'>
      <input
        id={coverInputId}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />

      <div
        role='button'
        tabIndex={0}
        className='flex h-full cursor-pointer flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring'
        onClick={onOpen}
        onKeyDown={handleKeyDown}
      >
        <div className='relative aspect-4/3 overflow-hidden'>
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`${title} cover`}
              fill
              unoptimized
              sizes='(min-width: 1280px) 24vw, (min-width: 768px) 42vw, 100vw'
              className='object-cover transition-transform duration-500 group-hover:scale-[1.02]'
            />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-end justify-between bg-card p-5 text-card-foreground',
                accentClassName,
              )}
            >
              <div className='space-y-2'>
                <p className='text-[11px] uppercase tracking-[0.35em] text-muted-foreground'>{itemLabel}</p>
                <div className='max-w-56 text-xl font-semibold leading-tight'>{title}</div>
              </div>
              {Icon}
            </div>
          )}

          <div className='absolute inset-0 bg-linear-to-b from-black/70 via-black/20 to-transparent' />
          <div className='absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3'>
            <Badge className='bg-card/90 text-card-foreground shadow-sm'>{badgeText}</Badge>
            <div
              className='pointer-events-auto'
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {menuContent({ openCoverPicker })}
            </div>
          </div>
        </div>

        <CardHeader className='space-y-3'>
          <div className='space-y-2'>
            <CardTitle className='line-clamp-2 text-lg'>{title}</CardTitle>
            <p className='min-h-12 text-sm leading-6 text-foreground'>{description}</p>
          </div>
        </CardHeader>

        <CardContent className='mt-auto pt-0'>
          <div className='rounded-2xl border border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] text-foreground'>
            {meta}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
