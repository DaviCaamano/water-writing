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

interface UserMenuProps {
  onOpenAuth: () => void;
  onOpenSettings: (section?: SettingsSection) => void;
}

export function UserMenu({ onOpenAuth, onOpenSettings }: UserMenuProps) {
  const { isLoggedIn, plan, logout } = useUserStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="-home-user-menu- pointer-events-auto">
        <button
          onClick={onOpenAuth}
          className="p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Sign in"
        >
          <Image src="/profile.svg" alt="" width={24} height={24} className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="-home-user-menu- pointer-events-auto">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="User menu"
        >
          <Image src="/profile.svg" alt="" width={24} height={24} className="w-6 h-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
