'use client';

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
import { useEditorStore } from '~store/useEditorStore';
import { useNavigationStore } from '~store/useNavigationStore';
import { useStoryQuery, useWorldQuery } from '~lib/queries/story';
import { useDeleteDocumentMutation, useUpsertDocumentMutation } from '~lib/mutations/story';
import Image from 'next/image';

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

function generateUntitledDocument(existing: string[]): string {
  let i = 1;
  while (existing.includes(`Untitled Document ${i}`)) i += 1;
  return `Untitled Document ${i}`;
}

export function StoryView() {
  const { currentWorldId, currentStoryId, navigateToEditor } = useNavigationStore();
  const { data: currentStory } = useStoryQuery(currentStoryId);
  const { data: currentWorld } = useWorldQuery(currentWorldId);
  const { loadDocument } = useEditorStore();
  const upsertDocument = useUpsertDocumentMutation();
  const deleteDocument = useDeleteDocumentMutation();

  const documents = currentStory?.documents ?? [];

  const handleAddDocument = () => {
    if (!currentStory) return;
    upsertDocument.mutate({
      storyId: currentStory.storyId,
      title: generateUntitledDocument(documents.map((d) => d.title)),
      body: '',
    });
  };

  const handleOpenDocument = (documentId: string) => {
    if (!currentStory || !currentWorldId) return;

    const document = documents.find((entry) => entry.documentId === documentId);
    if (!document) return;

    loadDocument(document);
    navigateToEditor(document.documentId, document.storyId, currentWorldId);
  };

  const handleRenameDocument = (documentId: string, currentTitle: string) => {
    const nextTitle = promptForTitle('document', currentTitle);
    if (!nextTitle) return;
    upsertDocument.mutate({ documentId, title: nextTitle });
  };

  const handleDeleteDocument = (documentId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    deleteDocument.mutate(documentId);
  };

  const totalCharacters = documents.reduce((sum, document) => sum + document.body.length, 0);

  return (
    <CatalogShell
      eyebrow='Story view'
      title={currentStory?.title ?? 'Story documents'}
      description={
        currentStory
          ? `This full-screen catalog holds every document in ${currentStory.title}. Click a card to jump into the editor, or use the ellipsis menu to reorganize the story.`
          : 'Choose a story to manage its document catalog.'
      }
      metrics={[
        currentWorld ? currentWorld.title : 'No world selected',
        `${documents.length} document${documents.length === 1 ? '' : 's'}`,
        `${totalCharacters.toLocaleString()} characters`,
      ]}
      addLabel='Add document'
      onAdd={handleAddDocument}
    >
      {documents.length > 0 ? (
        <section className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
          {documents.map((document, index) => (
            <CatalogCard
              key={document.documentId}
              itemLabel='Document'
              title={document.title}
              description={summarizeDocument(document.body)}
              meta={`#${index + 1} in story · ${document.body.length.toLocaleString()} characters`}
              badgeText='Document'
              coverImage={null}
              accentClassName='from-cyan-500 via-sky-500 to-indigo-500'
              Icon={<Image src='/file.svg' alt='Document' width={48} height={48} />}
              onOpen={() => handleOpenDocument(document.documentId)}
              onUploadCover={() => {}}
              menuContent={({ openCoverPicker }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type='button'
                      size='icon-sm'
                      variant='secondary'
                      className='bg-temp/75 text-black hover:bg-temp'
                      aria-label={`Document actions for ${document.title}`}
                    >
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-60'>
                    <DropdownMenuLabel>{document.title}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleOpenDocument(document.documentId)}>
                      <Image src='/file.svg' alt='Document' width={48} height={48} />
                      Open document
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRenameDocument(document.documentId, document.title)}
                    >
                      <PencilLine />
                      Rename document
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openCoverPicker}>
                      <ImagePlus />
                      Upload cover image
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => handleDeleteDocument(document.documentId, document.title)}
                    >
                      <Trash2 />
                      Delete document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          ))}
        </section>
      ) : (
        <section className='rounded-[28px] border border-border border-border bg-temp/70 px-6 py-12 text-center shadow-[0_15px_45px_-35px_rgba(15,23,42,0.45)]'>
          <div className='mx-auto max-w-2xl space-y-3'>
            <h2 className='text-2xl font-semibold text-black'>
              Start this story with a new document
            </h2>
            <p className='text-sm leading-6 text-black sm:text-base'>
              Every document lives here as a card. Click any card to open it in the editor, or add a
              first draft to get started.
            </p>
            <Button type='button' size='lg' onClick={handleAddDocument}>
              Create the first document
            </Button>
          </div>
        </section>
      )}
    </CatalogShell>
  );
}
