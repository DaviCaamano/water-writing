import { useDocumentQuery } from '~lib/queries/story';
import { useUserStore } from '~store/useUserStore';
import { CannonResponse, DocumentResponse, StoryResponse } from '#types/shared/response';
import { useState } from 'react';
import { SidebarEmptyState } from './SideBarEmptyState';
import { useSticky } from '~hooks/useSticky';
import { DrillLevel, DrillState } from '~components/home/sidebar/types';
import {
  useDeleteCannonMutation,
  useDeleteDocumentMutation,
  useDeleteStoryMutation,
  useUpsertCannonMutation,
  useUpsertDocumentMutation,
  useUpsertStoryMutation,
} from '~lib/mutations/story';
import { SideBarCannonView } from '~components/home/sidebar/sidebar-views/SideBarCannonView';
import { SideBarStoryView } from '~components/home/sidebar/sidebar-views/SideBarStoryView';
import { SideBarDocumentView } from '~components/home/sidebar/sidebar-views/SidebarDocumentView';

export const SidebarContent = ({
  documentId,
  onPickDocument,
}: {
  documentId: string | null;
  onPickDocument: () => void;
}) => {
  const { legacy } = useUserStore();
  const { data: currentDocument } = useDocumentQuery(documentId);

  const [drill, setDrill] = useState(() => computeInitialDrillState(currentDocument, legacy));
  useSticky(currentDocument?.documentId, () =>
    setDrill(() => computeInitialDrillState(currentDocument, legacy)),
  );
  const [currentCannon, currentStory] = findDocumentCannon(drill, legacy);

  const upsertCannon = useUpsertCannonMutation();
  const deleteCannon = useDeleteCannonMutation();
  const upsertStory = useUpsertStoryMutation();
  const deleteStory = useDeleteStoryMutation();
  const upsertDocument = useUpsertDocumentMutation();
  const deleteDocument = useDeleteDocumentMutation();

  if (!documentId || !currentCannon || !currentStory || !currentDocument)
    return <SidebarEmptyState message='No content yet — add a cannon to begin.' />;

  switch (drill.level) {
    case DrillLevel.cannons:
      return (
        <SideBarCannonView
          currentCannon={currentCannon}
          deleteCannon={deleteCannon}
          legacy={legacy}
          setDrill={setDrill}
          upsertCannon={upsertCannon}
        />
      );
    case DrillLevel.stories:
      return (
        <SideBarStoryView
          currentCannon={currentCannon}
          deleteStory={deleteStory}
          drill={drill}
          setDrill={setDrill}
          upsertStory={upsertStory}
        />
      );
    case DrillLevel.documents:
      return (
        <SideBarDocumentView
          currentStory={currentStory}
          deleteDocument={deleteDocument}
          documentId={documentId}
          onPickDocument={onPickDocument}
          setDrill={setDrill}
          upsertDocument={upsertDocument}
        />
      );
    default:
      return <SidebarEmptyState message='No content yet — add a cannon to begin.' />;
  }
};

const computeInitialDrillState = (
  currentDocument: DocumentResponse | undefined,
  legacy: CannonResponse[],
): DrillState => {
  if (!currentDocument) return { level: DrillLevel.cannons };
  for (const cannon of legacy) {
    const story = cannon.stories.find((s) => s.storyId === currentDocument.storyId);
    if (story) return { level: DrillLevel.documents, cannon, story };
  }
  return { level: DrillLevel.cannons };
};

const findDocumentCannon = (
  drill: DrillState,
  legacy: CannonResponse[],
): [CannonResponse | null, StoryResponse | null] => {
  const cannon = drill.cannon
    ? (legacy.find((c) => c.cannonId === drill.cannon!.cannonId) ?? null)
    : null;
  const story =
    cannon && drill.story
      ? (cannon.stories.find((s) => s.storyId === drill.story!.storyId) ?? null)
      : null;
  return [cannon, story];
};
