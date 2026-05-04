'use client';

import Image from 'next/image';
import { EllipsisVertical, ImagePlus, PencilLine, Trash2 } from 'lucide-react';
import { CatalogCard } from '~components/home/CatalogCard';
import { CatalogShell } from '~components/home/CatalogShell';
import { Button } from '~components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~components/ui/dropdown-menu';
import { useNavigationStore } from '~store/useNavigationStore';
import { useUserStore } from '~store/useUserStore';
import { useLegacyQuery } from '~lib/queries/story';
import { useDeleteCannonMutation, useUpsertCannonMutation } from '~lib/mutations/story';
import { cn } from '~utils/merge-css-classes';

const legacyViewDescription =
  'This is the top-level catalog for the user. Click a cannon card to dive into its ' +
  'stories, or use the ellipsis menu to rename, delete, or change its cover.';
function summarizeCannon(storyCount: number, documentCount: number): string {
  if (storyCount === 0) {
    return 'An empty cannon waiting for its first story.';
  }

  return `${storyCount} stor${storyCount === 1 ? 'y' : 'ies'} and ${documentCount} document${documentCount === 1 ? '' : 's'} live in this cannon.`;
}

function promptForTitle(kind: string, currentTitle: string): string | null {
  const nextTitle = window.prompt(`Rename ${kind}`, currentTitle);

  if (nextTitle === null) {
    return null;
  }

  return nextTitle.trim() || currentTitle;
}

function generateUntitled(existing: string[]): string {
  let i = 1;
  while (existing.includes(`Untitled Cannon ${i}`)) i += 1;
  return `Untitled Cannon ${i}`;
}

export function LegacyView() {
  const { userId } = useUserStore();
  const { navigateToCannon } = useNavigationStore();
  const { data: cannons = [] } = useLegacyQuery(userId);
  const upsertCannon = useUpsertCannonMutation();
  const deleteCannon = useDeleteCannonMutation();

  const totalStories = cannons.reduce((sum, cannon) => sum + cannon.stories.length, 0);
  const totalDocuments = cannons.reduce(
    (sum, cannon) =>
      sum + cannon.stories.reduce((storySum, story) => storySum + (story.documents?.length ?? 0), 0),
    0,
  );

  const handleAddCannon = () => {
    if (!userId) return;
    upsertCannon.mutate({ title: generateUntitled(cannons.map((w) => w.title)) });
  };

  const handleRenameCannon = (cannonId: string, currentTitle: string) => {
    const nextTitle = promptForTitle('cannon', currentTitle);
    if (!nextTitle) return;
    upsertCannon.mutate({ cannonId, title: nextTitle });
  };

  const handleDeleteCannon = (cannonId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    deleteCannon.mutate(cannonId);
  };

  return (
    <CatalogShell
      eyebrow='Legacy view'
      title='Your cannons'
      description={legacyViewDescription}
      metrics={[
        `${cannons.length} cannon${cannons.length === 1 ? '' : 's'}`,
        `${totalStories} stor${totalStories === 1 ? 'y' : 'ies'}`,
        `${totalDocuments} document${totalDocuments === 1 ? '' : 's'}`,
      ]}
      addLabel='Add cannon'
      onAdd={handleAddCannon}
    >
      {cannons.length > 0 ? (
        <section className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
          {cannons.map((cannon) => {
            const documentCount = cannon.stories.reduce(
              (sum, story) => sum + (story.documents?.length ?? 0),
              0,
            );

            return (
              <CatalogCard
                key={cannon.cannonId}
                itemLabel='Cannon'
                title={cannon.title}
                description={summarizeCannon(cannon.stories.length, documentCount)}
                meta={`${cannon.stories.length} stor${cannon.stories.length === 1 ? 'y' : 'ies'}`}
                badgeText='Cannon'
                coverImage={null}
                accentClassName='from-sky-600 via-teal-500 to-emerald-500'
                Icon={<Image src='/planet.svg' alt={'cannon'} width={48} height={48} />}
                onOpen={() => navigateToCannon(cannon.cannonId)}
                onUploadCover={() => {}}
                menuContent={({ openCoverPicker }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type='button'
                        size='icon-sm'
                        variant='secondary'
                        className='bg-temp/75 text-black hover:bg-temp'
                        aria-label={`Cannon actions for ${cannon.title}`}
                      >
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-60'>
                      <DropdownMenuLabel>{cannon.title}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigateToCannon(cannon.cannonId)}>
                        <Image src='/planet.svg' alt={'cannon'} width={48} height={48} />
                        Open cannon
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRenameCannon(cannon.cannonId, cannon.title)}
                      >
                        <PencilLine />
                        Rename cannon
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openCoverPicker}>
                        <ImagePlus />
                        Upload cover image
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant='destructive'
                        onClick={() => handleDeleteCannon(cannon.cannonId, cannon.title)}
                      >
                        <Trash2 />
                        Delete cannon
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            );
          })}
        </section>
      ) : (
        <section
          className={cn(
            '-legacy-view-create-cannon-section- debossed dip-on-click',
            'rounded-[28px] border border-border border-border',
            'bg-linear-to-r from-background to-background/50',
            'px-6 py-12 text-center cursor-pointer',
          )}
          onClick={handleAddCannon}
        >
          <div className='mx-auto max-w-2xl space-y-3'>
            <h2 className='text-2xl font-semibold text-black'>
              Create the first cannon in your legacy
            </h2>
            <p className='text-sm leading-6 text-black sm:text-base'>
              Once a cannon exists here, clicking its card will open the cannon view and reveal its
              stories.
            </p>
            <div className='border-shadow-foreground bg-background mt-4'>Get Started Here</div>
          </div>
        </section>
      )}
    </CatalogShell>
  );
}
