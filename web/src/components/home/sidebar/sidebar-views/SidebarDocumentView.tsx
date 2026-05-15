import { generateUntitledName, promptForTitle } from '~utils/catalog-helpers';
import { Variant } from '~types';
import { SidebarPanel } from '~components/home/sidebar/SidebarPanel';
import { CardStack } from '~components/home/sidebar/SidebarStackedCard';
import { StoryResponse } from '#types/shared/response';
import { DrillLevel, DrillState } from '~components/home/sidebar/types';
import { FileText, PencilLine, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UseDeleteDocumentMutation, UseUpsertDocumentMutation } from '~lib/mutations/story';

export interface SideBarCannonViewProps {
  currentStory: StoryResponse;
  deleteDocument: UseDeleteDocumentMutation;
  documentId: string;
  onPickDocument: () => void;
  setDrill: Setter<DrillState>;
  upsertDocument: UseUpsertDocumentMutation;
}
export const SideBarDocumentView = ({
  currentStory,
  deleteDocument,
  documentId,
  onPickDocument,
  setDrill,
  upsertDocument,
}: SideBarCannonViewProps) => {
  const goBack = () => {
    setDrill((prev) => {
      if (prev.level === DrillLevel.documents && prev.cannon) {
        return { level: DrillLevel.stories, cannon: prev.cannon };
      }
      if (prev.level === DrillLevel.stories) return { level: 'cannons' };
      return prev;
    });
  };
  const router = useRouter();

  const cards = currentStory.documents.map((doc) => ({
    id: doc.documentId,
    title: doc.title,
    icon: FileText,
    isActive: doc.documentId === documentId,
    onClick: () => {
      router.push(`/d/${doc.documentId}`);
      onPickDocument();
    },
    menu: [
      {
        label: 'Rename',
        icon: PencilLine,
        onClick: () => {
          const next = promptForTitle('document', doc.title);
          if (!next) return;
          upsertDocument.mutate({ documentId: doc.documentId, title: next });
        },
      },
      {
        label: 'Delete',
        icon: Trash2,
        variant: Variant.destructive,
        onClick: () => {
          if (!window.confirm(`Delete "${doc.title}"?`)) return;
          deleteDocument.mutate(doc.documentId);
        },
      },
    ],
  }));

  return (
    <SidebarPanel
      header={currentStory.title}
      subtitle='documents'
      onBack={goBack}
      onAdd={() =>
        upsertDocument.mutate({
          storyId: currentStory.storyId,
          title: generateUntitledName(
            'Untitled',
            currentStory.documents.map((d) => d.title),
          ),
          body: '',
        })
      }
      addLabel='New document'
    >
      <CardStack cards={cards} keyId={`docs-${currentStory.storyId}`} />
    </SidebarPanel>
  );
};
