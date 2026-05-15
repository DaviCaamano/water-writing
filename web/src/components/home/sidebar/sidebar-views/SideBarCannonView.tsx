import { generateUntitledName, promptForTitle } from '~utils/catalog-helpers';
import { SidebarPanel } from '~components/home/sidebar/SidebarPanel';
import { CardStack } from '~components/home/sidebar/SidebarStackedCard';
import { CannonResponse } from '#types/shared/response';
import { DrillState } from '~components/home/sidebar/types';
import { Library, PencilLine, Trash2 } from 'lucide-react';
import { UseDeleteCannonMutation, UseUpsertCannonMutation } from '~lib/mutations/story';

export interface SideBarCannonViewProps {
  currentCannon: CannonResponse;
  deleteCannon: UseDeleteCannonMutation;
  legacy: CannonResponse[];
  setDrill: Setter<DrillState>;
  upsertCannon: UseUpsertCannonMutation;
}
export const SideBarCannonView = ({
  currentCannon,
  deleteCannon,
  legacy,
  setDrill,
  upsertCannon,
}: SideBarCannonViewProps) => {
  const cards = legacy.map((cannon) => ({
    id: cannon.cannonId,
    title: cannon.title,
    icon: Library,
    isActive: cannon.cannonId === currentCannon.cannonId,
    onClick: () => setDrill({ level: 'stories', cannon }),
    menu: [
      {
        label: 'Rename',
        icon: PencilLine,
        onClick: () => {
          const next = promptForTitle('cannon', cannon.title);
          if (!next) return;
          upsertCannon.mutate({ cannonId: cannon.cannonId, title: next });
        },
      },
      {
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive' as const,
        onClick: () => {
          if (!window.confirm(`Delete "${cannon.title}" and all its content?`)) return;
          deleteCannon.mutate(cannon.cannonId);
        },
      },
    ],
  }));

  return (
    <SidebarPanel
      header='All cannons'
      subtitle={`${legacy.length} cannon${legacy.length === 1 ? '' : 's'}`}
      onAdd={() =>
        upsertCannon.mutate({
          title: generateUntitledName(
            'Untitled Cannon',
            legacy.map((c) => c.title),
          ),
        })
      }
      addLabel='New cannon'
    >
      <CardStack cards={cards} keyId='cannons' />
    </SidebarPanel>
  );
};
