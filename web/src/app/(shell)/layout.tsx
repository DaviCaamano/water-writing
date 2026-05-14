'use client';

import { useState } from 'react';
import { UserMenu } from '~components/home/user/UserMenu';
import { AuthDialog } from '~components/home/login/AuthDialog';
import { SettingsModal } from '~components/home/user/user-settings/SettingsModal';
import { EditorSettingsPopover } from '~components/home/editor/EditorSettingsPopover';
import { EditorSidebar } from '~components/home/sidebar/EditorSidebar';
import { useToggleSettings } from '~components/home/user/user-settings/useToggleSettings';
import { WaterDropTransition } from '~components/visual-effects/WaterDropTransition';
import { PageTransitionProvider } from '~context/PageTransitionContext';
import { cn } from '~utils/merge-css-classes';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransitionProvider>
      <ShellContent>{children}</ShellContent>
    </PageTransitionProvider>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const { handleOpenSettings, settingsOpen, setSettingsOpen, settingsSection } =
    useToggleSettings();

  return (
    <div className='-home- h-screen overflow-hidden bg-background flex'>
      <EditorSidebar />
      <div className='flex-1 relative overflow-hidden'>
        <div
          className={cn(
            '-home-view-content-',
            'h-full w-full max-w-full mx-auto',
            'sm:max-w-screen-sm md:max-w-3xl lg:max-w-5xl xl:max-w-300 2xl:max-w-350',
            'px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 2xl:px-10',
          )}
        >
          <div
            className={cn(
              '-home-nav-',
              'absolute right-0 top-0 z-40',
              'flex items-center justify-end',
              'px-4 py-3',
              'pointer-events-none',
            )}
          >
            <UserMenu onOpenAuth={() => setAuthOpen(true)} onOpenSettings={handleOpenSettings} />
          </div>
          <EditorSettingsPopover />
          <div className='-home-view- relative h-full'>{children}</div>
          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
          <SettingsModal
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            initialSection={settingsSection}
          />
        </div>
      </div>
      <WaterDropTransition />
    </div>
  );
}
