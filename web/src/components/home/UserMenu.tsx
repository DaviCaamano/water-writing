'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserStore } from '@/store/useUserStore';

interface UserMenuProps {
  onOpenAuth: () => void;
  onOpenSettings: (section?: 'general' | 'subscription' | 'billing') => void;
}

export function UserMenu({ onOpenAuth, onOpenSettings }: UserMenuProps) {
  const { isLoggedIn, subscription, logout } = useUserStore();

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
          <img src="/profile.svg" className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="p-2 rounded-full hover:bg-accent transition-colors"
        aria-label="User menu"
      >
        <img src="/profile.svg" className="w-6 h-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onOpenSettings('general')}>Settings</DropdownMenuItem>
        <DropdownMenuItem>Gallery</DropdownMenuItem>
        {subscription !== 'max' && (
          <DropdownMenuItem onClick={() => onOpenSettings('subscription')}>
            Upgrade
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout}>Log Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
