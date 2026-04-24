'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookImage, Expand, MessageCircleX } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useEditorStore } from '@/store/useEditorStore';
import type { StoryDocument } from '@/types';

const NODE_W = 120;
const NODE_H = 120;
const GAP = 160;

export function StoryCanvas() {
  const { currentStory, selectedDocumentId, selectDocument, navigateToEditor, currentWorldId } =
    useNavigationStore();
  const { loadDocument } = useEditorStore();

  // Build ordered chain from first document (no predecessor) following successors
  const orderedDocs = useMemo(() => {
    if (!currentStory?.documents?.length) return [];
    const docs = currentStory.documents;
    const byId = new Map(docs.map((d) => [d.id, d]));
    const first = docs.find((d) => !d.predecessorId);
    if (!first) return docs;

    const chain: StoryDocument[] = [];
    let current: StoryDocument | undefined = first;
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      chain.push(current);
      current = current.successorId ? byId.get(current.successorId) : undefined;
    }
    return chain;
  }, [currentStory]);

  const handleExpand = (doc: StoryDocument) => {
    loadDocument({ id: doc.id, title: doc.title, body: doc.body, storyId: doc.storyId });
    navigateToEditor(doc.id, doc.storyId, currentWorldId || '');
  };

  const totalWidth = orderedDocs.length * NODE_W + (orderedDocs.length - 1) * GAP;

  return (
    <div className="flex-1 relative overflow-auto bg-muted/30">
      {/* Center title */}
      <div className="absolute top-6 left-0 right-0 text-center">
        <h2 className="text-lg font-semibold text-muted-foreground">
          {currentStory?.name || 'Story Canvas'}
        </h2>
      </div>

      {/* Canvas area */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ minWidth: totalWidth + 200 }}
      >
        {/* SVG lines connecting adjacent docs */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {orderedDocs.map((doc, i) => {
            if (i === 0) return null;
            const x1 = getNodeX(i - 1, orderedDocs.length) + NODE_W;
            const x2 = getNodeX(i, orderedDocs.length);
            const cy = 0; // centered vertically via transform
            return (
              <line
                key={`line-${doc.id}`}
                x1={`calc(50% + ${x1 - totalWidth / 2}px)`}
                y1="50%"
                x2={`calc(50% + ${x2 - totalWidth / 2}px)`}
                y2="50%"
                className="stroke-border"
                strokeWidth={2}
              />
            );
          })}
        </svg>

        {/* Document nodes */}
        {orderedDocs.map((doc, i) => {
          const isSelected = selectedDocumentId === doc.id;
          const offsetX = getNodeX(i, orderedDocs.length) - totalWidth / 2;

          return (
            <motion.div
              key={doc.id}
              className="absolute flex flex-col items-center cursor-pointer group"
              style={{
                left: `calc(50% + ${offsetX}px)`,
                top: '50%',
                transform: 'translateY(-50%)',
                width: NODE_W,
              }}
              animate={{ scale: isSelected ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => selectDocument(isSelected ? null : doc.id)}
            >
              <div className="relative">
                <BookImage className="w-14 h-14 text-primary" />

                {/* Expand icon on hover when selected */}
                {isSelected && (
                  <button
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-75 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExpand(doc);
                    }}
                  >
                    <Expand className="w-8 h-8 text-primary" />
                  </button>
                )}

                {/* Close button when selected */}
                {isSelected && (
                  <button
                    className="absolute -top-2 -right-2 p-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectDocument(null);
                    }}
                  >
                    <MessageCircleX className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              <span className="text-xs mt-2 text-center truncate w-full">{doc.title}</span>

              {/* Characters to the right */}
              {isSelected && doc.characters?.length > 0 && (
                <motion.div
                  className="absolute left-full ml-4 top-0 space-y-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {doc.characters.map((c) => (
                    <div key={c.id} className="text-xs bg-card border rounded px-2 py-1 whitespace-nowrap">
                      {c.name}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Places to the left */}
              {isSelected && doc.places?.length > 0 && (
                <motion.div
                  className="absolute right-full mr-4 top-0 space-y-1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {doc.places.map((p) => (
                    <div key={p.id} className="text-xs bg-card border rounded px-2 py-1 whitespace-nowrap">
                      {p.name}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {orderedDocs.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No documents in this story
        </div>
      )}
    </div>
  );
}

function getNodeX(index: number, total: number): number {
  return index * (NODE_W + GAP);
}
