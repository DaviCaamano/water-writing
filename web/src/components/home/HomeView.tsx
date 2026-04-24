import { motion } from 'framer-motion';
import type { ViewMode } from '~types/story';
import { Editor } from '~components/home/Editor';
import { StoryView } from '~components/home/StoryView';
import { WorldView } from '~components/home/WorldView';
import { LegacyView } from '~components/home/LegacyView';
import { useEffect, useRef, useState } from 'react';

const VIEW_DEPTH: Record<ViewMode, number> = {
  legacy: 0,
  'world-view': 1,
  'story-view': 2,
  editor: 3,
};

export interface HomeViewProps {
  currentView: ViewMode;
}
export const HomeView = ({ currentView }: HomeViewProps) => {
  const [transitioningView, setTransitioningView] = useState<{
    view: ViewMode;
    direction: number;
    key: number;
  } | null>(null);
  const previousViewRef = useRef<ViewMode>('editor');

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

  const activeView = renderView(currentView);
  return (
    <div className="-home-view- relative h-full overflow-hidden">
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
  );
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
