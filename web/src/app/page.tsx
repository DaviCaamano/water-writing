'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleArrowOutUpLeft } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { UserMenu } from '@/components/UserMenu';
import { AuthDialog } from '@/components/AuthDialog';
import { SettingsModal } from '@/components/SettingsModal';
import { Editor } from '@/components/Editor';
import { FontSettings } from '@/components/FontSettings';
import { StoryCanvas } from '@/components/StoryCanvas';
import { WorldCanvas } from '@/components/WorldCanvas';
import { LegacyView } from '@/components/LegacyView';

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
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none">
        {/* Top left: Back navigation */}
        <div className="pointer-events-auto">
          {showBackButton && (
            <button
              onClick={navigateUp}
              className="p-2 rounded-full hover:bg-accent/80 transition-colors"
              aria-label="Navigate up"
            >
              <CircleArrowOutUpLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Top right: User menu */}
        <div className="pointer-events-auto">
          <UserMenu
            onOpenAuth={() => setAuthOpen(true)}
            onOpenSettings={handleOpenSettings}
          />
        </div>
      </div>

      {/* Bottom left: Font settings (editor only) */}
      {currentView === 'editor' && (
        <div className="absolute bottom-4 left-4 z-30">
          <FontSettings />
        </div>
      )}

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
