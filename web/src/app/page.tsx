'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/useUserStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useEditorStore } from '@/store/useEditorStore';
import { UserMenu } from '@/components/home/UserMenu';
import { AuthDialog } from '@/components/home/AuthDialog';
import { SettingsModal } from '@/components/home/SettingsModal';
import { Editor } from '@/components/home/Editor';
import { EditorSettings } from '@/components/home/EditorSettings';
import { StoryView } from '@/components/home/StoryView';
import { WorldView } from '@/components/home/WorldView';
import { LegacyView } from '@/components/home/LegacyView';
import { NavButton } from '@/components/home/NavButton';
import type { ViewMode } from '@/types';

type SettingsSection = 'general' | 'subscription' | 'billing';

const VIEW_DEPTH: Record<ViewMode, number> = {
  legacy: 0,
  'world-view': 1,
  'story-view': 2,
  editor: 3,
};

function renderView(view: ViewMode) {
  switch (view) {
    case 'editor':
      return <Editor />;
    case 'story-view':
      return <StoryView />;
    case 'world-view':
      return <WorldView />;
    case 'legacy':
      return <LegacyView />;
    default:
      return null;
  }
}

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('general');
  const [transitioningView, setTransitioningView] = useState<{
    view: ViewMode;
    direction: number;
    key: number;
  } | null>(null);

  const previousViewRef = useRef<ViewMode>('editor');

  const { refreshSession } = useUserStore();
  const { documentId: editorDocumentId, loadDocument } = useEditorStore();
  const { currentView, currentStory, currentDocumentId, navigateUp } = useNavigationStore();

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (previousViewRef.current === currentView) {
      return;
    }

    const previousView = previousViewRef.current;
    const nextView = currentView;

    setTransitioningView({
      view: previousView,
      direction: VIEW_DEPTH[nextView] > VIEW_DEPTH[previousView] ? 1 : -1,
      key: Date.now(),
    });
    previousViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    if (currentView !== 'editor' || !currentStory || !currentDocumentId) {
      return;
    }

    const document = currentStory.documents.find((entry) => entry.id === currentDocumentId);
    if (!document || editorDocumentId === document.id) {
      return;
    }

    loadDocument({
      id: document.id,
      title: document.title,
      body: document.body,
      storyId: document.storyId,
    });
  }, [currentDocumentId, currentStory, currentView, editorDocumentId, loadDocument]);

  const handleOpenSettings = (section: SettingsSection = 'general') => {
    setSettingsSection(section);
    setSettingsOpen(true);
  };

  const showBackButton = currentView !== 'legacy';
  const activeView = renderView(currentView);

  return (
    <div className="h-screen overflow-hidden bg-slate-950">
      <div className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3 pointer-events-none">
        <NavButton navigateUp={navigateUp} showBackButton={showBackButton} />
        <UserMenu onOpenAuth={() => setAuthOpen(true)} onOpenSettings={handleOpenSettings} />
      </div>

      {currentView === 'editor' && <EditorSettings />}

      <div className="relative h-full overflow-hidden">
        <motion.div
          key={currentView}
          className="absolute inset-0 z-10"
          initial={{ opacity: 0.88, scale: 0.985, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeView}
        </motion.div>

        {transitioningView && (
          <motion.div
            key={transitioningView.key}
            className="absolute inset-0 z-20"
            initial={{ opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)' }}
            animate={{
              opacity: 0,
              scale: 0.58,
              x: transitioningView.direction > 0 ? 220 : -220,
              y: -140,
              filter: 'blur(12px)',
            }}
            transition={{ duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
            onAnimationComplete={() =>
              setTransitioningView((current) =>
                current?.key === transitioningView.key ? null : current,
              )
            }
          >
            {renderView(transitioningView.view)}
          </motion.div>
        )}
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialSection={settingsSection}
      />
    </div>
  );
}
