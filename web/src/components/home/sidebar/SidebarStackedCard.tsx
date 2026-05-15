import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '~utils/merge-css-classes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~components/primitives/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';
import { SidebarEmptyState } from './SideBarEmptyState';
import { ComponentType } from 'react';
import { Variant } from '~types';

interface CardData {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  menu: {
    label: string;
    icon: ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: Variant;
  }[];
}

export const CardStack = ({ cards, keyId }: { cards: CardData[]; keyId?: string }) => {
  if (cards.length === 0) {
    return <SidebarEmptyState message='Nothing here yet.' />;
  }
  return (
    <div className='editor-scroll h-full overflow-y-auto overflow-x-hidden pr-2 pb-4'>
      <AnimatePresence mode='wait'>
        <motion.div
          key={keyId ?? 'stack'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className='flex flex-col gap-2.5'
        >
          {cards.map((card) => (
            <StackedCard key={card.id} card={card} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const StackedCard = ({ card }: { card: CardData }) => {
  const Icon = card.icon;
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ y: 0, scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('group relative rounded-2xl', card.isActive ? 'embossed' : 'embossed-lg')}
    >
      <button
        type='button'
        onClick={card.onClick}
        aria-current={card.isActive ? 'page' : undefined}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-2xl',
          'cursor-pointer text-left',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          card.isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span
          className={cn(
            'shrink-0 size-7 rounded-full flex items-center justify-center',
            card.isActive ? 'embossed-lg' : 'embossed-sm',
          )}
        >
          <Icon className='size-3.5' />
        </span>
        <span
          className={cn('flex-1 truncate text-[13px]', card.isActive ? 'font-bold' : 'font-medium')}
        >
          {card.title}
        </span>
      </button>
      <div className='absolute right-2 top-1/2 -translate-y-1/2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              aria-label={`Actions for ${card.title}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'size-7 rounded-full flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
                'text-muted-foreground hover:text-foreground bg-background/60',
              )}
            >
              <EllipsisVertical className='size-3.5' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {card.menu.map((item) => (
              <DropdownMenuItem
                key={item.label}
                variant={(item.variant as Variant) ?? Variant.default}
                onClick={item.onClick}
              >
                <item.icon className='size-4' />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};
