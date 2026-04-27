'use client';

import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~components/ui/dropdown-menu';
import { useUserStore } from '~store/useUserStore';
import { Plan } from '#types/shared/enum/plan';
import { SettingsSection } from '~types/components/settings-modal';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { cn } from '~utils/merge-css-classes';
import { WaterRippleFade } from '~components/visual-effects/WaterRippleFade';
import { useState } from 'react';
import { useSticky } from '~hooks/useSticky';

interface UserMenuProps {
  onOpenAuth: () => void;
  onOpenSettings: (section?: SettingsSection) => void;
}

export function UserMenu({ onOpenAuth, onOpenSettings }: UserMenuProps) {
  const { isLoggedIn, plan, logout } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useSticky(menuOpen, (stickyOpen) => {
    if (stickyOpen && !isLoggedIn) onOpenAuth();
  });

  const handleLogout = async () => {
    try {
      void logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <div className="-home-user-menu- pointer-events-auto">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <WaterRipple className="rounded-full">
          <DropdownMenuTrigger className="p-2 rounded-full cursor-pointer" aria-label="User menu">
            <Image src="/profile.svg" alt="" width={28} height={28} />
          </DropdownMenuTrigger>
        </WaterRipple>

        <DropdownMenuContent
          className="w-48 !bg-transparent !shadow-none !ring-0 !p-0'"
          align="end"
        >
          <WaterRippleFade
            open={isLoggedIn && menuOpen}
            className={cn(
              'space-y-4 ',
              'bg-popover rounded-lg ',
              'p-2.5 ring-1 ring-accent/50',
              'text-sm text-popover-foreground ',
            )}
          >
            <DropdownMenuItem onClick={() => onOpenSettings(SettingsSection.general)}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>Gallery</DropdownMenuItem>
            {plan !== Plan.max && (
              <DropdownMenuItem onClick={() => onOpenSettings(SettingsSection.plan)}>
                Upgrade
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLogout}>Log Out</DropdownMenuItem>
          </WaterRippleFade>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
