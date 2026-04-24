'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useEditorStore } from '@/store/useEditorStore';
import { UserMenu } from '@/components/home/UserMenu';
import { AuthDialog } from '@/components/home/AuthDialog';
import { SettingsModal } from '@/components/home/SettingsModal';
import { EditorSettings } from '@/components/home/EditorSettings';
import { NavButton } from '@/components/home/NavButton';
import { HomeView } from '@/components/home/HomeView';

type SettingsSection = 'general' | 'subscription' | 'billing';

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('general');

  const { refreshSession } = useUserStore();
  const { documentId: editorDocumentId, loadDocument } = useEditorStore();
  const { currentView, currentStory, currentDocumentId, navigateUp } = useNavigationStore();

  useEffect(() => void refreshSession(), [refreshSession]);

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

  return (
    <div className="-home- h-screen overflow-hidden bg-slate-950">
      <div className="-home-nav- absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3 pointer-events-none">
        <NavButton navigateUp={navigateUp} showBackButton={currentView !== 'legacy'} />
        <UserMenu onOpenAuth={() => setAuthOpen(true)} onOpenSettings={handleOpenSettings} />
      </div>
      {currentView === 'editor' && <EditorSettings />}
      <HomeView currentView={currentView} />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialSection={settingsSection}
      />
    </div>
  );
}
