'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/useUserStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { UserMenu } from '@/components/home/UserMenu';
import { AuthDialog } from '@/components/home/AuthDialog';
import { SettingsModal } from '@/components/home/SettingsModal';
import { Editor } from '@/components/home/Editor';
import { EditorSettings } from '@/components/home/EditorSettings';
import { StoryCanvas } from '@/components/home/StoryCanvas';
import { WorldCanvas } from '@/components/home/WorldCanvas';
import { LegacyView } from '@/components/home/LegacyView';
import { NavButton } from '@/components/home/NavButton';

type SettingsSection = 'general' | 'subscription' | 'billing';

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('general');

  const { refreshSession } = useUserStore();
  const { currentView, navigateUp } = useNavigationStore();

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleOpenSettings = (section: SettingsSection = 'general') => {
    setSettingsSection(section);
    setSettingsOpen(true);
  };

  const showBackButton = currentView !== 'legacy';

  return (
    <div className="-home- h-screen flex flex-col relative overflow-hidden">
      <div className="-home-header-button-framer- absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none">
        {/* Top left navigation button */}
        <NavButton navigateUp={navigateUp} showBackButton={showBackButton} />
        {/* Top right user menu */}
        <UserMenu onOpenAuth={() => setAuthOpen(true)} onOpenSettings={handleOpenSettings} />
      </div>

      {/* Bottom left theme selector and editor options  */}
      {currentView === 'editor' && <EditorSettings />}

      {/* Main content area */}
      <AnimatePresence mode="wait">
        {currentView === 'editor' && (
          <motion.div
            key="editor"
            className="flex-1 flex"
            initial={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.05, opacity: 0, borderRadius: '50%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Editor />
          </motion.div>
        )}

        {currentView === 'story-canvas' && (
          <motion.div
            key="story-canvas"
            className="flex-1 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StoryCanvas />
          </motion.div>
        )}

        {currentView === 'world-canvas' && (
          <motion.div
            key="world-canvas"
            className="flex-1 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WorldCanvas />
          </motion.div>
        )}

        {currentView === 'legacy' && (
          <motion.div
            key="legacy"
            className="flex-1 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LegacyView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialSection={settingsSection}
      />
    </div>
  );
}
