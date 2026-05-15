import { generateUntitledName, promptForTitle } from '~utils/catalog-helpers';
import { Variant } from '~types';
import { SidebarPanel } from '~components/home/sidebar/SidebarPanel';
import { CardStack } from '~components/home/sidebar/SidebarStackedCard';
import { CannonResponse } from '#types/shared/response';
import { DrillLevel, DrillState } from '~components/home/sidebar/types';
import { BookOpen, PencilLine, Trash2 } from 'lucide-react';
import { UseDeleteStoryMutation, UseUpsertStoryMutation } from '~lib/mutations/story';

export interface SideBarCannonViewProps {
  currentCannon: CannonResponse;
  deleteStory: UseDeleteStoryMutation;
  drill: DrillState;
  setDrill: Setter<DrillState>;
  upsertStory: UseUpsertStoryMutation;
}
export const SideBarStoryView = ({
  currentCannon,
  deleteStory,
  drill,
  setDrill,
  upsertStory,
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

  const cards = currentCannon.stories.map((story) => ({
    id: story.storyId,
    title: story.title,
    icon: BookOpen,
    isActive: story.storyId === drill.story?.storyId,
    onClick: () => setDrill({ level: DrillLevel.documents, cannon: currentCannon, story }),
    menu: [
      {
        label: 'Rename',
        icon: PencilLine,
        onClick: () => {
          const next = promptForTitle('story', story.title);
          if (!next) return;
          upsertStory.mutate({ storyId: story.storyId, title: next });
        },
      },
      {
        label: 'Delete',
        icon: Trash2,
        variant: Variant.destructive,
        onClick: () => {
          if (!window.confirm(`Delete "${story.title}" and all its documents?`)) return;
          deleteStory.mutate(story.storyId);
        },
      },
    ],
  }));

  return (
    <SidebarPanel
      header={currentCannon.title}
      subtitle='Stories'
      onBack={goBack}
      onAdd={() =>
        upsertStory.mutate({
          cannonId: currentCannon.cannonId,
          title: generateUntitledName(
            'Untitled Story',
            currentCannon.stories.map((s) => s.title),
          ),
        })
      }
      addLabel='New story'
    >
      <CardStack cards={cards} keyId={`stories-${currentCannon.cannonId}`} />
    </SidebarPanel>
  );
};
