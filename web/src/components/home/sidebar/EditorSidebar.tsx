'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  settingsRaisedStyle,
  settingsTrackStyle,
  settingsInsetStyle,
} from '~components/home/user/user-settings/index';
import { Plus, EllipsisVertical, PencilLine, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~components/ui/dropdown-menu';
import { CannonResponse, StoryResponse, DocumentResponse } from '#types/shared/response';
import { RiverPath } from '~components/home/sidebar/RiverPath';

const SIDEBAR_WIDTH = 320;

type SidebarMode = 'documents' | 'cannons';

export const EditorSidebar = () => {
  const [mode, setMode] = useState<SidebarMode>('documents');
  const params = useParams<{ documentId?: string }>();
  const documentId = params.documentId ?? null;

  return (
    <aside
      className={cn(
        '-editor-sidebar-',
        'h-full flex flex-col gap-4 p-4',
        'bg-background',
      )}
      style={{ width: SIDEBAR_WIDTH }}
    >
      <ModeToggle mode={mode} onChange={setMode} />
      <div className='flex-1 overflow-y-auto overflow-x-hidden relative'>
        {mode === 'documents' ? (
          <DocumentsView documentId={documentId} />
        ) : (
          <CannonsView documentId={documentId} />
        )}
      </div>
    </aside>
  );
};

const ModeToggle = ({
  mode,
  onChange,
}: {
  mode: SidebarMode;
  onChange: (mode: SidebarMode) => void;
}) => {
  return (
    <div className={cn('flex p-1.5 rounded-full', settingsTrackStyle)}>
      {(['documents', 'cannons'] as SidebarMode[]).map((m) => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            type='button'
            onClick={() => onChange(m)}
            className={cn(
              'flex-1 rounded-full px-3 py-1.5 text-[12px] cursor-pointer',
              'transition-all duration-200 capitalize',
              isActive
                ? cn('text-foreground font-bold', settingsRaisedStyle)
                : 'bg-transparent text-muted-foreground font-medium',
            )}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
};

const DocumentsView = ({ documentId }: { documentId: string | null }) => {
  const { data: currentDocument } = useDocumentQuery(documentId);
  const { legacy } = useUserStore();
  const upsertDocument = useUpsertDocumentMutation();
  const deleteDocument = useDeleteDocumentMutation();
  const router = useRouter();

  const story = useMemo(() => {
    if (!currentDocument) return null;
    for (const cannon of legacy) {
      const found = cannon.stories.find((s) => s.storyId === currentDocument.storyId);
      if (found) return found;
    }
    return null;
  }, [legacy, currentDocument]);

  const handleAdd = () => {
    if (!story) return;
    upsertDocument.mutate({
      storyId: story.storyId,
      title: generateUntitledName(
        'Untitled',
        story.documents.map((d) => d.title),
      ),
      body: '',
    });
  };

  const handleRename = (doc: DocumentResponse) => {
    const next = promptForTitle('document', doc.title);
    if (!next) return;
    upsertDocument.mutate({ documentId: doc.documentId, title: next });
  };

  const handleDelete = (doc: DocumentResponse) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    deleteDocument.mutate(doc.documentId);
  };

  if (!story) {
    return (
      <SidebarEmptyState message='Select a document to see related documents.' />
    );
  }

  return (
    <SidebarList
      header={story.title}
      headerSubtitle='documents in this story'
      onAdd={handleAdd}
      addLabel='New document'
    >
      <RiverColumn
        nodes={story.documents.map((doc) => ({
          id: doc.documentId,
          label: doc.title,
          isActive: doc.documentId === documentId,
          onClick: () => router.push(`/d/${doc.documentId}`),
          menu: [
            { label: 'Rename', icon: PencilLine, onClick: () => handleRename(doc) },
            { label: 'Delete', icon: Trash2, onClick: () => handleDelete(doc), variant: 'destructive' },
          ],
        }))}
      />
    </SidebarList>
  );
};

const CannonsView = ({ documentId }: { documentId: string | null }) => {
  const { legacy } = useUserStore();
  const { data: currentDocument } = useDocumentQuery(documentId);
  const router = useRouter();
  const [expandedCannons, setExpandedCannons] = useState<Set<string>>(() => new Set());
  const [expandedStories, setExpandedStories] = useState<Set<string>>(() => new Set());

  const upsertCannon = useUpsertCannonMutation();
  const deleteCannon = useDeleteCannonMutation();
  const upsertStory = useUpsertStoryMutation();
  const deleteStory = useDeleteStoryMutation();
  const upsertDocument = useUpsertDocumentMutation();
  const deleteDocument = useDeleteDocumentMutation();

  // Auto-expand the cannon/story containing the current document
  const activeStoryId = currentDocument?.storyId ?? null;
  const activeCannonId = useMemo(() => {
    if (!activeStoryId) return null;
    for (const cannon of legacy) {
      if (cannon.stories.some((s) => s.storyId === activeStoryId)) return cannon.cannonId;
    }
    return null;
  }, [legacy, activeStoryId]);

  const isCannonOpen = (id: string) => expandedCannons.has(id) || id === activeCannonId;
  const isStoryOpen = (id: string) => expandedStories.has(id) || id === activeStoryId;

  const toggleCannon = (id: string) => {
    setExpandedCannons((prev) => {
      const next = new Set(prev);
      if (next.has(id) || id === activeCannonId) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStory = (id: string) => {
    setExpandedStories((prev) => {
      const next = new Set(prev);
      if (next.has(id) || id === activeStoryId) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCannon = () => {
    upsertCannon.mutate({
      title: generateUntitledName(
        'Untitled Cannon',
        legacy.map((c) => c.title),
      ),
    });
  };

  const handleRenameCannon = (cannon: CannonResponse) => {
    const next = promptForTitle('cannon', cannon.title);
    if (!next) return;
    upsertCannon.mutate({ cannonId: cannon.cannonId, title: next });
  };

  const handleDeleteCannon = (cannon: CannonResponse) => {
    if (!window.confirm(`Delete "${cannon.title}" and all its stories and documents?`)) return;
    deleteCannon.mutate(cannon.cannonId);
  };

  const handleAddStory = (cannon: CannonResponse) => {
    upsertStory.mutate({
      cannonId: cannon.cannonId,
      title: generateUntitledName(
        'Untitled Story',
        cannon.stories.map((s) => s.title),
      ),
    });
  };

  const handleRenameStory = (story: StoryResponse) => {
    const next = promptForTitle('story', story.title);
    if (!next) return;
    upsertStory.mutate({ storyId: story.storyId, title: next });
  };

  const handleDeleteStory = (story: StoryResponse) => {
    if (!window.confirm(`Delete "${story.title}" and all its documents?`)) return;
    deleteStory.mutate(story.storyId);
  };

  const handleAddDocument = (story: StoryResponse) => {
    upsertDocument.mutate({
      storyId: story.storyId,
      title: generateUntitledName(
        'Untitled',
        story.documents.map((d) => d.title),
      ),
      body: '',
    });
  };

  const handleRenameDocument = (doc: DocumentResponse) => {
    const next = promptForTitle('document', doc.title);
    if (!next) return;
    upsertDocument.mutate({ documentId: doc.documentId, title: next });
  };

  const handleDeleteDocument = (doc: DocumentResponse) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    deleteDocument.mutate(doc.documentId);
  };

  return (
    <SidebarList header='All cannons' onAdd={handleAddCannon} addLabel='New cannon'>
      <div className='relative'>
        <RiverPath />
        <div className='relative flex flex-col gap-1.5 pl-7'>
          {legacy.map((cannon) => {
            const open = isCannonOpen(cannon.cannonId);
            return (
              <div key={cannon.cannonId} className='flex flex-col gap-1'>
                <SidebarRow
                  label={cannon.title}
                  level={0}
                  isActive={cannon.cannonId === activeCannonId}
                  expanded={open}
                  onClick={() => toggleCannon(cannon.cannonId)}
                  menu={[
                    { label: 'New story', icon: Plus, onClick: () => handleAddStory(cannon) },
                    { label: 'Rename', icon: PencilLine, onClick: () => handleRenameCannon(cannon) },
                    {
                      label: 'Delete',
                      icon: Trash2,
                      onClick: () => handleDeleteCannon(cannon),
                      variant: 'destructive',
                    },
                  ]}
                />
                {open &&
                  cannon.stories.map((story) => {
                    const sOpen = isStoryOpen(story.storyId);
                    return (
                      <div key={story.storyId} className='flex flex-col gap-1 pl-3'>
                        <SidebarRow
                          label={story.title}
                          level={1}
                          isActive={story.storyId === activeStoryId}
                          expanded={sOpen}
                          onClick={() => toggleStory(story.storyId)}
                          menu={[
                            {
                              label: 'New document',
                              icon: Plus,
                              onClick: () => handleAddDocument(story),
                            },
                            {
                              label: 'Rename',
                              icon: PencilLine,
                              onClick: () => handleRenameStory(story),
                            },
                            {
                              label: 'Delete',
                              icon: Trash2,
                              onClick: () => handleDeleteStory(story),
                              variant: 'destructive',
                            },
                          ]}
                        />
                        {sOpen &&
                          story.documents.map((doc) => (
                            <div key={doc.documentId} className='pl-3'>
                              <SidebarRow
                                label={doc.title}
                                level={2}
                                isActive={doc.documentId === documentId}
                                onClick={() => router.push(`/d/${doc.documentId}`)}
                                menu={[
                                  {
                                    label: 'Rename',
                                    icon: PencilLine,
                                    onClick: () => handleRenameDocument(doc),
                                  },
                                  {
                                    label: 'Delete',
                                    icon: Trash2,
                                    onClick: () => handleDeleteDocument(doc),
                                    variant: 'destructive',
                                  },
                                ]}
                              />
                            </div>
                          ))}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </SidebarList>
  );
};

const SidebarList = ({
  header,
  headerSubtitle,
  onAdd,
  addLabel,
  children,
}: {
  header: string;
  headerSubtitle?: string;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) => {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-2 px-2'>
        <div className='flex flex-col min-w-0'>
          <h3 className='text-[14px] font-bold text-foreground truncate'>{header}</h3>
          {headerSubtitle && (
            <span className='text-[10px] text-muted-foreground uppercase tracking-wide'>
              {headerSubtitle}
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={onAdd}
          aria-label={addLabel}
          title={addLabel}
          className={cn(
            'size-8 rounded-full shrink-0 flex items-center justify-center',
            'cursor-pointer transition-transform active:translate-y-px text-foreground',
            settingsRaisedStyle,
          )}
        >
          <Plus className='size-4' />
        </button>
      </div>
      {children}
    </div>
  );
};

const RiverColumn = ({
  nodes,
}: {
  nodes: {
    id: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    menu: MenuItem[];
  }[];
}) => {
  return (
    <div className='relative'>
      <RiverPath />
      <div className='relative flex flex-col gap-1.5 pl-7'>
        {nodes.map((node) => (
          <SidebarRow
            key={node.id}
            label={node.label}
            level={0}
            isActive={node.isActive}
            onClick={node.onClick}
            menu={node.menu}
          />
        ))}
      </div>
    </div>
  );
};

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

const SidebarRow = ({
  label,
  level,
  isActive,
  expanded,
  onClick,
  menu,
}: {
  label: string;
  level: 0 | 1 | 2;
  isActive: boolean;
  expanded?: boolean;
  onClick: () => void;
  menu: MenuItem[];
}) => {
  void expanded;
  return (
    <div
      className={cn(
        'group relative flex items-center gap-1 rounded-full pr-1',
        isActive ? settingsInsetStyle : '',
        !isActive && 'hover:bg-muted/30',
      )}
    >
      <button
        type='button'
        onClick={onClick}
        className={cn(
          'flex-1 text-left rounded-full px-3 py-2 text-[13px] truncate cursor-pointer',
          isActive ? 'text-foreground font-semibold' : 'text-muted-foreground',
          level === 0 && 'font-medium',
          level === 1 && 'text-[12px]',
          level === 2 && 'text-[12px]',
        )}
      >
        {label}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            aria-label={`Actions for ${label}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'size-7 rounded-full flex items-center justify-center shrink-0',
              'opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
              'text-muted-foreground hover:text-foreground',
            )}
          >
            <EllipsisVertical className='size-3.5' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {menu.map((item) => (
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
  );
};

const SidebarEmptyState = ({ message }: { message: string }) => (
  <div className='px-2 py-8 text-center'>
    <p className='text-xs text-muted-foreground'>{message}</p>
  </div>
);
