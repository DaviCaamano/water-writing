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
import { useDeleteWorldMutation, useUpsertWorldMutation } from '~lib/mutations/story';
import { cn } from '~utils/merge-css-classes';

const legacyViewDescription =
    'This is the top-level catalog for the user. Click a world card to dive into its ' +
    'stories, or use the ellipsis menu to rename, delete, or change its cover.';
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

function generateUntitled(existing: string[]): string {
    let i = 1;
    while (existing.includes(`Untitled World ${i}`)) i += 1;
    return `Untitled World ${i}`;
}

export function LegacyView() {
    const { userId } = useUserStore();
    const { navigateToWorld } = useNavigationStore();
    const { data: worlds = [] } = useLegacyQuery(userId);
    const upsertWorld = useUpsertWorldMutation();
    const deleteWorld = useDeleteWorldMutation();

    const totalStories = worlds.reduce((sum, world) => sum + world.stories.length, 0);
    const totalDocuments = worlds.reduce(
        (sum, world) =>
            sum +
            world.stories.reduce((storySum, story) => storySum + (story.documents?.length ?? 0), 0),
        0,
    );

    const handleAddWorld = () => {
        if (!userId) return;
        upsertWorld.mutate({ title: generateUntitled(worlds.map((w) => w.title)) });
    };

    const handleRenameWorld = (worldId: string, currentTitle: string) => {
        const nextTitle = promptForTitle('world', currentTitle);
        if (!nextTitle) return;
        upsertWorld.mutate({ worldId, title: nextTitle });
    };

    const handleDeleteWorld = (worldId: string, title: string) => {
        if (!window.confirm(`Delete "${title}"?`)) return;
        deleteWorld.mutate(worldId);
    };

    return (
        <CatalogShell
            eyebrow='Legacy view'
            title='Your worlds'
            description={legacyViewDescription}
            metrics={[
                `${worlds.length} world${worlds.length === 1 ? '' : 's'}`,
                `${totalStories} stor${totalStories === 1 ? 'y' : 'ies'}`,
                `${totalDocuments} document${totalDocuments === 1 ? '' : 's'}`,
            ]}
            addLabel='Add world'
            onAdd={handleAddWorld}
        >
            {worlds.length > 0 ? (
                <section className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
                    {worlds.map((world) => {
                        const documentCount = world.stories.reduce(
                            (sum, story) => sum + (story.documents?.length ?? 0),
                            0,
                        );

                        return (
                            <CatalogCard
                                key={world.worldId}
                                itemLabel='World'
                                title={world.title}
                                description={summarizeWorld(world.stories.length, documentCount)}
                                meta={`${world.stories.length} stor${world.stories.length === 1 ? 'y' : 'ies'}`}
                                badgeText='World'
                                coverImage={null}
                                accentClassName='from-sky-600 via-teal-500 to-emerald-500'
                                Icon={
                                    <Image src='/planet.svg' alt={'world'} width={48} height={48} />
                                }
                                onOpen={() => navigateToWorld(world.worldId)}
                                onUploadCover={() => {}}
                                menuContent={({ openCoverPicker }) => (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type='button'
                                                size='icon-sm'
                                                variant='secondary'
                                                className='bg-temp/75 text-black hover:bg-temp'
                                                aria-label={`World actions for ${world.title}`}
                                            >
                                                <EllipsisVertical />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='end' className='w-60'>
                                            <DropdownMenuLabel>{world.title}</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() => navigateToWorld(world.worldId)}
                                            >
                                                <Image
                                                    src='/planet.svg'
                                                    alt={'world'}
                                                    width={48}
                                                    height={48}
                                                />
                                                Open world
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleRenameWorld(world.worldId, world.title)
                                                }
                                            >
                                                <PencilLine />
                                                Rename world
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={openCoverPicker}>
                                                <ImagePlus />
                                                Upload cover image
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                variant='destructive'
                                                onClick={() =>
                                                    handleDeleteWorld(world.worldId, world.title)
                                                }
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
                <section
                    className={cn(
                        '-legacy-view-create-world-section- debossed dip-on-click',
                        'rounded-[28px] border border-border border-border',
                        'bg-linear-to-r from-background to-background/50',
                        'px-6 py-12 text-center cursor-pointer',
                    )}
                    onClick={handleAddWorld}
                >
                    <div className='mx-auto max-w-2xl space-y-3'>
                        <h2 className='text-2xl font-semibold text-black'>
                            Create the first world in your legacy
                        </h2>
                        <p className='text-sm leading-6 text-black sm:text-base'>
                            Once a world exists here, clicking its card will open the world view and
                            reveal its stories.
                        </p>
                        <div className='border-shadow-foreground bg-background mt-4'>
                            Get Started Here
                        </div>
                    </div>
                </section>
            )}
        </CatalogShell>
    );
}
