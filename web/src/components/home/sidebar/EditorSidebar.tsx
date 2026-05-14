'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  EllipsisVertical,
  PencilLine,
  Trash2,
  ChevronLeft,
  X,
  FileText,
  BookOpen,
  Library,
} from 'lucide-react';
import { useUserStore } from '~store/useUserStore';
import { useDocumentQuery } from '~lib/queries/story';
import {
  useUpsertCannonMutation,
  useDeleteCannonMutation,
  useUpsertStoryMutation,
  useDeleteStoryMutation,
  useUpsertDocumentMutation,
  useDeleteDocumentMutation,
} from '~lib/mutations/story';
import { promptForTitle, generateUntitledName } from '~utils/catalog-helpers';
import { cn } from '~utils/merge-css-classes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~components/ui/dropdown-menu';
import { CannonResponse, StoryResponse } from '#types/shared/response';

const DRAWER_WIDTH = 340;

export const EditorSidebar = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const params = useParams<{ documentId?: string }>();
  const documentId = params.documentId ?? null;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key='backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className='fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40'
          />
          <motion.aside
            key='drawer'
            initial={{ x: -DRAWER_WIDTH - 20 }}
            animate={{ x: 0 }}
            exit={{ x: -DRAWER_WIDTH - 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={cn(
              '-editor-sidebar-',
              'fixed left-0 top-0 bottom-0 z-50',
              'h-full flex flex-col gap-3 p-4',
              'bg-background border-r border-border',
              'shadow-2xl shadow-shadow/20',
            )}
            style={{ width: DRAWER_WIDTH }}
          >
            <div className='flex items-center justify-end'>
              <button
                type='button'
                onClick={() => onOpenChange(false)}
                aria-label='Close sidebar'
                className={cn(
                  'size-8 flex items-center justify-center',
                  'cursor-pointer transition-transform active:translate-y-px text-foreground',
                  'embossed-lg rounded-full mr-0.5',
                )}
              >
                <X className='size-4' />
              </button>
            </div>
            <div className='flex-1 min-h-0 overflow-hidden'>
              <CannonsView documentId={documentId} onPickDocument={() => onOpenChange(false)} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

type DrillLevel = 'cannons' | 'stories' | 'documents';

interface DrillState {
  level: DrillLevel;
  cannon?: CannonResponse;
  story?: StoryResponse;
}

const CannonsView = ({
  documentId,
  onPickDocument,
}: {
  documentId: string | null;
  onPickDocument: () => void;
}) => {
  const { legacy } = useUserStore();
  const { data: currentDocument } = useDocumentQuery(documentId);
  const router = useRouter();

  const computeInitial = (): DrillState => {
    if (!currentDocument) return { level: 'cannons' };
    for (const cannon of legacy) {
      const story = cannon.stories.find((s) => s.storyId === currentDocument.storyId);
      if (story) return { level: 'documents', cannon, story };
    }
    return { level: 'cannons' };
  };

  const initial = computeInitial();
  const [drill, setDrill] = useState<DrillState>(initial);
  const [lastDocumentId, setLastDocumentId] = useState(documentId);

  if (lastDocumentId !== documentId) {
    setLastDocumentId(documentId);
    setDrill(initial);
  }

  const upsertCannon = useUpsertCannonMutation();
  const deleteCannon = useDeleteCannonMutation();
  const upsertStory = useUpsertStoryMutation();
  const deleteStory = useDeleteStoryMutation();
  const upsertDocument = useUpsertDocumentMutation();
  const deleteDocument = useDeleteDocumentMutation();

  const currentCannon = drill.cannon
    ? (legacy.find((c) => c.cannonId === drill.cannon!.cannonId) ?? null)
    : null;
  const currentStory =
    currentCannon && drill.story
      ? (currentCannon.stories.find((s) => s.storyId === drill.story!.storyId) ?? null)
      : null;

  const goBack = () => {
    setDrill((prev) => {
      if (prev.level === 'documents' && prev.cannon) {
        return { level: 'stories', cannon: prev.cannon };
      }
      if (prev.level === 'stories') return { level: 'cannons' };
      return prev;
    });
  };

  if (drill.level === 'cannons') {
    const cards = legacy.map((cannon) => ({
      id: cannon.cannonId,
      title: cannon.title,
      icon: Library,
      isActive: cannon.cannonId === initial.cannon?.cannonId,
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
  }

  if (drill.level === 'stories' && currentCannon) {
    const cards = currentCannon.stories.map((story) => ({
      id: story.storyId,
      title: story.title,
      icon: BookOpen,
      isActive: story.storyId === initial.story?.storyId,
      onClick: () => setDrill({ level: 'documents', cannon: currentCannon, story }),
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
          variant: 'destructive' as const,
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
        subtitle='stories'
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
  }

  if (drill.level === 'documents' && currentCannon && currentStory) {
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
          variant: 'destructive' as const,
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
  }

  return <SidebarEmptyState message='No content yet — add a cannon to begin.' />;
};

interface CardData {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  menu: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }[];
}

const CardStack = ({ cards, keyId }: { cards: CardData[]; keyId?: string }) => {
  if (cards.length === 0) {
    return <SidebarEmptyState message='Nothing here yet.' />;
  }
  return (
    <div className='editor-scroll h-full overflow-y-auto overflow-x-hidden pr-2 pb-4'>
      <AnimatePresence mode='wait'>
        <motion.div
          key={keyId ?? 'stack'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className='flex flex-col gap-2.5'
        >
          {cards.map((card) => (
            <StackedCard key={card.id} card={card} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const StackedCard = ({ card }: { card: CardData }) => {
  const Icon = card.icon;
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ y: 0, scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('group relative rounded-2xl', card.isActive ? 'embossed' : 'embossed-lg')}
    >
      <button
        type='button'
        onClick={card.onClick}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-2xl',
          'cursor-pointer text-left',
          card.isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span
          className={cn(
            'shrink-0 size-7 rounded-full flex items-center justify-center',
            card.isActive ? 'embossed-lg' : 'embossed-sm',
          )}
        >
          <Icon className='size-3.5' />
        </span>
        <span
          className={cn('flex-1 truncate text-[13px]', card.isActive ? 'font-bold' : 'font-medium')}
        >
          {card.title}
        </span>
      </button>
      <div className='absolute right-2 top-1/2 -translate-y-1/2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              aria-label={`Actions for ${card.title}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'size-7 rounded-full flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
                'text-muted-foreground hover:text-foreground bg-background/60',
              )}
            >
              <EllipsisVertical className='size-3.5' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {card.menu.map((item) => (
              <DropdownMenuItem
                key={item.label}
                variant={item.variant ?? 'default'}
                onClick={item.onClick}
              >
                <item.icon className='size-4' />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

const SidebarPanel = ({
  header,
  subtitle,
  onAdd,
  addLabel,
  onBack,
  children,
}: {
  header: string;
  subtitle?: string;
  onAdd: () => void;
  addLabel: string;
  onBack?: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className='flex flex-col gap-3 h-full min-h-0'>
      <div className='flex items-center gap-2 px-1'>
        {onBack && (
          <button
            type='button'
            onClick={onBack}
            aria-label='Back'
            className={cn(
              'size-8 flex items-center justify-center',
              'cursor-pointer active:translate-y-px text-foreground',
              'embossed rounded-lg transition-transformrounded-full shrink-0',
              'hover:bg-accent/25',
            )}
          >
            <ChevronLeft className='size-4' />
          </button>
        )}
        <div className='flex-1 min-w-0'>
          <h3 className='text-[14px] font-bold text-foreground truncate'>{header}</h3>
          {subtitle && (
            <span className='text-[10px] text-muted-foreground uppercase tracking-wide'>
              {subtitle}
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={onAdd}
          aria-label={addLabel}
          title={addLabel}
          className={cn(
            'size-8 flex items-center justify-center',
            'cursor-pointer active:translate-y-px text-foreground',
            'rounded-full shrink-0 transition-transform embossed-lg hover:bg-accent/25',
          )}
        >
          <Plus className='size-4' />
        </button>
      </div>
      <div className='flex-1 min-h-0'>{children}</div>
    </div>
  );
};

const SidebarEmptyState = ({ message }: { message: string }) => (
  <div className='px-2 py-8 text-center'>
    <p className='text-xs text-muted-foreground'>{message}</p>
  </div>
);
