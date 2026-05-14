'use client';

import { useState } from 'react';
import { Dialog, DialogPortal, DialogOverlay } from '~components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { SettingsSection } from '~types/components/settings-modal';
import { cn } from '~utils/merge-css-classes';
import { useColors } from '~hooks/useColors';
import { GeneralSection } from '~components/home/user/user-settings/GeneralSection';
import { BillingSection } from '~components/home/user/user-settings/BillingSection';
import { SubscriptionSection } from '~components/home/user/user-settings/SubscriptionSection';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: SettingsSection;
}

export const SettingsModal = ({
  open,
  onOpenChange,
  initialSection = SettingsSection.general,
}: SettingsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} className='-settings-dialog-'>
      {open ? (
        <SettingsModalContent
          key={initialSection}
          initialSection={initialSection}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
};

const SettingsModalContent = ({
  initialSection,
  onClose,
}: {
  initialSection: SettingsSection;
  onClose: () => void;
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const sections: { key: SettingsSection; label: string }[] = [
    { key: SettingsSection.general, label: 'General' },
    { key: SettingsSection.plan, label: 'Plan' },
    { key: SettingsSection.billing, label: 'Billing' },
  ];

  const { colors } = useColors();
  const colorMap = {
    default: colors.foreground,
    destructive: colors.destructive,
    ghost: colors.muted,
  };

  return (
    <DialogPortal>
      <DialogOverlay className='-settings-modal-overlay-' />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          '-settings-modal- fixed left-1/2 top-1/2 z-50',
          '-translate-x-1/2 -translate-y-1/2 outline-none',
          'bg-background rounded-kg shadow-2xl border-border border',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=open]:zoom-in-95 data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        )}
      >
        <div
          className={cn(
            'w-[min(900px,92vw)] h-[80vh]',
            'rounded-kg p-8 flex gap-7 relative text-foreground',
          )}
        >
          {/* Close */}
          <button
            type='button'
            onClick={onClose}
            className={cn(
              'absolute top-5 right-5 size-9 rounded-full',
              'flex items-center justify-center',
              'cursor-pointer transition-transform active:translate-y-px',
              'text-muted embossed-lg',
            )}
            aria-label='Close'
          >
            <X className='size-4' />
          </button>

          {/* Sidebar nav - pill rail */}
          <nav className='w-48 shrink-0 flex flex-col gap-3 pt-1'>
            <DialogPrimitive.Title asChild>
              <h2 className='text-[22px] text-foreground font-bold tracking-tight pl-2 pb-2'>
                Settings
              </h2>
            </DialogPrimitive.Title>

            <div className={'flex flex-col gap-2 p-1.5 rounded-4xl embossed-sm'}>
              {sections.map((s) => {
                const isActive = activeSection === s.key;
                return (
                  <button
                    key={s.key}
                    type='button'
                    onClick={() => setActiveSection(s.key)}
                    className={cn(
                      'text-left rounded-full px-4 py-2.5 text-[13px]',
                      'cursor-pointer transition-all duration-200 weight-600',
                      isActive
                        ? 'text-foreground font-bold'
                        : 'bg-transparent text-muted-foreground font-medium',
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content panel - inset surface */}
          <div className='flex-1 rounded-[24px] overflow-y-auto p-7 '>
            {activeSection === SettingsSection.general && <GeneralSection />}
            {activeSection === SettingsSection.plan && <SubscriptionSection colorMap={colorMap} />}
            {activeSection === SettingsSection.billing && <BillingSection />}
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
};
