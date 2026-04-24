'use client';

import { motion } from 'framer-motion';
import { LibraryBig } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';

export function LegacyView() {
  const { worlds, navigateToWorld } = useNavigationStore();

  return (
    <div className="flex-1 overflow-auto bg-muted/30">
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-8 text-center">Your Legacy</h2>

        <div
          className="grid gap-y-10 gap-x-4 justify-items-center mx-auto"
          style={{
            gridTemplateColumns: 'repeat(5, 1fr)',
            maxWidth: '1000px',
          }}
        >
          {worlds.map((world) => (
            <motion.button
              key={world.id}
              className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-accent/50 transition-colors w-full max-w-[180px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigateToWorld(world.id)}
            >
              <LibraryBig className="w-16 h-16 text-primary" />
              <span className="text-sm font-medium text-center w-full truncate">
                {world.name}
              </span>
            </motion.button>
          ))}
        </div>

        {worlds.length === 0 && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No worlds yet. Start writing to create your first world.
          </div>
        )}
      </div>
    </div>
  );
}
