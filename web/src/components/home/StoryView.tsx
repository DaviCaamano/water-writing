'use client';

import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpToLine,
  EllipsisVertical,
  FileText,
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
import { useEditorStore } from '@/store/useEditorStore';
import { useNavigationStore } from '@/store/useNavigationStore';

function summarizeDocument(body: string): string {
  const trimmed = body.trim();

  if (!trimmed) {
    return 'Blank draft ready for a first sentence.';
  }

  if (trimmed.length <= 120) {
    return trimmed;
  }

  return `${trimmed.slice(0, 117)}...`;
}

function promptForTitle(kind: string, currentTitle: string): string | null {
  const nextTitle = window.prompt(`Rename ${kind}`, currentTitle);

  if (nextTitle === null) {
    return null;
  }

  return nextTitle.trim() || currentTitle;
}

export function StoryView() {
  const {
    worlds,
    currentStory,
    currentWorld,
    currentWorldId,
    createDocument,
    renameDocument,
    deleteDocument,
    moveDocumentToStory,
    moveDocumentPosition,
    updateDocumentCover,
    navigateToEditor,
  } = useNavigationStore();
  const { loadDocument } = useEditorStore();

  const documents = currentStory?.documents ?? [];

  const handleAddDocument = () => {
    if (!currentStory) return;

    createDocument(currentStory.id);
  };

  const handleOpenDocument = (documentId: string) => {
    if (!currentStory || !currentWorldId) return;

    const document = currentStory.documents.find((entry) => entry.id === documentId);
    if (!document) return;

    loadDocument({
      id: document.id,
      title: document.title,
      body: document.body,
      storyId: document.storyId,
    });
    navigateToEditor(document.id, document.storyId, currentWorldId);
  };

  const handleRenameDocument = (documentId: string, currentTitle: string) => {
    const nextTitle = promptForTitle('document', currentTitle);
    if (!nextTitle) return;
    renameDocument(documentId, nextTitle);
  };

  const handleDeleteDocument = (documentId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    deleteDocument(documentId);
  };

  const totalCharacters = documents.reduce((sum, document) => sum + document.body.length, 0);

  return (
    <CatalogShell
      eyebrow="Story view"
      title={currentStory?.name ?? 'Story documents'}
      description={
        currentStory
          ? `This full-screen catalog holds every document in ${currentStory.name}. Click a card to jump into the editor, or use the ellipsis menu to reorganize the story.`
          : 'Choose a story to manage its document catalog.'
      }
      metrics={[
        currentWorld ? currentWorld.name : 'No world selected',
        `${documents.length} document${documents.length === 1 ? '' : 's'}`,
        `${totalCharacters.toLocaleString()} characters`,
      ]}
      addLabel="Add document"
      onAdd={handleAddDocument}
    >
      {documents.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((document, index) => {
            const moveTargets = worlds.flatMap((world) =>
              world.stories
                .filter((story) => story.id !== currentStory?.id)
                .map((story) => ({
                  worldName: world.name,
                  storyId: story.id,
                  storyName: story.name,
                })),
            );

            return (
              <CatalogCard
                key={document.id}
                itemLabel="Document"
                title={document.title}
                description={summarizeDocument(document.body)}
                meta={`#${index + 1} in story · ${document.body.length.toLocaleString()} characters`}
                badgeText="Document"
                coverImage={document.coverImage}
                accentClassName="from-cyan-500 via-sky-500 to-indigo-500"
                Icon={FileText}
                onOpen={() => handleOpenDocument(document.id)}
                onUploadCover={(coverImage) => updateDocumentCover(document.id, coverImage)}
                menuContent={({ openCoverPicker }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="secondary"
                        className="bg-slate-950/75 text-white hover:bg-slate-950"
                        aria-label={`Document actions for ${document.title}`}
                      >
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuLabel>{document.title}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenDocument(document.id)}>
                        <FileText />
                        Open document
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ArrowRightLeft />
                          Change story
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64">
                          {moveTargets.length > 0 ? (
                            moveTargets.map((target) => (
                              <DropdownMenuItem
                                key={`${document.id}-${target.storyId}`}
                                onClick={() => moveDocumentToStory(document.id, target.storyId)}
                              >
                                {target.storyName}
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {target.worldName}
                                </span>
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>No other stories yet</DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ArrowUpDownIcon />
                          Change position
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-52">
                          <DropdownMenuItem
                            disabled={index === 0}
                            onClick={() => moveDocumentPosition(document.id, 'first')}
                          >
                            <ArrowUpToLine />
                            Move to first
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={index === 0}
                            onClick={() => moveDocumentPosition(document.id, 'earlier')}
                          >
                            <ArrowUp />
                            Move earlier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={index === documents.length - 1}
                            onClick={() => moveDocumentPosition(document.id, 'later')}
                          >
                            <ArrowDown />
                            Move later
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={index === documents.length - 1}
                            onClick={() => moveDocumentPosition(document.id, 'last')}
                          >
                            <ArrowDownToLine />
                            Move to last
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRenameDocument(document.id, document.title)}
                      >
                        <PencilLine />
                        Rename document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openCoverPicker}>
                        <ImagePlus />
                        Upload cover image
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDeleteDocument(document.id, document.title)}
                      >
                        <Trash2 />
                        Delete document
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
            <h2 className="text-2xl font-semibold text-slate-900">Start this story with a new document</h2>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Every document lives here as a card. Click any card to open it in the editor, or add
              a first draft to get started.
            </p>
            <Button type="button" size="lg" onClick={handleAddDocument}>
              Create the first document
            </Button>
          </div>
        </section>
      )}
    </CatalogShell>
  );
}

function ArrowUpDownIcon() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <ArrowUp className="size-3.5" />
      <ArrowDown className="size-3.5" />
    </span>
  );
}
