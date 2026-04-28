'use client';

import { useEffect, useState } from 'react';
import { useNavigationStore } from '~store/useNavigationStore';
import { useEditorStore } from '~store/useEditorStore';
import { useDocumentQuery } from '~lib/queries/story';
import { UserMenu } from '~components/home/UserMenu';
import { AuthDialog } from '~components/home/login/AuthDialog';
import { SettingsModal } from '~components/home/SettingsModal';
import { EditorSettingsPopover } from '~components/home/editor/EditorSettingsPopover';
import { NavButton } from '~components/home/NavButton';
import { HomeView } from '~components/home/HomeView';
import { useToggleSettings } from '~hooks/components/home/useToggleSettings';
import { cn } from '~utils/merge-css-classes';

export default function Home() {
    const [authOpen, setAuthOpen] = useState(false);
    const { handleOpenSettings, settingsOpen, setSettingsOpen, settingsSection } =
        useToggleSettings();

    const { documentId: editorDocumentId, loadDocument } = useEditorStore();
    const { currentView, currentDocumentId, navigateUp } = useNavigationStore();
    const shouldFetchDocument =
        currentView === 'editor' &&
        currentDocumentId !== null &&
        currentDocumentId !== editorDocumentId;
    const { data: documentData } = useDocumentQuery(shouldFetchDocument ? currentDocumentId : null);

    // Sync editor context state to currently selected document
    useEffect(() => {
        if (!documentData || editorDocumentId === documentData.documentId) return;
        loadDocument(documentData);
    }, [documentData, editorDocumentId, loadDocument]);

    return (
        <div
            className='-home- h-screen overflow-hidden bg-temp'
        >
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
                        ' pointer-events-none',
                    )}
                >
                    <NavButton navigateUp={navigateUp} showBackButton={currentView !== 'legacy'} />
                    <UserMenu
                        onOpenAuth={() => setAuthOpen(true)}
                        onOpenSettings={handleOpenSettings}
                    />
                </div>
                {currentView === 'editor' && <EditorSettingsPopover />}
                <HomeView currentView={currentView} />
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
