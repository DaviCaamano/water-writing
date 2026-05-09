import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ViewMode } from '~types/story';
import { assertNever } from '~utils/assert-never';
import { useNavigationStore } from '~store/useNavigationStore';
import { StoryView } from '~components/home/views/StoryView';
import { WorldView } from '~components/home/views/WorldView';
import { LegacyView } from '~components/home/views/LegacyView';

const DynamicEditor = dynamic(() => import('~components/home/views/Editor').then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className='h-full' />,
});

const VIEW_DEPTH: Record<ViewMode, number> = {
  legacy: 0,
  'cannon-view': 1,
  'story-view': 2,
  editor: 3,
};

export interface HomeViewProps {
  currentView: ViewMode;
}

export const HomeView = ({ currentView }: HomeViewProps) => {
  const { currentDocumentId } = useNavigationStore();
  const [transitioningView, setTransitioningView] = useState<{
    view: ViewMode;
    direction: number;
    key: number;
  } | null>(null);
  const previousViewRef = useRef<ViewMode>(ViewMode.editor);

  useEffect(() => {
    if (previousViewRef.current === currentView) {
      return;
    }

    const previousView = previousViewRef.current;

    setTransitioningView({
      view: previousView,
      direction: VIEW_DEPTH[currentView] > VIEW_DEPTH[previousView] ? 1 : -1,
      key: Date.now(),
    });
    previousViewRef.current = currentView;
  }, [currentView]);

  const activeView = renderView(currentView, currentDocumentId);
  return (
    <div className='-home-view- relative h-full'>
      <motion.div
        key={currentView}
        className='absolute inset-0 z-10'
        initial={{ opacity: 0.88, scale: 0.985, filter: 'blur(6px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeView}
      </motion.div>

      {transitioningView && (
        <motion.div
          key={transitioningView.key}
          className='absolute inset-0 z-20'
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
          {renderView(transitioningView.view, currentDocumentId)}
        </motion.div>
      )}
    </div>
  );
};

const renderView = (view: ViewMode, currentDocumentId: string | null) => {
  switch (view) {
    case ViewMode.editor:
      return <DynamicEditor key={currentDocumentId ?? 'no-doc'} />;
    case ViewMode.storyView:
      return <StoryView />;
    case ViewMode.cannonView:
      return <WorldView />;
    case ViewMode.legacy:
      return <LegacyView />;
    default:
      return assertNever(view);
  }
};
