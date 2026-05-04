'use client';

import { ArrowRightLeft, EllipsisVertical, ImagePlus, PencilLine, Trash2 } from 'lucide-react';
import { CatalogCard } from '~components/home/CatalogCard';
import { CatalogShell } from '~components/home/CatalogShell';
import { Button } from '~components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~components/ui/dropdown-menu';
import { useNavigationStore } from '~store/useNavigationStore';
import { useUserStore } from '~store/useUserStore';
import { useLegacyQuery, useCannonQuery } from '~lib/queries/story';
import { useDeleteStoryMutation, useUpsertStoryMutation } from '~lib/mutations/story';
import Image from 'next/image';

function summarizeStory(documentCount: number): string {
  if (documentCount === 0) {
    return 'No documents yet. Add a first draft and start filling out the story.';
  }

  if (documentCount === 1) {
    return 'One document is ready inside this story.';
  }

  return `${documentCount} documents are already part of this story.`;
}

function promptForTitle(kind: string, currentTitle: string): string | null {
  const nextTitle = window.prompt(`Rename ${kind}`, currentTitle);

  if (nextTitle === null) {
    return null;
  }

  return nextTitle.trim() || currentTitle;
}

function generateUntitledStory(existing: string[]): string {
  let i = 1;
  while (existing.includes(`Untitled Story ${i}`)) i += 1;
  return `Untitled Story ${i}`;
}

export function WorldView() {
  const { userId } = useUserStore();
  const { currentCannonId, navigateToStory } = useNavigationStore();
  const { data: currentCannon } = useCannonQuery(currentCannonId);
  const { data: cannons = [] } = useLegacyQuery(userId);
  const upsertStory = useUpsertStoryMutation();
  const deleteStory = useDeleteStoryMutation();

  const stories = currentCannon?.stories ?? [];
  const totalDocuments = stories.reduce((sum, story) => sum + (story.documents?.length ?? 0), 0);

  const handleAddStory = () => {
    if (!currentCannon) return;
    upsertStory.mutate({
      cannonId: currentCannon.cannonId,
      title: generateUntitledStory(stories.map((s) => s.title)),
    });
  };

  const handleRenameStory = (storyId: string, currentTitle: string) => {
    const nextTitle = promptForTitle('story', currentTitle);
    if (!nextTitle) return;
    upsertStory.mutate({ storyId, title: nextTitle });
  };

  const handleDeleteStory = (storyId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    deleteStory.mutate(storyId);
  };

  const handleMoveStoryToCannon = (storyId: string, targetCannonId: string, title: string) => {
    upsertStory.mutate({ storyId, cannonId: targetCannonId, title });
  };

  return (
    <CatalogShell
      eyebrow='Cannon view'
      title={currentCannon?.title ?? 'Cannon stories'}
      description={
        currentCannon
          ? `Each card below is a story in ${currentCannon.title}. Click a card to enter its document catalog, or open the ellipsis menu to move or manage it.`
          : 'Choose a cannon to manage its story catalog.'
      }
      metrics={[
        `${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}`,
        `${totalDocuments} document${totalDocuments === 1 ? '' : 's'}`,
      ]}
      addLabel='Add story'
      onAdd={handleAddStory}
    >
      {stories.length > 0 ? (
        <section className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
          {stories.map((story) => {
            const cannonTargets = cannons.filter((cannon) => cannon.cannonId !== story.cannonId);

            return (
              <CatalogCard
                key={story.storyId}
                itemLabel='Story'
                title={story.title}
                description={summarizeStory(story.documents?.length ?? 0)}
                meta={`${story.documents?.length ?? 0} document${(story.documents?.length ?? 0) === 1 ? '' : 's'}`}
                badgeText='Story'
                coverImage={null}
                accentClassName='from-amber-500 via-orange-400 to-rose-500'
                Icon={<Image src='/book.svg' alt='Story' width={48} height={48} />}
                onOpen={() => navigateToStory(story.storyId, story.cannonId)}
                onUploadCover={() => {}}
                menuContent={({ openCoverPicker }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type='button'
                        size='icon-sm'
                        variant='secondary'
                        className='bg-temp/75 text-black hover:bg-temp'
                        aria-label={`Story actions for ${story.title}`}
                      >
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-60'>
                      <DropdownMenuLabel>{story.title}</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => navigateToStory(story.storyId, story.cannonId)}
                      >
                        <Image src='/book.svg' alt='Story' width={48} height={48} />
                        Open story
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ArrowRightLeft />
                          Change cannon
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className='w-56'>
                          {cannonTargets.length > 0 ? (
                            cannonTargets.map((cannon) => (
                              <DropdownMenuItem
                                key={`${story.storyId}-${cannon.cannonId}`}
                                onClick={() =>
                                  handleMoveStoryToCannon(story.storyId, cannon.cannonId, story.title)
                                }
                              >
                                {cannon.title}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>No other cannons yet</DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRenameStory(story.storyId, story.title)}
                      >
                        <PencilLine />
                        Rename story
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openCoverPicker}>
                        <ImagePlus />
                        Upload cover image
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant='destructive'
                        onClick={() => handleDeleteStory(story.storyId, story.title)}
                      >
                        <Trash2 />
                        Delete story
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            );
          })}
        </section>
      ) : (
        <section className='rounded-[28px] border border-border border-border bg-temp/70 px-6 py-12 text-center shadow-[0_15px_45px_-35px_rgba(15,23,42,0.45)]'>
          <div className='mx-auto max-w-2xl space-y-3'>
            <h2 className='text-2xl font-semibold text-black'>This cannon needs its first story</h2>
            <p className='text-sm leading-6 text-black sm:text-base'>
              Story cards live here as a full-screen catalog. Add one and it will be ready to open
              into the story view.
            </p>
            <Button type='button' size='lg' onClick={handleAddStory}>
              Create the first story
            </Button>
          </div>
        </section>
      )}
    </CatalogShell>
  );
}
