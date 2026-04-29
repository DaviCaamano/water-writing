'use client';

import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~components/ui/dropdown-menu';
import { useUserStore } from '~store/useUserStore';
import { Plan } from '#types/shared/enum/plan';
import { SettingsSection } from '~types/components/settings-modal';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { WaterRippleFade } from '~components/visual-effects/WaterRippleFade';
import { useState } from 'react';
import { useSticky } from '~hooks/useSticky';
import { cn } from '~utils/merge-css-classes';

interface UserMenuProps {
  onOpenAuth: () => void;
  onOpenSettings: (section?: SettingsSection) => void;
}

export function UserMenu({ onOpenAuth, onOpenSettings }: UserMenuProps) {
  const { isLoggedIn, plan, logout, firstName, lastName, email } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);

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

  const closeMenu = () => setMenuOpen(false);

  const handleOpenSettings = (section?: SettingsSection) => {
    closeMenu();
    onOpenSettings(section);
  };

  const handleOpenAuth = () => {
    closeMenu();
    onOpenAuth();
  };

  const menuItems = isLoggedIn
    ? [
        {
          label: 'Settings',
          onSelect: () => handleOpenSettings(SettingsSection.general),
        },
        {
          label: 'Gallery',
          onSelect: closeMenu,
        },
        ...(plan !== Plan.max
          ? [
              {
                label: 'Upgrade',
                onSelect: () => handleOpenSettings(SettingsSection.plan),
              },
            ]
          : []),
        {
          label: 'Log Out',
          onSelect: () => {
            closeMenu();
            void handleLogout();
          },
        },
      ]
    : [
        {
          label: 'Sign In',
          onSelect: handleOpenAuth,
        },
      ];

  return (
    <div className='-home-user-menu- pointer-events-auto'>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <WaterRipple className='rounded-full' disabled={menuOpen}>
          <DropdownMenuTrigger
            className='-home-user-menu-trigger- p-2 rounded-full cursor-pointer'
            aria-label='User menu'
          >
            <Image src='/profile.svg' alt='' width={28} height={28} />
          </DropdownMenuTrigger>
        </WaterRipple>

        <DropdownMenuContent
          className='-home-user-menu-content- w-52 border-none! bg-transparent! p-0! shadow-none!'
          align='end'
        >
          <WaterRippleFade open={menuOpen} className='border-0' maxScale={28}>
            <div className='flex flex-col gap-1 rounded p-1.5 w-full embossed border-border border'>
              {isLoggedIn && (
                <div className='-home-user-menu-header- flex items-center gap-2.5 px-2 py-2 mb-1 border-b border-border/40'>
                  <div
                    aria-hidden='true'
                    className='size-9 shrink-0 rounded-full flex items-center justify-center text-[14px] font-semibold uppercase bg-accent/30 text-accent-foreground'
                  >
                    {(firstName || email || '?').charAt(0)}
                  </div>
                  <div className='flex flex-col min-w-0 flex-1'>
                    <div className='text-[13px] font-semibold leading-tight truncate'>
                      {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Account'}
                    </div>
                    <div className='text-[11px] opacity-60 leading-tight truncate'>{email}</div>
                  </div>
                </div>
              )}
              {menuItems.map((item) => (
                <WaterRipple key={item.label} className='w-full'>
                  <div
                    role='button'
                    tabIndex={0}
                    onClick={item.onSelect}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        item.onSelect();
                      }
                    }}
                    onMouseEnter={() => setActiveItem(item.label)}
                    onMouseLeave={() =>
                      setActiveItem((current) => (current === item.label ? null : current))
                    }
                    onFocus={() => setActiveItem(item.label)}
                    onBlur={() =>
                      setActiveItem((current) => (current === item.label ? null : current))
                    }
                    className={cn(
                      '-home-user-menu-item-',
                      'w-full px-4 py-2.5',
                      'text-left text-[13px] font-medium',
                      'transition-all duration-200',
                      'cursor-pointer outline-none',
                      activeItem === item.label &&
                        'bg-accent/10 shadow-[inset_5px_5px_11px_var(--shadow),inset_-5px_-5px_11px_var(--shadow)]!',
                    )}
                  >
                    {item.label}
                  </div>
                </WaterRipple>
              ))}
            </div>
          </WaterRippleFade>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
