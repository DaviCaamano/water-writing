'use client';

import { EllipsisVertical, Globe2, ImagePlus, PencilLine, Trash2 } from 'lucide-react';
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

function summarizeWorld(storyCount: number, documentCount: number): string {
  if (storyCount === 0) {
    return 'An empty world waiting for its first story.';
  }

  return `${storyCount} stor${storyCount === 1 ? 'y' : 'ies'} and ${documentCount} document${documentCount === 1 ? '' : 's'} live in this world.`;
}

function promptForTitle(kind: string, currentTitle: string): string | null {
  const nextTitle = window.prompt(`Rename ${kind}`, currentTitle);

  if (nextTitle === null) {
    return null;
  }

  return nextTitle.trim() || currentTitle;
}

export function LegacyView() {
  const {
    worlds,
    createWorld,
    renameWorld,
    deleteWorld,
    updateWorldCover,
    navigateToWorld,
  } = useNavigationStore();

  const totalStories = worlds.reduce((sum, world) => sum + world.stories.length, 0);
  const totalDocuments = worlds.reduce(
    (sum, world) =>
      sum + world.stories.reduce((storySum, story) => storySum + story.documents.length, 0),
    0,
  );

  const handleAddWorld = () => {
    createWorld();
  };

  const handleRenameWorld = (worldId: string, currentTitle: string) => {
    const nextTitle = promptForTitle('world', currentTitle);
    if (!nextTitle) return;
    renameWorld(worldId, nextTitle);
  };

  const handleDeleteWorld = (worldId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    deleteWorld(worldId);
  };

  return (
    <CatalogShell
      eyebrow="Legacy view"
      title="Your worlds"
      description="This is the top-level catalog for the user. Click a world card to dive into its stories, or use the ellipsis menu to rename, delete, or change its cover."
      metrics={[
        `${worlds.length} world${worlds.length === 1 ? '' : 's'}`,
        `${totalStories} stor${totalStories === 1 ? 'y' : 'ies'}`,
        `${totalDocuments} document${totalDocuments === 1 ? '' : 's'}`,
      ]}
      addLabel="Add world"
      onAdd={handleAddWorld}
    >
      {worlds.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {worlds.map((world) => {
            const documentCount = world.stories.reduce(
              (sum, story) => sum + story.documents.length,
              0,
            );

            return (
              <CatalogCard
                key={world.id}
                itemLabel="World"
                title={world.name}
                description={summarizeWorld(world.stories.length, documentCount)}
                meta={`${world.stories.length} stor${world.stories.length === 1 ? 'y' : 'ies'}`}
                badgeText="World"
                coverImage={world.coverImage}
                accentClassName="from-sky-600 via-teal-500 to-emerald-500"
                Icon={Globe2}
                onOpen={() => navigateToWorld(world.id)}
                onUploadCover={(coverImage) => updateWorldCover(world.id, coverImage)}
                menuContent={({ openCoverPicker }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="secondary"
                        className="bg-slate-950/75 text-white hover:bg-slate-950"
                        aria-label={`World actions for ${world.name}`}
                      >
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuLabel>{world.name}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigateToWorld(world.id)}>
                        <Globe2 />
                        Open world
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRenameWorld(world.id, world.name)}>
                        <PencilLine />
                        Rename world
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openCoverPicker}>
                        <ImagePlus />
                        Upload cover image
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDeleteWorld(world.id, world.name)}
                      >
                        <Trash2 />
                        Delete world
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
            <h2 className="text-2xl font-semibold text-slate-900">Create the first world in your legacy</h2>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Once a world exists here, clicking its card will open the world view and reveal its
              stories.
            </p>
            <Button type="button" size="lg" onClick={handleAddWorld}>
              Create the first world
            </Button>
          </div>
        </section>
      )}
    </CatalogShell>
  );
}
