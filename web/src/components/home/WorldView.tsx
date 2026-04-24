'use client';

import {
  ArrowRightLeft,
  BookMarked,
  EllipsisVertical,
  ImagePlus,
  PencilLine,
  Trash2,
} from 'lucide-react';
import { CatalogCard } from '@/components/home/CatalogCard';
import { CatalogShell } from '@/components/home/CatalogShell';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dropdown-menu';
import { useNavigationStore } from '@/store/useNavigationStore';

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

export function WorldView() {
  const {
    worlds,
    currentWorld,
    createStory,
    renameStory,
    deleteStory,
    moveStoryToWorld,
    updateStoryCover,
    navigateToStory,
  } = useNavigationStore();

  const stories = currentWorld?.stories ?? [];
  const totalDocuments = stories.reduce((sum, story) => sum + story.documents.length, 0);

  const handleAddStory = () => {
    if (!currentWorld) return;
    createStory(currentWorld.id);
  };

  const handleRenameStory = (storyId: string, currentTitle: string) => {
    const nextTitle = promptForTitle('story', currentTitle);
    if (!nextTitle) return;
    renameStory(storyId, nextTitle);
  };

  const handleDeleteStory = (storyId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    deleteStory(storyId);
  };

  return (
    <CatalogShell
      eyebrow="World view"
      title={currentWorld?.name ?? 'World stories'}
      description={
        currentWorld
          ? `Each card below is a story in ${currentWorld.name}. Click a card to enter its document catalog, or open the ellipsis menu to move or manage it.`
          : 'Choose a world to manage its story catalog.'
      }
      metrics={[
        `${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}`,
        `${totalDocuments} document${totalDocuments === 1 ? '' : 's'}`,
      ]}
      addLabel="Add story"
      onAdd={handleAddStory}
    >
      {stories.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stories.map((story) => {
            const worldTargets = worlds.filter((world) => world.id !== story.worldId);

            return (
              <CatalogCard
                key={story.id}
                itemLabel="Story"
                title={story.name}
                description={summarizeStory(story.documents.length)}
                meta={`${story.documents.length} document${story.documents.length === 1 ? '' : 's'}`}
                badgeText="Story"
                coverImage={story.coverImage}
                accentClassName="from-amber-500 via-orange-400 to-rose-500"
                Icon={BookMarked}
                onOpen={() => navigateToStory(story.id, story.worldId)}
                onUploadCover={(coverImage) => updateStoryCover(story.id, coverImage)}
                menuContent={({ openCoverPicker }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="secondary"
                        className="bg-slate-950/75 text-white hover:bg-slate-950"
                        aria-label={`Story actions for ${story.name}`}
                      >
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuLabel>{story.name}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigateToStory(story.id, story.worldId)}>
                        <BookMarked />
                        Open story
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ArrowRightLeft />
                          Change world
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56">
                          {worldTargets.length > 0 ? (
                            worldTargets.map((world) => (
                              <DropdownMenuItem
                                key={`${story.id}-${world.id}`}
                                onClick={() => moveStoryToWorld(story.id, world.id)}
                              >
                                {world.name}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>No other worlds yet</DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRenameStory(story.id, story.name)}>
                        <PencilLine />
                        Rename story
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openCoverPicker}>
                        <ImagePlus />
                        Upload cover image
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDeleteStory(story.id, story.name)}
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
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-[0_15px_45px_-35px_rgba(15,23,42,0.45)]">
          <div className="mx-auto max-w-2xl space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">This world needs its first story</h2>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Story cards live here as a full-screen catalog. Add one and it will be ready to open
              into the story view.
            </p>
            <Button type="button" size="lg" onClick={handleAddStory}>
              Create the first story
            </Button>
          </div>
        </section>
      )}
    </CatalogShell>
  );
}
