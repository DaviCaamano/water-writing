'use client';

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { UserMenu } from '~components/home/user/UserMenu';
import { AuthDialog } from '~components/home/login/AuthDialog';
import { SettingsModal } from '~components/home/user/user-settings/SettingsModal';
import { EditorSettingsPopover } from '~components/home/editor/EditorSettingsPopover';
import { NavButton } from '~components/home/NavButton';
import { useToggleSettings } from '~components/home/user/user-settings/useToggleSettings';
import { useNavigationStore } from '~store/useNavigationStore';
import { cn } from '~utils/merge-css-classes';

function getDepth(pathname: string): number {
  if (pathname.startsWith('/editor')) return 3;
  if (pathname.startsWith('/story')) return 2;
  if (pathname.startsWith('/world')) return 1;
  return 0;
}

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const { handleOpenSettings, settingsOpen, setSettingsOpen, settingsSection } =
    useToggleSettings();
  const { navigateUp } = useNavigationStore();
  const pathname = usePathname();

  const currentDepth = getDepth(pathname);
  const prevDepthRef = useRef(currentDepth);
  const directionRef = useRef(1);
  if (prevDepthRef.current !== currentDepth) {
    directionRef.current = currentDepth >= prevDepthRef.current ? 1 : -1;
    prevDepthRef.current = currentDepth;
  }
  const direction = directionRef.current;

  const isEditor = pathname.startsWith('/editor');
  const showBackButton = pathname !== '/';

  return (
    <div className='-home- h-screen overflow-hidden bg-background'>
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
            'absolute left-0 right-0 top-0 z-40',
            'flex items-center justify-between',
            'px-4 py-3',
            'pointer-events-none',
          )}
        >
          <NavButton navigateUp={navigateUp} showBackButton={showBackButton} />
          <UserMenu onOpenAuth={() => setAuthOpen(true)} onOpenSettings={handleOpenSettings} />
        </div>
        {isEditor && <EditorSettingsPopover />}
        <div className='-home-view- relative h-full'>
          <AnimatePresence mode='sync'>
            <motion.div
              key={pathname}
              className='absolute inset-0 z-10'
              initial={{ opacity: 0.88, scale: 0.985, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                scale: 0.58,
                x: direction > 0 ? 220 : -220,
                y: -140,
                filter: 'blur(12px)',
                transition: { duration: 0.48, ease: [0.32, 0.72, 0, 1] },
              }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          initialSection={settingsSection}
        />
      </div>
    </div>
  );
}
