import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '~utils/merge-css-classes';
import { Button } from '~components/primitives/button';
import { KeyLabel } from '~types';
import { useKeyDown } from '~hooks/useKeyDown';
import { SidebarContent } from '~components/home/sidebar/SidebarContent';

const DRAWER_WIDTH = 340;

export const EditorSidebar = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const params = useParams<{ documentId?: string }>();
  const documentId = params.documentId ?? null;

  // Close on Escape
  useKeyDown({ key: KeyLabel.escape, handler: () => onOpenChange(false) });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key='backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className='fixed inset-0 foreground/10 backdrop-blur-[2px] z-40'
          />
          <motion.aside
            key='drawer'
            role='dialog'
            aria-modal='true'
            aria-label='Document navigation'
            initial={{ x: -DRAWER_WIDTH - 20 }}
            animate={{ x: 0 }}
            exit={{ x: -DRAWER_WIDTH - 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={cn(
              '-editor-sidebar-',
              'fixed left-0 top-0 bottom-0 z-50',
              'h-full flex flex-col gap-3 p-4',
              'bg-background border-r border-border',
              'shadow-2xl shadow-shadow/20',
            )}
            style={{ width: DRAWER_WIDTH }}
          >
            <CloseButton onOpenChange={onOpenChange} />
            <div className='flex-1 min-h-0 overflow-hidden'>
              <SidebarContent documentId={documentId} onPickDocument={() => onOpenChange(false)} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

const CloseButton = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => (
  <div className='flex items-center justify-end'>
    <Button
      variant='default'
      size='icon'
      onClick={() => onOpenChange(false)}
      aria-label='Close sidebar'
      className='mr-0.5'
    >
      <X className='size-4' />
    </Button>
  </div>
);
