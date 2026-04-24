'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookText } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';

export function WorldCanvas() {
  const { currentWorld, navigateToStory } = useNavigationStore();
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const stories = currentWorld?.stories || [];

  return (
    <div className="flex-1 relative overflow-auto bg-muted/30">
      {/* Title */}
      <div className="absolute top-6 left-0 right-0 text-center">
        <h2 className="text-lg font-semibold text-muted-foreground">
          {currentWorld?.name || 'World Canvas'}
        </h2>
      </div>

      {/* Stories grid */}
      <div className="flex items-center justify-center min-h-full">
        <div className="flex flex-wrap justify-center gap-12 p-16 max-w-4xl">
          {stories.map((story) => {
            const isSelected = selectedStoryId === story.id;

            return (
              <motion.div
                key={story.id}
                className="flex flex-col items-center cursor-pointer"
                whileHover={{ scale: 1.05 }}
                animate={{ scale: isSelected ? 1.1 : 1 }}
                onClick={() => setSelectedStoryId(isSelected ? null : story.id)}
                onDoubleClick={() =>
                  navigateToStory(story.id, currentWorld?.id || '')
                }
              >
                <div className="relative">
                  <BookText className="w-16 h-16 text-primary" />
                </div>
                <span className="text-sm mt-2 font-medium text-center max-w-[120px] truncate">
                  {story.name}
                </span>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-xs text-muted-foreground text-center space-y-1"
                    >
                      <p>
                        {story.documentCount || story.documents?.length || 0} document
                        {(story.documentCount || story.documents?.length || 0) !== 1 ? 's' : ''}
                      </p>
                      <button
                        className="text-primary underline underline-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToStory(story.id, currentWorld?.id || '');
                        }}
                      >
                        Open Story
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {stories.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No stories in this world
        </div>
      )}
    </div>
  );
}
